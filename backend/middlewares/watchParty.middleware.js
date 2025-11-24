/**
 * Watch Party Middleware
 * Authorization and validation middleware for watch party routes
 */

import asyncHandler from 'express-async-handler';
import db from '../models/index.js';

const { MovieRoom, MovieRoomMember } = db;

/**
 * Verify that the user is a member of the room
 * Attaches req.roomMember if successful
 */
export const verifyRoomMember = asyncHandler(async (req, res, next) => {
    const { roomId } = req.params;
    const userId = req.user.id;

    const member = await MovieRoomMember.findOne({
        where: {
            roomId,
            userId,
            leftAt: null,
            isKicked: false,
        },
    });

    if (!member) {
        res.status(403);
        throw new Error('You are not a member of this room');
    }

    // Attach to request for use in controllers
    req.roomMember = member;
    next();
});

/**
 * Verify that the user is the host of the room
 * Requires verifyRoomMember to run first
 */
export const verifyHost = asyncHandler(async (req, res, next) => {
    const { roomId } = req.params;
    const userId = req.user.id;

    const room = await MovieRoom.findByPk(roomId);

    if (!room) {
        res.status(404);
        throw new Error('Room not found');
    }

    if (room.hostId !== userId) {
        res.status(403);
        throw new Error('Only the host can perform this action');
    }

    // Attach to request for use in controllers
    req.room = room;
    next();
});

/**
 * Verify room exists and is active
 */
export const verifyRoomActive = asyncHandler(async (req, res, next) => {
    const { roomId } = req.params;

    const room = await MovieRoom.findByPk(roomId);

    if (!room) {
        res.status(404);
        throw new Error('Room not found');
    }

    if (room.status === 'closed') {
        res.status(410);
        throw new Error('Room is closed');
    }

    req.room = room;
    next();
});
