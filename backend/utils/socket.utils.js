import redisClient from '../config/redis.js';

/**
 * Safely emit socket event with error handling
 * @param {Object} io - Socket.IO instance
 * @param {string} room - Room name to emit to
 * @param {string} event - Event name
 * @param {*} data - Data to emit
 * @returns {boolean} Success status
 */
export const safeSocketEmit = (io, room, event, data) => {
    try {
        if (!io) {
            console.error('[Socket Utils] IO instance is null/undefined');
            return false;
        }
        io.to(room).emit(event, data);
        return true;
    } catch (error) {
        console.error(`[Socket Utils] Emit failed for event "${event}" to room "${room}":`, error.message);
        return false;
    }
};

/**
 * Safely publish to Redis channel with error handling
 * @param {string} channel - Redis channel name
 * @param {*} message - Message to publish (will be stringified)
 * @returns {Promise<boolean>} Success status
 */
export const safeRedisPublish = async (channel, message) => {
    try {
        if (redisClient.status !== 'ready') {
            console.warn(`[Redis Utils] Redis not ready (status: ${redisClient.status}), skipping publish to ${channel}`);
            return false;
        }

        const stringifiedMessage = typeof message === 'string' ? message : JSON.stringify(message);
        await redisClient.publish(channel, stringifiedMessage);
        return true;
    } catch (error) {
        console.error(`[Redis Utils] Publish failed for channel "${channel}":`, error.message);
        return false;
    }
};

/**
 * Emit socket event to multiple rooms safely
 * @param {Object} io - Socket.IO instance
 * @param {Array<string>} rooms - Array of room names
 * @param {string} event - Event name
 * @param {*} data - Data to emit
 * @returns {Object} Success count and failed rooms
 */
export const safeSocketEmitToRooms = (io, rooms, event, data) => {
    const results = {
        successCount: 0,
        failedRooms: []
    };

    for (const room of rooms) {
        const success = safeSocketEmit(io, room, event, data);
        if (success) {
            results.successCount++;
        } else {
            results.failedRooms.push(room);
        }
    }

    return results;
};
