/**
 * Watch Party Socket.IO Handlers
 * Real-time event handlers for watch party rooms
 */

import db from '../models/index.js';
import * as watchPartyService from '../services/watchParty.service.js';
import { redisHelpers } from '../config/redis.js';
import { getIo } from '../config/socket.js';

const { MovieRoom, MovieRoomMember, User } = db;

// ==================== REDIS CHANNELS ====================

export const WATCH_PARTY_CHANNELS = {
    PLAYBACK_SYNC: 'watchparty:playback:sync',
    ROOM_UPDATE: 'watchparty:room:update',
    MEMBER_UPDATE: 'watchparty:member:update',
    CHAT: 'watchparty:chat',
};

// ==================== RATE LIMITING ====================

const RATE_LIMITS = {
    playback: { limit: 10, window: 10000 }, // 10 actions per 10s
    chat: { limit: 5, window: 5000 }, // 5 messages per 5s
};

const rateLimitMap = new Map();

function checkRateLimit(key, limit, window) {
    const now = Date.now();
    const record = rateLimitMap.get(key) || { count: 0, resetAt: now + window };

    if (now > record.resetAt) {
        // Reset window
        record.count = 1;
        record.resetAt = now + window;
        rateLimitMap.set(key, record);
        return true;
    }

    if (record.count >= limit) {
        return false; // Rate limited
    }

    record.count++;
    rateLimitMap.set(key, record);
    return true;
}

// ==================== SYNC TICK BROADCASTER ====================

let syncTickIntervals = new Map(); // roomId -> intervalId

/**
 * Start periodic sync tick for a room (every 5 seconds when playing)
 */
export function startSyncTickBroadcaster(roomId) {
    // Clear existing interval if any
    if (syncTickIntervals.has(roomId)) {
        clearInterval(syncTickIntervals.get(roomId));
    }

    const intervalId = setInterval(async () => {
        try {
            const room = await MovieRoom.findByPk(roomId);
            if (!room || room.status === 'closed' || room.playbackState !== 'playing') {
                // Stop broadcasting if room closed or paused
                stopSyncTickBroadcaster(roomId);
                return;
            }

            // Calculate current time based on elapsed time
            const now = Date.now();
            const elapsed = (now - room.lastUpdateTimestamp) / 1000;
            const currentTime = room.currentTime + elapsed;

            const io = getIo();
            io.to(`room:${roomId}`).emit('room:sync_tick', {
                currentTime,
                playbackState: room.playbackState,
                serverTimestamp: now,
            });
        } catch (error) {
            console.error(`Error in sync tick for room ${roomId}:`, error);
        }
    }, 5000); // Every 5 seconds

    syncTickIntervals.set(roomId, intervalId);
}

/**
 * Stop sync tick broadcaster for a room
 */
export function stopSyncTickBroadcaster(roomId) {
    if (syncTickIntervals.has(roomId)) {
        clearInterval(syncTickIntervals.get(roomId));
        syncTickIntervals.delete(roomId);
    }
}

// ==================== REDIS PUB/SUB SETUP ====================

let redisSubscriber = null;

export async function setupWatchPartyRedisPubSub(redisPoolManager) {
    try {
        redisSubscriber = await redisPoolManager.getConnection('pubsub');

        if (!redisSubscriber) {
            console.warn('⚠️  Redis not available for Watch Party Pub/Sub - running in single-instance mode');
            return;
        }

        const channels = Object.values(WATCH_PARTY_CHANNELS);

        await redisSubscriber.subscribe(channels, (message, channel) => {
            const io = getIo();
            if (!io) return;

            try {
                const data = JSON.parse(message);

                switch (channel) {
                    case WATCH_PARTY_CHANNELS.PLAYBACK_SYNC:
                        handlePlaybackSyncBroadcast(data);
                        break;
                    case WATCH_PARTY_CHANNELS.MEMBER_UPDATE:
                        handleMemberUpdateBroadcast(data);
                        break;
                    case WATCH_PARTY_CHANNELS.CHAT:
                        handleChatBroadcast(data);
                        break;
                    default:
                        break;
                }
            } catch (error) {
                console.error(`Error handling Watch Party Redis message on ${channel}:`, error);
            }
        });

        console.log(`✅ Watch Party subscribed to ${channels.length} Redis channels`);
    } catch (error) {
        console.warn('⚠️  Failed to setup Watch Party Redis Pub/Sub:', error.message);
    }
}

function handlePlaybackSyncBroadcast(data) {
    const io = getIo();
    const { roomId, ...syncData } = data;
    io.to(`room:${roomId}`).emit('room:playback_sync', syncData);
}

function handleMemberUpdateBroadcast(data) {
    const io = getIo();
    const { roomId, type, ...memberData } = data;
    io.to(`room:${roomId}`).emit(`room:member_${type}`, memberData);
}

function handleChatBroadcast(data) {
    const io = getIo();
    const { roomId, ...chatData } = data;
    io.to(`room:${roomId}`).emit('room:chat_message', chatData);
}

// ==================== SOCKET EVENT HANDLERS ====================

/**
 * Register all watch party socket event handlers
 */
export function registerWatchPartyHandlers(socket) {
    const userId = socket.userId;

    // ==================== ROOM MANAGEMENT ====================

    /**
     * Join a watch party room
     */
    socket.on('room:join', async (data, callback) => {
        try {
            const { roomId } = data;

            // Verify user is a member
            const member = await MovieRoomMember.findOne({
                where: { roomId, userId, leftAt: null, isKicked: false },
            });

            if (!member) {
                return callback?.({ success: false, error: 'Not a member of this room' });
            }

            // Join Socket.IO room
            socket.join(`room:${roomId}`);

            // Get current room state
            const room = await watchPartyService.getRoomById(roomId, true, false);

            // Update last seen
            await member.update({ lastSeenAt: new Date() });

            // Broadcast to others that user joined
            socket.to(`room:${roomId}`).emit('room:member_joined', {
                userId,
                username: socket.userEmail, // Will be replaced with full user data
                role: member.role,
            });

            // Publish to Redis for other instances
            await redisHelpers.publish(WATCH_PARTY_CHANNELS.MEMBER_UPDATE, {
                roomId,
                type: 'joined',
                userId,
                role: member.role,
            });

            callback?.({
                success: true,
                data: {
                    room: {
                        id: room.id,
                        movieId: room.movieId,
                        episodeId: room.episodeId,
                        hostId: room.hostId,
                        status: room.status,
                        currentTime: room.currentTime,
                        playbackState: room.playbackState,
                        serverTimestamp: room.lastUpdateTimestamp,
                        allowChat: room.allowChat,
                        allowReactions: room.allowReactions,
                    },
                    members: room.members,
                },
            });
        } catch (error) {
            console.error('Error in room:join:', error);
            callback?.({ success: false, error: error.message });
        }
    });

    /**
     * Leave a watch party room
     */
    socket.on('room:leave', async (data, callback) => {
        try {
            const { roomId } = data;

            socket.leave(`room:${roomId}`);

            // Broadcast to others
            socket.to(`room:${roomId}`).emit('room:member_left', { userId });

            await redisHelpers.publish(WATCH_PARTY_CHANNELS.MEMBER_UPDATE, {
                roomId,
                type: 'left',
                userId,
            });

            callback?.({ success: true });
        } catch (error) {
            console.error('Error in room:leave:', error);
            callback?.({ success: false, error: error.message });
        }
    });

    // ==================== PLAYBACK CONTROL ====================

    /**
     * Playback action (play/pause/seek) - Host only
     */
    socket.on('room:playback_action', async (data, callback) => {
        try {
            const { roomId, action, time } = data;

            // Rate limit check
            const rateLimitKey = `playback:${roomId}`;
            if (!checkRateLimit(rateLimitKey, RATE_LIMITS.playback.limit, RATE_LIMITS.playback.window)) {
                return callback?.({ success: false, error: 'Rate limit exceeded' });
            }

            // Verify user is host
            const room = await MovieRoom.findByPk(roomId);
            if (!room) {
                return callback?.({ success: false, error: 'Room not found' });
            }

            if (room.hostId !== userId) {
                return callback?.({ success: false, error: 'Only host can control playback' });
            }

            // Update room state
            const updateData = {
                lastUpdateTimestamp: Date.now(),
            };

            if (action === 'play') {
                updateData.playbackState = 'playing';
                if (time !== undefined) updateData.currentTime = time;
            } else if (action === 'pause') {
                updateData.playbackState = 'paused';
                if (time !== undefined) updateData.currentTime = time;
            } else if (action === 'seek') {
                if (time !== undefined) updateData.currentTime = time;
            }

            await room.update(updateData);

            // Update Redis cache
            await watchPartyService.updatePlaybackState(roomId, updateData);

            // Broadcast to room
            const syncData = {
                action,
                currentTime: room.currentTime,
                playbackState: room.playbackState,
                serverTimestamp: updateData.lastUpdateTimestamp,
            };

            const io = getIo();
            io.to(`room:${roomId}`).emit('room:playback_sync', syncData);

            // Publish to Redis for other instances
            await redisHelpers.publish(WATCH_PARTY_CHANNELS.PLAYBACK_SYNC, {
                roomId,
                ...syncData,
            });

            // Start/stop sync ticker based on state
            if (updateData.playbackState === 'playing') {
                startSyncTickBroadcaster(roomId);
            } else {
                stopSyncTickBroadcaster(roomId);
            }

            callback?.({ success: true });
        } catch (error) {
            console.error('Error in room:playback_action:', error);
            callback?.({ success: false, error: error.message });
        }
    });

    /**
     * Change episode - Host only
     */
    socket.on('room:change_episode', async (data, callback) => {
        try {
            const { roomId, episodeId } = data;

            // Verify host
            const room = await MovieRoom.findByPk(roomId);
            if (!room || room.hostId !== userId) {
                return callback?.({ success: false, error: 'Only host can change episode' });
            }

            // Update room
            await room.update({
                episodeId,
                currentTime: 0,
                playbackState: 'paused',
                lastUpdateTimestamp: Date.now(),
            });

            // Broadcast to room
            const io = getIo();
            io.to(`room:${roomId}`).emit('room:episode_changed', {
                episodeId,
                currentTime: 0,
                playbackState: 'paused',
            });

            callback?.({ success: true });
        } catch (error) {
            console.error('Error in room:change_episode:', error);
            callback?.({ success: false, error: error.message });
        }
    });

    /**
     * Request manual sync - Member
     */
    socket.on('room:request_sync', async (data, callback) => {
        try {
            const { roomId } = data;

            const room = await MovieRoom.findByPk(roomId);
            if (!room) {
                return callback?.({ success: false, error: 'Room not found' });
            }

            // Calculate current time
            const now = Date.now();
            const elapsed = room.playbackState === 'playing'
                ? (now - room.lastUpdateTimestamp) / 1000
                : 0;
            const currentTime = room.currentTime + elapsed;

            callback?.({
                success: true,
                data: {
                    currentTime,
                    playbackState: room.playbackState,
                    serverTimestamp: now,
                },
            });
        } catch (error) {
            console.error('Error in room:request_sync:', error);
            callback?.({ success: false, error: error.message });
        }
    });

    // ==================== CHAT ====================

    /**
     * Send chat message
     */
    socket.on('room:chat_message', async (data, callback) => {
        try {
            const { roomId, type, content, videoTimestamp } = data;

            // Rate limit check
            const rateLimitKey = `chat:${userId}`;
            if (!checkRateLimit(rateLimitKey, RATE_LIMITS.chat.limit, RATE_LIMITS.chat.window)) {
                return callback?.({ success: false, error: 'Too many messages. Please slow down.' });
            }

            // Verify member and not muted
            const member = await MovieRoomMember.findOne({
                where: { roomId, userId, leftAt: null, isKicked: false, isMuted: false },
            });

            if (!member) {
                return callback?.({ success: false, error: 'Cannot send message' });
            }

            // Check room allows chat
            const room = await MovieRoom.findByPk(roomId);
            if (!room.allowChat) {
                return callback?.({ success: false, error: 'Chat is disabled in this room' });
            }

            // Save message
            const message = await watchPartyService.sendChatMessage(roomId, userId, {
                type,
                content,
                videoTimestamp,
            });

            // Broadcast to room
            const io = getIo();
            io.to(`room:${roomId}`).emit('room:chat_message', {
                chatId: message.id,
                userId: message.userId,
                username: message.user.username,
                avatar: message.user.avatar,
                type: message.type,
                content: message.content,
                videoTimestamp: message.videoTimestamp,
                timestamp: message.createdAt,
            });

            // Publish to Redis
            await redisHelpers.publish(WATCH_PARTY_CHANNELS.CHAT, {
                roomId,
                chatId: message.id,
                userId: message.userId,
                username: message.user.username,
                avatar: message.user.avatar,
                type: message.type,
                content: message.content,
                videoTimestamp: message.videoTimestamp,
                timestamp: message.createdAt,
            });

            callback?.({ success: true, data: { chatId: message.id } });
        } catch (error) {
            console.error('Error in room:chat_message:', error);
            callback?.({ success: false, error: error.message });
        }
    });

    /**
     * Typing indicator
     */
    socket.on('room:typing', async (data) => {
        try {
            const { roomId } = data;

            // Broadcast to others (throttled on client side)
            socket.to(`room:${roomId}`).emit('room:user_typing', { userId });
        } catch (error) {
            console.error('Error in room:typing:', error);
        }
    });

    // ==================== DISCONNECT CLEANUP ====================

    socket.on('disconnect', async () => {
        // Auto-leave all watch party rooms
        const rooms = Array.from(socket.rooms).filter(r => r.startsWith('room:'));

        for (const room of rooms) {
            const roomId = room.replace('room:', '');
            socket.to(room).emit('room:member_left', { userId });

            await redisHelpers.publish(WATCH_PARTY_CHANNELS.MEMBER_UPDATE, {
                roomId,
                type: 'left',
                userId,
            });
        }
    });
}

// ==================== CLEANUP ====================

/**
 * Cleanup all watch party resources
 */
export async function cleanupWatchParty() {
    // Stop all sync tick broadcasters
    for (const [roomId, intervalId] of syncTickIntervals.entries()) {
        clearInterval(intervalId);
    }
    syncTickIntervals.clear();

    // Clear rate limit map
    rateLimitMap.clear();

    console.log('✅ Watch Party resources cleaned up');
}
