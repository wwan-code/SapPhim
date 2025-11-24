/**
 * Watch Party Controller
 * HTTP request handlers for watch party endpoints
 */

import asyncHandler from 'express-async-handler';
import * as watchPartyService from '../services/watchParty.service.js';

// ==================== ROOM MANAGEMENT ====================

/**
 * @route   POST /api/watch-party/create
 * @desc    Create a new watch party room
 * @access  Private
 */
export const createRoom = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { movieId, episodeId, isPrivate, password, maxMembers } = req.body;

    // Validation
    if (!movieId || !episodeId) {
        res.status(400);
        throw new Error('movieId and episodeId are required');
    }

    // Validate password requirement for private rooms
    if (isPrivate && !password) {
        res.status(400);
        throw new Error('Password is required for private rooms');
    }

    // Validate password length
    if (password && (password.length < 6 || password.length > 30)) {
        res.status(400);
        throw new Error('Password must be between 6 and 30 characters');
    }

    // Validate maxMembers
    if (maxMembers && (maxMembers < 10 || maxMembers > 200)) {
        res.status(400);
        throw new Error('maxMembers must be between 10 and 200');
    }

    const room = await watchPartyService.createRoom(userId, {
        movieId,
        episodeId,
        isPrivate,
        password,
        maxMembers,
    });

    // Build invite link
    const inviteLink = `/watch-party/${room.id}?code=${room.inviteCode}`;

    res.status(201).json({
        success: true,
        message: 'Room created successfully',
        data: {
            roomId: room.id,
            uuid: room.uuid,
            inviteCode: room.inviteCode,
            inviteLink,
            room: {
                id: room.id,
                movieId: room.movieId,
                episodeId: room.episodeId,
                hostId: room.hostId,
                isPrivate: room.isPrivate,
                maxMembers: room.maxMembers,
                status: room.status,
                createdAt: room.createdAt,
            },
        },
    });
});

/**
 * @route   GET /api/watch-party/:roomId
 * @desc    Get room details
 * @access  Public
 */
export const getRoomDetails = asyncHandler(async (req, res) => {
    const { roomId } = req.params;
    const userId = req.user?.id; // Optional auth

    const room = await watchPartyService.getRoomById(roomId, true, false);

    if (!room) {
        res.status(404);
        throw new Error('Room not found');
    }

    // Check if user is a member
    const isUserMember = userId
        ? room.members.some((m) => m.userId === userId && m.leftAt === null)
        : false;

    // Check if room is joinable
    const activeMemberCount = room.members.filter((m) => m.leftAt === null).length;
    const canJoin = room.status === 'active' && activeMemberCount < room.maxMembers;

    // Hide password hash
    delete room.dataValues.password;

    res.json({
        success: true,
        data: {
            room,
            host: room.host,
            memberCount: activeMemberCount,
            isUserMember,
            canJoin,
        },
    });
});

/**
 * @route   POST /api/watch-party/join
 * @desc    Join a room
 * @access  Private
 */
export const joinRoom = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { roomId, password } = req.body;

    if (!roomId) {
        res.status(400);
        throw new Error('roomId is required');
    }

    const result = await watchPartyService.joinRoom(userId, roomId, password);

    res.json({
        success: true,
        message: result.isRejoining ? 'Rejoined room successfully' : 'Joined room successfully',
        data: {
            room: result.room,
            member: result.member,
            currentState: {
                currentTime: result.room.currentTime,
                playbackState: result.room.playbackState,
                serverTimestamp: result.room.lastUpdateTimestamp,
            },
        },
    });
});

/**
 * @route   POST /api/watch-party/join-by-code
 * @desc    Join a room using invite code
 * @access  Private
 */
export const joinRoomByCode = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { code, password } = req.body;

    if (!code) {
        res.status(400);
        throw new Error('Invite code is required');
    }

    const room = await watchPartyService.getRoomByInviteCode(code);

    if (!room) {
        res.status(404);
        throw new Error('Room not found with this invite code');
    }

    const result = await watchPartyService.joinRoom(userId, room.id, password);

    res.json({
        success: true,
        message: result.isRejoining ? 'Rejoined room successfully' : 'Joined room successfully',
        data: {
            room: result.room,
            member: result.member,
            currentState: {
                currentTime: result.room.currentTime,
                playbackState: result.room.playbackState,
                serverTimestamp: result.room.lastUpdateTimestamp,
            },
        },
    });
});

/**
 * @route   DELETE /api/watch-party/:roomId/leave
 * @desc    Leave a room
 * @access  Private (Member)
 */
export const leaveRoom = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { roomId } = req.params;

    const result = await watchPartyService.leaveRoom(userId, roomId);

    res.json({
        success: true,
        message: 'Left room successfully',
        data: result,
    });
});

/**
 * @route   POST /api/watch-party/:roomId/close
 * @desc    Close a room
 * @access  Private (Host only)
 */
export const closeRoom = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { roomId } = req.params;

    await watchPartyService.closeRoom(roomId, userId);

    res.json({
        success: true,
        message: 'Room closed successfully',
    });
});

/**
 * @route   POST /api/watch-party/:roomId/transfer-host
 * @desc    Transfer host to another member
 * @access  Private (Host only)
 */
export const transferHost = asyncHandler(async (req, res) => {
    const currentHostId = req.user.id;
    const { roomId } = req.params;
    const { newHostId } = req.body;

    if (!newHostId) {
        res.status(400);
        throw new Error('newHostId is required');
    }

    const result = await watchPartyService.transferHost(roomId, currentHostId, newHostId);

    res.json({
        success: true,
        message: 'Host transferred successfully',
        data: result,
    });
});

/**
 * @route   POST /api/watch-party/:roomId/kick
 * @desc    Kick a member from the room
 * @access  Private (Host only)
 */
export const kickMember = asyncHandler(async (req, res) => {
    const hostId = req.user.id;
    const { roomId } = req.params;
    const { userId } = req.body;

    if (!userId) {
        res.status(400);
        throw new Error('userId is required');
    }

    await watchPartyService.kickMember(roomId, hostId, userId);

    res.json({
        success: true,
        message: 'Member kicked successfully',
    });
});

/**
 * @route   PATCH /api/watch-party/:roomId
 * @desc    Update room settings
 * @access  Private (Host only)
 */
export const updateRoomSettings = asyncHandler(async (req, res) => {
    const { roomId } = req.params;
    const { isPrivate, password, allowChat, allowReactions, maxMembers } = req.body;

    const room = await watchPartyService.getRoomById(roomId, false, false);

    if (!room) {
        res.status(404);
        throw new Error('Room not found');
    }

    // Validate host
    if (room.hostId !== req.user.id) {
        res.status(403);
        throw new Error('Only the host can update room settings');
    }

    const updateData = {};

    if (isPrivate !== undefined) {
        updateData.isPrivate = isPrivate;

        // If making private, password is required
        if (isPrivate && !password && !room.password) {
            res.status(400);
            throw new Error('Password is required when making room private');
        }
    }

    if (password !== undefined) {
        if (password === null) {
            // Remove password (only if room is public)
            if (room.isPrivate || isPrivate) {
                res.status(400);
                throw new Error('Cannot remove password from private room');
            }
            updateData.password = null;
        } else {
            // Update password
            if (password.length < 6 || password.length > 30) {
                res.status(400);
                throw new Error('Password must be between 6 and 30 characters');
            }
            updateData.password = password; // Will be auto-hashed
        }
    }

    if (allowChat !== undefined) updateData.allowChat = allowChat;
    if (allowReactions !== undefined) updateData.allowReactions = allowReactions;
    if (maxMembers !== undefined) {
        if (maxMembers < 10 || maxMembers > 200) {
            res.status(400);
            throw new Error('maxMembers must be between 10 and 200');
        }
        updateData.maxMembers = maxMembers;
    }

    await room.update(updateData);

    res.json({
        success: true,
        message: 'Room settings updated successfully',
        data: {
            isPrivate: room.isPrivate,
            allowChat: room.allowChat,
            allowReactions: room.allowReactions,
            maxMembers: room.maxMembers,
        },
    });
});

// ==================== CHAT OPERATIONS ====================

/**
 * @route   GET /api/watch-party/:roomId/chat
 * @desc    Get chat history
 * @access  Private (Member only)
 */
export const getChatHistory = asyncHandler(async (req, res) => {
    const { roomId } = req.params;
    const { limit = 50, before } = req.query;

    const messages = await watchPartyService.getChatHistory(
        roomId,
        parseInt(limit),
        before
    );

    res.json({
        success: true,
        data: {
            messages,
            hasMore: messages.length === parseInt(limit),
        },
    });
});
