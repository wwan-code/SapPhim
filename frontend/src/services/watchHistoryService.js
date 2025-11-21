import api from './api';

const saveProgress = async ({ movieId, episodeId, progress, timestamp }) => {
  const response = await api.post('/watch-history', { movieId, episodeId, progress, timestamp });
  return response.data; // Returns { success, data, message }
};

const getHistory = async ({ page = 1, limit = 12 } = {}) => {
  const response = await api.get('/watch-history', { params: { page, limit } });
  return response.data; // Returns { success, data: items, message, meta }
};

const deleteOne = async (id) => {
  const response = await api.delete(`/watch-history/${id}`);
  return response.data; // Returns { success, data, message }
};

const clearAll = async () => {
  const response = await api.delete('/watch-history');
  return response.data; // Returns { success, data, message }
};

/**
 * Get watch progress for a specific movie/episode
 * @param {Object} params - Parameters
 * @param {number} params.movieId - Movie ID
 * @param {number|null} [params.episodeId] - Episode ID (optional, null for movies without episodes)
 * @returns {Promise<Object>} Response with watch progress data
 */
const getProgress = async ({ movieId, episodeId = null }) => {
  const url = episodeId
    ? `/watch-history/progress/${movieId}/${episodeId}`
    : `/watch-history/progress/${movieId}`;
  const response = await api.get(url);
  return response.data; // Returns { success, data, message }
};

export default { saveProgress, getHistory, deleteOne, clearAll, getProgress };
