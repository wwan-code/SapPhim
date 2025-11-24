import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import ffmpeg from 'fluent-ffmpeg';
import Episode from '../models/Episode.js';
import { videoQueue } from '../services/video.queue.js';
import * as episodeService from '../services/episode.service.js';
import logger from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper: Validate video file integrity using FFprobe
const validateVideoFile = (filePath) => {
    return new Promise((resolve, reject) => {
        ffmpeg.ffprobe(filePath, (err, metadata) => {
            if (err) {
                return reject(new Error('File is not a valid video or is corrupted'));
            }

            const videoStream = metadata.streams.find(s => s.codec_type === 'video');
            if (!videoStream) {
                return reject(new Error('File contains no video stream'));
            }

            const duration = metadata.format.duration;
            if (!duration || duration < 1) {
                return reject(new Error('Video duration is too short or invalid'));
            }

            resolve({
                duration,
                width: videoStream.width,
                height: videoStream.height,
                codec: videoStream.codec_name
            });
        });
    });
};

export const uploadVideo = async (req, res) => {
    const file = req.file;
    const { episodeId } = req.body;

    try {
        if (!file) {
            return res.status(400).json({ message: 'No video file uploaded' });
        }

        if (!episodeId) {
            // Cleanup file if request is invalid
            fs.unlinkSync(file.path);
            return res.status(400).json({ message: 'Episode ID is required' });
        }

        // 1. Check Episode Existence & Status
        const episode = await Episode.findByPk(episodeId);
        if (!episode) {
            fs.unlinkSync(file.path);
            return res.status(404).json({ message: 'Episode not found' });
        }

        // 2. Check for Duplicate Processing
        if (['processing', 'ready'].includes(episode.status)) {
            fs.unlinkSync(file.path);
            return res.status(409).json({
                message: `Episode is already ${episode.status}. Please delete existing video first.`
            });
        }

        // 3. Validate Video Integrity
        logger.info(`Validating uploaded file: ${file.path}`);
        try {
            const metadata = await validateVideoFile(file.path);
            logger.info(`Video valid: ${metadata.width}x${metadata.height}, ${metadata.duration}s, ${metadata.codec}`);
        } catch (validationError) {
            logger.error(`Validation failed for ${file.path}:`, validationError);
            fs.unlinkSync(file.path);

            // Cleanup episode on validation failure
            await episodeService.cleanupFailedUpload(episodeId);

            return res.status(400).json({
                message: 'Invalid video file',
                error: validationError.message
            });
        }

        // 4. Define Output Directory
        // Structure: uploads/videos/hls/{episode_uuid}/
        const outputDir = path.join(__dirname, '../uploads/videos/hls', episode.uuid);

        // 5. Add to BullMQ Queue
        const job = await videoQueue.add('transcode', {
            episodeId: episode.id,
            filePath: file.path,
            outputDir: outputDir,
            userId: req.user?.id,
        });

        if (!job || !job.id) {
            throw new Error('Failed to enqueue transcoding job');
        }

        // 6. Update Episode Status
        await episode.update({
            status: 'pending',
            jobId: job.id,
        });

        logger.info(`Job ${job.id} enqueued for Episode ${episode.id}`);

        res.status(200).json({
            message: 'Video uploaded and transcoding started',
            jobId: job.id,
            status: 'pending',
            fileInfo: {
                originalName: file.originalname,
                size: file.size,
                path: file.path
            }
        });

    } catch (error) {
        logger.error('Error in uploadVideo:', error);

        // Cleanup uploaded file on server error
        if (file && fs.existsSync(file.path)) {
            try {
                fs.unlinkSync(file.path);
                logger.info(`Cleaned up file after error: ${file.path}`);
            } catch (cleanupError) {
                logger.error('Failed to cleanup file:', cleanupError);
            }
        }

        // Cleanup episode on system error
        if (episodeId) {
            await episodeService.cleanupFailedUpload(episodeId);
        }

        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

export const getJobStatus = async (req, res) => {
    try {
        const { jobId } = req.params;

        if (!jobId) {
            return res.status(400).json({ message: 'Job ID is required' });
        }

        const job = await videoQueue.getJob(jobId);

        if (!job) {
            return res.status(404).json({ message: 'Job not found' });
        }

        const state = await job.getState();
        const progress = job.progress;
        const reason = job.failedReason;

        res.status(200).json({
            jobId,
            state,
            progress,
            failedReason: reason || null,
            data: job.data
        });

    } catch (error) {
        logger.error('Error in getJobStatus:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};
