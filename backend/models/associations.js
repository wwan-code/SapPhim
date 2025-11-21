/**
 * Apply all model associations
 * @param {Object} db - Database object containing all models
 * @throws {Error} If required models are missing
 */
export default (db) => {
        // ==================== VALIDATE REQUIRED MODELS ====================
        const requiredModels = ['User', 'Role', 'Movie'];
        const missingModels = requiredModels.filter(model => !db[model]);

        if (missingModels.length > 0) {
                throw new Error(`Missing required models: ${missingModels.join(', ')}`);
        }

        // ==================== DESTRUCTURE MODELS ====================
        const {
                User, Role, RefreshToken, Friendship, Genre, Country, Category,
                Movie, Episode, Series, Section, AiLog, WatchHistory, Favorite,
                Comment, Notification, LoginHistory,
        } = db;

        // ==================== USER & AUTHENTICATION ASSOCIATIONS ====================

        // User - Friendship (1-n bidirectional)
        if (User && Friendship) {
                User.hasMany(Friendship, { foreignKey: 'senderId', as: 'sentFriendRequests' });
                User.hasMany(Friendship, { foreignKey: 'receiverId', as: 'receivedFriendRequests' });
                Friendship.belongsTo(User, { as: 'sender', foreignKey: 'senderId' });
                Friendship.belongsTo(User, { as: 'receiver', foreignKey: 'receiverId' });
        }

        // User - Role (n-n)
        if (User && Role) {
                User.belongsToMany(Role, { through: 'user_roles', as: 'roles', foreignKey: 'userId' });
                Role.belongsToMany(User, { through: 'user_roles', as: 'users', foreignKey: 'roleId' });
        }

        // User - RefreshToken (1-n)
        if (User && RefreshToken) {
                User.hasMany(RefreshToken, { foreignKey: 'userId', as: 'refreshTokens' });
                RefreshToken.belongsTo(User, { foreignKey: 'userId', as: 'user' });
        }

        // User - LoginHistory (1-n)
        if (User && LoginHistory) {
                User.hasMany(LoginHistory, { foreignKey: 'userId', as: 'loginHistories' });
                LoginHistory.belongsTo(User, { foreignKey: 'userId', as: 'user' });
        }
        // ==================== CONTENT ASSOCIATIONS ====================

        // Genre – Movie (n-n)
        if (Genre && Movie) {
                Genre.belongsToMany(Movie, { through: 'movie_genres', as: 'movies' });
                Movie.belongsToMany(Genre, { through: 'movie_genres', as: 'genres' });
        }

        // Country – Movie (1-n)
        if (Country && Movie) {
                Country.hasMany(Movie, { foreignKey: 'countryId', as: 'movies' });
                Movie.belongsTo(Country, { foreignKey: 'countryId', as: 'country' });
        }

        // Category – Movie (1-n)
        if (Category && Movie) {
                Category.hasMany(Movie, { foreignKey: 'categoryId', as: 'movies' });
                Movie.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });
        }

        // Movie – Episode (1-n)
        if (Movie && Episode) {
                Movie.hasMany(Episode, { foreignKey: 'movieId', as: 'episodes' });
                Episode.belongsTo(Movie, { foreignKey: 'movieId', as: 'movie' });
        }

        // Movie – Section (1-1)
        if (Movie && Section) {
                Movie.hasOne(Section, { foreignKey: 'movieId', as: 'section' });
                Section.belongsTo(Movie, { foreignKey: 'movieId', as: 'movie' });
        }

        // Series – Movie (1-n)
        if (Series && Movie) {
                Series.hasMany(Movie, { foreignKey: 'seriesId', as: 'movies' });
                Movie.belongsTo(Series, { foreignKey: 'seriesId', as: 'series' });
        }

        // ==================== USER ACTIVITY ASSOCIATIONS ====================

        // User - AiLog (1-n)
        if (User && AiLog) {
                User.hasMany(AiLog, { foreignKey: 'userId', as: 'aiLogs' });
                AiLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });
        }

        // WatchHistory (User/Movie/Episode)
        if (User && Movie && Episode && WatchHistory) {
                User.hasMany(WatchHistory, { foreignKey: 'userId', as: 'watchHistories' });
                Movie.hasMany(WatchHistory, { foreignKey: 'movieId', as: 'watchHistories' });
                Episode.hasMany(WatchHistory, { foreignKey: 'episodeId', as: 'watchHistories' });
                WatchHistory.belongsTo(User, { foreignKey: 'userId', as: 'user' });
                WatchHistory.belongsTo(Movie, { foreignKey: 'movieId', as: 'movie' });
                WatchHistory.belongsTo(Episode, { foreignKey: 'episodeId', as: 'episode' });
        }

        // User - Movie (n-n) through Favorite
        if (User && Movie && Favorite) {
                User.belongsToMany(Movie, { through: Favorite, as: 'favoriteMovies', foreignKey: 'userId' });
                Movie.belongsToMany(User, { through: Favorite, as: 'favoritedByUsers', foreignKey: 'movieId' });
                Favorite.belongsTo(User, { foreignKey: 'userId', as: 'user' });
                Favorite.belongsTo(Movie, { foreignKey: 'movieId', as: 'movie' });
        }

        // Comment (self-referencing + User relation)
        if (User && Comment) {
                User.hasMany(Comment, { foreignKey: 'userId', as: 'comments' });
                Comment.belongsTo(User, { foreignKey: 'userId', as: 'user' });
                Comment.hasMany(Comment, { as: 'replies', foreignKey: 'parentId', onDelete: 'CASCADE' });
                Comment.belongsTo(Comment, { as: 'parent', foreignKey: 'parentId' });
        }

        // ==================== NOTIFICATION ASSOCIATIONS ====================

        // User - Notification (1-n bidirectional)
        if (User && Notification) {
                User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });
                User.hasMany(Notification, { foreignKey: 'senderId', as: 'sentNotifications' });
                Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });
                Notification.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });
        }

        // ==================== VALIDATION COMPLETE ====================
        console.log('✓ All model associations configured successfully');
};
