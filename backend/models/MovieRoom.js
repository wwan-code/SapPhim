import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import { generateSlug } from '../utils/slugUtil.js';
import bcrypt from 'bcrypt';

/**
 * MovieRoom Model - Represents a Watch Party room
 */
const MovieRoom = sequelize.define('MovieRoom', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    uuid: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        unique: true,
        allowNull: false,
    },
    movieId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'Foreign key to Movie table',
    },
    episodeId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'Foreign key to Episode table',
    },
    hostId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'Foreign key to User table - current host',
    },
    status: {
        type: DataTypes.ENUM('active', 'paused', 'closed'),
        defaultValue: 'active',
        allowNull: false,
        comment: 'Room status: active=ongoing, paused=temporarily stopped, closed=ended',
    },
    isPrivate: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
        comment: 'Whether room requires password',
    },
    password: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: 'Bcrypt hashed password - REQUIRED if isPrivate=true',
    },
    maxMembers: {
        type: DataTypes.INTEGER,
        defaultValue: 150,
        allowNull: false,
        validate: {
            min: 10,
            max: 200,
        },
        comment: 'Maximum members allowed (10-200, default 150)',
    },
    inviteCode: {
        type: DataTypes.STRING(8),
        unique: true,
        allowNull: false,
        comment: 'Unique 8-char invite code (e.g. AB12CD34)',
    },

    // Playback state (persisted for recovery)
    currentTime: {
        type: DataTypes.FLOAT,
        defaultValue: 0,
        allowNull: false,
        comment: 'Current playback time in seconds',
    },
    playbackState: {
        type: DataTypes.ENUM('playing', 'paused', 'buffering'),
        defaultValue: 'paused',
        allowNull: false,
        comment: 'Current playback state',
    },
    lastUpdateTimestamp: {
        type: DataTypes.BIGINT,
        allowNull: true,
        comment: 'Unix timestamp (ms) of last playback update',
    },

    // Settings
    allowChat: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false,
    },
    allowReactions: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false,
    },

    closedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'When the room was closed',
    },
}, {
    timestamps: true,
    tableName: 'movie_rooms',
    indexes: [
        { fields: ['uuid'], unique: true },
        { fields: ['inviteCode'], unique: true },
        { fields: ['status'] },
        { fields: ['createdAt'] },
        { fields: ['movieId', 'episodeId'] }, // Composite for room lookup
        { fields: ['hostId'] },
    ],
    hooks: {
        beforeValidate: async (room) => {
            // Generate unique 8-char invite code if not provided
            if (!room.inviteCode) {
                room.inviteCode = generateInviteCode();
            }

            // Enforce password requirement for private rooms
            if (room.isPrivate && !room.password) {
                throw new Error('Password is required for private rooms');
            }

            // Hash password if provided and changed
            if (room.password && room.changed('password')) {
                const salt = await bcrypt.genSalt(10);
                room.password = await bcrypt.hash(room.password, salt);
            }
        },
        beforeCreate: (room) => {
            if (!room.lastUpdateTimestamp) {
                room.lastUpdateTimestamp = Date.now();
            }
        },
    },
});

/**
 * Generate a random 8-character invite code
 * Format: 2 uppercase letters + 2 digits + 2 uppercase letters + 2 digits
 * Example: AB12CD34
 */
function generateInviteCode() {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const digits = '0123456789';

    let code = '';
    code += letters[Math.floor(Math.random() * letters.length)];
    code += letters[Math.floor(Math.random() * letters.length)];
    code += digits[Math.floor(Math.random() * digits.length)];
    code += digits[Math.floor(Math.random() * digits.length)];
    code += letters[Math.floor(Math.random() * letters.length)];
    code += letters[Math.floor(Math.random() * letters.length)];
    code += digits[Math.floor(Math.random() * digits.length)];
    code += digits[Math.floor(Math.random() * digits.length)];

    return code;
}

/**
 * Instance method to verify password
 */
MovieRoom.prototype.verifyPassword = async function (candidatePassword) {
    if (!this.password) return true; // No password set
    return bcrypt.compare(candidatePassword, this.password);
};

export default MovieRoom;
