import db from '../models/index.js';
import {
  buildPrompt,
  callAIProvider,
  parseAIResponse,
  validateInput,
  checkRateLimit,
  formatTitlesForPrompt,
  formatGenresForPrompt,
  PROMPT_TEMPLATES,
  generateOtherTitlesWithAI,
  classifyCommentWithAI,
} from '../utils/ai.utils.js';
import { Op } from 'sequelize';

const { AiLog, User, Movie, Genre, Country, Category, WatchHistory, Series } = db;

/**
 * @desc Ghi log tương tác AI vào cơ sở dữ liệu
 * @param {number} userId - ID của người dùng
 * @param {string} prompt - Câu hỏi/yêu cầu của người dùng
 * @param {string} response - Phản hồi từ AI
 * @param {string} type - Loại tương tác AI (suggestMovie, chat, translate, etc.)
 * @param {object} metadata - Thông tin bổ sung
 */
const logAiInteraction = async (userId, prompt, response, type = 'general', metadata = {}) => {
  try {
    await AiLog.create({
      userId,
      prompt,
      response,
      type,
      metadata: JSON.stringify(metadata)
    });
  } catch (error) {
    console.error('Lỗi khi ghi log AI:', error);
  }
};

/**
 * @desc Trợ lý AI thông minh với Action Router
 * @param {number} userId - ID của người dùng
 * @param {string} prompt - Câu hỏi của người dùng
 * @returns {Promise<string>} Phản hồi từ AI
 */
const chatWithAI = async (userId, prompt) => {
  // 1. Kiểm tra bảo mật & rate limit
  checkRateLimit(userId, 20, 60000); // Tăng giới hạn chat
  if (!validateInput({ prompt })) {
    throw new Error('Invalid input detected.');
  }

  // 2. Lấy ngữ cảnh tối thiểu (chỉ lịch sử chat)
  const recentLogs = await AiLog.findAll({
    where: { userId, type: 'chat' },
    order: [['timestamp', 'DESC']],
    limit: 5,
  });

  // [TỐI ƯU] Chỉ lấy prompt và response text, không lấy cả object nặng nề
  const chatHistory = recentLogs.map(log => {
    let responseText = log.response;
    try {
      // Nếu response là JSON, chỉ lấy phần text
      const parsed = JSON.parse(log.response);
      if (parsed.text) responseText = parsed.text;
    } catch (e) { }
    return `User: ${log.prompt}\nAI: ${responseText}`;
  }).join('\n');

  // 3. [BƯỚC 1: INTENT] Gọi AI để phân loại ý định
  const intentPrompt = buildPrompt('CHAT_INTENT_CLASSIFIER', { prompt, chatHistory });
  let intentData;
  try {
    const intentResponse = await callAIProvider(intentPrompt);
    intentData = parseAIResponse(intentResponse);
  } catch (error) {
    console.error('Lỗi khi phân loại intent:', error);
    // Fallback: Nếu không phân loại được, coi như general_chat
    intentData = {
      intent: 'general_chat',
      entities: {},
      confidence: 0.5,
      response_to_user: "Xin lỗi, tôi chưa hiểu rõ ý bạn. Bạn có thể nói lại không?"
    };
  }

  // 4. [BƯỚC 2: ACTION ROUTER] Định tuyến hành động dựa trên ý định
  let finalResponse;
  const { intent, entities, response_to_user } = intentData;

  switch (intent) {
    case 'search_movie':
      finalResponse = await _handleSearchMovie(entities, response_to_user);
      break;
    case 'recommend_movie':
      finalResponse = await _handleRecommendMovie(userId, entities, response_to_user);
      break;
    case 'navigation':
      finalResponse = _handleNavigation(entities, response_to_user);
      break;
    case 'get_movie_details':
      finalResponse = await _handleGetMovieDetails(entities, response_to_user);
      break;
    case 'help':
      finalResponse = _handleHelp(response_to_user);
      break;
    case 'general_chat':
    default:
      finalResponse = _handleGeneralChat(response_to_user);
  }

  // 5. [BƯỚC 3: LOG & RETURN] Ghi log (nhẹ nhàng hơn) và trả về
  // [TỐI ƯU LOGGING]
  // Chỉ log prompt gốc của user và JSON response cuối cùng.
  // Metadata chứa intent để phân tích.
  await logAiInteraction(
    userId,
    prompt, // Chỉ prompt của user
    JSON.stringify(finalResponse), // Response JSON có cấu trúc
    'chat', // Loại tương tác
    { intent, entities, confidence: intentData.confidence } // Metadata
  );

  return finalResponse;
};
// --- [MỚI] Các Hàm Xử Lý Action (Private) ---

/**
 * @desc [ACTION] Tìm kiếm phim trong DB
 */
const _handleSearchMovie = async (entities, aiText) => {
  const { query, genre, category, releaseYear } = entities;
  const { Op } = db.Sequelize;
  if (!query && !genre && !category && !releaseYear) {
    return { type: 'text', text: "Bạn muốn tìm phim gì vậy? (theo tên, thể loại, năm...)" };
  }

  const whereClause = {};
  const includeClause = [];

  // Tìm theo tiêu đề (linh hoạt)
  if (query) {
    const lowerQuery = query.toLowerCase().trim();

    whereClause[Op.and] = (whereClause[Op.and] || []);
    
    whereClause[Op.and].push(
      db.sequelize.where(
        db.sequelize.fn('LOWER', db.sequelize.cast(db.sequelize.col('Movie.titles'), 'CHAR')),
        Op.like,
        `%${lowerQuery}%`
      )
    );
  }

  // Tìm theo năm
  if (releaseYear) {
    whereClause.year = releaseYear;
  }

  // Tìm theo thể loại (cần join)
  if (genre) {
    includeClause.push({
      model: Genre,
      as: 'genres',
      where: { title: { [Op.like]: `%${genre}%` } }
    });
  }

  // Tìm theo danh mục (cần join)
  if (category) {
    includeClause.push({
      model: Category,
      as: 'category',
      where: { title: { [Op.like]: `%${category}%` } }
    });
  }
  try {
    const movies = await Movie.findAll({
      where: whereClause,
      include: includeClause,
      limit: 5, // Trợ lý chỉ nên trả về 5 kết quả hàng đầu
      order: [['views', 'DESC']],
      attributes: ['titles', 'slug', 'image', 'year', 'type', 'views', 'description'] // Chỉ lấy các trường cần thiết
    });
    if (!movies || movies.length === 0) {
      const contextMsg = query ? `với từ khóa "${query}"` : "với các tiêu chí này";
        return {
            type: 'text',
            text: `Rất tiếc, tôi không tìm thấy bộ phim nào ${contextMsg}. Bạn thử kiểm tra lại tên hoặc dùng từ khóa khác xem sao?`
        };
    }
    const formattedMovies = movies.map(movie => {
        // Ưu tiên title default, fallback về phần tử đầu tiên
        const titleObj = movie.titles.find(t => t.type === 'default') || movie.titles[0];
        return {
            title: titleObj ? titleObj.title : 'Chưa có tiêu đề',
            slug: movie.slug,
            posterUrl: movie.image?.posterUrl,
            year: movie.year,
            type: movie.type,
            views: movie.views,
            description: movie.description ? (movie.description.substring(0, 100) + '...') : ''
        };
    });

    return {
      type: 'movie_list',
      text: aiText || `Tìm thấy ${formattedMovies.length} phim phù hợp cho bạn:`,
      payload: formattedMovies
    };
  } catch (error) {
    console.error("[AI Service] Search Error:", error);
    return {
      type: 'text',
      text: "Xin lỗi, tôi gặp chút trục trặc khi tìm dữ liệu. Bạn thử lại sau nhé!"
    };
  }
};

/**
 * @desc [ACTION] Gợi ý phim (tái sử dụng logic từ `recommendMovies` cũ)
 */
const _handleRecommendMovie = async (userId, entities, aiText) => {
  // Lấy lịch sử xem của user
  const userWatchHistory = await WatchHistory.findAll({
    where: { userId },
    include: [{ model: Movie, as: 'movie', include: [{ model: Genre, as: 'genres' }] }],
    limit: 20,
  });

  const watchedMovieIds = userWatchHistory.map(history => history.movieId);
  const watchedMovieGenres = userWatchHistory.flatMap(history =>
    history.movie?.genres.map(genre => genre.title) || []
  );

  // Đếm thể loại yêu thích
  const genreCounts = watchedMovieGenres.reduce((acc, genre) => {
    acc[genre] = (acc[genre] || 0) + 1;
    return acc;
  }, {});

  const topGenres = Object.entries(genreCounts)
    .sort(([, countA], [, countB]) => countB - countA)
    .slice(0, 3)
    .map(([genre]) => genre);

  // Tìm phim trending thuộc thể loại user thích (và chưa xem)
  const whereClause = {
    id: { [Op.notIn]: watchedMovieIds } // Loại trừ phim đã xem
  };

  const includeClause = [];

  // Ưu tiên thể loại AI trích xuất được
  const targetGenre = entities.genre || (topGenres.length > 0 ? topGenres[0] : null);

  if (targetGenre) {
    includeClause.push({
      model: Genre,
      as: 'genres',
      where: { title: { [Op.like]: `%${targetGenre}%` } }
    });
  }

  const recommendedMovies = await Movie.findAll({
    where: whereClause,
    include: includeClause,
    order: [['views', 'DESC']], // Gợi ý phim hot
    limit: 5,
    attributes: ['titles', 'slug', 'image', 'year', 'type', 'views', 'description']
  });

  const formattedMovies = recommendedMovies.map(movie => ({
    title: movie.titles.find(t => t.type === 'default')?.title || 'Không có tiêu đề',
    slug: movie.slug,
    posterUrl: movie.image?.posterUrl,
    year: movie.year,
    type: movie.type,
    description: movie.description?.substring(0, 100) + '...'
  }));

  let responseText = aiText;
  if (!responseText) {
    if (targetGenre) responseText = `Đây là vài phim ${targetGenre} hay nhất mà tôi nghĩ bạn sẽ thích:`;
    else responseText = "Dựa trên lịch sử của bạn, đây là vài phim tôi gợi ý:";
  }

  return {
    type: 'movie_list',
    text: responseText,
    payload: formattedMovies
  };
};

/**
 * @desc [ACTION] Cung cấp thông tin chi tiết về 1 phim
 */
const _handleGetMovieDetails = async (entities, aiText) => {
  const { query } = entities; // "query" ở đây là tên phim
  if (!query) {
    return { type: 'text', text: "Bạn muốn hỏi về phim nào?" };
  }

  const movie = await Movie.findOne({
    where: {
      titles: { [Op.like]: `%${query}%` }
    },
    include: [
      { model: Genre, as: 'genres', attributes: ['title'] },
      { model: Country, as: 'country', attributes: ['title'] }
    ]
  });

  if (!movie) {
    return { type: 'text', text: `Tôi không tìm thấy phim nào tên là "${query}".` };
  }

  // Format một mô tả chi tiết từ AI (có thể gọi AI một lần nữa,
  // nhưng ở đây chúng ta tự tạo để tiết kiệm chi phí)
  const movieTitle = movie.titles.find(t => t.type === 'default')?.title;
  const genres = movie.genres.map(g => g.title).join(', ');
  const description = `**${movieTitle}** (${movie.year}) là phim ${movie.country?.title} thuộc thể loại ${genres}.
    - Trạng thái: ${movie.status}
    - Tổng số tập: ${movie.totalEpisodes}
    - Thời lượng: ${movie.duration}
    - Mô tả: ${movie.description?.substring(0, 200)}...`;

  // Chúng ta cũng trả về payload phim để UI có thể hiển thị card
  const moviePayload = {
    title: movieTitle,
    slug: movie.slug,
    posterUrl: movie.image?.posterUrl,
    year: movie.year,
    type: movie.type,
    description: movie.description?.substring(0, 100) + '...'
  };

  return {
    type: 'movie_detail_text', // Một loại type mới
    text: description, // AI tự tạo văn bản chi tiết
    payload: moviePayload // Gửi kèm 1 card phim
  };
};

/**
 * @desc [ACTION] Điều hướng
 */
const _handleNavigation = (entities, aiText) => {
  const { target_route } = entities;

  // Mapping từ khóa đến route (lấy từ router.jsx)
  const routeMap = {
    "/phim-moi-cap-nhat": ["mới", "mới cập nhật", "latest"],
    "/phim-chieu-rap": ["chiếu rạp", "theater"],
    "/the-loai": ["thể loại", "genres"],
    "/profile": ["cá nhân", "profile", "tài khoản"]
  };

  let finalRoute = target_route;

  // Nếu AI không trích xuất được route, thử tìm trong map
  if (!finalRoute) {
    const query = entities.query?.toLowerCase() || '';
    for (const route in routeMap) {
      if (routeMap[route].some(keyword => query.includes(keyword))) {
        finalRoute = route;
        break;
      }
    }
  }

  if (!finalRoute || !Object.keys(routeMap).includes(finalRoute)) {
    return { type: 'text', text: "Tôi chưa rõ bạn muốn đi đến trang nào. Bạn có thể đến trang 'Phim mới', 'Phim chiếu rạp', 'Thể loại'..." };
  }

  return {
    type: 'navigation', // Frontend sẽ biết cách xử lý
    text: aiText || `Ok, đang chuyển bạn đến trang...`,
    payload: {
      route: finalRoute, // Đường dẫn (ví dụ: /phim-moi-cap-nhat)
      // Tên trang để hiển thị trên nút bấm
      routeName: finalRoute.replace('/', '').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    }
  };
};

/**
 * @desc [ACTION] Trợ giúp
 */
const _handleHelp = (aiText) => {
  return {
    type: 'suggestions', // Frontend sẽ render các nút bấm
    text: aiText || "Tôi là Trợ lý AI Sạp Phim! Tôi có thể giúp bạn:",
    payload: [ // Danh sách các gợi ý
      { text: "Tìm phim 'Oppenheimer'", action_prompt: "Tìm phim Oppenheimer" },
      { text: "Gợi ý phim hành động", action_prompt: "Gợi ý phim hành động" },
      { text: "Phim chiếu rạp mới", action_prompt: "Đưa tôi đến trang phim chiếu rạp" },
    ]
  };
};

/**
 * @desc [ACTION] Chat thông thường
 */
const _handleGeneralChat = (aiText) => {
  // Đây chỉ là một câu trả lời văn bản đơn giản
  // AI đã cung cấp câu trả lời trong `response_to_user`
  return {
    type: 'text',
    text: aiText || "Chào bạn, tôi có thể giúp gì cho bạn hôm nay?"
  };
};

/**
 * @desc Gợi ý phim cho người dùng dựa trên sở thích và lịch sử
 * @param {number} userId - ID của người dùng
 * @param {object} options - Các tùy chọn gợi ý (ví dụ: số lượng, thể loại ưu tiên)
 * @returns {Promise<Array<Movie>>} Danh sách phim gợi ý
 */
const recommendMovies = async (userId, options = {}) => {
  try {
    const { limit = 10, preferredGenres = [] } = options;

    // Lấy thông tin người dùng
    const user = await User.findByPk(userId);

    // Lấy lịch sử xem phim của người dùng
    const userWatchHistory = await WatchHistory.findAll({
      where: { userId },
      include: [{ model: Movie, as: 'movie', include: [{ model: Genre, as: 'genres' }] }],
      order: [['updatedAt', 'DESC']],
      limit: 20, // Lấy 20 phim gần nhất để phân tích
    });

    const watchedMovieGenres = userWatchHistory.flatMap(history =>
      history.movie?.genres.map(genre => genre.title) || []
    );
    const genreCounts = watchedMovieGenres.reduce((acc, genre) => {
      acc[genre] = (acc[genre] || 0) + 1;
      return acc;
    }, {});

    const topGenres = Object.entries(genreCounts)
      .sort(([, countA], [, countB]) => countB - countA)
      .slice(0, 3)
      .map(([genre]) => genre);

    const finalPreferredGenres = [...new Set([...preferredGenres, ...topGenres])];

    let recommendationPrompt = `Gợi ý ${limit} phim cho người dùng.
    Người dùng có thể quan tâm đến các thể loại: ${finalPreferredGenres.length > 0 ? finalPreferredGenres.join(', ') : 'bất kỳ'}.
    Dựa trên lịch sử xem gần đây, người dùng đã xem các phim thuộc thể loại: ${topGenres.join(', ')}.
    Hãy đưa ra các gợi ý đa dạng và hấp dẫn, ưu tiên các phim chưa được xem bởi người dùng.
    Định dạng phản hồi là một danh sách các tiêu đề phim, mỗi tiêu đề trên một dòng.
    `;

    // Nếu có thông tin người dùng, thêm vào ngữ cảnh
    if (user) {
      recommendationPrompt += `\nThông tin người dùng:
      - Tên đăng nhập: ${user.username}
      - Giới tính: ${user.sex || 'Không rõ'}
      - Mô tả bản thân: ${user.bio || 'Không có'}
      `;
    }

    const aiResponse = await callAIProvider(recommendationPrompt);
    await logAiInteraction(userId, recommendationPrompt, aiResponse, 'recommendMovies');

    // Phân tích phản hồi từ AI để lấy danh sách tiêu đề phim
    const movieTitles = aiResponse.split('\n').map(line => line.replace(/^- /, '').trim()).filter(line => line !== '');

    // Lấy danh sách ID phim đã xem để loại trừ
    const watchedMovieIds = userWatchHistory.map(history => history.movieId);

    // Tìm kiếm các phim trong DB dựa trên tiêu đề gợi ý
    const recommendedMovies = await Movie.findAll({
      where: {
        titles: {
          [db.Sequelize.Op.or]: movieTitles.map(title => ({
            [db.Sequelize.Op.like]: `%${title}%`
          }))
        },
        id: { [db.Sequelize.Op.notIn]: watchedMovieIds } // Loại trừ phim đã xem
      },
      include: [
        { model: Genre, as: 'genres', through: { attributes: [] } },
        { model: Country, as: 'country' },
        { model: Category, as: 'category' },
      ],
      limit: limit,
    });

    // Nếu không tìm thấy đủ phim từ gợi ý AI, bổ sung bằng phim trending chưa xem
    if (recommendedMovies.length < limit) {
      const trending = await Movie.findAll({
        order: [['views', 'DESC']],
        limit: limit - recommendedMovies.length,
        where: {
          id: { [db.Sequelize.Op.notIn]: [...recommendedMovies.map(m => m.id), ...watchedMovieIds] }
        },
        include: [
          { model: Genre, as: 'genres', through: { attributes: [] } },
          { model: Country, as: 'country' },
          { model: Category, as: 'category' },
        ],
      });
      recommendedMovies.push(...trending);
    }

    return recommendedMovies;
  } catch (error) {
    console.error('Lỗi khi gợi ý phim:', error);
    throw new Error('Không thể gợi ý phim vào lúc này.');
  }
};

/**
 * @desc Dịch nội dung sử dụng AI
 * @param {number} userId - ID của người dùng
 * @param {string} text - Nội dung cần dịch
 * @param {string} targetLanguage - Ngôn ngữ đích (ví dụ: "English", "Vietnamese")
 * @returns {Promise<string>} Nội dung đã dịch
 */
const translateText = async (userId, text, targetLanguage) => {
  try {
    const prompt = `Dịch văn bản sau sang ${targetLanguage}: "${text}"`;
    const response = await callAIProvider(prompt);
    await logAiInteraction(userId, prompt, response, 'translate');
    return response;
  } catch (error) {
    console.error('Lỗi khi dịch văn bản:', error);
    throw new Error('Không thể dịch văn bản vào lúc này.');
  }
};

/**
 * @desc Gợi ý dữ liệu phim mới cho admin với context đầy đủ
 * @param {number} userId - ID của người dùng (admin)
 * @param {object} movieInfo - Thông tin phim hiện có
 * @param {Array} movieInfo.titles - Array of title objects [{type: "default", title: "..."}, ...]
 * @param {string} movieInfo.season - Season information (optional)
 * @param {string} movieInfo.description - Current description
 * @param {Array} movieInfo.genres - Array of genre objects (optional)
 * @param {string} movieInfo.type - Movie type (movie/series)
 * @returns {Promise<object>} Dữ liệu phim được gợi ý
 */
const suggestMovieData = async (userId, movieInfo) => {
  try {
    // Rate limiting check
    checkRateLimit(userId, 5, 60000);

    // Validate input
    if (!validateInput(movieInfo)) {
      throw new Error('Invalid input detected. Possible prompt injection attempt.');
    }

    const { titles = [], season, releaseYear = '', country = '', description = '', genres = [], type = 'movie' } = movieInfo;

    // Format titles for prompt
    let { defaultTitle, otherTitles } = formatTitlesForPrompt(titles);
    let aiGeneratedOtherTitlesCount = 0;

    if (!defaultTitle.trim()) {
      throw new Error('Default title is required for AI suggestion');
    }

    // If otherTitles are not provided, generate them using AI
    if (!otherTitles || otherTitles.length === 0) {
      const generatedTitles = await generateOtherTitlesWithAI(defaultTitle);
      if (generatedTitles.length > 0) {
        otherTitles = generatedTitles.map(t => `${t.type}: ${t.title}`).join(', ');
        aiGeneratedOtherTitlesCount = generatedTitles.length;
      }
    }

    // Format genres for prompt
    const genresString = formatGenresForPrompt(genres);

    // Fetch related movies from DB for better AI context
    const relatedMoviesArr = await getRelatedMoviesForContext(defaultTitle, Array.isArray(genres) ? genres : [], type);
    const relatedMovies = Array.isArray(relatedMoviesArr) && relatedMoviesArr.length > 0 ? relatedMoviesArr.join(', ') : '';

    // Build enhanced prompt with full context
    const prompt = buildPrompt('SUGGEST_MOVIE', {
      defaultTitle,
      otherTitles,
      season: season || '',
      country,
      description,
      genres: genresString,
      releaseYear,
      relatedMovies
    });

    // Call AI provider
    const aiResponse = await callAIProvider(prompt);

    // Parse response
    const suggestedData = parseAIResponse(aiResponse);

    // Add the AI-generated otherTitles to the suggestedData if they were generated
    if (aiGeneratedOtherTitlesCount > 0) {
      suggestedData.aiGeneratedOtherTitlesCount = aiGeneratedOtherTitlesCount;
    }

    // Log interaction with metadata
    await logAiInteraction(userId, prompt, aiResponse, 'suggestMovie', {
      movieTitle: defaultTitle,
      hasSeason: !!season,
      genresCount: genres.length,
      aiGeneratedOtherTitlesCount: aiGeneratedOtherTitlesCount // Log if other titles were AI-generated
    });

    return suggestedData;
  } catch (error) {
    console.error('Lỗi khi gợi ý dữ liệu phim:', error);
    throw new Error(`Không thể gợi ý dữ liệu phim: ${error.message}`);
  }
};

/**
 * Extracts the base title from a movie title by removing season, part, and other identifiers.
 * @param {string} title - The full movie title.
 * @returns {string} The base title.
 */
const getBaseTitle = (title) => {
  if (!title) return '';
  // Remove common suffixes like "Season 2", "Part 1", "2nd Season", etc.
  // Also removes text after a colon, which often indicates a subtitle for a specific season/arc.
  return title
    .replace(/\s*:\s*.*/, '') // "Title: Subtitle" -> "Title"
    .replace(/\s+((\d+)(st|nd|rd|th)?\s*season|season\s*(\d+))/i, '') // "Title Season 2" -> "Title"
    .replace(/\s+part\s+\d+/i, '') // "Title Part 2" -> "Title"
    .trim();
};

/**
 * @desc Get related movies from database for context
 * @param {string} title - Movie title
 * @param {Array} genres - Array of genres
 * @param {string} type - Movie type
 * @returns {Promise<Array>} Array of related movie titles
 */
const getRelatedMoviesForContext = async (title, genres, type) => {
  try {
    const relatedMovies = [];

    const baseTitle = getBaseTitle(title);
    // Use the shorter, more generic title for searching if it's different from the original
    const searchTitle = (baseTitle && baseTitle.length < title.length) ? baseTitle : title;

    // Find movies with similar titles
    const similarTitles = await Movie.findAll({
      where: db.sequelize.where(
        db.sequelize.cast(db.sequelize.col('titles'), 'CHAR'),
        db.Sequelize.Op.like,
        `%${searchTitle}%`
      ),
      limit: 3,
      attributes: ['titles']
    });

    similarTitles.forEach(movie => {
      const defaultTitle = movie.titles.find(t => t.type === 'default')?.title;
      if (defaultTitle && defaultTitle !== title) {
        relatedMovies.push(defaultTitle);
      }
    });

    // Find movies with similar genres
    if (genres.length > 0) {
      const genreIds = genres.map(g => g.id || g);
      const similarGenres = await Movie.findAll({
        include: [{
          model: Genre,
          as: 'genres',
          where: { id: genreIds },
          through: { attributes: [] }
        }],
        limit: 3,
        attributes: ['titles']
      });

      similarGenres.forEach(movie => {
        const defaultTitle = movie.titles.find(t => t.type === 'default')?.title;
        if (defaultTitle && defaultTitle !== title && !relatedMovies.includes(defaultTitle)) {
          relatedMovies.push(defaultTitle);
        }
      });
    }

    return relatedMovies.slice(0, 5); // Limit to 5 related movies
  } catch (error) {
    console.error('Error getting related movies:', error);
    return [];
  }
};

/**
 * @desc Generate marketing content for movie
 * @param {number} userId - User ID
 * @param {object} movieInfo - Movie information
 * @returns {Promise<object>} Marketing content
 */
const generateMarketingContent = async (userId, movieInfo) => {
  try {
    checkRateLimit(userId, 3, 60000); // 3 requests per minute

    if (!validateInput(movieInfo)) {
      throw new Error('Invalid input detected');
    }

    const { title, description, genres, year } = movieInfo;

    const prompt = buildPrompt('GENERATE_MARKETING', {
      title: title || '',
      description: description || '',
      genres: formatGenresForPrompt(genres),
      year: year || ''
    });

    const aiResponse = await callAIProvider(prompt);
    const marketingData = parseAIResponse(aiResponse);

    await logAiInteraction(userId, prompt, aiResponse, 'generateMarketing', {
      movieTitle: title
    });

    return marketingData;
  } catch (error) {
    console.error('Error generating marketing content:', error);
    throw new Error(`Không thể tạo nội dung marketing: ${error.message}`);
  }
};

/**
 * @desc Translate movie description
 * @param {number} userId - User ID
 * @param {object} translationInfo - Translation information
 * @returns {Promise<object>} Translated content
 */
const translateDescription = async (userId, translationInfo) => {
  try {
    checkRateLimit(userId, 10, 60000); // 10 requests per minute

    if (!validateInput(translationInfo)) {
      throw new Error('Invalid input detected');
    }

    const { title, description, targetLanguage } = translationInfo;

    if (!title || !description || !targetLanguage) {
      throw new Error('Title, description, and target language are required');
    }

    const prompt = buildPrompt('TRANSLATE_DESCRIPTION', {
      title,
      description,
      targetLanguage
    });

    const aiResponse = await callAIProvider(prompt);
    const translationData = parseAIResponse(aiResponse);

    await logAiInteraction(userId, prompt, aiResponse, 'translateDescription', {
      movieTitle: title,
      targetLanguage
    });

    return translationData;
  } catch (error) {
    console.error('Error translating description:', error);
    throw new Error(`Không thể dịch mô tả: ${error.message}`);
  }
};

/**
 * @desc Generate SEO optimized content
 * @param {number} userId - User ID
 * @param {object} seoInfo - SEO information
 * @returns {Promise<object>} SEO optimized content
 */
const generateSEOContent = async (userId, seoInfo) => {
  try {
    checkRateLimit(userId, 5, 60000); // 5 requests per minute

    if (!validateInput(seoInfo)) {
      throw new Error('Invalid input detected');
    }

    const { title, description, genres, tags } = seoInfo;

    const prompt = buildPrompt('SEO_OPTIMIZATION', {
      title: title || '',
      description: description || '',
      genres: formatGenresForPrompt(genres),
      tags: Array.isArray(tags) ? tags.join(', ') : (tags || '')
    });

    const aiResponse = await callAIProvider(prompt);
    const seoData = parseAIResponse(aiResponse);

    await logAiInteraction(userId, prompt, aiResponse, 'generateSEO', {
      movieTitle: title
    });

    return seoData;
  } catch (error) {
    console.error('Error generating SEO content:', error);
    throw new Error(`Không thể tạo nội dung SEO: ${error.message}`);
  }
};

/**
 * @desc Classify a comment using AI
 * @param {number} userId - User ID
 * @param {string} commentText - The text of the comment to classify
 * @returns {Promise<object>} Classification result (sentiment, categories, reason)
 */
const classifyComment = async (userId, commentText) => {
  try {
    checkRateLimit(userId, 20, 60000); // Higher rate limit for classification

    if (!validateInput({ commentText })) {
      throw new Error('Invalid input detected.');
    }

    const classification = await classifyCommentWithAI(commentText);

    await logAiInteraction(userId, commentText, JSON.stringify(classification), 'classifyComment', {
      commentTextPreview: commentText.substring(0, 100)
    });

    return classification;
  } catch (error) {
    console.error('Error classifying comment:', error);
    throw new Error(`Không thể phân loại bình luận: ${error.message}`);
  }
};

/**
 * @desc Get AI analytics data
 * @param {number} userId - User ID (admin only)
 * @param {object} filters - Filter options
 * @returns {Promise<object>} Analytics data
 */
const getAIAnalytics = async (userId, filters = {}) => {
  try {
    const { startDate, endDate, type } = filters;

    const whereClause = { userId };

    if (startDate && endDate) {
      whereClause.timestamp = {
        [db.Sequelize.Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    if (type) {
      whereClause.type = type;
    }

    const logs = await AiLog.findAll({
      where: whereClause,
      order: [['timestamp', 'DESC']],
      limit: 100
    });

    // Calculate analytics
    const totalRequests = logs.length;
    const typeCounts = logs.reduce((acc, log) => {
      acc[log.type] = (acc[log.type] || 0) + 1;
      return acc;
    }, {});

    const recentActivity = logs.slice(0, 10).map(log => ({
      id: log.id,
      type: log.type,
      timestamp: log.timestamp,
      promptLength: log.prompt.length,
      responseLength: log.response.length
    }));

    return {
      totalRequests,
      typeCounts,
      recentActivity,
      period: { startDate, endDate }
    };
  } catch (error) {
    console.error('Error getting AI analytics:', error);
    throw new Error(`Không thể lấy dữ liệu analytics: ${error.message}`);
  }
};

export {
  chatWithAI,
  recommendMovies,
  translateText,
  suggestMovieData,
  generateMarketingContent,
  translateDescription,
  generateSEOContent,
  classifyComment, // Export the new function
  getAIAnalytics,
  logAiInteraction
};