import { createClient } from 'redis';
import { createPool } from 'generic-pool';

// Redis Configuration
const redisConfig = {
    username: 'default',
    password: process.env.REDIS_PASSWORD,
    socket: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT,
        reconnectStrategy: (retries) => {
            if (retries > 20) {
                console.error('Redis: Too many reconnection attempts, giving up');
                return new Error('Too many reconnection attempts');
            }
            const delay = Math.min(retries * 50, 3000);
            return delay;
        },
        connectTimeout: 10000,
        keepAlive: 5000,
    },
};

// Pool Configuration Factory
const createPoolConfig = (max, min) => ({
    max,
    min,
    testOnBorrow: true,
    acquireTimeoutMillis: parseInt(process.env.REDIS_POOL_ACQUIRE_TIMEOUT, 10) || 5000,
    idleTimeoutMillis: parseInt(process.env.REDIS_POOL_IDLE_TIMEOUT, 10) || 30000,
    evictionRunIntervalMillis: 15000,
});

class RedisPoolManager {
    constructor() {
        this.pools = {
            main: null,
            cache: null,
            pubsub: null,
        };
        this.isInitialized = false;
    }

    // Factory for creating a single Redis client
    createClientFactory(name) {
        return {
            create: async () => {
                const client = createClient(redisConfig);
                client.on('error', (err) => console.error(`❌ Redis Client Error (${name}):`, err.message));
                await client.connect();
                return client;
            },
            destroy: async (client) => {
                if (client.isOpen) {
                    await client.quit();
                }
            },
            validate: async (client) => {
                return client.isOpen && client.isReady;
            },
        };
    }

    initialize() {
        if (this.isInitialized) return;

        console.log('🔄 Initializing Redis Connection Pools...');

        // 1. Main Pool (Writes, Critical Ops)
        this.pools.main = createPool(
            this.createClientFactory('Main'),
            createPoolConfig(
                parseInt(process.env.REDIS_POOL_MAIN_MAX, 10) || 5,
                parseInt(process.env.REDIS_POOL_MAIN_MIN, 10) || 2
            )
        );

        // 2. Cache Pool (Reads, High Volume)
        this.pools.cache = createPool(
            this.createClientFactory('Cache'),
            createPoolConfig(
                parseInt(process.env.REDIS_POOL_CACHE_MAX, 10) || 10,
                parseInt(process.env.REDIS_POOL_CACHE_MIN, 10) || 3
            )
        );

        // 3. PubSub Pool (Dedicated for Socket.IO)
        this.pools.pubsub = createPool(
            this.createClientFactory('PubSub'),
            createPoolConfig(
                parseInt(process.env.REDIS_POOL_PUBSUB_MAX, 10) || 5,
                parseInt(process.env.REDIS_POOL_PUBSUB_MIN, 10) || 1
            )
        );

        this.isInitialized = true;
        console.log('✅ Redis Connection Pools Initialized');
    }

    async getConnection(type = 'main') {
        if (!this.pools[type]) {
            throw new Error(`Invalid pool type: ${type}`);
        }
        try {
            return await this.pools[type].acquire();
        } catch (error) {
            console.error(`Failed to acquire connection from ${type} pool:`, error);
            throw error;
        }
    }

    async releaseConnection(client, type = 'main') {
        if (!this.pools[type]) return;
        try {
            await this.pools[type].release(client);
        } catch (error) {
            console.error(`Failed to release connection to ${type} pool:`, error);
        }
    }

    async shutdown() {
        console.log('🛑 Shutting down Redis Pools...');
        const closePromises = Object.values(this.pools).map((pool) => {
            if (pool) return pool.drain().then(() => pool.clear());
            return Promise.resolve();
        });
        await Promise.all(closePromises);
        this.isInitialized = false;
        console.log('✅ Redis Pools Closed');
    }

    getStats() {
        return {
            main: this.pools.main ? {
                active: this.pools.main.borrowed,
                idle: this.pools.main.available,
                size: this.pools.main.size,
                pending: this.pools.main.pending,
            } : null,
            cache: this.pools.cache ? {
                active: this.pools.cache.borrowed,
                idle: this.pools.cache.available,
                size: this.pools.cache.size,
                pending: this.pools.cache.pending,
            } : null,
            pubsub: this.pools.pubsub ? {
                active: this.pools.pubsub.borrowed,
                idle: this.pools.pubsub.available,
                size: this.pools.pubsub.size,
                pending: this.pools.pubsub.pending,
            } : null,
        };
    }
}

export const redisPoolManager = new RedisPoolManager();

// Auto-initialize on import
redisPoolManager.initialize();

// Helper functions using the pool
export const redisHelpers = {
    async safeGet(key, fallback = null) {
        let client;
        try {
            client = await redisPoolManager.getConnection('cache');
            const value = await client.get(key);
            return value ? JSON.parse(value) : fallback;
        } catch (error) {
            console.error(`Redis GET error for key ${key}:`, error);
            return fallback;
        } finally {
            if (client) await redisPoolManager.releaseConnection(client, 'cache');
        }
    },

    async safeSet(key, value, ttl = null) {
        let client;
        try {
            client = await redisPoolManager.getConnection('main');
            const serialized = JSON.stringify(value);
            if (ttl) {
                await client.setEx(key, ttl, serialized);
            } else {
                await client.set(key, serialized);
            }
            return true;
        } catch (error) {
            console.error(`Redis SET error for key ${key}:`, error);
            return false;
        } finally {
            if (client) await redisPoolManager.releaseConnection(client, 'main');
        }
    },

    async safeDel(...keys) {
        let client;
        try {
            client = await redisPoolManager.getConnection('main');
            return await client.del(keys);
        } catch (error) {
            console.error(`Redis DEL error for keys ${keys}:`, error);
            return 0;
        } finally {
            if (client) await redisPoolManager.releaseConnection(client, 'main');
        }
    },

    async safeIncr(key, ttl = null) {
        let client;
        try {
            client = await redisPoolManager.getConnection('main');
            const count = await client.incr(key);
            if (ttl && count === 1) {
                await client.expire(key, ttl);
            }
            return count;
        } catch (error) {
            console.error(`Redis INCR error for key ${key}:`, error);
            return 0;
        } finally {
            if (client) await redisPoolManager.releaseConnection(client, 'main');
        }
    },

    async cache(key, fetchFn, ttl = 300) {
        try {
            const cached = await this.safeGet(key);
            if (cached !== null) return cached;

            const data = await fetchFn();
            if (data !== null && data !== undefined) {
                await this.safeSet(key, data, ttl);
            }
            return data;
        } catch (error) {
            console.error(`Cache error for key ${key}:`, error);
            return await fetchFn();
        }
    },

    async publish(channel, message) {
        let client;
        try {
            client = await redisPoolManager.getConnection('pubsub');
            const payload = typeof message === 'string' ? message : JSON.stringify(message);
            return await client.publish(channel, payload);
        } catch (error) {
            console.error(`Redis PUBLISH error for channel ${channel}:`, error);
            return 0;
        } finally {
            if (client) await redisPoolManager.releaseConnection(client, 'pubsub');
        }
    },

    async invalidatePattern(pattern) {
        let client;
        try {
            client = await redisPoolManager.getConnection('main');
            const keys = await client.keys(pattern);
            if (keys.length > 0) {
                return await client.del(keys);
            }
            return 0;
        } catch (error) {
            console.error(`Redis pattern invalidation error for ${pattern}:`, error);
            return 0;
        } finally {
            if (client) await redisPoolManager.releaseConnection(client, 'main');
        }
    },

    // Video metadata caching helpers
    async cacheVideoMetadata(episodeId, metadata, ttl = 604800) {
        const key = `video:metadata:${episodeId}`;
        return await this.safeSet(key, metadata, ttl);
    },

    async getVideoMetadata(episodeId) {
        const key = `video:metadata:${episodeId}`;
        return await this.safeGet(key, null);
    },

    async invalidateVideoMetadata(episodeId) {
        const key = `video:metadata:${episodeId}`;
        return await this.safeDel(key);
    }
};

export default redisPoolManager;
