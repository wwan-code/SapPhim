/**
 * useImportAuthFiles Hook
 * Xử lý logic import, parse, validate và submit auth files
 */

import { useState, useCallback, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { login, register } from '../store/slices/authSlice';
import { parseAuthFile, getFirstValidAccount } from '../utils/authFileParsers';

// File entry states
export const FILE_STATUS = {
  PENDING: 'pending',
  PARSING: 'parsing',
  VALIDATING: 'validating',
  SUBMITTING: 'submitting',
  SUCCESS: 'success',
  ERROR: 'error',
};

/**
 * Performance measurement helper
 */
const measurePerformance = (label, callback) => {
  const start = performance.now();
  const result = callback();
  const end = performance.now();
  console.log(`[Performance] ${label}: ${(end - start).toFixed(2)}ms`);
  return result;
};

/**
 * Clear sensitive data from memory
 */
const clearSensitiveData = (obj) => {
  if (obj && typeof obj === 'object') {
    if (obj.password) obj.password = null;
    if (obj.confPassword) obj.confPassword = null;
  }
};

export const useImportAuthFiles = (options = {}) => {
  const {
    maxConcurrency = 3,
    autoLoginOnSuccess = true,
    onSuccessfulLogin = null,
  } = options;

  const dispatch = useDispatch();
  const [fileEntries, setFileEntries] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasSuccessfulLogin, setHasSuccessfulLogin] = useState(false);
  const processingQueue = useRef([]);
  const activeProcessing = useRef(0);

  /**
   * Update file entry status
   */
  const updateFileEntry = useCallback((fileId, updates) => {
    setFileEntries((prev) =>
      prev.map((entry) =>
        entry.id === fileId ? { ...entry, ...updates } : entry
      )
    );
  }, []);

  /**
   * Submit single account (login or register)
   */
  const submitAccount = async (account, fileId, skipStatusUpdate = false) => {
    try {
      if (!skipStatusUpdate) {
        updateFileEntry(fileId, { status: FILE_STATUS.SUBMITTING });
      }

      let result;
      if (account.action === 'login') {
        result = await dispatch(
          login({ email: account.email, password: account.password })
        ).unwrap();
        
        // Mark successful login (for auto-close)
        setHasSuccessfulLogin(true);
        if (onSuccessfulLogin) {
          onSuccessfulLogin(result);
        }
      } else if (account.action === 'register') {
        result = await dispatch(
          register({
            username: account.username,
            email: account.email,
            password: account.password,
            confPassword: account.confPassword,
            phoneNumber: account.phoneNumber || '',
          })
        ).unwrap();
        // Note: Register không trigger auto-close
      }

      // Clear sensitive data immediately
      clearSensitiveData(account);

      if (!skipStatusUpdate) {
        updateFileEntry(fileId, {
          status: FILE_STATUS.SUCCESS,
          message: `${account.action === 'login' ? 'Đăng nhập' : 'Đăng ký'} thành công`,
          result,
        });
      }

      return { success: true, result };
    } catch (error) {
      clearSensitiveData(account);
      
      const errorMessage = error?.message || error || 'Đã xảy ra lỗi';
      
      if (!skipStatusUpdate) {
        updateFileEntry(fileId, {
          status: FILE_STATUS.ERROR,
          error: errorMessage,
        });
      }

      return { success: false, error: errorMessage };
    }
  };

  /**
   * Process single file
   */
  const processFile = async (file, fileId) => {
    try {
      // Parsing phase
      updateFileEntry(fileId, { status: FILE_STATUS.PARSING });

      const results = await measurePerformance(`auth-import-parse-${file.name}`, async () => {
        return await parseAuthFile(file);
      });

      // Validating phase
      updateFileEntry(fileId, { status: FILE_STATUS.VALIDATING, parsedResults: results });

      // Get valid accounts
      const validAccounts = results.filter(r => r.valid).map(r => r.account);
      const invalidCount = results.filter(r => !r.valid).length;

      if (validAccounts.length === 0) {
        throw new Error('Không tìm thấy account hợp lệ trong file');
      }

      updateFileEntry(fileId, {
        validCount: validAccounts.length,
        invalidCount,
      });

      // Process based on action type
      const firstAccount = validAccounts[0];
      
      if (firstAccount.action === 'login') {
        // LOGIN: Chỉ xử lý account đầu tiên
        updateFileEntry(fileId, { selectedAccount: firstAccount });
        
        if (autoLoginOnSuccess) {
          const result = await submitAccount(firstAccount, fileId);
          // submitAccount already updates the status
        } else {
          updateFileEntry(fileId, {
            status: FILE_STATUS.SUCCESS,
            message: `Đã parse thành công 1 tài khoản đăng nhập`,
          });
        }
      } else if (firstAccount.action === 'register') {
        // REGISTER: Xử lý tuần tự tất cả accounts
        let successCount = 0;
        let failedCount = 0;
        const errors = [];

        for (let i = 0; i < validAccounts.length; i++) {
          const account = validAccounts[i];
          
          updateFileEntry(fileId, { 
            selectedAccount: account,
            status: FILE_STATUS.SUBMITTING,
            message: `Đang đăng ký ${i + 1}/${validAccounts.length}: ${account.email}`,
          });

          const result = await submitAccount(account, fileId, true); // Skip auto status update
          
          if (result.success) {
            successCount++;
          } else {
            failedCount++;
            errors.push(`${account.email}: ${result.error}`);
          }

          // Small delay between registrations to avoid rate limiting
          if (i < validAccounts.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }

        // Final status after all registrations
        if (successCount > 0) {
          updateFileEntry(fileId, {
            status: FILE_STATUS.SUCCESS,
            message: `Hoàn thành: ${successCount}/${validAccounts.length} tài khoản đăng ký thành công`,
            registerResults: { successCount, failedCount, errors },
          });
        } else {
          updateFileEntry(fileId, {
            status: FILE_STATUS.ERROR,
            error: `Tất cả ${validAccounts.length} tài khoản đăng ký thất bại`,
            registerResults: { successCount, failedCount, errors },
          });
        }
      }
    } catch (error) {
      updateFileEntry(fileId, {
        status: FILE_STATUS.ERROR,
        error: error.message || 'Không thể xử lý file',
      });
    } finally {
      activeProcessing.current--;
      processNextInQueue();
    }
  };

  /**
   * Process next file in queue
   */
  const processNextInQueue = useCallback(() => {
    if (processingQueue.current.length === 0) {
      if (activeProcessing.current === 0) {
        setIsProcessing(false);
      }
      return;
    }

    if (activeProcessing.current < maxConcurrency) {
      const nextTask = processingQueue.current.shift();
      if (nextTask) {
        activeProcessing.current++;
        processFile(nextTask.file, nextTask.fileId);
      }
    }
  }, [maxConcurrency]);

  /**
   * Add files to import queue
   */
  const addFiles = useCallback(
    (files) => {
      const newEntries = Array.from(files).map((file) => ({
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        file,
        fileName: file.name,
        fileSize: file.size,
        status: FILE_STATUS.PENDING,
        error: null,
        message: null,
        parsedResults: null,
        validCount: 0,
        invalidCount: 0,
        selectedAccount: null,
        result: null,
        registerResults: null, // For register: { successCount, failedCount, errors }
      }));

      setFileEntries((prev) => [...prev, ...newEntries]);

      // Add to processing queue
      newEntries.forEach((entry) => {
        processingQueue.current.push({ file: entry.file, fileId: entry.id });
      });

      setIsProcessing(true);
      setHasSuccessfulLogin(false);

      // Start processing
      for (let i = 0; i < Math.min(maxConcurrency, newEntries.length); i++) {
        processNextInQueue();
      }
    },
    [maxConcurrency, processNextInQueue]
  );

  /**
   * Retry failed file
   */
  const retryFile = useCallback(
    (fileId) => {
      const entry = fileEntries.find((e) => e.id === fileId);
      if (!entry) return;

      updateFileEntry(fileId, {
        status: FILE_STATUS.PENDING,
        error: null,
        message: null,
      });

      processingQueue.current.push({ file: entry.file, fileId: entry.id });

      if (!isProcessing) {
        setIsProcessing(true);
        processNextInQueue();
      }
    },
    [fileEntries, isProcessing, processNextInQueue, updateFileEntry]
  );

  /**
   * Remove file from list
   */
  const removeFile = useCallback((fileId) => {
    setFileEntries((prev) => prev.filter((entry) => entry.id !== fileId));
  }, []);

  /**
   * Clear all files
   */
  const clearAll = useCallback(() => {
    // Clear sensitive data from all entries
    fileEntries.forEach((entry) => {
      if (entry.selectedAccount) {
        clearSensitiveData(entry.selectedAccount);
      }
    });

    setFileEntries([]);
    processingQueue.current = [];
    activeProcessing.current = 0;
    setIsProcessing(false);
    setHasSuccessfulLogin(false);
  }, [fileEntries]);

  /**
   * Get processing statistics
   */
  const getStats = useCallback(() => {
    const total = fileEntries.length;
    const success = fileEntries.filter((e) => e.status === FILE_STATUS.SUCCESS).length;
    const error = fileEntries.filter((e) => e.status === FILE_STATUS.ERROR).length;
    const processing = fileEntries.filter(
      (e) =>
        e.status === FILE_STATUS.PENDING ||
        e.status === FILE_STATUS.PARSING ||
        e.status === FILE_STATUS.VALIDATING ||
        e.status === FILE_STATUS.SUBMITTING
    ).length;

    return { total, success, error, processing };
  }, [fileEntries]);

  return {
    fileEntries,
    isProcessing,
    hasSuccessfulLogin,
    addFiles,
    retryFile,
    removeFile,
    clearAll,
    getStats,
  };
};
