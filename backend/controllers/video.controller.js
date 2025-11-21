import path from 'path';
import { fileURLToPath } from 'url';
import Episode from '../models/Episode.js';
import { videoQueue } from '../services/video.queue.js';
import logger from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const uploadVideo = async (req, res) => {
    try {
        const { episodeId } = req.body;
        const file = req.file;

        if (!file) {
            return res.status(400).json({ message: 'No video file uploaded' });
        }

        if (!episodeId) {
            return res.status(400).json({ message: 'Episode ID is required' });
        }

        const episode = await Episode.findByPk(episodeId);
        if (!episode) {
            return res.status(404).json({ message: 'Episode not found' });
        }

        // Define output directory for HLS
        // Structure: uploads/videos/hls/{episode_uuid}/
        const outputDir = path.join(__dirname, '../uploads/videos/hls', episode.uuid);

        // Add to queue
        const job = await videoQueue.add('transcode', {
            episodeId: episode.id,
            filePath: file.path,
            outputDir: outputDir,
            userId: req.user?.id, // Pass userId for socket notifications
        });

        // Update episode status
        await episode.update({
            status: 'pending',
            jobId: job.id,
        });

        res.status(200).json({
            message: 'Video uploaded and transcoding started',
            jobId: job.id,
            status: 'pending',
        });

    } catch (error) {
        logger.error('Error in uploadVideo:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

export const getJobStatus = async (req, res) => {
    try {
        const { jobId } = req.params;
        const job = await videoQueue.getJob(jobId);

        if (!job) {
            return res.status(404).json({ message: 'Job not found' });
        }

        const state = await job.getState();
        const progress = job.progress;

        res.status(200).json({
            jobId,
            state,
            progress,
        });

    } catch (error) {
        logger.error('Error in getJobStatus:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};
