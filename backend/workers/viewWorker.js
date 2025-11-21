import { Worker } from 'bullmq';
import Movie from '../models/Movie.js';
import Episode from '../models/Episode.js';
import logger from '../utils/logger.js';

const redisConnection = {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD,
};

const worker = new Worker('view-queue', async (job) => {
    const { movieId, episodeId } = job.data;

    try {
        if (movieId) {
            await Movie.increment('views', { where: { id: movieId } });
        }

        if (episodeId) {
            await Episode.increment('views', { where: { id: episodeId } });
        }

        // Optional: Update trending score in Redis here

    } catch (error) {
        logger.error(`Failed to process view increment for job ${job.id}:`, error);
        throw error;
    }
}, {
    connection: redisConnection,
    concurrency: 5, // Process 5 jobs concurrently
});

worker.on('completed', (job) => {
    // logger.info(`View increment job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
    logger.error(`View increment job ${job.id} failed: ${err.message}`);
});

export default worker;
