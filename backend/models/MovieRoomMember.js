import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

/**
 * MovieRoomMember Model - Represents a member in a Watch Party room
 */
const MovieRoomMember = sequelize.define('MovieRoomMember', {
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
        comment: 'Foreign key to User table',
    },
    role: {
        type: DataTypes.ENUM('host', 'member', 'guest'),
        defaultValue: 'member',
        allowNull: false,
        comment: 'Member role: host=full control, member=chat+view, guest=view only',
    },
    joinedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false,
        comment: 'When the user joined the room',
    },
    lastSeenAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false,
        comment: 'Last activity timestamp (updated via socket heartbeat)',
    },
    leftAt: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'When the user left the room (null if still in room)',
    },
    isMuted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
        comment: 'If true, user cannot send chat messages',
    },
    isKicked: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
        comment: 'If true, user was kicked from room',
    },
}, {
    timestamps: true,
    tableName: 'movie_room_members',
    indexes: [
        {
            fields: ['roomId', 'userId'],
            unique: true,
            name: 'unique_room_user',
            comment: 'Each user can only be in a room once'
        },
        { fields: ['roomId'] },
        { fields: ['userId'] },
        { fields: ['leftAt'] }, // For queries to find active members
    ],
    hooks: {
        beforeCreate: (member) => {
            if (!member.joinedAt) {
                member.joinedAt = new Date();
            }
            if (!member.lastSeenAt) {
                member.lastSeenAt = new Date();
            }
        },
    },
});

/**
 * Instance method to check if member is active (not left or kicked)
 */
MovieRoomMember.prototype.isActive = function () {
    return !this.leftAt && !this.isKicked;
};

/**
 * Instance method to update last seen timestamp
 */
MovieRoomMember.prototype.updateLastSeen = async function () {
    this.lastSeenAt = new Date();
    await this.save({ fields: ['lastSeenAt'] });
};

export default MovieRoomMember;
