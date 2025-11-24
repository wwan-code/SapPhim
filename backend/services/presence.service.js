import redisClient from '../config/redis.js';

const CONNECTION_KEY = (userId) => `presence:user:${userId}:connections`;
const STALE_THRESHOLD_MS = parseInt(process.env.PRESENCE_STALE_THRESHOLD_MS || 3 * 60 * 1000, 10);
const SCAN_BATCH_SIZE = parseInt(process.env.PRESENCE_SCAN_BATCH_SIZE || 200, 10);

const isRedisReady = () => redisClient.status === 'ready';

const safeRedisCall = async (fallback, task) => {
  if (!isRedisReady()) return fallback;
  try {
    return await task();
  } catch (error) {
    console.error('[PresenceService] Redis error:', error);
    return fallback;
  }
};

const serializeConnection = (socketId, metadata = {}) => {
  return JSON.stringify({
    socketId,
    metadata,
    timestamp: Date.now(),
  });
};

const parseUserIdFromKey = (key) => {
  const match = key.match(/^presence:user:(\d+):connections$/);
  return match ? parseInt(match[1], 10) : null;
};

export const registerConnection = async (userId, socketId, metadata = {}) => {
  return safeRedisCall(
    { isFirstConnection: true, connectionCount: 1 },
    async () => {
      const key = CONNECTION_KEY(userId);
      const previousCount = await redisClient.hLen(key);
      await redisClient.hSet(key, socketId, serializeConnection(socketId, metadata));
      return {
        isFirstConnection: previousCount === 0,
        connectionCount: previousCount + 1,
      };
    }
  );
};

export const unregisterConnection = async (userId, socketId) => {
  return safeRedisCall(
    { hasConnections: false, remaining: 0 },
    async () => {
      const key = CONNECTION_KEY(userId);
      await redisClient.hDel(key, socketId);
      const remaining = await redisClient.hLen(key);
      if (remaining === 0) {
        await redisClient.del(key);
      }
      return {
        hasConnections: remaining > 0,
        remaining,
      };
    }
  );
};

export const touchConnection = async (userId, socketId, metadata = {}) => {
  return safeRedisCall(false, async () => {
    const key = CONNECTION_KEY(userId);
    const exists = await redisClient.hExists(key, socketId);
    if (!exists) return false;

    const payload = await redisClient.hGet(key, socketId);
    let parsed = {};
    try {
      parsed = payload ? JSON.parse(payload) : {};
    } catch (error) {
      console.warn('[PresenceService] Failed to parse payload for touch.', error);
    }

    const mergedMetadata = { ...(parsed.metadata || {}), ...metadata };
    await redisClient.hSet(key, socketId, serializeConnection(socketId, mergedMetadata));
    return true;
  });
};

export const getGlobalConnectionCount = async (userId) => {
  return safeRedisCall(0, async () => {
    const key = CONNECTION_KEY(userId);
    return redisClient.hLen(key);
  });
};

const scanPresenceKeys = async (cursor = 0, onKeys = async () => {}) => {
  if (!isRedisReady()) return;

  let nextCursor = cursor;
  do {
    const result = await redisClient.scan(nextCursor, {
      MATCH: 'presence:user:*:connections',
      COUNT: SCAN_BATCH_SIZE,
    });
    nextCursor = parseInt(result.cursor, 10);
    const keys = result.keys || result[1] || [];
    if (keys.length > 0) {
      await onKeys(keys);
    }
  } while (nextCursor !== 0);
};

export const pruneStaleConnections = async () => {
  const staleUsers = [];
  if (!isRedisReady()) return staleUsers;

  const now = Date.now();

  await scanPresenceKeys(0, async (keys) => {
    for (const key of keys) {
      const userId = parseUserIdFromKey(key);
      if (!userId) continue;

      const entries = await redisClient.hGetAll(key);
      let removed = false;

      for (const [socketId, payload] of Object.entries(entries)) {
        let data = null;
        try {
          data = JSON.parse(payload);
        } catch (error) {
          console.warn('[PresenceService] Invalid payload during prune.', error);
        }

        const lastSeen = data?.timestamp || 0;
        if (!lastSeen || now - lastSeen > STALE_THRESHOLD_MS) {
          await redisClient.hDel(key, socketId);
          removed = true;
        }
      }

      const remaining = await redisClient.hLen(key);
      if (remaining === 0 && removed) {
        await redisClient.del(key);
        staleUsers.push({ userId, disconnectedAt: now });
      }
    }
  });

  return staleUsers;
};

export default {
  registerConnection,
  unregisterConnection,
  touchConnection,
  getGlobalConnectionCount,
  pruneStaleConnections,
};

