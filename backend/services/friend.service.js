import db from '../models/index.js';
import { Op } from 'sequelize';
import { getIo } from '../config/socket.js';
import { createNotification, deleteNotificationByFriendship } from './notification.service.js';
import { generateNotificationContent } from '../utils/notification.utils.js';
import { redisHelpers } from '../config/redis.js';
import { REDIS_CHANNELS } from '../config/socket.js';
import { safeSocketEmit, safeRedisPublish } from '../utils/socket.utils.js';

const { User, Friendship, Notification } = db;

/**
 * Check if two users have mutual friends (optimized)
 * @private
 */
const checkMutualFriends = async (senderId, receiverId, transaction) => {
  const cacheKey = `mutual:${Math.min(senderId, receiverId)}:${Math.max(senderId, receiverId)}`;

  try {
    const cached = await redisHelpers.safeGet(cacheKey);
    if (cached !== null) {
      return cached === 'true';
    }

    // Optimized query - only check if mutual friends exist (LIMIT 1)
    const result = await db.sequelize.query(`
      SELECT 1 as hasMutual
      FROM Friendships f1
      INNER JOIN Friendships f2 ON (
        CASE 
          WHEN f1.senderId = :senderId THEN f1.receiverId
          WHEN f1.receiverId = :senderId THEN f1.senderId
        END = CASE 
          WHEN f2.senderId = :receiverId THEN f2.receiverId
          WHEN f2.receiverId = :receiverId THEN f2.senderId
        END
      )
      WHERE (f1.senderId = :senderId OR f1.receiverId = :senderId)
      AND (f2.senderId = :receiverId OR f2.receiverId = :receiverId)
      AND f1.status = 'accepted' 
      AND f2.status = 'accepted'
      LIMIT 1
    `, {
      replacements: { senderId, receiverId },
      type: db.sequelize.QueryTypes.SELECT,
      transaction,
      timeout: 5000 // 5 second timeout
    });

    const hasMutual = result && result.length > 0;

    // Cache for 1 hour
    await redisHelpers.safeSet(cacheKey, hasMutual ? 'true' : 'false', 3600);

    return hasMutual;
  } catch (error) {
    console.error('[checkMutualFriends] Error:', error.message);
    // On error, default to allowing the request
    return true;
  }
};

/**
 * Invalidate all friend-related caches for given user IDs
 * @private
 */
const invalidateFriendCaches = async (...userIds) => {
  try {
    const invalidations = userIds.flatMap(userId => [
      redisHelpers.invalidatePattern(`user:${userId}:friends:*`),
      redisHelpers.invalidatePattern(`search:users:${userId}:*`)
    ]);

    await Promise.allSettled(invalidations);
  } catch (error) {
    console.error('[invalidateFriendCaches] Error:', error.message);
    // Non-critical, don't throw
  }
};

/**
 * @desc Gửi lời mời kết bạn
 * @param {number} senderId - ID của người gửi lời mời
 * @param {number} receiverId - ID của người nhận lời mời
 * @returns {Promise<Friendship>} Đối tượng Friendship đã tạo
 */
const sendFriendRequest = async (senderId, receiverId) => {
  if (senderId === receiverId) {
    throw new Error('Không thể gửi lời mời kết bạn cho chính mình.');
  }

  let friendship;

  // Transaction with proper error handling
  try {
    friendship = await db.sequelize.transaction(async (t) => {
      // Validate sender existence and status
      const sender = await User.findByPk(senderId, {
        attributes: ['id', 'uuid', 'username', 'avatarUrl', 'status'],
        transaction: t
      });

      if (!sender) {
        throw new Error('Người gửi không tồn tại.');
      }

      if (sender.status !== 'active') {
        throw new Error('Tài khoản của bạn đã bị khóa.');
      }

      // Validate receiver existence and settings
      const receiver = await User.findByPk(receiverId, {
        attributes: ['id', 'uuid', 'username', 'avatarUrl', 'canReceiveFriendRequests', 'status'],
        transaction: t
      });

      if (!receiver) {
        throw new Error('Người nhận không tồn tại.');
      }

      if (receiver.status !== 'active') {
        throw new Error('Tài khoản người nhận đã bị khóa.');
      }

      // Check receiver's friend request settings
      if (receiver.canReceiveFriendRequests === 'nobody') {
        throw new Error('Người dùng này không nhận lời mời kết bạn.');
      }

      // Check mutual friends requirement
      if (receiver.canReceiveFriendRequests === 'friends_of_friends') {
        const hasMutualFriends = await checkMutualFriends(senderId, receiverId, t);

        if (!hasMutualFriends) {
          throw new Error('Người dùng này chỉ nhận lời mời kết bạn từ bạn của bạn bè.');
        }
      }

      // Pessimistic locking to prevent race conditions
      const existingFriendship = await Friendship.findOne({
        where: {
          [Op.or]: [
            { senderId: senderId, receiverId: receiverId },
            { senderId: receiverId, receiverId: senderId },
          ],
        },
        lock: t.LOCK.UPDATE,
        transaction: t,
      });

      if (existingFriendship) {
        if (existingFriendship.status === 'pending') {
          throw new Error('Lời mời kết bạn đã được gửi và đang chờ phản hồi.');
        } else if (existingFriendship.status === 'accepted') {
          throw new Error('Hai bạn đã là bạn bè.');
        } else if (existingFriendship.status === 'rejected' || existingFriendship.status === 'cancelled') {
          // Allow resending after rejection/cancellation
          await existingFriendship.destroy({ transaction: t });
        }
      }

      // Create new friendship
      const newFriendship = await Friendship.create({
        senderId,
        receiverId,
        status: 'pending',
      }, { transaction: t });

      return newFriendship;
    });
  } catch (error) {
    console.error('[sendFriendRequest] Transaction failed:', error.message);
    throw error;
  }

  // Invalidate caches AFTER successful transaction
  await invalidateFriendCaches(senderId, receiverId);

  // Fetch user info for notifications
  const sender = await User.findByPk(senderId, {
    attributes: ['id', 'uuid', 'username', 'avatarUrl']
  });
  const receiver = await User.findByPk(receiverId, {
    attributes: ['id', 'uuid', 'username', 'avatarUrl']
  });

  // Emit socket events
  const io = getIo();
  const friendRequestData = {
    id: friendship.id,
    senderId: senderId,
    sender: sender,
    receiverId: receiverId,
    receiver: receiver,
    status: 'pending',
    createdAt: friendship.createdAt,
  };

  safeSocketEmit(io, `user_${receiverId}`, 'friend:request', friendRequestData);
  safeSocketEmit(io, `user_${senderId}`, 'friend:request:sent', friendRequestData);

  // Publish to Redis Pub/Sub
  await safeRedisPublish(REDIS_CHANNELS.FRIEND_REQUEST, friendRequestData);

  // Create notification
  try {
    const { title, body } = generateNotificationContent('friend_request', {
      senderName: sender.username
    });
    await createNotification({
      userId: receiverId,
      type: 'friend_request',
      title,
      body,
      link: `/profile/${sender.uuid}`,
      senderId,
      metadata: { friendshipId: friendship.id }
    });
  } catch (notifError) {
    console.error('[sendFriendRequest] Failed to create notification:', notifError.message);
    // Non-critical, don't throw
  }

  return friendship;
};

/**
 * @desc Lấy danh sách bạn bè (status: 'accepted') với pagination
 * @param {number} userId - ID của người dùng
 * @param {string} query - Tìm kiếm theo username (optional)
 * @param {number} page - Số trang (default: 1)
 * @param {number} limit - Số lượng items per page (default: 10)
 * @returns {Promise<Object>} Object chứa data và meta pagination
 */
const getFriends = async (userId, query = null, page = 1, limit = 10) => {
  try {
    // Validate inputs
    const validPage = Math.max(1, parseInt(page) || 1);
    const validLimit = Math.min(50, Math.max(1, parseInt(limit) || 10));
    const offset = (validPage - 1) * validLimit;

    const cacheKey = `user:${userId}:friends:${query || 'all'}:${validPage}:${validLimit}`;

    // Try cache first (only for first page without query)
    if (validPage === 1 && !query) {
      const cachedFriends = await redisHelpers.safeGet(cacheKey);
      if (cachedFriends) {
        return cachedFriends;
      }
    }

    const searchQuery = query && query.trim() ? query.trim() : null;
    const replacements = { userId };

    // Build query to get friend IDs with proper SQL escaping
    let friendIdsQuery = `
      SELECT DISTINCT CASE 
        WHEN f.senderId = :userId THEN f.receiverId
        ELSE f.senderId
      END as friendId
      FROM Friendships f
      WHERE (f.senderId = :userId OR f.receiverId = :userId)
      AND f.status = 'accepted'
    `;

    // Add search filter if provided
    if (searchQuery) {
      friendIdsQuery = `
        SELECT DISTINCT CASE 
          WHEN f.senderId = :userId THEN f.receiverId
          ELSE f.senderId
        END as friendId
        FROM Friendships f
        INNER JOIN Users u ON (
          (f.senderId = :userId AND u.id = f.receiverId) OR
          (f.receiverId = :userId AND u.id = f.senderId)
        )
        WHERE (f.senderId = :userId OR f.receiverId = :userId)
        AND f.status = 'accepted'
        AND u.username LIKE :searchQuery
      `;
      replacements.searchQuery = `%${searchQuery}%`;
    }

    // Get all friend IDs matching criteria
    const friendIdsResult = await db.sequelize.query(friendIdsQuery, {
      replacements,
      type: db.sequelize.QueryTypes.SELECT,
    });

    const friendIds = friendIdsResult.map(row => row.friendId);

    if (friendIds.length === 0) {
      const emptyResult = {
        data: [],
        meta: {
          page: validPage,
          limit: validLimit,
          total: 0,
          totalPages: 0,
          hasMore: false,
        },
      };

      if (validPage === 1 && !query) {
        await redisHelpers.safeSet(cacheKey, emptyResult, 300);
      }

      return emptyResult;
    }

    // Total count
    const total = friendIds.length;
    const totalPages = Math.ceil(total / validLimit);

    // Fetch paginated friends with proper attributes
    const friends = await User.findAll({
      where: { id: { [Op.in]: friendIds } },
      attributes: [
        'id', 'uuid', 'username', 'avatarUrl',
        'online', 'lastOnline', 'showOnlineStatus'
      ],
      limit: validLimit,
      offset: offset,
      order: [['username', 'ASC']],
    });

    // Transform results with privacy settings
    const transformedFriends = friends.map(friend => {
      const friendData = friend.get({ plain: true });

      if (friendData.showOnlineStatus === false) {
        friendData.online = false;
        friendData.lastOnline = null;
        friendData.hidden = true;
      } else {
        friendData.hidden = false;
      }

      delete friendData.showOnlineStatus;
      return friendData;
    });

    const result = {
      data: transformedFriends,
      meta: {
        page: validPage,
        limit: validLimit,
        total: total,
        totalPages: totalPages,
        hasMore: validPage < totalPages,
      },
    };

    // Cache result (only first page without query)
    if (validPage === 1 && !query) {
      await redisHelpers.safeSet(cacheKey, result, 300);
    }

    return result;
  } catch (error) {
    console.error('[getFriends] Error:', error.message);
    throw error;
  }
};

/**
 * @desc Lấy danh sách lời mời kết bạn đang chờ (người dùng là receiver) với pagination
 * @param {number} userId - ID của người dùng
 * @param {number} page - Số trang (default: 1)
 * @param {number} limit - Số lượng items per page (default: 10)
 * @returns {Promise<Object>} Object chứa data và meta pagination
 */
const getPendingFriendRequests = async (userId, page = 1, limit = 10) => {
  try {
    const validPage = Math.max(1, parseInt(page) || 1);
    const validLimit = Math.min(50, Math.max(1, parseInt(limit) || 10));
    const offset = (validPage - 1) * validLimit;

    const whereCondition = {
      receiverId: userId,
      status: 'pending',
    };

    // Count total
    const total = await Friendship.count({ where: whereCondition });

    // Fetch with pagination
    const pendingRequests = await Friendship.findAll({
      where: whereCondition,
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'uuid', 'username', 'avatarUrl', 'online', 'lastOnline'],
        },
      ],
      limit: validLimit,
      offset: offset,
      order: [['createdAt', 'DESC']],
    });

    const totalPages = Math.ceil(total / validLimit);

    return {
      data: pendingRequests,
      meta: {
        page: validPage,
        limit: validLimit,
        total: total,
        totalPages: totalPages,
        hasMore: validPage < totalPages,
      },
    };
  } catch (error) {
    console.error('[getPendingFriendRequests] Error:', error.message);
    throw error;
  }
};

/**
 * @desc Lấy danh sách lời mời kết bạn đã gửi (người dùng là sender) với pagination
 * @param {number} userId - ID của người dùng
 * @param {number} page - Số trang (default: 1)
 * @param {number} limit - Số lượng items per page (default: 10)
 * @returns {Promise<Object>} Object chứa data và meta pagination
 */
const getSentFriendRequests = async (userId, page = 1, limit = 10) => {
  try {
    const validPage = Math.max(1, parseInt(page) || 1);
    const validLimit = Math.min(50, Math.max(1, parseInt(limit) || 10));
    const offset = (validPage - 1) * validLimit;

    const whereCondition = {
      senderId: userId,
      status: 'pending',
    };

    // Count total
    const total = await Friendship.count({ where: whereCondition });

    // Fetch with pagination
    const sentRequests = await Friendship.findAll({
      where: whereCondition,
      include: [
        {
          model: User,
          as: 'receiver',
          attributes: ['id', 'uuid', 'username', 'avatarUrl', 'online', 'lastOnline'],
        },
      ],
      limit: validLimit,
      offset: offset,
      order: [['createdAt', 'DESC']],
    });

    const totalPages = Math.ceil(total / validLimit);

    return {
      data: sentRequests,
      meta: {
        page: validPage,
        limit: validLimit,
        total: total,
        totalPages: totalPages,
        hasMore: validPage < totalPages,
      },
    };
  } catch (error) {
    console.error('[getSentFriendRequests] Error:', error.message);
    throw error;
  }
};

/**
 * @desc Chấp nhận lời mời kết bạn
 * @param {number} userId - ID của người dùng (người chấp nhận)
 * @param {number} inviteId - ID của lời mời kết bạn
 * @returns {Promise<Friendship>} Đối tượng Friendship đã cập nhật
 */
const acceptFriendRequest = async (userId, inviteId) => {
  let friendship;

  try {
    friendship = await db.sequelize.transaction(async (t) => {
      const existingFriendship = await Friendship.findOne({
        where: {
          id: inviteId,
          receiverId: userId,
          status: 'pending',
        },
        transaction: t,
      });

      if (!existingFriendship) {
        throw new Error('Lời mời kết bạn không tồn tại hoặc không thể chấp nhận.');
      }

      existingFriendship.status = 'accepted';
      await existingFriendship.save({ transaction: t });

      return existingFriendship;
    });
  } catch (error) {
    console.error('[acceptFriendRequest] Transaction failed:', error.message);
    throw error;
  }

  // Invalidate caches AFTER successful transaction
  await invalidateFriendCaches(friendship.senderId, friendship.receiverId);

  // Fetch user info
  const sender = await User.findByPk(friendship.senderId, {
    attributes: ['id', 'uuid', 'username', 'avatarUrl']
  });
  const receiver = await User.findByPk(friendship.receiverId, {
    attributes: ['id', 'uuid', 'username', 'avatarUrl']
  });

  // Emit socket events
  const io = getIo();
  const friendshipUpdateData = {
    type: 'accepted',
    friendshipId: friendship.id,
    senderId: friendship.senderId,
    receiverId: friendship.receiverId,
    friendOfSender: receiver,
    friendOfReceiver: sender,
  };

  safeSocketEmit(io, `user_${friendship.senderId}`, 'friendship:update', {
    ...friendshipUpdateData,
    friend: receiver
  });
  safeSocketEmit(io, `user_${friendship.receiverId}`, 'friendship:update', {
    ...friendshipUpdateData,
    friend: sender
  });

  // Publish to Redis
  await safeRedisPublish(REDIS_CHANNELS.FRIENDSHIP_UPDATE, friendshipUpdateData);

  // Create notification
  try {
    const { title, body } = generateNotificationContent('friend_request_status', {
      senderName: receiver.username,
      status: 'accepted'
    });
    await createNotification({
      userId: friendship.senderId,
      type: 'friend_request_status',
      title,
      body,
      link: `/profile/${receiver.uuid}`,
      senderId: friendship.receiverId,
      metadata: { friendshipId: friendship.id, status: 'accepted' }
    });
  } catch (notifError) {
    console.error('[acceptFriendRequest] Failed to create notification:', notifError.message);
  }

  return friendship;
};

/**
 * @desc Từ chối lời mời kết bạn
 * @param {number} userId - ID của người dùng (người từ chối)
 * @param {number} inviteId - ID của lời mời kết bạn
 * @returns {Promise<Friendship>} Đối tượng Friendship đã cập nhật
 */
const rejectFriendRequest = async (userId, inviteId) => {
  let friendship;

  try {
    friendship = await db.sequelize.transaction(async (t) => {
      const existingFriendship = await Friendship.findOne({
        where: {
          id: inviteId,
          receiverId: userId,
          status: 'pending',
        },
        transaction: t,
      });

      if (!existingFriendship) {
        throw new Error('Lời mời kết bạn không tồn tại hoặc không thể từ chối.');
      }

      existingFriendship.status = 'rejected';
      await existingFriendship.save({ transaction: t });

      return existingFriendship;
    });
  } catch (error) {
    console.error('[rejectFriendRequest] Transaction failed:', error.message);
    throw error;
  }

  // Invalidate caches AFTER successful transaction
  await invalidateFriendCaches(friendship.senderId, friendship.receiverId);

  // Fetch user info
  const sender = await User.findByPk(friendship.senderId, {
    attributes: ['id', 'uuid', 'username', 'avatarUrl']
  });
  const receiver = await User.findByPk(friendship.receiverId, {
    attributes: ['id', 'uuid', 'username', 'avatarUrl']
  });

  // Emit socket events
  const io = getIo();
  const friendshipUpdateData = {
    type: 'rejected',
    friendshipId: friendship.id,
    senderId: friendship.senderId,
    receiverId: friendship.receiverId,
  };

  safeSocketEmit(io, `user_${friendship.senderId}`, 'friendship:update', friendshipUpdateData);
  safeSocketEmit(io, `user_${friendship.receiverId}`, 'friendship:update', friendshipUpdateData);

  // Publish to Redis
  await safeRedisPublish(REDIS_CHANNELS.FRIENDSHIP_UPDATE, friendshipUpdateData);

  // Optional: Create notification (consider UX - many apps don't notify rejection)
  try {
    const { title, body } = generateNotificationContent('friend_request_status', {
      senderName: receiver.username,
      status: 'rejected'
    });
    await createNotification({
      userId: friendship.senderId,
      type: 'friend_request_status',
      title,
      body,
      link: `/profile/${receiver.uuid}`,
      senderId: friendship.receiverId,
      metadata: { friendshipId: friendship.id, status: 'rejected' }
    });
  } catch (notifError) {
    console.error('[rejectFriendRequest] Failed to create notification:', notifError.message);
  }

  return friendship;
};

/**
 * @desc Hủy lời mời kết bạn đã gửi
 * @param {number} userId - ID của người dùng (người hủy)
 * @param {number} requestId - ID của lời mời kết bạn (friendshipId)
 * @returns {Promise<void>}
 */
const cancelFriendRequest = async (userId, requestId) => {
  let friendship;

  try {
    friendship = await db.sequelize.transaction(async (t) => {
      const existingFriendship = await Friendship.findOne({
        where: {
          id: requestId,
          senderId: userId,
          status: 'pending',
        },
        transaction: t,
      });

      if (!existingFriendship) {
        throw new Error('Lời mời kết bạn không tồn tại hoặc không thể hủy.');
      }

      await existingFriendship.destroy({ transaction: t });

      return existingFriendship;
    });
  } catch (error) {
    console.error('[cancelFriendRequest] Transaction failed:', error.message);
    throw error;
  }

  // Invalidate caches AFTER successful transaction
  await invalidateFriendCaches(friendship.senderId, friendship.receiverId);

  // Delete notification
  try {
    await deleteNotificationByFriendship(friendship.id, friendship.receiverId);
  } catch (error) {
    console.error('[cancelFriendRequest] Failed to delete notification:', error.message);
  }

  // Emit socket events
  const io = getIo();
  const friendshipUpdateData = {
    type: 'cancelled',
    friendshipId: friendship.id,
    senderId: friendship.senderId,
    receiverId: friendship.receiverId,
  };

  safeSocketEmit(io, `user_${friendship.senderId}`, 'friendship:update', friendshipUpdateData);
  safeSocketEmit(io, `user_${friendship.receiverId}`, 'friendship:update', friendshipUpdateData);

  // Publish to Redis
  await safeRedisPublish(REDIS_CHANNELS.FRIENDSHIP_UPDATE, friendshipUpdateData);
};

/**
 * @desc Hủy kết bạn
 * @param {number} userId - ID của người dùng
 * @param {number} friendId - ID của người bạn muốn hủy kết bạn
 * @returns {Promise<void>}
 */
const removeFriend = async (userId, friendId) => {
  let friendship;

  try {
    friendship = await db.sequelize.transaction(async (t) => {
      const existingFriendship = await Friendship.findOne({
        where: {
          [Op.or]: [
            { senderId: userId, receiverId: friendId },
            { senderId: friendId, receiverId: userId },
          ],
          status: 'accepted',
        },
        transaction: t,
      });

      if (!existingFriendship) {
        throw new Error('Không tìm thấy tình bạn hoặc không thể hủy kết bạn.');
      }

      await existingFriendship.destroy({ transaction: t });

      // Cleanup related notifications
      try {
        await Notification.destroy({
          where: {
            type: { [Op.in]: ['friend_request', 'friend_request_status'] },
            [Op.or]: [
              { userId: userId, senderId: friendId },
              { userId: friendId, senderId: userId }
            ]
          },
          transaction: t
        });
      } catch (notifError) {
        console.error('[removeFriend] Failed to cleanup notifications:', notifError.message);
        // Don't throw - notification cleanup is not critical
      }

      return existingFriendship;
    });
  } catch (error) {
    console.error('[removeFriend] Transaction failed:', error.message);
    throw error;
  }

  // Invalidate caches AFTER successful transaction
  await invalidateFriendCaches(userId, friendId);

  // Emit socket events
  const io = getIo();
  const friendshipUpdateData = {
    type: 'removed',
    friendshipId: friendship.id,
    friendId: friendId,
    userId: userId,
  };

  safeSocketEmit(io, `user_${userId}`, 'friendship:update', friendshipUpdateData);
  safeSocketEmit(io, `user_${friendId}`, 'friendship:update', friendshipUpdateData);

  // Publish to Redis
  await safeRedisPublish(REDIS_CHANNELS.FRIENDSHIP_UPDATE, friendshipUpdateData);
};

/**
 * @desc Search users by username or uuid with optimized performance
 * @param {string} query - Search query string
 * @param {number} currentUserId - Current user ID to exclude from results
 * @param {object} options - Additional options (limit, offset)
 * @returns {Promise<Array<User>>} List of matching users
 */
const searchUsers = async (query, currentUserId, options = {}) => {
  // Input validation
  if (!query || typeof query !== 'string') {
    throw new Error('Invalid search query');
  }

  if (!currentUserId || !Number.isInteger(currentUserId)) {
    throw new Error('Invalid user ID');
  }

  // Sanitize and trim query
  const sanitizedQuery = query.trim();

  if (sanitizedQuery.length === 0) {
    return [];
  }

  if (sanitizedQuery.length > 100) {
    throw new Error('Search query too long (max 100 characters)');
  }

  const limit = Math.min(options.limit || 10, 50);
  const offset = options.offset || 0;

  // Check cache
  const cacheKey = `search:users:${currentUserId}:${sanitizedQuery}:${limit}:${offset}`;
  const cached = await redisHelpers.safeGet(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    // Check if query is UUID
    const isUuidQuery = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(sanitizedQuery);

    // Build where clause (username and UUID only - no email for privacy)
    const whereCondition = {
      id: { [Op.ne]: currentUserId },
      status: 'active',
      [Op.or]: isUuidQuery
        ? [{ uuid: sanitizedQuery }]
        : [{ username: { [Op.like]: `%${sanitizedQuery}%` } }],
    };

    // Step 1: Get users matching search
    const users = await User.findAll({
      where: whereCondition,
      attributes: [
        'id', 'uuid', 'username', 'avatarUrl',
        'online', 'lastOnline', 'showOnlineStatus'
      ],
      limit,
      offset,
    });

    if (users.length === 0) {
      await redisHelpers.safeSet(cacheKey, [], 120);
      return [];
    }

    // Step 2: Get friendship statuses separately for better performance
    const userIds = users.map(u => u.id);
    const friendships = await Friendship.findAll({
      where: {
        [Op.or]: [
          { senderId: currentUserId, receiverId: { [Op.in]: userIds } },
          { receiverId: currentUserId, senderId: { [Op.in]: userIds } },
        ],
      },
      attributes: ['senderId', 'receiverId', 'status'],
      raw: true,
    });

    // Step 3: Build friendship status map
    const friendshipMap = new Map();
    for (const fs of friendships) {
      const otherUserId = fs.senderId === currentUserId ? fs.receiverId : fs.senderId;
      friendshipMap.set(otherUserId, fs.status);
    }

    // Step 4: Transform results
    const results = users.map(user => {
      const userData = user.get({ plain: true });
      const isHidden = userData.showOnlineStatus === false;

      return {
        id: userData.id,
        uuid: userData.uuid,
        username: userData.username,
        avatarUrl: userData.avatarUrl,
        online: isHidden ? false : userData.online,
        lastOnline: isHidden ? null : userData.lastOnline,
        hidden: isHidden,
        friendshipStatus: friendshipMap.get(userData.id) || 'none',
      };
    });

    // Cache for 2 minutes
    await redisHelpers.safeSet(cacheKey, results, 120);

    return results;
  } catch (error) {
    console.error('[searchUsers] Error:', error.message);
    throw new Error('Failed to search users');
  }
};

export {
  sendFriendRequest,
  getFriends,
  getPendingFriendRequests,
  getSentFriendRequests,
  acceptFriendRequest,
  rejectFriendRequest,
  cancelFriendRequest,
  removeFriend,
  searchUsers,
};