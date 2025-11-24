/**
 * Watch Party Routes
 * Express routes for watch party endpoints
 */

import express from 'express';
import * as watchPartyController from '../controllers/watchParty.controller.js';
import { verifyToken, verifyTokenOptional } from '../middlewares/auth.middleware.js';
import { verifyRoomMember, verifyHost, verifyRoomActive } from '../middlewares/watchParty.middleware.js';

const router = express.Router();

// ==================== PUBLIC ROUTES ====================

/**
 * @route   GET /api/watch-party/:roomId
 * @desc    Get room details (public, but more info if authenticated)
 * @access  Public
 */
router.get('/:roomId', verifyTokenOptional, watchPartyController.getRoomDetails);

// ==================== AUTHENTICATED ROUTES ====================

/**
 * @route   POST /api/watch-party/create
 * @desc    Create a new watch party room
 * @access  Private
 */
router.post('/create', verifyToken, watchPartyController.createRoom);

/**
 * @route   POST /api/watch-party/join
 * @desc    Join a room by roomId
 * @access  Private
 */
router.post('/join', verifyToken, watchPartyController.joinRoom);

/**
 * @route   POST /api/watch-party/join-by-code
 * @desc    Join a room using invite code
 * @access  Private
 */
router.post('/join-by-code', verifyToken, watchPartyController.joinRoomByCode);

// ==================== MEMBER-ONLY ROUTES ====================

/**
 * @route   DELETE /api/watch-party/:roomId/leave
 * @desc    Leave a room
 * @access  Private (Member)
 */
router.delete('/:roomId/leave', verifyToken, verifyRoomMember, watchPartyController.leaveRoom);

/**
 * @route   GET /api/watch-party/:roomId/chat
 * @desc    Get chat history
 * @access  Private (Member)
 */
router.get('/:roomId/chat', verifyToken, verifyRoomMember, watchPartyController.getChatHistory);

// ==================== HOST-ONLY ROUTES ====================

/**
 * @route   POST /api/watch-party/:roomId/close
 * @desc    Close a room
 * @access  Private (Host only)
 */
router.post('/:roomId/close', verifyToken, verifyHost, watchPartyController.closeRoom);

/**
 * @route   POST /api/watch-party/:roomId/transfer-host
 * @desc    Transfer host to another member
 * @access  Private (Host only)
 */
router.post('/:roomId/transfer-host', verifyToken, verifyHost, watchPartyController.transferHost);

/**
 * @route   POST /api/watch-party/:roomId/kick
 * @desc    Kick a member from the room
 * @access  Private (Host only)
 */
router.post('/:roomId/kick', verifyToken, verifyHost, watchPartyController.kickMember);

/**
 * @route   PATCH /api/watch-party/:roomId
 * @desc    Update room settings (password, privacy, etc.)
 * @access  Private (Host only)
 */
router.patch('/:roomId', verifyToken, verifyHost, watchPartyController.updateRoomSettings);

export default router;
