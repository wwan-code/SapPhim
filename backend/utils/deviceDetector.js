/**
 * Device Detection Utility
 * Phát hiện thông tin thiết bị từ User-Agent string
 */

/**
 * Phát hiện loại thiết bị từ User-Agent
 * @param {string} userAgent - User-Agent string từ request header
 * @returns {string} - 'mobile', 'tablet', 'desktop', hoặc 'unknown'
 */
export const detectDeviceType = (userAgent) => {
  if (!userAgent) return 'unknown';

  const ua = userAgent.toLowerCase();

  // Mobile devices
  const mobileRegex = /mobile|android|iphone|ipod|blackberry|iemobile|opera mini|windows phone/i;
  if (mobileRegex.test(ua)) {
    // Tablet detection
    const tabletRegex = /tablet|ipad|playbook|silk|kindle/i;
    if (tabletRegex.test(ua)) {
      return 'tablet';
    }
    return 'mobile';
  }

  // Tablet detection (specific patterns)
  const tabletRegex = /tablet|ipad|playbook|silk|kindle|android(?!.*mobile)/i;
  if (tabletRegex.test(ua)) {
    return 'tablet';
  }

  // Desktop by default
  return 'desktop';
};

/**
 * Phát hiện tên thiết bị/browser từ User-Agent
 * @param {string} userAgent - User-Agent string từ request header
 * @returns {string} - Tên browser/device
 */
export const detectDeviceName = (userAgent) => {
  if (!userAgent) return 'Unknown Device';

  const ua = userAgent.toLowerCase();

  // Browser detection
  if (ua.includes('edg/') || ua.includes('edge')) return 'Microsoft Edge';
  if (ua.includes('chrome') && !ua.includes('edg')) return 'Google Chrome';
  if (ua.includes('firefox')) return 'Mozilla Firefox';
  if (ua.includes('safari') && !ua.includes('chrome')) return 'Safari';
  if (ua.includes('opera') || ua.includes('opr/')) return 'Opera';
  if (ua.includes('brave')) return 'Brave Browser';
  if (ua.includes('vivaldi')) return 'Vivaldi';

  // Mobile devices
  if (ua.includes('iphone')) return 'iPhone';
  if (ua.includes('ipad')) return 'iPad';
  if (ua.includes('android')) return 'Android Device';
  if (ua.includes('windows phone')) return 'Windows Phone';

  return 'Unknown Device';
};

/**
 * Phát hiện hệ điều hành từ User-Agent
 * @param {string} userAgent - User-Agent string từ request header
 * @returns {string} - Tên OS
 */
export const detectOS = (userAgent) => {
  if (!userAgent) return 'Unknown';

  const ua = userAgent.toLowerCase();

  if (ua.includes('windows nt 10.0')) return 'Windows 10/11';
  if (ua.includes('windows nt 6.3')) return 'Windows 8.1';
  if (ua.includes('windows nt 6.2')) return 'Windows 8';
  if (ua.includes('windows nt 6.1')) return 'Windows 7';
  if (ua.includes('windows')) return 'Windows';

  if (ua.includes('mac os x')) return 'macOS';
  if (ua.includes('iphone') || ua.includes('ipad')) return 'iOS';
  if (ua.includes('android')) return 'Android';
  if (ua.includes('linux')) return 'Linux';

  return 'Unknown';
};

/**
 * Tạo một đối tượng thông tin thiết bị đầy đủ
 * @param {string} userAgent - User-Agent string từ request header
 * @returns {Object} - Đối tượng chứa thông tin thiết bị
 */
export const getDeviceInfo = (userAgent) => {
  return {
    type: detectDeviceType(userAgent),
    name: detectDeviceName(userAgent),
    os: detectOS(userAgent),
    userAgent: userAgent || 'Unknown',
  };
};

/**
 * Format device info thành chuỗi hiển thị
 * @param {string} userAgent - User-Agent string
 * @returns {string} - Chuỗi mô tả thiết bị
 */
export const formatDeviceInfo = (userAgent) => {
  const info = getDeviceInfo(userAgent);
  return `${info.name} on ${info.os}`;
};
