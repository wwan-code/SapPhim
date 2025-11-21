import { jsPDF } from 'jspdf';
import { formatDate } from './dateUtils';

// ============================================================================
// CONSTANTS & CONFIGURATION
// ============================================================================

const PDF_CONFIG = {
  orientation: 'p',
  unit: 'mm',
  format: 'a4',
  putOnlyUsedFonts: true,
  floatPrecision: 16,
};

const LAYOUT = {
  margin: 15,
  sectionSpacing: 6,
  itemSpacing: 3.5,
  lineSpacing: 2,
  avatarSize: 30,
  headerHeight: 20,
  columnGap: 8,
};

const COLORS = {
  primary: [32, 201, 151], // Teal from theme
  primaryLight: [140, 250, 210],
  text: [33, 33, 33],
  textLight: [108, 117, 125],
  success: [40, 167, 69],
  danger: [220, 53, 69],
  link: [0, 123, 255],
  divider: [222, 226, 230],
  white: [255, 255, 255],
  footerText: [150, 150, 150],
};

const FONTS = {
  size: {
    title: 20,
    sectionHeader: 11,
    subtitle: 10,
    body: 8,
    small: 7,
    footer: 7,
  },
};

const FONT_URLS = {
  bold: '/fonts/Roboto-Bold.ttf',
  boldItalic: '/fonts/Roboto-BoldItalic.ttf',
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Safely encodes Vietnamese text for PDF
 */
const encodeVietnamese = (text) => {
  if (!text) return '';
  return String(text).normalize('NFC');
};

/**
 * Converts image URL to base64 with error handling
 */
const loadImageAsBase64 = (url) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    
    const timeout = setTimeout(() => {
      console.warn('Image load timeout:', url);
      resolve(null);
    }, 5000);
    
    img.onload = () => {
      clearTimeout(timeout);
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        
        const dataURL = canvas.toDataURL('image/jpeg', 0.85);
        resolve(dataURL);
      } catch (error) {
        console.error('Error converting image:', error);
        resolve(null);
      }
    };
    
    img.onerror = () => {
      clearTimeout(timeout);
      console.error('Failed to load image:', url);
      resolve(null);
    };
    
    img.src = url.includes('?') ? `${url}&t=${Date.now()}` : `${url}?t=${Date.now()}`;
  });
};

/**
 * Loads font and converts to base64
 */
const loadFontAsBase64 = async (url) => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to load font: ${url}`);
    }
    
    const buffer = await response.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = '';
    
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    
    return window.btoa(binary);
  } catch (error) {
    console.error('Font loading error:', error);
    return null;
  }
};

/**
 * Strips HTML tags from text
 */
const stripHtmlTags = (html) => {
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  return tempDiv.textContent || tempDiv.innerText || '';
};

/**
 * Generates fallback avatar URL
 */
const getFallbackAvatarUrl = (username) => {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(username || '?')}&background=20c997&color=fff&size=200&bold=true`;
};

// ============================================================================
// PDF BUILDER CLASS
// ============================================================================

class PDFBuilder {
  constructor(doc, user) {
    this.doc = doc;
    this.user = user;
    this.pageWidth = doc.internal.pageSize.getWidth();
    this.pageHeight = doc.internal.pageSize.getHeight();
    this.yPosition = LAYOUT.margin;
  }

  // --------------------------------------------------------------------------
  // Text & Drawing Helpers
  // --------------------------------------------------------------------------

  addText(text, x, y, options = {}) {
    const encoded = encodeVietnamese(text);
    this.doc.text(encoded, x, y, options);
  }

  addWrappedText(text, x, y, maxWidth, fontSize = FONTS.size.body) {
    this.doc.setFontSize(fontSize);
    const encoded = encodeVietnamese(text);
    const lines = this.doc.splitTextToSize(encoded, maxWidth);
    this.doc.text(lines, x, y);
    return y + (lines.length * fontSize * 0.5);
  }

  addDivider() {
    this.doc.setDrawColor(...COLORS.divider);
    this.doc.setLineWidth(0.2);
    this.doc.line(
      LAYOUT.margin,
      this.yPosition,
      this.pageWidth - LAYOUT.margin,
      this.yPosition
    );
    this.yPosition += 5;
  }

  checkPageBreak(neededSpace = 50) {
    if (this.yPosition > this.pageHeight - neededSpace) {
      this.doc.addPage();
      this.yPosition = LAYOUT.margin;
      return true;
    }
    return false;
  }

  // --------------------------------------------------------------------------
  // Header Section
  // --------------------------------------------------------------------------

  async addHeader() {
    // Compact header background
    this.doc.setFillColor(...COLORS.primaryLight);
    this.doc.rect(0, 0, this.pageWidth, LAYOUT.headerHeight, 'F');
    
    // Title
    this.doc.setTextColor(...COLORS.text);
    this.doc.setFontSize(FONTS.size.title);
    this.doc.setFont('Roboto', 'bold');
    this.addText('Thông tin Cá nhân', this.pageWidth / 2, 12, { align: 'center' });
    
    this.yPosition = LAYOUT.headerHeight + 5;
  }

  // --------------------------------------------------------------------------
  // Avatar Section
  // --------------------------------------------------------------------------

  async addAvatar() {
    let avatarUrl = this.user.avatarUrl;
    
    // Build full URL if needed
    if (avatarUrl && !avatarUrl.startsWith('http')) {
      avatarUrl = `${import.meta.env.VITE_SERVER_URL}${avatarUrl}`;
    } else if (!avatarUrl) {
      avatarUrl = getFallbackAvatarUrl(this.user.username);
    }

    const avatarBase64 = await loadImageAsBase64(avatarUrl);
    
    if (avatarBase64) {
      const x = this.pageWidth / 2 - LAYOUT.avatarSize / 2;
      
      // Add avatar image
      this.doc.addImage(
        avatarBase64,
        'JPEG',
        x,
        this.yPosition,
        LAYOUT.avatarSize,
        LAYOUT.avatarSize
      );
      
      this.yPosition += LAYOUT.avatarSize + 5;
    } else {
      this.yPosition += LAYOUT.itemSpacing;
    }
  }

  // --------------------------------------------------------------------------
  // User Identity Section
  // --------------------------------------------------------------------------

  addUserIdentity() {
    // Username
    this.doc.setFontSize(FONTS.size.subtitle + 2);
    this.doc.setFont('Roboto', 'bold');
    this.doc.setTextColor(...COLORS.text);
    this.addText(this.user.username || 'N/A', this.pageWidth / 2, this.yPosition, {
      align: 'center',
    });
    this.yPosition += 5;

    // Online status
    this.doc.setFontSize(FONTS.size.small);
    this.doc.setFont('Roboto', 'normal');
    let statusText = '○ Offline';
    let statusColor = COLORS.textLight;

    if (this.user.hidden) {
      statusText = '◎ Đang ẩn trạng thái';
      statusColor = COLORS.textLight;
    } else if (this.user.online) {
      statusText = '● Online';
      statusColor = COLORS.success;
    }
    this.doc.setTextColor(...statusColor);
    this.addText(statusText, this.pageWidth / 2, this.yPosition, { align: 'center' });
    
    this.yPosition += 8;
  }

  // --------------------------------------------------------------------------
  // Section Header
  // --------------------------------------------------------------------------

  addSectionHeader(title) {
    // Compact section title
    this.doc.setTextColor(...COLORS.primary);
    this.doc.setFontSize(FONTS.size.sectionHeader);
    this.doc.setFont('Roboto', 'bold');
    this.addText(title, LAYOUT.margin, this.yPosition);
    
    this.yPosition += 6;
  }

  // --------------------------------------------------------------------------
  // Info Row
  // --------------------------------------------------------------------------

  addInfoRow(label, value, options = {}) {
    const { bold = false, color = COLORS.text, compact = false } = options;
    
    this.doc.setFontSize(FONTS.size.body);
    
    // Label
    this.doc.setFont('Roboto', 'bold');
    this.doc.setTextColor(...COLORS.textLight);
    this.addText(label + ':', LAYOUT.margin + 2, this.yPosition);
    
    // Value (inline, no wrapping for compact view)
    this.doc.setFont('Roboto', bold ? 'bold' : 'normal');
    this.doc.setTextColor(...color);
    
    const maxWidth = this.pageWidth - LAYOUT.margin - 45;
    const encoded = encodeVietnamese(value);
    const lines = this.doc.splitTextToSize(encoded, maxWidth);
    
    // Always try to keep on one line for compact view
    this.addText(lines[0], LAYOUT.margin + 40, this.yPosition);
    this.yPosition += LAYOUT.itemSpacing;
  }

  // --------------------------------------------------------------------------
  // Basic Information Section
  // --------------------------------------------------------------------------

  addBasicInformation() {
    this.addSectionHeader('Thông tin Cơ bản');

    const basicInfo = [
      { label: 'Email', value: this.user.email || 'N/A' },
      { label: 'SĐT', value: this.user.phoneNumber || 'Chưa cập nhật' },
      { 
        label: 'Giới tính', 
        value: this.user.sex === 'nam' ? 'Nam' : 
               this.user.sex === 'nữ' ? 'Nữ' : 
               this.user.sex === 'khác' ? 'Khác' : 'Chưa cập nhật' 
      },
      { 
        label: 'Trạng thái', 
        value: this.user.status === 'active' ? 'Hoạt động' : 'Bị cấm',
        bold: true,
        color: this.user.status === 'active' ? COLORS.success : COLORS.danger
      },
      { label: 'Điểm', value: (this.user.points?.toLocaleString() || '0'), bold: true },
      { label: 'Cấp độ', value: String(this.user.level || '1'), bold: true },
    ];

    if (this.user.createdAt) {
      basicInfo.push({
        label: 'Ngày tạo',
        value: formatDate(this.user.createdAt, 'vi-VN', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        }),
      });
    }

    basicInfo.forEach((info) => {
      this.addInfoRow(info.label, info.value, {
        bold: info.bold,
        color: info.color,
      });
    });

    this.yPosition += LAYOUT.lineSpacing;
  }

  // --------------------------------------------------------------------------
  // Bio Section
  // --------------------------------------------------------------------------

  addBio() {
    if (!this.user.bio) return;

    this.addSectionHeader('Tiểu sử');

    const bioText = stripHtmlTags(this.user.bio);
    
    this.doc.setTextColor(...COLORS.text);
    this.doc.setFontSize(FONTS.size.small);
    this.doc.setFont('Roboto', 'normal');

    // Limit bio to 3 lines max for compact view
    const maxWidth = this.pageWidth - 2 * LAYOUT.margin - 4;
    const lines = this.doc.splitTextToSize(encodeVietnamese(bioText), maxWidth);
    const displayLines = lines.slice(0, 3);
    
    this.doc.text(displayLines, LAYOUT.margin + 2, this.yPosition);
    this.yPosition += displayLines.length * 3 + LAYOUT.lineSpacing;
  }

  // --------------------------------------------------------------------------
  // Privacy Settings Section
  // --------------------------------------------------------------------------

  addPrivacySettings() {
    this.addSectionHeader('Quyền riêng tư');

    const privacyMap = {
      public: 'Công khai',
      friends: 'Bạn bè',
      private: 'Riêng tư',
      everyone: 'Mọi người',
      friends_of_friends: 'Bạn của bạn',
      none: 'Không',
    };

    // Only show most important privacy settings
    const privacySettings = [
      {
        label: 'Trang cá nhân',
        value: privacyMap[this.user.profileVisibility] || 'N/A',
      },
      {
        label: 'Lời mời KBạn',
        value: privacyMap[this.user.canReceiveFriendRequests] || 'N/A',
      },
      {
        label: 'Trạng thái online',
        value: this.user.showOnlineStatus ? 'Hiện' : 'Ẩn',
      },
      {
        label: 'DS bạn bè',
        value: privacyMap[this.user.showFriendList] || 'N/A',
      },
    ];

    privacySettings.forEach((setting) => {
      this.addInfoRow(setting.label, setting.value);
    });

    this.yPosition += LAYOUT.lineSpacing;
  }

  // --------------------------------------------------------------------------
  // Social Links Section
  // --------------------------------------------------------------------------

  addSocialLinks() {
    if (!this.user.socialLinks || !Object.values(this.user.socialLinks).some(link => link)) {
      return;
    }

    this.addSectionHeader('Mạng xã hội');

    const socialLabels = {
      github: 'GitHub',
      twitter: 'Twitter', 
      instagram: 'Instagram',
      facebook: 'Facebook',
    };

    this.doc.setFontSize(FONTS.size.body);

    Object.entries(this.user.socialLinks).forEach(([key, value]) => {
      if (value) {
        this.doc.setFont('Roboto', 'bold');
        this.doc.setTextColor(...COLORS.textLight);
        this.addText(socialLabels[key] + ':', LAYOUT.margin + 2, this.yPosition);

        this.doc.setFont('Roboto', 'normal');
        this.doc.setTextColor(...COLORS.link);
        
        // Truncate long URLs
        const maxLen = 35;
        const displayValue = value.length > maxLen ? value.substring(0, maxLen) + '...' : value;
        this.addText(displayValue, LAYOUT.margin + 30, this.yPosition);
        
        this.doc.setTextColor(...COLORS.text);
        this.yPosition += LAYOUT.itemSpacing;
      }
    });
  }

  // --------------------------------------------------------------------------
  // Footer
  // --------------------------------------------------------------------------

  addFooter() {
    const footerY = this.pageHeight - 15;
    
    this.doc.setFontSize(FONTS.size.footer);
    this.doc.setTextColor(...COLORS.footerText);
    this.doc.setFont('Roboto', 'italic');
    
    const footerText = `Xuất ngày ${formatDate(new Date(), 'vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })}`;
    
    this.addText(footerText, this.pageWidth / 2, footerY, { align: 'center' });
    
    // Add page number
    this.doc.setFontSize(FONTS.size.small);
    this.addText(
      `Trang ${this.doc.internal.getNumberOfPages()}`,
      this.pageWidth - LAYOUT.margin,
      footerY,
      { align: 'right' }
    );
  }
}

// ============================================================================
// MAIN EXPORT FUNCTION
// ============================================================================

/**
 * Exports user profile information to PDF with enhanced design
 * @param {Object} user - User object containing all profile information
 * @returns {Promise<boolean>} Success status
 */
export const exportUserToPdf = async (user) => {
  if (!user) {
    console.error('No user data provided for PDF export.');
    return false;
  }

  try {
    // Load fonts
    const [robotoBoldBase64, robotoBoldItalicBase64] = await Promise.all([
      loadFontAsBase64(FONT_URLS.bold),
      loadFontAsBase64(FONT_URLS.boldItalic),
    ]);

    // Create PDF document
    const doc = new jsPDF(PDF_CONFIG);

    // Add fonts if loaded successfully
    if (robotoBoldBase64) {
      doc.addFileToVFS('Roboto-Bold.ttf', robotoBoldBase64);
      doc.addFont('Roboto-Bold.ttf', 'Roboto', 'normal');
      doc.addFont('Roboto-Bold.ttf', 'Roboto', 'bold');
    }
    if (robotoBoldItalicBase64) {
      doc.addFileToVFS('Roboto-BoldItalic.ttf', robotoBoldItalicBase64);
      doc.addFont('Roboto-BoldItalic.ttf', 'Roboto', 'italic');
      doc.addFont('Roboto-BoldItalic.ttf', 'Roboto', 'bolditalic');
    }

    // Set default font
    doc.setFont('Roboto', 'normal');

    // Build PDF using PDFBuilder class
    const builder = new PDFBuilder(doc, user);

    await builder.addHeader();
    await builder.addAvatar();
    builder.addUserIdentity();
    builder.addDivider();
    builder.addBasicInformation();
    builder.addBio();
    builder.addPrivacySettings();
    builder.addSocialLinks();
    builder.addFooter();

    // Save PDF
    const filename = `${user.username || 'user'}_profile_${Date.now()}.pdf`;
    doc.save(filename);

    console.log('PDF exported successfully:', filename);
    return true;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};