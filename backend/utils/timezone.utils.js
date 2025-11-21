/**
 * Timezone Utilities
 * Giúp xử lý múi giờ Việt Nam (UTC+7) cho các timestamp
 */

/**
 * Convert UTC date to Vietnam timezone string
 * @param {Date} date - Date object
 * @returns {string} - Formatted date string in Vietnam timezone
 */
export const toVietnamTime = (date) => {
  if (!date) return null;
  return new Date(date).toLocaleString('vi-VN', { 
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
};

/**
 * Convert UTC date to Vietnam timezone ISO string
 * @param {Date} date - Date object
 * @returns {string} - ISO string adjusted for Vietnam timezone
 */
export const toVietnamISO = (date) => {
  if (!date) return null;
  const vnDate = new Date(date);
  // Add 7 hours for Vietnam timezone
  vnDate.setHours(vnDate.getHours() + 7);
  return vnDate.toISOString();
};

/**
 * Format date for JSON response with Vietnam timezone
 * @param {Date} date - Date object
 * @returns {Object} - Object with multiple format options
 */
export const formatDateResponse = (date) => {
  if (!date) return null;
  return {
    utc: date.toISOString(),
    vietnam: toVietnamTime(date),
    timestamp: date.getTime()
  };
};

/**
 * Add Vietnam timezone info to Sequelize model instance
 * @param {Object} instance - Sequelize model instance
 * @param {Array} dateFields - Array of date field names to convert
 * @returns {Object} - Instance with added Vietnam time fields
 */
export const addVietnamTimeFields = (instance, dateFields = ['createdAt', 'updatedAt']) => {
  if (!instance) return null;
  
  const data = instance.toJSON ? instance.toJSON() : instance;
  
  dateFields.forEach(field => {
    if (data[field]) {
      data[`${field}VN`] = toVietnamTime(data[field]);
    }
  });
  
  return data;
};

/**
 * Get current time in Vietnam timezone
 * @returns {Date} - Current date adjusted for Vietnam timezone
 */
export const getCurrentVietnamTime = () => {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
};

/**
 * Check if a date is today in Vietnam timezone
 * @param {Date} date - Date to check
 * @returns {boolean}
 */
export const isToday = (date) => {
  if (!date) return false;
  const today = getCurrentVietnamTime();
  const checkDate = new Date(date);
  return checkDate.toDateString() === today.toDateString();
};

export default {
  toVietnamTime,
  toVietnamISO,
  formatDateResponse,
  addVietnamTimeFields,
  getCurrentVietnamTime,
  isToday
};
