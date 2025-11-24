import { Worker } from 'bullmq';
import db from '../models/index.js';
import { createNotification } from '../services/notification.service.js';
import { generateNotificationContent } from '../utils/notification.utils.js';
import logger from '../utils/logger.js';
import { Op } from 'sequelize';

const { User, Movie, Episode, Role } = db;

// Re-use Redis connection config
const redisConnection = {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD,
};

const CONTENT_TYPES = {
    MOVIE: 'movie',
    EPISODE: 'episode'
};

const NOTIFICATION_TYPES = {
    NEW_COMMENT: 'new_comment',
    LIKE_COMMENT: 'like_comment',
    COMMENT_REPORT: 'comment_report',
    USER_MENTION: 'user_mention'
};

const worker = new Worker('notification-queue', async (job) => {
    const { type, data } = job.data;
    logger.info(`Processing notification job ${job.id} of type ${type}`);

    try {
        switch (type) {
            case 'REPLY':
                await handleReplyNotification(data);
                break;
            case 'LIKE':
                await handleLikeNotification(data);
                break;
            case 'REPORT':
                await handleReportNotification(data);
                break;
            case 'MENTION':
                await handleMentionNotification(data);
                break;
            default:
                logger.warn(`Unknown notification job type: ${type}`);
        }
    } catch (error) {
        logger.error(`Failed to process notification job ${job.id}:`, error);
        throw error;
    }
}, {
    connection: redisConnection,
    concurrency: 5,
});

worker.on('completed', (job) => {
    // logger.info(`Notification job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
    logger.error(`Notification job ${job.id} failed: ${err.message}`);
});

// ==================== HANDLERS ====================

const buildNotificationLink = async (contentType, contentId, commentId) => {
    try {
        if (contentType === CONTENT_TYPES.MOVIE) {
            const movie = await Movie.findByPk(contentId, { attributes: ['slug'] });
            if (movie) {
                return `/movie/${movie.slug}?commentId=${commentId}`;
            }
        } else if (contentType === CONTENT_TYPES.EPISODE) {
            const episode = await Episode.findByPk(contentId, {
                attributes: ['episodeNumber', 'movieId'],
                include: [{
                    model: Movie,
                    as: 'movie',
                    attributes: ['slug']
                }]
            });
            if (episode && episode.movie) {
                return `/watch/${episode.movie.slug}/episode/${episode.episodeNumber}?commentId=${commentId}`;
            }
        }
    } catch (linkError) {
        logger.error('Failed to build notification link:', linkError);
    }
    // Fallback
    return `/comments/${contentType}/${contentId}?commentId=${commentId}`;
};

const handleReplyNotification = async (data) => {
    const { parentCommentUserId, currentUserId, newCommentId, parentCommentId, contentType, contentId, commentText } = data;

    if (parentCommentUserId === currentUserId) return;

    const sender = await User.findByPk(currentUserId);
    if (!sender) return;

    const notificationLink = await buildNotificationLink(contentType, contentId, newCommentId);
    const preview = commentText.length > 50 ? `${commentText.substring(0, 50)}...` : commentText;

    const { title, body } = generateNotificationContent('new_comment', {
        senderName: sender.username,
        commentPreview: preview,
    });

    await createNotification({
        userId: parentCommentUserId,
        type: NOTIFICATION_TYPES.NEW_COMMENT,
        title,
        body,
        link: notificationLink,
        senderId: currentUserId,
        metadata: {
            commentId: newCommentId,
            parentId: parentCommentId,
            contentId: contentId,
            contentType: contentType,
        }
    });
};

const handleLikeNotification = async (data) => {
    const { commentUserId, currentUserId, commentId, contentId, contentType, commentText } = data;

    if (commentUserId === currentUserId) return;

    const sender = await User.findByPk(currentUserId);
    if (!sender) return;

    const notificationLink = await buildNotificationLink(contentType, contentId, commentId);
    const preview = commentText.length > 50 ? `${commentText.substring(0, 50)}...` : commentText;

    const { title, body } = generateNotificationContent('like_comment', {
        senderName: sender.username,
        commentPreview: preview,
    });

    await createNotification({
        userId: commentUserId,
        type: NOTIFICATION_TYPES.LIKE_COMMENT,
        title,
        body,
        link: notificationLink,
        senderId: currentUserId,
        metadata: {
            commentId: commentId,
            contentId: contentId,
            contentType: contentType,
        }
    });
};

const handleReportNotification = async (data) => {
    const { reporterId, commentId, contentId, contentType, commentText } = data;

    const admins = await User.findAll({
        include: [{
            model: Role,
            as: 'roles',
            where: { name: 'admin' },
            through: { attributes: [] }
        }]
    });

    if (admins.length === 0) return;

    const sender = await User.findByPk(reporterId);
    if (!sender) return;

    const preview = commentText.length > 50 ? `${commentText.substring(0, 50)}...` : commentText;
    const { title, body } = generateNotificationContent('comment_report', {
        senderName: sender.username,
        commentPreview: preview,
    });
    const notificationLink = `/admin/comments/${commentId}`;

    // Create notifications for all admins
    await Promise.all(admins.map(admin =>
        createNotification({
            userId: admin.id,
            type: NOTIFICATION_TYPES.COMMENT_REPORT,
            title,
            body,
            link: notificationLink,
            senderId: reporterId,
            metadata: {
                commentId: commentId,
                contentId: contentId,
                contentType: contentType,
            }
        })
    ));
};

const handleMentionNotification = async (data) => {
    const { commentText, senderId, commentId, contentType, contentId } = data;

    const mentionRegex = /\[@([^\]]+)\]\(\/profile\/([a-f0-9-]+)\)/g;
    let match;
    const mentionedUserUuids = new Set();

    while ((match = mentionRegex.exec(commentText)) !== null) {
        mentionedUserUuids.add(match[2]);
    }

    if (mentionedUserUuids.size === 0) return;

    const sender = await User.findByPk(senderId, { attributes: ['id', 'username'] });
    if (!sender) return;

    const mentionedUsers = await User.findAll({
        where: {
            uuid: { [Op.in]: Array.from(mentionedUserUuids) },
            id: { [Op.ne]: senderId }
        },
        attributes: ['id', 'username']
    });

    if (mentionedUsers.length === 0) return;

    const stripMentionLinksForNotification = (text) => {
        if (!text) return '';
        return text.replace(/\[@([^\]]+)\]\(\/profile\/[a-f0-9-]+\)/gi, '@$1');
    };

    const cleanedCommentText = stripMentionLinksForNotification(commentText);
    const preview = cleanedCommentText.length > 50 ? `${cleanedCommentText.substring(0, 50)}...` : cleanedCommentText;

    const notificationLink = await buildNotificationLink(contentType, contentId, commentId);

    await Promise.all(mentionedUsers.map(async (user) => {
        const { title, body } = generateNotificationContent(NOTIFICATION_TYPES.USER_MENTION, {
            senderName: sender.username,
            commentPreview: preview,
        });

        return createNotification({
            userId: user.id,
            type: NOTIFICATION_TYPES.USER_MENTION,
            title,
            body,
            link: notificationLink,
            senderId: senderId,
            metadata: {
                commentId: commentId,
                contentId: contentId,
                contentType: contentType,
                mentionedUserId: user.id,
            }
        });
    }));
};

export default worker;
