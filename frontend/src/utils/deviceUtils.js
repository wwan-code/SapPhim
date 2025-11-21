/**
 * Device utilities for frontend
 * Format device information for display
 */

/**
 * Get device icon based on device type
 * @param {string} deviceType - Type of device (mobile, tablet, desktop)
 * @returns {string} Emoji icon
 */
export const getDeviceIcon = (deviceType) => {
  switch (deviceType?.toLowerCase()) {
    case 'mobile':
      return '📱';
    case 'tablet':
      return '📱';
    case 'desktop':
      return '💻';
    default:
      return '🖥️';
  }
};

/**
 * Format device name from user agent
 * @param {string} userAgent - User agent string
 * @returns {string} Formatted device name
 */
export const formatDeviceName = (userAgent) => {
  if (!userAgent) return 'Unknown Device';

  const ua = userAgent.toLowerCase();

  // Browser detection
  if (ua.includes('edg/') || ua.includes('edge')) return 'Microsoft Edge';
  if (ua.includes('chrome') && !ua.includes('edg')) return 'Google Chrome';
  if (ua.includes('firefox')) return 'Mozilla Firefox';
  if (ua.includes('safari') && !ua.includes('chrome')) return 'Safari';
  if (ua.includes('opera') || ua.includes('opr/')) return 'Opera';
  if (ua.includes('brave')) return 'Brave Browser';
  
  // Mobile devices
  if (ua.includes('iphone')) return 'iPhone';
  if (ua.includes('ipad')) return 'iPad';
  if (ua.includes('android')) return 'Android Device';

  return 'Unknown Device';
};

/**
 * Format OS name from user agent
 * @param {string} userAgent - User agent string
 * @returns {string} Formatted OS name
 */
export const formatOS = (userAgent) => {
  if (!userAgent) return 'Unknown OS';

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

  return 'Unknown OS';
};

/**
 * Get provider display name
 * @param {string} provider - Login provider (google, facebook, github, local)
 * @returns {string} Display name
 */
export const getProviderDisplayName = (provider) => {
  const providers = {
    google: 'Google',
    facebook: 'Facebook',
    github: 'GitHub',
    local: 'Email/Password',
  };
  return providers[provider?.toLowerCase()] || provider || 'Unknown';
};

/**
 * Get provider color for badge
 * @param {string} provider - Login provider
 * @returns {string} Color class name
 */
export const getProviderColor = (provider) => {
  const colors = {
    google: 'provider-google',
    facebook: 'provider-facebook',
    github: 'provider-github',
    local: 'provider-local',
  };
  return colors[provider?.toLowerCase()] || 'provider-default';
};

/**
 * Format full device info for display
 * @param {Object} loginData - Login history data
 * @returns {string} Formatted string
 */
export const formatDeviceDisplay = (loginData) => {
  const deviceName = formatDeviceName(loginData.userAgent);
  const os = formatOS(loginData.userAgent);
  return `${deviceName} • ${os}`;
};

/**
 * Truncate IP address for privacy
 * @param {string} ip - IP address
 * @returns {string} Truncated IP
 */
export const truncateIP = (ip) => {
  if (!ip) return 'N/A';
  
  // IPv4: Show only first 2 octets
  if (ip.includes('.')) {
    const parts = ip.split('.');
    return `${parts[0]}.${parts[1]}.***`;
  }
  
  // IPv6: Show only first 2 groups
  if (ip.includes(':')) {
    const parts = ip.split(':');
    return `${parts[0]}:${parts[1]}:***`;
  }
  
  return ip;
};
