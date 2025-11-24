import { Queue } from 'bullmq';

// Re-use Redis connection config
const redisConnection = {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD,
};

export const notificationQueue = new Queue('notification-queue', {
    connection: redisConnection,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 1000,
        },
        removeOnComplete: true,
        removeOnFail: 1000,
    },
});

export const addNotificationJob = async (type, data) => {
    return await notificationQueue.add(type, { type, data });
};
