import { Queue, Worker } from 'bullmq';
import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import Episode from '../models/Episode.js';
import logger from '../utils/logger.js';
import { redisHelpers } from '../config/redis.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Redis connection config
const redisConfig = {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD,
};

// Create Queue with optimized settings
export const videoQueue = new Queue('video-transcoding', {
    connection: redisConfig,
    defaultJobOptions: {
        attempts: 2,
        backoff: {
            type: 'exponential',
            delay: 2000,
        },
        removeOnComplete: 100,
        removeOnFail: 50,
    },
});

// Enhanced Transcoding options
const TRANSCODE_OPTIONS = [
    {
        name: '1440p',
        width: 2560,
        height: 1440,
        bitrate: '10000k',
        audioBitrate: '192k',
        maxrate: '12000k',
        bufsize: '20000k',
    },
    {
        name: '1080p',
        width: 1920,
        height: 1080,
        bitrate: '5000k',
        audioBitrate: '128k',
        maxrate: '6000k',
        bufsize: '10000k',
    },
    {
        name: '720p',
        width: 1280,
        height: 720,
        bitrate: '2500k',
        audioBitrate: '128k',
        maxrate: '3000k',
        bufsize: '5000k',
    },
    {
        name: '480p',
        width: 854,
        height: 480,
        bitrate: '1000k',
        audioBitrate: '96k',
        maxrate: '1200k',
        bufsize: '2000k',
    },
];

// Configuration
const VIDEO_QUEUE_CONCURRENCY = parseInt(process.env.VIDEO_QUEUE_CONCURRENCY, 10) || 3;
const VIDEO_QUEUE_JOB_TIMEOUT = parseInt(process.env.VIDEO_QUEUE_JOB_TIMEOUT, 10) || 21600000; // 6 hours
const VIDEO_THUMBNAIL_INTERVAL = process.env.VIDEO_THUMBNAIL_INTERVAL || 'auto';
const VIDEO_THUMBNAIL_MAX_PER_SPRITE = parseInt(process.env.VIDEO_THUMBNAIL_MAX_PER_SPRITE, 10) || 100;

// Active process tracking for cleanup
const activeProcesses = new Map();

// Hardware encoder detection cache
let detectedEncoder = null;

// Helper: Detect available hardware encoder
const detectHardwareEncoder = async () => {
    if (detectedEncoder !== null) {
        return detectedEncoder;
    }

    logger.info('Detecting available hardware encoders...');

    return new Promise((resolve) => {
        ffmpeg.getAvailableEncoders((err, encoders) => {
            if (err) {
                logger.warn('Could not detect encoders, falling back to CPU:', err.message);
                detectedEncoder = { type: 'cpu', codec: 'libx264', preset: 'faster' };
                resolve(detectedEncoder);
                return;
            }

            // Check for NVIDIA NVENC (best quality)
            if (encoders['h264_nvenc']) {
                logger.info('✅ NVIDIA NVENC detected - using GPU acceleration');
                detectedEncoder = {
                    type: 'nvenc',
                    codec: 'h264_nvenc',
                    preset: 'p6', // Balanced quality/speed (p7 is too heavy for parallel)
                    extraOptions: ['-tune', 'hq', '-rc', 'vbr', '-b_ref_mode', 'middle'],
                };
                resolve(detectedEncoder);
                return;
            }

            // Check for Intel QSV
            if (encoders['h264_qsv']) {
                logger.info('✅ Intel QSV detected - using GPU acceleration');
                detectedEncoder = {
                    type: 'qsv',
                    codec: 'h264_qsv',
                    preset: 'medium',
                    extraOptions: ['-look_ahead', '1', '-global_quality', '23'],
                };
                resolve(detectedEncoder);
                return;
            }

            // Check for AMD AMF
            if (encoders['h264_amf']) {
                logger.info('✅ AMD AMF detected - using GPU acceleration');
                detectedEncoder = {
                    type: 'amf',
                    codec: 'h264_amf',
                    preset: 'quality',
                    extraOptions: ['-rc', 'vbr_hq', '-quality', 'quality'],
                };
                resolve(detectedEncoder);
                return;
            }

            // Fallback to optimized CPU
            logger.info('ℹ️ No GPU encoder detected - using optimized CPU encoding');
            detectedEncoder = {
                type: 'cpu',
                codec: 'libx264',
                preset: 'faster', // Optimized for speed
                extraOptions: [],
            };
            resolve(detectedEncoder);
        });
    });
};

// Helper: Get video metadata with caching
const getVideoMetadata = async (filePath, episodeId) => {
    // Try cache first
    const cacheKey = `video:metadata:${episodeId}`;
    const cached = await redisHelpers.safeGet(cacheKey);

    if (cached) {
        logger.info(`Using cached metadata for episode ${episodeId}`);
        return cached;
    }

    // Probe video
    return new Promise((resolve, reject) => {
        ffmpeg.ffprobe(filePath, async (err, metadata) => {
            if (err) {
                reject(err);
                return;
            }

            // Cache metadata for 7 days
            await redisHelpers.safeSet(cacheKey, metadata, 604800);
            resolve(metadata);
        });
    });
};

// Helper: Format duration to HH:MM:SS
const formatDuration = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

// Helper: Format time for VTT (HH:MM:SS.mmm)
const formatVttTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
};

// Helper: Calculate adaptive thumbnail interval
const calculateThumbnailInterval = (totalSeconds) => {
    if (VIDEO_THUMBNAIL_INTERVAL !== 'auto') {
        return parseFloat(VIDEO_THUMBNAIL_INTERVAL);
    }

    // Adaptive: aim for ~200-500 thumbnails
    // Short videos (< 5min): 5s
    // Medium (5-60min): 5-10s
    // Long (> 1h): 7-10s
    const targetThumbnails = 300;
    const calculated = totalSeconds / targetThumbnails;
    return Math.max(5, Math.min(10, calculated));
};

// OPTIMIZED: Generate thumbnail sprites with splitting
const generateThumbnails = async (filePath, outputDir, totalSeconds, jobId) => {
    const thumbnailsDir = path.join(outputDir, 'thumbnails');

    if (!fs.existsSync(thumbnailsDir)) {
        fs.mkdirSync(thumbnailsDir, { recursive: true });
    }

    const interval = calculateThumbnailInterval(totalSeconds);
    const width = 160;
    const height = 90;
    const maxPerSprite = VIDEO_THUMBNAIL_MAX_PER_SPRITE;
    const totalCount = Math.ceil(totalSeconds / interval);

    logger.info(`Job ${jobId}: Generating ${totalCount} thumbnails (interval: ${interval.toFixed(1)}s)`);

    try {
        // Calculate sprite splitting
        const spriteCount = Math.ceil(totalCount / maxPerSprite);
        const vttFiles = [];

        for (let spriteIndex = 0; spriteIndex < spriteCount; spriteIndex++) {
            const startIdx = spriteIndex * maxPerSprite;
            const endIdx = Math.min((spriteIndex + 1) * maxPerSprite, totalCount);
            const count = endIdx - startIdx;

            const cols = count >= 100 ? 10 : count >= 64 ? 8 : Math.ceil(Math.sqrt(count));
            const rows = Math.ceil(count / cols);

            const spriteName = spriteCount > 1 ? `sprite_${spriteIndex + 1}.jpg` : 'sprite.jpg';
            const vttName = spriteCount > 1 ? `thumbnails_${spriteIndex + 1}.vtt` : 'thumbnails.vtt';
            const spritePath = path.join(thumbnailsDir, spriteName);
            const vttPath = path.join(thumbnailsDir, vttName);

            logger.info(`Job ${jobId}: Creating sprite ${spriteIndex + 1}/${spriteCount} (${cols}x${rows} grid, ${count} thumbs)`);

            // Generate sprite using FFmpeg tile filter
            const startTime = startIdx * interval;
            const duration = count * interval;

            await new Promise((resolve, reject) => {
                const fps = 1 / interval;

                ffmpeg(filePath)
                    .seekInput(startTime)
                    .duration(duration)
                    .outputOptions([
                        `-vf fps=${fps},scale=${width}:${height},tile=${cols}x${rows}`,
                        '-frames:v 1',
                        '-q:v 2'
                    ])
                    .output(spritePath)
                    .on('start', (cmd) => {
                        logger.info(`Job ${jobId}: Sprite ${spriteIndex + 1} command: ${cmd}`);
                    })
                    .on('error', (err, stdout, stderr) => {
                        logger.error(`Job ${jobId}: Sprite ${spriteIndex + 1} error:`, err.message);
                        reject(err);
                    })
                    .on('end', () => {
                        logger.info(`Job ${jobId}: Sprite ${spriteIndex + 1} created: ${spritePath}`);
                        resolve();
                    })
                    .run();
            });

            // Verify sprite
            if (!fs.existsSync(spritePath)) {
                throw new Error(`Sprite ${spriteIndex + 1} was not created`);
            }

            const spriteStats = fs.statSync(spritePath);
            logger.info(`Job ${jobId}: Sprite ${spriteIndex + 1} size: ${(spriteStats.size / 1024).toFixed(2)} KB`);

            // Generate VTT file for this sprite
            let vttContent = 'WEBVTT\n\n';

            for (let i = 0; i < count; i++) {
                const thumbIdx = startIdx + i;
                const thumbStartTime = thumbIdx * interval;
                const thumbEndTime = Math.min((thumbIdx + 1) * interval, totalSeconds);

                const x = (i % cols) * width;
                const y = Math.floor(i / cols) * height;

                vttContent += `${formatVttTime(thumbStartTime)} --> ${formatVttTime(thumbEndTime)}\n`;
                vttContent += `${spriteName}#xywh=${x},${y},${width},${height}\n\n`;
            }

            fs.writeFileSync(vttPath, vttContent);
            logger.info(`Job ${jobId}: VTT ${spriteIndex + 1} created: ${vttPath}`);
            vttFiles.push(vttName);
        }

        logger.info(`Job ${jobId}: Generated ${spriteCount} sprite(s) with ${totalCount} thumbnails total`);
        return true;

    } catch (error) {
        logger.error(`Job ${jobId}: Thumbnail generation failed:`, error);
        return false;
    }
};

// OPTIMIZED: Parallel transcoding with process tracking
const transcodeQuality = async (filePath, outputDir, option, encoder, jobId, progressCallback) => {
    return new Promise((resolve, reject) => {
        const command = ffmpeg(filePath)
            .videoCodec(encoder.codec)
            .audioCodec('aac')
            .size(`${option.width}x${option.height}`)
            .videoBitrate(option.bitrate)
            .audioBitrate(option.audioBitrate);

        // Determine H.264 Level based on resolution
        // Level 4.0 limits: 1920x1080 @ 30fps
        // Level 5.1 limits: 4096x2304 (supports 1440p/4K)
        const isHighRes = option.width > 1920 || option.height > 1080;
        const h264Level = isHighRes ? '5.1' : '4.0';

        // Build output options based on encoder type
        const outputOptions = [
            '-profile:v', 'high',
            '-level', h264Level,
            '-maxrate', option.maxrate,
            '-bufsize', option.bufsize,
            '-g', '48',
            '-sc_threshold', '0',
            '-hls_time', '6',
            '-hls_list_size', '0',
            '-hls_segment_type', 'mpegts',
            '-hls_flags', 'independent_segments',
            `-hls_segment_filename`, path.join(outputDir, `${option.name}_%03d.ts`),
        ];

        // Encoder-specific options
        if (encoder.type === 'cpu') {
            outputOptions.push('-preset', encoder.preset, '-crf', '23', '-threads', '0');
        } else {
            outputOptions.push('-preset', encoder.preset);
            outputOptions.push(...encoder.extraOptions);
        }

        command.outputOptions(outputOptions)
            .output(path.join(outputDir, `${option.name}.m3u8`))
            .on('start', (cmd) => {
                logger.info(`Job ${jobId}: Started ${option.name} (${encoder.type.toUpperCase()})`);
            })
            .on('progress', (progress) => {
                if (progress.percent && progressCallback) {
                    progressCallback(option.name, Math.round(progress.percent));
                }
            })
            .on('end', () => {
                logger.info(`Job ${jobId}: Completed ${option.name}`);
                resolve(option);
            })
            .on('error', (err) => {
                logger.error(`Job ${jobId}: Error transcoding ${option.name}:`, err);
                reject(err);
            })
            .run();

        // Track process for cleanup
        if (!activeProcesses.has(jobId)) {
            activeProcesses.set(jobId, []);
        }
        activeProcesses.get(jobId).push(command);
    });
};

// Helper: Cleanup processes for a job
const cleanupJobProcesses = (jobId) => {
    const processes = activeProcesses.get(jobId);
    if (processes) {
        processes.forEach((process) => {
            try {
                if (process && process.ffmpegProc) {
                    process.kill('SIGKILL');
                }
            } catch (err) {
                logger.error(`Error killing process for job ${jobId}:`, err);
            }
        });
        activeProcesses.delete(jobId);
    }
};

// Worker Processor
const worker = new Worker(
    'video-transcoding',
    async (job) => {
        const { episodeId, filePath, outputDir, userId } = job.data;
        logger.info(`Job ${job.id}: Starting transcoding for Episode ${episodeId}`);

        // Job timeout handler
        const timeoutId = setTimeout(() => {
            logger.error(`Job ${job.id}: Timeout after ${VIDEO_QUEUE_JOB_TIMEOUT}ms`);
            cleanupJobProcesses(job.id);
            throw new Error('Job timeout exceeded');
        }, VIDEO_QUEUE_JOB_TIMEOUT);

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
            emitProgress('probe', 5, 'Đang phân tích video...');

            const episode = await Episode.findByPk(episodeId);
            if (!episode) throw new Error('Episode not found');

            await episode.update({ status: 'processing', jobId: job.id });

            // Detect hardware encoder
            const encoder = await detectHardwareEncoder();
            logger.info(`Job ${job.id}: Using encoder: ${encoder.codec} (${encoder.type})`);

            // Get video metadata (with caching)
            const metadata = await getVideoMetadata(filePath, episodeId);
            const totalSeconds = metadata.format.duration;
            const videoDuration = formatDuration(totalSeconds);

            // Get source resolution
            const videoStream = metadata.streams.find(s => s.codec_type === 'video');
            const sourceWidth = videoStream?.width || 1920;
            const sourceHeight = videoStream?.height || 1080;

            logger.info(`Job ${job.id}: Video metadata - Duration: ${videoDuration}, Resolution: ${sourceWidth}x${sourceHeight}`);

            await episode.update({ duration: videoDuration });

            // Ensure output directory exists
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
            }

            emitProgress('transcode', 10, `Bắt đầu chuyển mã (${encoder.type.toUpperCase()})...`);

            // Filter qualities based on source resolution
            const suitableQualities = TRANSCODE_OPTIONS.filter(opt =>
                opt.height <= sourceHeight && opt.width <= sourceWidth
            );

            if (suitableQualities.length === 0) {
                suitableQualities.push(TRANSCODE_OPTIONS[TRANSCODE_OPTIONS.length - 1]);
            }

            logger.info(`Job ${job.id}: Transcoding ${suitableQualities.length} qualities in PARALLEL: ${suitableQualities.map(q => q.name).join(', ')}`);

            // Progress tracking for parallel jobs
            const qualityProgress = {};
            suitableQualities.forEach(q => qualityProgress[q.name] = 0);

            const updateProgress = (qualityName, percent) => {
                qualityProgress[qualityName] = percent;
                const avgProgress = Object.values(qualityProgress).reduce((a, b) => a + b, 0) / suitableQualities.length;
                const totalProgress = Math.round(10 + (avgProgress * 0.5)); // 10-60%
                job.updateProgress(totalProgress);
                emitProgress('transcode', totalProgress, `Đang xử lý: ${qualityName} (${percent}%)`, qualityName);
            };

            // PARALLEL TRANSCODING with individual error handling
            const transcodePromises = suitableQualities.map(option =>
                transcodeQuality(filePath, outputDir, option, encoder, job.id, updateProgress)
            );

            const results = await Promise.allSettled(transcodePromises);

            // Check for failures
            const qualitiesProcessed = [];
            const failed = [];

            results.forEach((result, index) => {
                if (result.status === 'fulfilled') {
                    qualitiesProcessed.push(result.value);
                } else {
                    failed.push({
                        quality: suitableQualities[index].name,
                        error: result.reason
                    });
                }
            });

            // If ALL qualities failed, throw error
            if (qualitiesProcessed.length === 0) {
                throw new Error(`All quality transcoding failed: ${failed.map(f => f.quality).join(', ')}`);
            }

            // Log partial failures but continue
            if (failed.length > 0) {
                logger.warn(`Job ${job.id}: Some qualities failed: ${failed.map(f => f.quality).join(', ')}`);
                emitProgress('transcode', 60, `Một số chất lượng thất bại: ${failed.map(f => f.quality).join(', ')}`);
            } else {
                logger.info(`Job ${job.id}: All qualities transcoded successfully`);
                emitProgress('transcode', 60, 'Hoàn tất chuyển mã tất cả chất lượng');
            }

            // Generate thumbnails
            emitProgress('thumbnails', 65, 'Đang tạo thumbnail sprites...');

            try {
                const thumbnailSuccess = await generateThumbnails(filePath, outputDir, totalSeconds, job.id);

                if (thumbnailSuccess) {
                    emitProgress('thumbnails', 80, 'Thumbnail sprites đã tạo thành công');
                } else {
                    emitProgress('thumbnails', 80, 'Không thể tạo thumbnails (tiếp tục xử lý)');
                }
            } catch (thumbError) {
                logger.error(`Job ${job.id}: Thumbnail generation failed:`, thumbError);
                emitProgress('thumbnails', 80, 'Bỏ qua tạo thumbnails (không bắt buộc)');
            }

            emitProgress('finalize', 85, 'Đang tạo danh sách phát chính...');

            // Create Master Playlist
            const masterPlaylistPath = path.join(outputDir, 'master.m3u8');
            let masterContent = '#EXTM3U\n#EXT-X-VERSION:3\n';

            const variantPlaylists = qualitiesProcessed.map(option => ({
                path: `${option.name}.m3u8`,
                bandwidth: parseInt(option.bitrate.replace('k', '')) * 1000,
                resolution: `${option.width}x${option.height}`,
                name: option.name
            })).sort((a, b) => b.bandwidth - a.bandwidth);

            variantPlaylists.forEach((variant) => {
                masterContent += `#EXT-X-STREAM-INF:BANDWIDTH=${variant.bandwidth},RESOLUTION=${variant.resolution},NAME="${variant.name}"\n${variant.path}\n`;
            });

            fs.writeFileSync(masterPlaylistPath, masterContent);
            logger.info(`Job ${job.id}: Master playlist created`);

            // Update Episode
            const relativePath = path.relative(
                path.join(__dirname, '../uploads'),
                masterPlaylistPath
            ).replace(/\\/g, '/');

            await episode.update({
                status: 'ready',
                hlsUrl: `/uploads/${relativePath}`,
                quality: qualitiesProcessed.map(q => q.name),
            });

            logger.info(`Job ${job.id}: Episode updated with HLS URL: /uploads/${relativePath}`);

            emitProgress('cleanup', 95, 'Dọn dẹp file gốc...');

            // Clean up raw file
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                logger.info(`Job ${job.id}: Cleaned up raw file: ${filePath}`);
            }

            // Cleanup processes
            cleanupJobProcesses(job.id);
            clearTimeout(timeoutId);

            emitProgress('complete', 100, 'Hoàn tất!');

            logger.info(`Job ${job.id}: Transcoding completed successfully for Episode ${episodeId}`);

        } catch (error) {
            logger.error(`Job ${job.id}: Transcoding failed`, error);

            // Cleanup on error (with delay to let processes finish gracefully)
            setTimeout(() => cleanupJobProcesses(job.id), 1000);

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
    {
        connection: redisConfig,
        concurrency: VIDEO_QUEUE_CONCURRENCY,
        lockDuration: 60000, // 60 seconds (default 30s) to prevent lock renewal errors
        maxStalledCount: 0, // Don't retry stalled jobs automatically
    }
);

worker.on('completed', (job) => {
    logger.info(`Job ${job.id} has completed!`);
    // Ensure cleanup
    cleanupJobProcesses(job.id);
});

worker.on('failed', (job, err) => {
    logger.error(`Job ${job.id} has failed with ${err.message}`);
    // Ensure cleanup (with delay)
    setTimeout(() => cleanupJobProcesses(job.id), 1000);
});

// Log worker status
logger.info(`Video transcoding worker started with concurrency: ${VIDEO_QUEUE_CONCURRENCY}`);

export default videoQueue;