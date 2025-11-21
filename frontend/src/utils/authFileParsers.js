/**
 * Auth File Parsers
 * Xử lý parsing các file định dạng .json, .txt, .docx để extract thông tin đăng nhập/đăng ký
 */

import mammoth from 'mammoth';

// Configuration
const FILE_SIZE_LIMIT = 200 * 1024; // 200KB
const SUPPORTED_FORMATS = ['.json', '.txt', '.docx'];
const SUPPORTED_ACTIONS = ['login', 'register'];

/**
 * Validate account object theo schema
 * @param {Object} obj - Object cần validate
 * @returns {Object} { valid: boolean, errors: string[], account: Object }
 */
export const validateAccountObj = (obj) => {
  const errors = [];
  const account = { ...obj };

  // Validate action
  if (!account.action || !SUPPORTED_ACTIONS.includes(account.action.toLowerCase())) {
    errors.push('Thiếu hoặc không hợp lệ field "action" (phải là "login" hoặc "register")');
  } else {
    account.action = account.action.toLowerCase();
  }

  // Common validation
  if (!account.email || typeof account.email !== 'string' || !account.email.includes('@')) {
    errors.push('Thiếu hoặc không hợp lệ field "email"');
  }

  if (!account.password || typeof account.password !== 'string' || account.password.length < 6) {
    errors.push('Thiếu hoặc không hợp lệ field "password" (tối thiểu 6 ký tự)');
  }

  // Register-specific validation
  if (account.action === 'register') {
    if (!account.username || typeof account.username !== 'string' || account.username.trim().length < 3) {
      errors.push('Thiếu hoặc không hợp lệ field "username" (tối thiểu 3 ký tự)');
    }

    if (!account.confPassword || account.confPassword !== account.password) {
      errors.push('Thiếu hoặc không khớp field "confPassword"');
    }

    // phoneNumber is optional
    if (account.phoneNumber && typeof account.phoneNumber !== 'string') {
      errors.push('Field "phoneNumber" không hợp lệ');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    account: errors.length === 0 ? account : null,
  };
};

/**
 * Parse JSON file
 * @param {File} file - File object từ input
 * @returns {Promise<Array>} Array of validated accounts
 */
export const parseJSONFile = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const parsed = JSON.parse(text);

        let accounts = [];

        // Nếu là array, xử lý từng item
        if (Array.isArray(parsed)) {
          accounts = parsed;
        } else if (typeof parsed === 'object' && parsed !== null) {
          // Nếu là object, coi như 1 account
          accounts = [parsed];
        } else {
          throw new Error('JSON phải là object hoặc array');
        }

        // Validate từng account
        const results = accounts.map((acc, idx) => {
          const validation = validateAccountObj(acc);
          return {
            index: idx,
            raw: acc,
            ...validation,
          };
        });

        resolve(results);
      } catch (error) {
        reject(new Error(`Không thể parse JSON: ${error.message}`));
      }
    };

    reader.onerror = () => {
      reject(new Error('Không thể đọc file'));
    };

    reader.readAsText(file);
  });
};

/**
 * Parse text file với fallback strategies
 * @param {File} file - File object từ input
 * @returns {Promise<Array>} Array of validated accounts
 */
export const parseTextFile = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const text = e.target.result.trim();

        // Strategy 1: Try parse as JSON
        try {
          const parsed = JSON.parse(text);
          // Recursively use parseJSONFile logic
          const accounts = Array.isArray(parsed) ? parsed : [parsed];
          const results = accounts.map((acc, idx) => {
            const validation = validateAccountObj(acc);
            return { index: idx, raw: acc, ...validation };
          });
          return resolve(results);
        } catch (jsonError) {
          // Not JSON, continue to next strategy
        }

        // Strategy 2: Parse key:value lines
        const keyValueAccounts = parseKeyValueFormat(text);
        if (keyValueAccounts.length > 0) {
          const results = keyValueAccounts.map((acc, idx) => {
            const validation = validateAccountObj(acc);
            return { index: idx, raw: acc, ...validation };
          });
          return resolve(results);
        }

        // Strategy 3: Parse CSV format
        const csvAccounts = parseCSVFormat(text);
        if (csvAccounts.length > 0) {
          const results = csvAccounts.map((acc, idx) => {
            const validation = validateAccountObj(acc);
            return { index: idx, raw: acc, ...validation };
          });
          return resolve(results);
        }

        // No strategy worked
        reject(new Error('Không đọc được nội dung hợp lệ từ file text. Vui lòng sử dụng định dạng JSON, key:value hoặc CSV.'));
      } catch (error) {
        reject(new Error(`Lỗi khi parse text file: ${error.message}`));
      }
    };

    reader.onerror = () => {
      reject(new Error('Không thể đọc file'));
    };

    reader.readAsText(file);
  });
};

/**
 * Parse key:value format
 * Format example:
 * action: login
 * email: user@example.com
 * password: 123456
 * ---
 * action: register
 * ...
 */
const parseKeyValueFormat = (text) => {
  const accounts = [];
  const blocks = text.split(/\n---+\n/).map(b => b.trim()).filter(Boolean);

  for (const block of blocks) {
    const lines = block.split('\n').filter(l => l.trim());
    const account = {};

    for (const line of lines) {
      const match = line.match(/^(\w+)\s*:\s*(.+)$/);
      if (match) {
        const [, key, value] = match;
        account[key.trim()] = value.trim();
      }
    }

    if (Object.keys(account).length > 0) {
      accounts.push(account);
    }
  }

  return accounts;
};

/**
 * Parse CSV format
 * Format: action,email,password,username,confPassword,phoneNumber
 * First line = headers
 */
const parseCSVFormat = (text) => {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const accounts = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    const account = {};

    headers.forEach((header, idx) => {
      if (values[idx]) {
        account[header] = values[idx];
      }
    });

    if (Object.keys(account).length > 0) {
      accounts.push(account);
    }
  }

  return accounts;
};

/**
 * Parse DOCX file
 * @param {File} file - File object từ input
 * @returns {Promise<Array>} Array of validated accounts
 */
export const parseDocxFile = async (file) => {
  try {
    // Read file as ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();

    // Extract text using mammoth
    const result = await mammoth.extractRawText({ arrayBuffer });
    const text = result.value.trim();

    if (!text) {
      throw new Error('File DOCX không chứa nội dung text');
    }

    // Use text parsing logic
    return parseTextFromExtractedContent(text);
  } catch (error) {
    throw new Error(`Không thể parse DOCX: ${error.message}`);
  }
};

/**
 * Helper to parse extracted text (used by DOCX parser)
 */
const parseTextFromExtractedContent = (text) => {
  // Try JSON first
  try {
    const parsed = JSON.parse(text);
    const accounts = Array.isArray(parsed) ? parsed : [parsed];
    const results = accounts.map((acc, idx) => {
      const validation = validateAccountObj(acc);
      return { index: idx, raw: acc, ...validation };
    });
    return results;
  } catch (jsonError) {
    // Not JSON
  }

  // Try key:value
  const keyValueAccounts = parseKeyValueFormat(text);
  if (keyValueAccounts.length > 0) {
    const results = keyValueAccounts.map((acc, idx) => {
      const validation = validateAccountObj(acc);
      return { index: idx, raw: acc, ...validation };
    });
    return results;
  }

  // Try CSV
  const csvAccounts = parseCSVFormat(text);
  if (csvAccounts.length > 0) {
    const results = csvAccounts.map((acc, idx) => {
      const validation = validateAccountObj(acc);
      return { index: idx, raw: acc, ...validation };
    });
    return results;
  }

  throw new Error('Không đọc được nội dung hợp lệ từ DOCX');
};

/**
 * Validate file size
 * @param {File} file - File object
 * @param {number} limit - Size limit in bytes
 * @returns {Object} { valid: boolean, error: string }
 */
export const validateFileSize = (file, limit = FILE_SIZE_LIMIT) => {
  if (file.size > limit) {
    return {
      valid: false,
      error: `File quá lớn. Kích thước tối đa: ${(limit / 1024).toFixed(0)}KB`,
    };
  }
  return { valid: true, error: null };
};

/**
 * Validate file format
 * @param {File} file - File object
 * @returns {Object} { valid: boolean, error: string, format: string }
 */
export const validateFileFormat = (file) => {
  const fileName = file.name.toLowerCase();
  const format = SUPPORTED_FORMATS.find(fmt => fileName.endsWith(fmt));

  if (!format) {
    return {
      valid: false,
      error: `Định dạng file không được hỗ trợ. Chỉ chấp nhận: ${SUPPORTED_FORMATS.join(', ')}`,
      format: null,
    };
  }

  return { valid: true, error: null, format };
};

/**
 * Main parser dispatcher
 * @param {File} file - File object
 * @returns {Promise<Array>} Array of validated accounts
 */
export const parseAuthFile = async (file) => {
  // Validate size
  const sizeValidation = validateFileSize(file);
  if (!sizeValidation.valid) {
    throw new Error(sizeValidation.error);
  }

  // Validate format
  const formatValidation = validateFileFormat(file);
  if (!formatValidation.valid) {
    throw new Error(formatValidation.error);
  }

  // Parse based on format
  const { format } = formatValidation;

  if (format === '.json') {
    return parseJSONFile(file);
  } else if (format === '.txt') {
    return parseTextFile(file);
  } else if (format === '.docx') {
    return parseDocxFile(file);
  }

  throw new Error('Định dạng file không được hỗ trợ');
};

/**
 * Get first valid account from results
 * @param {Array} results - Array of parsed results
 * @returns {Object|null} First valid account or null
 */
export const getFirstValidAccount = (results) => {
  if (!Array.isArray(results) || results.length === 0) return null;
  return results.find(r => r.valid)?.account || null;
};

export { FILE_SIZE_LIMIT, SUPPORTED_FORMATS, SUPPORTED_ACTIONS };
