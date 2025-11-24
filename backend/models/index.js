import { Sequelize } from 'sequelize';
import sequelize from '../config/database.js';
import applyAssociations from './associations.js';

// ==================== IMPORT MODELS ====================
import User from './User.js';
import Role from './Role.js';
import RefreshToken from './RefreshToken.js';
import LoginHistory from './LoginHistory.js';
import Friendship from './Friendship.js';
import Genre from './Genre.js';
import Country from './Country.js';
import Category from './Category.js';
import Movie from './Movie.js';
import Episode from './Episode.js';
import Series from './Series.js';
import Section from './Section.js';
import WatchHistory from './WatchHistory.js';
import Favorite from './Favorite.js';
import Comment from './Comment.js';
import AiLog from './AiLog.js';
import Notification from './Notification.js';
import MovieRoom from './MovieRoom.js';
import MovieRoomMember from './MovieRoomMember.js';
import MovieRoomChat from './MovieRoomChat.js';

// ==================== DATABASE OBJECT ====================
const db = {
  Sequelize,
  sequelize,
  User,
  Role,
  RefreshToken,
  LoginHistory,
  Friendship,
  Genre,
  Country,
  Category,
  Movie,
  Episode,
  Series,
  Section,
  WatchHistory,
  Favorite,
  Comment,
  AiLog,
  Notification,
  MovieRoom,
  MovieRoomMember,
  MovieRoomChat,
};
// ==================== APPLY ASSOCIATIONS ====================
try {
  applyAssociations(db);
  console.log('✓ Model associations applied successfully');
} catch (error) {
  console.error('✗ Failed to apply model associations:', error.message);
  throw error;
}

// ==================== DATABASE INITIALIZATION ====================
const initializeDefaultRoles = async () => {
  try {
    const roles = ['user', 'editor', 'admin'];
    const results = [];

    for (const roleName of roles) {
      const [role, created] = await db.Role.findOrCreate({
        where: { name: roleName },
        defaults: { name: roleName },
      });

      if (created) {
        results.push(roleName);
        console.log(`✓ Role '${role.name}' created`);
      }
    }

    if (results.length === 0) {
      console.log('✓ All default roles already exist');
    }
  } catch (error) {
    console.error('✗ Failed to initialize default roles:', error.message);
    throw error;
  }
};

const syncDatabase = async () => {
  const env = process.env.NODE_ENV || 'development';

  try {
    let syncOptions = { force: false, alter: false };

    switch (env) {
      case 'development':
        syncOptions = { force: false, alter: false };
        break;
      case 'test':
        syncOptions = { force: true, alter: false };
        break;
      case 'production':
        syncOptions = { force: false, alter: false };
        await db.sequelize.authenticate();
        return;
      default:
        console.log('Unknown environment, using safe defaults');
    }

    await db.sequelize.sync(syncOptions);
    console.log('Database synchronized successfully');

    if (env !== 'production') {
      await initializeDefaultRoles();
    }
  } catch (error) {
    console.error('Database synchronization failed:', {
      message: error.message,
      stack: error.stack,
      environment: env
    });
    throw error;
  }
};

syncDatabase().catch(error => {
  console.error('Fatal error during database initialization:', error);
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
});

export default db;
