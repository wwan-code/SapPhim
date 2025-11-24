import sequelize from '../config/database.js';
import { redisPoolManager } from '../config/redis.js';
import { getIo } from '../config/socket.js';

export const healthMonitor = {
    /**
     * Get Sequelize Pool Statistics
     */
    getSequelizePoolStats() {
        const pool = sequelize.connectionManager.pool;
        return {
            active: pool.using, // Connections currently in use
            idle: pool.available, // Connections available in pool
            waiting: pool.pending, // Requests waiting for connection
            size: pool.size, // Total connections
            max: pool.max,
            min: pool.min,
        };
    },

    /**
     * Get Redis Pool Statistics
     */
    getRedisPoolStats() {
        return redisPoolManager.getStats();
    },

    /**
     * Get Socket.IO Statistics
     */
    getSocketIOStats() {
        try {
            const io = getIo();
            return {
                connected: io.engine.clientsCount,
                polling: io.engine.clientsCount - (io.engine.clientsCount - io.sockets.sockets.size), // Estimate
                websocket: io.sockets.sockets.size,
            };
        } catch (error) {
            return { connected: 0, error: 'Socket.IO not initialized' };
        }
    },

    /**
     * Get System Memory Usage
     */
    getSystemStats() {
        const used = process.memoryUsage();
        return {
            rss: Math.round(used.rss / 1024 / 1024) + ' MB',
            heapTotal: Math.round(used.heapTotal / 1024 / 1024) + ' MB',
            heapUsed: Math.round(used.heapUsed / 1024 / 1024) + ' MB',
            external: Math.round(used.external / 1024 / 1024) + ' MB',
            uptime: process.uptime(),
        };
    },

    /**
     * Get All Metrics
     */
    getAllMetrics() {
        return {
            timestamp: new Date().toISOString(),
            status: 'ok',
            database: this.getSequelizePoolStats(),
            redis: this.getRedisPoolStats(),
            socketIO: this.getSocketIOStats(),
            system: this.getSystemStats(),
        };
    },

    /**
     * Check Overall Health
     */
    async checkHealth() {
        try {
            // Check DB
            await sequelize.authenticate();

            // Check Redis
            const redis = await redisPoolManager.getConnection('main');
            await redis.ping();
            await redisPoolManager.releaseConnection(redis, 'main');

            return true;
        } catch (error) {
            console.error('Health check failed:', error);
            return false;
        }
    }
};

export default healthMonitor;
