import { Queue } from 'bullmq';
import { redisHelpers } from '../config/redis.js';

// Re-use Redis connection config from redis.js or create new connection options
const redisConnection = {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD,
};

export const viewQueue = new Queue('view-queue', {
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

export const addViewJob = async (data) => {
    return await viewQueue.add('increment-view', data);
};
