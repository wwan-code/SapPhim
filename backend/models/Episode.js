import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Episode = sequelize.define('Episode', {
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
  episodeNumber: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  views: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
  },
  linkEpisode: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  movieId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  duration: {
    type: DataTypes.STRING, // Ví dụ: "hh:mm:ss" hoặc "mm:ss"
    allowNull: true,
  },
  hlsUrl: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('pending', 'processing', 'ready', 'error'),
    defaultValue: 'pending',
    allowNull: false,
  },
  jobId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  quality: {
    type: DataTypes.JSON, // Ví dụ: ["1080p", "720p"]
    allowNull: true,
    get() {
      const rawValue = this.getDataValue('quality');
      if (typeof rawValue === 'string') {
        try {
          return JSON.parse(rawValue);
        } catch (e) {
          return [];
        }
      }
      return rawValue || [];
    },
  },
}, {
  timestamps: true,
  indexes: [
    { fields: ['movieId'] },
    { fields: ['episodeNumber'] },
  ],
});

export default Episode;