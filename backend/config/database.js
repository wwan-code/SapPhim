import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: process.env.DB_DIALECT,
    timezone: process.env.DB_TIMEZONE || '+07:00',
    logging: process.env.NODE_ENV === 'development'
      ? (msg) => console.log(`[Sequelize] ${msg}`)
      : false,

    // Optimized Connection Pool
    pool: {
      max: parseInt(process.env.DB_POOL_MAX, 10) || (process.env.NODE_ENV === 'production' ? 50 : 20),
      min: parseInt(process.env.DB_POOL_MIN, 10) || (process.env.NODE_ENV === 'production' ? 10 : 5),
      acquire: parseInt(process.env.DB_POOL_ACQUIRE, 10) || 30000,
      idle: parseInt(process.env.DB_POOL_IDLE, 10) || 10000,
      evict: parseInt(process.env.DB_POOL_EVICT, 10) || 1000,
      handleDisconnects: true,
      validate: (obj) => {
        // Validate connection before use
        if (!obj || typeof obj.query !== 'function') return false;
        return true;
      }
    },

    dialectOptions: {
      connectTimeout: 60000,
      timezone: process.env.DB_TIMEZONE || '+07:00',
      // Statement timeout to prevent long-running queries (60s)
      dateStrings: true,
      typeCast: true,
    },

    // Robust Retry Strategy
    retry: {
      match: [
        /ETIMEDOUT/,
        /EHOSTUNREACH/,
        /ECONNRESET/,
        /ECONNREFUSED/,
        /ESOCKETTIMEDOUT/,
        /EPIPE/,
        /SequelizeConnectionError/,
        /SequelizeConnectionRefusedError/,
        /SequelizeHostNotFoundError/,
        /SequelizeHostNotReachableError/,
        /SequelizeInvalidConnectionError/,
        /SequelizeConnectionTimedOutError/
      ],
      max: 3,
      backoffBase: 1000,
      backoffExponent: 1.5,
    },

    // Connection Lifecycle Hooks
    hooks: {
      afterConnect: (connection, config) => {
        // console.log('[Sequelize] New connection established');
      },
      beforeDisconnect: (connection) => {
        // console.log('[Sequelize] Connection closing');
      }
    },

    benchmark: process.env.NODE_ENV === 'development', // Log query time in dev
  }
);

export default sequelize;
