/**
 * Watch Party Service Layer
 * Business logic for watch party room management
 */

import db from '../models/index.js';
import { Op } from 'sequelize';
import { redisHelpers } from '../config/redis.js';

const { MovieRoom, MovieRoomMember, MovieRoomChat, User, Movie, Episode } = db;

// ==================== REDIS KEY HELPERS ====================

const REDIS_KEYS = {
    room: (roomId) => `room:${roomId}`,
    roomMembers: (roomId) => `room:${roomId}:members`,
    userRooms: (userId) => `user:${userId}:rooms`,
    inviteCode: (code) => `invite:${code}`,
};

// ==================== ROOM CRUD OPERATIONS ====================

/**
 * Create a new watch party room
 */
export const createRoom = async (userId, { movieId, episodeId, isPrivate, password, maxMembers }) => {
    // Validate movie and episode exist
    const movie = await Movie.findByPk(movieId);
    if (!movie) {
        throw new Error('Movie not found');
    }

    const episode = await Episode.findByPk(episodeId);
    if (!episode || episode.movieId !== movieId) {
        throw new Error('Episode not found or does not belong to this movie');
    }

    // Create room
    const room = await MovieRoom.create({
        movieId,
        episodeId,
        hostId: userId,
        isPrivate: isPrivate || false,
        password: password || null, // Will be auto-hashed by model hook
        maxMembers: maxMembers || 150,
        lastUpdateTimestamp: Date.now(),
    });

    // Add host as first member
    await MovieRoomMember.create({
        roomId: room.id,
        userId,
        role: 'host',
    });

    // Cache in Redis if available
    await cacheRoomState(room);

    // Cache invite code mapping
    await redisHelpers.safeSet(
        REDIS_KEYS.inviteCode(room.inviteCode),
        room.id,
        7 * 24 * 60 * 60 // 7 days TTL
    );

    return room;
};

/**
 * Get room by ID with full details
 */
export const getRoomById = async (roomId, includeMembers = true, includeChat = false) => {
    const includeOptions = [
        { model: User, as: 'host', attributes: ['id', 'username', 'avatar', 'email'] },
        { model: Movie, as: 'movie', attributes: ['id', 'titles', 'slug', 'image'] },
        { model: Episode, as: 'episode', attributes: ['id', 'episodeNumber', 'hlsUrl', 'duration'] },
    ];

    if (includeMembers) {
        includeOptions.push({
            model: MovieRoomMember,
            as: 'members',
            where: { leftAt: null, isKicked: false },
            required: false,
            include: [
                { model: User, as: 'user', attributes: ['id', 'username', 'avatar', 'online', 'lastOnline'] }
            ],
        });
    }

    if (includeChat) {
        includeOptions.push({
            model: MovieRoomChat,
            as: 'chatMessages',
            limit: 50,
            order: [['createdAt', 'DESC']],
            include: [
                { model: User, as: 'user', attributes: ['id', 'username', 'avatar'] }
            ],
        });
    }

    const room = await MovieRoom.findByPk(roomId, {
        include: includeOptions,
    });

    return room;
};

/**
 * Get room by invite code
 */
export const getRoomByInviteCode = async (inviteCode) => {
    // Try Redis first
    const cachedRoomId = await redisHelpers.safeGet(REDIS_KEYS.inviteCode(inviteCode));

    if (cachedRoomId) {
        return await getRoomById(cachedRoomId);
    }

    // Fallback to database
    const room = await MovieRoom.findOne({
        where: { inviteCode, status: { [Op.ne]: 'closed' } },
        include: [
            { model: User, as: 'host', attributes: ['id', 'username', 'avatar'] },
            { model: Movie, as: 'movie', attributes: ['id', 'titles', 'slug'] },
            { model: Episode, as: 'episode', attributes: ['id', 'episodeNumber'] },
        ],
    });

    // Cache if found
    if (room) {
        await redisHelpers.safeSet(
            REDIS_KEYS.inviteCode(inviteCode),
            room.id,
            7 * 24 * 60 * 60
        );
    }

    return room;
};

/**
 * Join a room
 */
export const joinRoom = async (userId, roomId, password = null) => {
    const room = await getRoomById(roomId, true, false);

    if (!room) {
        throw new Error('Room not found');
    }

    if (room.status === 'closed') {
        throw new Error('Room is closed');
    }

    // Check if room is full
    const memberCount = await MovieRoomMember.count({
        where: { roomId, leftAt: null, isKicked: false },
    });

    if (memberCount >= room.maxMembers) {
        throw new Error('Room is full');
    }

    // Verify password for private rooms
    if (room.isPrivate) {
        if (!password) {
            throw new Error('Password required for private room');
        }

        const isValidPassword = await room.verifyPassword(password);
        if (!isValidPassword) {
            throw new Error('Invalid password');
        }
    }

    // Check if user is already a member
    const existingMember = await MovieRoomMember.findOne({
        where: { roomId, userId, leftAt: null },
    });

    if (existingMember) {
        // User is rejoining
        await existingMember.update({ lastSeenAt: new Date() });
        return { room, member: existingMember, isRejoining: true };
    }

    // Add as new member
    const member = await MovieRoomMember.create({
        roomId,
        userId,
        role: 'member',
    });

    return { room, member, isRejoining: false };
};

/**
 * Leave a room
 */
export const leaveRoom = async (userId, roomId) => {
    const member = await MovieRoomMember.findOne({
        where: { roomId, userId, leftAt: null },
    });

    if (!member) {
        throw new Error('You are not a member of this room');
    }

    // Mark as left
    await member.update({ leftAt: new Date() });

    // If user was host, transfer to next member
    const room = await MovieRoom.findByPk(roomId);
    if (room.hostId === userId) {
        const nextHost = await MovieRoomMember.findOne({
            where: {
                roomId,
                userId: { [Op.ne]: userId },
                leftAt: null,
                isKicked: false,
            },
            order: [['joinedAt', 'ASC']], // Longest-standing member
        });

        if (nextHost) {
            // Transfer host
            await room.update({ hostId: nextHost.userId });
            await nextHost.update({ role: 'host' });
            return { leftRoom: true, newHostId: nextHost.userId };
        } else {
            // No members left, close room
            await room.update({ status: 'closed', closedAt: new Date() });
            return { leftRoom: true, roomClosed: true };
        }
    }

    return { leftRoom: true };
};

/**
 * Close a room (host only)
 */
export const closeRoom = async (roomId, hostId) => {
    const room = await MovieRoom.findByPk(roomId);

    if (!room) {
        throw new Error('Room not found');
    }

    if (room.hostId !== hostId) {
        throw new Error('Only the host can close the room');
    }

    await room.update({ status: 'closed', closedAt: new Date() });

    // Cleanup Redis cache
    await redisHelpers.safeDel(REDIS_KEYS.room(roomId));
    await redisHelpers.safeDel(REDIS_KEYS.roomMembers(room.id));
    await redisHelpers.safeDel(REDIS_KEYS.inviteCode(room.inviteCode));

    return room;
};

/**
 * Transfer host to another member
 */
export const transferHost = async (roomId, currentHostId, newHostId) => {
    const room = await MovieRoom.findByPk(roomId);

    if (!room) {
        throw new Error('Room not found');
    }

    if (room.hostId !== currentHostId) {
        throw new Error('Only the current host can transfer host');
    }

    // Verify new host is a member
    const newHostMember = await MovieRoomMember.findOne({
        where: { roomId, userId: newHostId, leftAt: null, isKicked: false },
    });

    if (!newHostMember) {
        throw new Error('New host must be an active member of the room');
    }

    // Update roles
    await room.update({ hostId: newHostId });

    const oldHostMember = await MovieRoomMember.findOne({
        where: { roomId, userId: currentHostId },
    });
    if (oldHostMember) {
        await oldHostMember.update({ role: 'member' });
    }

    await newHostMember.update({ role: 'host' });

    return { oldHostId: currentHostId, newHostId };
};

/**
 * Kick a member from room (host only)
 */
export const kickMember = async (roomId, hostId, userIdToKick) => {
    const room = await MovieRoom.findByPk(roomId);

    if (!room) {
        throw new Error('Room not found');
    }

    if (room.hostId !== hostId) {
        throw new Error('Only the host can kick members');
    }

    if (hostId === userIdToKick) {
        throw new Error('You cannot kick yourself');
    }

    const member = await MovieRoomMember.findOne({
        where: { roomId, userId: userIdToKick, leftAt: null },
    });

    if (!member) {
        throw new Error('User is not a member of this room');
    }

    await member.update({ isKicked: true, leftAt: new Date() });

    return member;
};

// ==================== PLAYBACK STATE MANAGEMENT ====================

/**
 * Update room playback state
 */
export const updatePlaybackState = async (roomId, { currentTime, playbackState }) => {
    const room = await MovieRoom.findByPk(roomId);

    if (!room) {
        throw new Error('Room not found');
    }

    const updateData = {
        lastUpdateTimestamp: Date.now(),
    };

    if (currentTime !== undefined) {
        updateData.currentTime = currentTime;
    }

    if (playbackState !== undefined) {
        updateData.playbackState = playbackState;
    }

    await room.update(updateData);

    // Update Redis cache
    await cacheRoomState(room);

    return room;
};

// ==================== CHAT OPERATIONS ====================

/**
 * Get chat history for a room
 */
export const getChatHistory = async (roomId, limit = 50, beforeTimestamp = null) => {
    const whereClause = { roomId };

    if (beforeTimestamp) {
        whereClause.createdAt = { [Op.lt]: new Date(beforeTimestamp) };
    }

    const messages = await MovieRoomChat.findAll({
        where: whereClause,
        include: [
            { model: User, as: 'user', attributes: ['id', 'username', 'avatar'] }
        ],
        order: [['createdAt', 'DESC']],
        limit,
    });

    return messages.reverse(); // Oldest first
};

/**
 * Send a chat message
 */
export const sendChatMessage = async (roomId, userId, { type, content, videoTimestamp }) => {
    const message = await MovieRoomChat.create({
        roomId,
        userId,
        type: type || 'text',
        content,
        videoTimestamp: videoTimestamp || null,
    });

    // Load user data
    const messageWithUser = await MovieRoomChat.findByPk(message.id, {
        include: [
            { model: User, as: 'user', attributes: ['id', 'username', 'avatar'] }
        ],
    });

    return messageWithUser;
};

// ==================== REDIS CACHING ====================

/**
 * Cache room state in Redis
 */
async function cacheRoomState(room) {
    const roomData = {
        id: room.id,
        movieId: room.movieId,
        episodeId: room.episodeId,
        hostId: room.hostId,
        status: room.status,
        currentTime: room.currentTime,
        playbackState: room.playbackState,
        serverTimestamp: room.lastUpdateTimestamp,
        isPrivate: room.isPrivate,
        maxMembers: room.maxMembers,
        allowChat: room.allowChat,
    };

    await redisHelpers.safeSet(
        REDIS_KEYS.room(room.id),
        roomData,
        24 * 60 * 60 // 24 hours TTL
    );
}

/**
 * Get cached room state from Redis
 */
export const getCachedRoomState = async (roomId) => {
    return await redisHelpers.safeGet(REDIS_KEYS.room(roomId));
};
