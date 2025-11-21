import express from 'express';
import * as userController from '../controllers/user.controller.js';
import { verifyToken, authorizeRoles, verifyTokenOptional } from '../middlewares/auth.middleware.js';
import { uploadImageUser } from '../middlewares/uploadImageUser.middleware.js';
import { uploadCoverImage } from '../middlewares/uploadCoverImage.middleware.js';

const router = express.Router();

// Routes cho profile của người dùng hiện tại (cần authentication)
router.get('/me', verifyToken, userController.getProfile);
router.put('/me', verifyToken, userController.updateProfile);
router.put('/me/social-links', verifyToken, userController.updateSocialLinks);
router.post('/me/avatar', verifyToken, uploadImageUser.single('avatar'), userController.uploadAvatar);
router.delete('/me/avatar', verifyToken, userController.deleteAvatar);
router.post('/me/cover', verifyToken, uploadCoverImage.single('cover'), userController.uploadCover);
router.delete('/me/cover', verifyToken, userController.deleteCover);

// Public search endpoint
router.get('/search', userController.searchUsers);
router.get('/search/friends', verifyToken, userController.searchFriends);

// Routes cho profile của người dùng khác (public)
router.get('/:uuid', verifyTokenOptional, userController.getUserByUuid);
router.get('/:uuid/favorites', userController.getUserFavoritesByUuid);
router.get('/:uuid/watch-history', userController.getUserWatchHistoryByUuid);
router.get('/:uuid/friends', verifyTokenOptional, userController.getUserFriendsByUuid);


export default router;
