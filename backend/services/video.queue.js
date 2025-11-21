import { Queue, Worker } from 'bullmq';
import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import Episode from '../models/Episode.js';
import logger from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Redis connection config
const redisConfig = {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD,
};

// Create Queue
export const videoQueue = new Queue('video-transcoding', {
    connection: redisConfig,
});

// Transcoding options
const TRANSCODE_OPTIONS = [
    {
        name: '720p',
        width: 1280,
        height: 720,
        bitrate: '2500k',
        audioBitrate: '128k',
    },
    {
        name: '480p',
        width: 854,
        height: 480,
        bitrate: '1000k',
        audioBitrate: '96k',
    },
];

// Worker Processor
const worker = new Worker(
    'video-transcoding',
    async (job) => {
        const { episodeId, filePath, outputDir, userId } = job.data;
        logger.info(`Job ${job.id}: Starting transcoding for Episode ${episodeId}`);

        const emitProgress = (stage, progress, message, currentQuality = null) => {
            if (userId) {
                import('../config/socket.js').then(({ emitToUser }) => {
                    emitToUser(userId, 'video:transcode:progress', {
                        episodeId,
                        jobId: job.id,
                        stage,
                        progress,
                        message,
                        currentQuality
                    });
                }).catch(err => console.error('Socket import error:', err));
            }
        };

        try {
            emitProgress('probe', 10, 'Đang phân tích video...');
            const episode = await Episode.findByPk(episodeId);
            if (!episode) throw new Error('Episode not found');

            await episode.update({ status: 'processing', jobId: job.id });

            // Extract video duration using ffprobe
            const videoDuration = await new Promise((resolve, reject) => {
                ffmpeg.ffprobe(filePath, (err, metadata) => {
                    if (err) {
                        logger.error(`Failed to probe video: ${err.message}`);
                        resolve(null);
                    } else {
                        const durationInSeconds = metadata.format.duration;
                        if (durationInSeconds) {
                            const hours = Math.floor(durationInSeconds / 3600);
                            const minutes = Math.floor((durationInSeconds % 3600) / 60);
                            const seconds = Math.floor(durationInSeconds % 60);
                            const formatted = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
                            resolve(formatted);
                        } else {
                            resolve(null);
                        }
                    }
                });
            });

            if (videoDuration) {
                await episode.update({ duration: videoDuration });
                logger.info(`Job ${job.id}: Video duration extracted: ${videoDuration}`);
            }

            // Ensure output directory exists
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
            }

            const masterPlaylistPath = path.join(outputDir, 'master.m3u8');
            const variantPlaylists = [];

            emitProgress('transcode', 15, 'Bắt đầu chuyển mã...');

            // Create a promise for the transcoding process
            await new Promise((resolve, reject) => {
                let command = ffmpeg(filePath);

                // Optimize ffmpeg for speed
                command.addOption('-preset', 'veryfast'); // Faster encoding
                command.addOption('-threads', '0'); // Use all available threads

                TRANSCODE_OPTIONS.forEach((option) => {
                    command = command
                        .output(path.join(outputDir, `${option.name}.m3u8`))
                        .videoCodec('libx264')
                        .audioCodec('aac')
                        .size(`${option.width}x${option.height}`)
                        .videoBitrate(option.bitrate)
                        .audioBitrate(option.audioBitrate)
                        .addOption('-hls_time', '10')
                        .addOption('-hls_list_size', '0')
                        .addOption('-hls_segment_filename', path.join(outputDir, `${option.name}_%03d.ts`));

                    variantPlaylists.push({
                        path: `${option.name}.m3u8`,
                        bandwidth: parseInt(option.bitrate) * 1000,
                        resolution: `${option.width}x${option.height}`,
                    });
                });

                command
                    .on('start', (commandLine) => {
                        logger.info(`Spawned Ffmpeg with command: ${commandLine}`);
                    })
                    .on('progress', (progress) => {
                        if (progress.percent) {
                            const percent = Math.round(progress.percent);
                            job.updateProgress(percent);
                            // Map 0-100% of transcoding to 15-90% of total progress
                            const totalProgress = 15 + Math.round(percent * 0.75);
                            emitProgress('transcode', totalProgress, `Đang xử lý: ${percent}%`);
                        }
                    })
                    .on('end', () => {
                        resolve();
                    })
                    .on('error', (err) => {
                        reject(err);
                    })
                    .run();
            });

            emitProgress('finalize', 90, 'Đang tạo danh sách phát...');

            // Create Master Playlist
            let masterContent = '#EXTM3U\n#EXT-X-VERSION:3\n';
            variantPlaylists.forEach((variant) => {
                masterContent += `#EXT-X-STREAM-INF:BANDWIDTH=${variant.bandwidth},RESOLUTION=${variant.resolution}\n${variant.path}\n`;
            });

            fs.writeFileSync(masterPlaylistPath, masterContent);

            // Update Episode
            const relativePath = path.relative(path.join(__dirname, '../uploads'), masterPlaylistPath).replace(/\\/g, '/');

            await episode.update({
                status: 'ready',
                hlsUrl: `/uploads/${relativePath}`,
                quality: TRANSCODE_OPTIONS.map(o => o.name),
            });

            logger.info(`Job ${job.id}: Transcoding completed for Episode ${episodeId}`);

            emitProgress('cleanup', 95, 'Dọn dẹp file gốc...');

            // Clean up raw file
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                logger.info(`Cleaned up raw file: ${filePath}`);
            }

            emitProgress('complete', 100, 'Hoàn tất!');

        } catch (error) {
            logger.error(`Job ${job.id}: Transcoding failed`, error);
            const episode = await Episode.findByPk(episodeId);
            if (episode) {
                await episode.update({ status: 'error' });
            }
            if (userId) {
                import('../config/socket.js').then(({ emitToUser }) => {
                    emitToUser(userId, 'video:transcode:error', {
                        episodeId,
                        jobId: job.id,
                        message: 'Lỗi xử lý video: ' + error.message
                    });
                }).catch(e => console.error(e));
            }
            throw error;
        }
    },
    { connection: redisConfig }
);

worker.on('completed', (job) => {
    logger.info(`Job ${job.id} has completed!`);
});

worker.on('failed', (job, err) => {
    logger.error(`Job ${job.id} has failed with ${err.message}`);
});

export default videoQueue;
