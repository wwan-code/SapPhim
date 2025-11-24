import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

/**
 * MovieRoomChat Model - Represents a chat message in a Watch Party room
 */
const MovieRoomChat = sequelize.define('MovieRoomChat', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    roomId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'Foreign key to MovieRoom table',
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'Foreign key to User table (sender)',
    },
    type: {
        type: DataTypes.ENUM('text', 'emoji', 'reaction', 'system'),
        defaultValue: 'text',
        allowNull: false,
        comment: 'Message type: text=normal message, emoji=emoji only, reaction=emoji at specific timestamp, system=auto message',
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: false,
        comment: 'Message content (text or emoji)',
    },
    videoTimestamp: {
        type: DataTypes.FLOAT,
        allowNull: true,
        comment: 'Video timestamp when reaction was sent (for type=reaction)',
    },
}, {
    timestamps: true,
    tableName: 'movie_room_chats',
    indexes: [
        {
            fields: ['roomId', 'createdAt'],
            name: 'idx_room_created',
            comment: 'For fetching chat history ordered by time'
        },
        { fields: ['roomId'] },
        { fields: ['userId'] },
        { fields: ['type'] },
    ],
    hooks: {
        beforeCreate: (chat) => {
            // Sanitize content to prevent XSS (basic - DOMPurify on frontend is primary defense)
            if (chat.type === 'text' && typeof chat.content === 'string') {
                // Remove potential script tags
                chat.content = chat.content.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
                // Trim whitespace
                chat.content = chat.content.trim();
            }
        },
    },
});

export default MovieRoomChat;
