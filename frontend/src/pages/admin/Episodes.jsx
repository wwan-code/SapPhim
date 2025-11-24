import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { toast } from 'react-toastify';
import episodeService from '@/services/episodeService';
import movieService from '@/services/movieService';
import useTableData from '@/hooks/useTableData';
import Pagination from '@/components/common/Pagination';
import classNames from '@/utils/classNames';
import { FaEdit, FaTrash, FaPlus, FaRedo } from 'react-icons/fa';
import { debounce } from '@/utils/performanceUtils';
import api from '@/services/api';
import { getSocket } from '@/socket/socketManager';

// ============================================================================
// CONSTANTS
// ============================================================================
const MAX_FILE_SIZE = 5 * 1024 * 1024 * 1024; // 5GB
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/x-msvideo', 'video/quicktime'];
const RETRY_CONFIG = {
  maxRetries: 3,
  initialDelay: 1000,
  backoffFactor: 2,
  maxDelay: 10000,
};
const PROGRESS_PERSIST_KEY = 'transcoding_progress_state';
const BATCH_REFETCH_DELAY = 5000; // 5s debounce for batch updates

// ============================================================================
// UPLOAD STATE MANAGER - Per-episode tracking
// ============================================================================
class UploadStateManager {
  constructor() {
    this.uploads = new Map();
  }

  initUpload(episodeId, fileSize) {
    this.uploads.set(episodeId, {
      fileSize,
      uploadedBytes: 0,
      progress: 0,
      status: 'pending', // pending | uploading | completed | failed | retrying
      retryCount: 0,
      lastError: null,
      startTime: Date.now(),
      abortController: new AbortController(),
    });
  }

  updateProgress(episodeId, uploadedBytes) {
    const upload = this.uploads.get(episodeId);
    if (!upload) return 0;

    upload.uploadedBytes = uploadedBytes;
    upload.progress = Math.round((uploadedBytes / upload.fileSize) * 100);
    upload.status = 'uploading';
    return upload.progress;
  }

  markCompleted(episodeId) {
    const upload = this.uploads.get(episodeId);
    if (upload) {
      upload.status = 'completed';
      upload.completedTime = Date.now();
    }
  }

  markFailed(episodeId, error) {
    const upload = this.uploads.get(episodeId);
    if (upload) {
      upload.status = 'failed';
      upload.lastError = error;
    }
  }

  incrementRetry(episodeId) {
    const upload = this.uploads.get(episodeId);
    if (upload) {
      upload.retryCount++;
      upload.status = 'retrying';
      return upload.retryCount;
    }
    return 0;
  }

  getUpload(episodeId) {
    return this.uploads.get(episodeId);
  }

  abortUpload(episodeId) {
    const upload = this.uploads.get(episodeId);
    if (upload) {
      upload.abortController.abort();
    }
  }

  clear(episodeId) {
    this.uploads.delete(episodeId);
  }

  clearAll() {
    this.uploads.clear();
  }

  getStats() {
    return {
      total: this.uploads.size,
      uploading: Array.from(this.uploads.values()).filter(u => u.status === 'uploading').length,
      completed: Array.from(this.uploads.values()).filter(u => u.status === 'completed').length,
      failed: Array.from(this.uploads.values()).filter(u => u.status === 'failed').length,
    };
  }
}

// ============================================================================
// PROGRESS PERSISTENCE LAYER
// ============================================================================
const persistProgressState = async (state) => {
  try {
    await window.storage?.set(PROGRESS_PERSIST_KEY, JSON.stringify(state), false);
  } catch (err) {
    console.warn('Failed to persist progress:', err);
  }
};

const loadProgressState = async () => {
  try {
    const result = await window.storage?.get(PROGRESS_PERSIST_KEY, false);
    return result ? JSON.parse(result.value) : {};
  } catch (err) {
    console.warn('Failed to load progress:', err);
    return {};
  }
};

// ============================================================================
// RETRY UTILITY WITH EXPONENTIAL BACKOFF
// ============================================================================
const retryWithBackoff = async (
  fn,
  episodeId,
  onRetry = null,
  config = RETRY_CONFIG
) => {
  let lastError;
  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt < config.maxRetries) {
        const delay = Math.min(
          config.initialDelay * Math.pow(config.backoffFactor, attempt),
          config.maxDelay
        );

        if (onRetry) {
          onRetry(attempt + 1, config.maxRetries, delay, error);
        }

        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================
const Episodes = () => {
  // ========================================================================
  // STATE MANAGEMENT
  // ========================================================================
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentEpisode, setCurrentEpisode] = useState({
    id: null,
    movieId: '',
    episodeNumber: '',
    linkEpisode: '',
    duration: '',
    hlsUrl: '',
    status: 'pending'
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [movies, setMovies] = useState([]);

  // Upload state per-episode
  const [uploadStates, setUploadStates] = useState({});
  const [transcodingProgress, setTranscodingProgress] = useState({});
  const [selectedFile, setSelectedFile] = useState(null);

  // Refs for lifecycle management
  const uploadManagerRef = useRef(new UploadStateManager());
  const progressTimeoutsRef = useRef({});
  const debouncedSearchRef = useRef(null);
  const batchRefetchTimeoutRef = useRef(null);
  const socketListenersRef = useRef({ progress: null, error: null });

  // Table data hook
  const {
    data: episodes,
    meta,
    isLoading,
    error,
    refetch,
    setPage,
    setLimit,
    setSortRules,
    setFilters,
    queryParams,
  } = useTableData(episodeService.getEpisodes, {
    initialSortRules: [{ field: 'episodeNumber', order: 'asc' }],
  });

  // ========================================================================
  // INITIALIZATION - Load persisted progress & movies
  // ========================================================================
  useEffect(() => {
    // Load persisted transcoding progress
    const loadPersistedProgress = async () => {
      const state = await loadProgressState();
      if (Object.keys(state).length > 0) {
        setTranscodingProgress(state);
      }
    };

    loadPersistedProgress();

    // Fetch movies once
    const fetchMovies = async () => {
      try {
        const response = await movieService.getAllMovies();
        setMovies(response.data || []);
      } catch {
        toast.error('Lỗi khi tải danh sách phim.');
      }
    };

    fetchMovies();
  }, []);

  // ========================================================================
  // PERSISTED PROGRESS SYNC
  // ========================================================================
  useEffect(() => {
    persistProgressState(transcodingProgress);
  }, [transcodingProgress]);

  // ========================================================================
  // SEARCH DEBOUNCING - Enhanced with cleanup
  // ========================================================================
  useEffect(() => {
    if (!debouncedSearchRef.current) {
      debouncedSearchRef.current = debounce((value) => {
        setFilters({ episodeNumber: value });
      }, 300);
    }

    return () => {
      if (debouncedSearchRef.current) {
        debouncedSearchRef.current.cancel();
      }
    };
  }, [setFilters]);

  const handleSearchChange = useCallback((e) => {
    if (debouncedSearchRef.current) {
      debouncedSearchRef.current(e.target.value);
    }
  }, []);

  // ========================================================================
  // SOCKET.IO - Real-time progress tracking with optimized updates
  // ========================================================================
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    // Progress handler - NO automatic refetch
    const handleProgress = (data) => {
      const { episodeId, stage, progress, message } = data;

      setTranscodingProgress(prev => ({
        ...prev,
        [episodeId]: { stage, progress, message, updatedAt: Date.now() }
      }));

      if (stage === 'complete') {
        toast.success(`Xử lý video hoàn tất: Tập ${episodeId}`);

        // Clear old timeout
        if (progressTimeoutsRef.current[episodeId]) {
          clearTimeout(progressTimeoutsRef.current[episodeId]);
        }

        // Batch refetch after completion (5s debounce)
        scheduleBatchRefetch();

        // Schedule progress cleanup
        const cleanupTimeoutId = setTimeout(() => {
          setTranscodingProgress(prev => {
            const newState = { ...prev };
            delete newState[episodeId];
            return newState;
          });
          delete progressTimeoutsRef.current[episodeId];
        }, 3000);

        progressTimeoutsRef.current[episodeId] = cleanupTimeoutId;
      }
    };

    // Error handler
    const handleError = (data) => {
      const { episodeId, message } = data;
      toast.error(message || 'Lỗi xử lý video');

      // Remove from progress immediately
      setTranscodingProgress(prev => {
        const newState = { ...prev };
        delete newState[episodeId];
        return newState;
      });

      // Batch refetch
      scheduleBatchRefetch();
    };

    socketListenersRef.current.progress = handleProgress;
    socketListenersRef.current.error = handleError;

    socket.on('video:transcode:progress', handleProgress);
    socket.on('video:transcode:error', handleError);

    return () => {
      socket.off('video:transcode:progress', handleProgress);
      socket.off('video:transcode:error', handleError);
    };
  }, []);

  // ========================================================================
  // BATCH REFETCH - Debounced table refresh
  // ========================================================================
  const scheduleBatchRefetch = useCallback(() => {
    // Clear previous timeout
    if (batchRefetchTimeoutRef.current) {
      clearTimeout(batchRefetchTimeoutRef.current);
    }

    // Schedule new refetch after delay
    batchRefetchTimeoutRef.current = setTimeout(() => {
      refetch();
      batchRefetchTimeoutRef.current = null;
    }, BATCH_REFETCH_DELAY);
  }, [refetch]);

  // ========================================================================
  // FILE VALIDATION
  // ========================================================================
  const validateFile = useCallback((file) => {
    if (!file) return { valid: false, error: 'Vui lòng chọn file' };

    if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
      return {
        valid: false,
        error: `Định dạng video không hỗ trợ. Cho phép: ${ALLOWED_VIDEO_TYPES.join(', ')}`
      };
    }

    if (file.size > MAX_FILE_SIZE) {
      return {
        valid: false,
        error: `File quá lớn. Tối đa: ${(MAX_FILE_SIZE / 1024 / 1024 / 1024).toFixed(2)}GB`
      };
    }

    return { valid: true };
  }, []);

  // ========================================================================
  // FORM VALIDATION
  // ========================================================================
  const validateForm = useCallback(() => {
    const errors = {};

    if (!currentEpisode.movieId) {
      errors.movieId = 'Phim là bắt buộc.';
    }

    if (!currentEpisode.episodeNumber || parseInt(currentEpisode.episodeNumber) <= 0) {
      errors.episodeNumber = 'Số tập phải là số dương.';
    }

    // Link or file or hlsUrl required
    const hasLink = currentEpisode.linkEpisode?.trim();
    const hasFile = selectedFile !== null;
    const hasHls = currentEpisode.hlsUrl;

    if (!hasLink && !hasFile && !hasHls) {
      errors.linkEpisode = 'Link tập phim hoặc file video là bắt buộc.';
    }

    // Validate file if provided
    if (selectedFile) {
      const validation = validateFile(selectedFile);
      if (!validation.valid) {
        errors.linkEpisode = validation.error;
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [currentEpisode, selectedFile, validateFile]);

  // ========================================================================
  // VIDEO UPLOAD WITH RETRY
  // ========================================================================
  const handleUploadVideo = async (episodeId, file) => {
    if (!file) return;

    const fileValidation = validateFile(file);
    if (!fileValidation.valid) {
      toast.error(fileValidation.error);
      return;
    }

    uploadManagerRef.current.initUpload(episodeId, file.size);

    const uploadWithRetry = async () => {
      const formData = new FormData();
      formData.append('video', file);
      formData.append('episodeId', episodeId);

      const upload = uploadManagerRef.current.getUpload(episodeId);
      const signal = upload?.abortController.signal;

      try {
        const res = await api.post('/episodes/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          signal,
          onUploadProgress: (progressEvent) => {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            uploadManagerRef.current.updateProgress(episodeId, progressEvent.loaded);

            setUploadStates(prev => ({
              ...prev,
              [episodeId]: { progress: percent, status: 'uploading' }
            }));
          },
        });

        uploadManagerRef.current.markCompleted(episodeId);
        setUploadStates(prev => ({
          ...prev,
          [episodeId]: { progress: 100, status: 'completed' }
        }));

        toast.success('Video đã được upload và đang xử lý!');

        // Initialize transcoding progress if jobId returned
        if (res.data.jobId) {
          setTranscodingProgress(prev => ({
            ...prev,
            [episodeId]: {
              stage: 'upload',
              progress: 100,
              message: 'Đang chờ xử lý...'
            }
          }));
        }

        return res;
      } catch (error) {
        // Abort error is expected when cancelling
        if (error.name === 'AbortError') {
          throw new Error('Upload bị hủy');
        }
        throw error;
      }
    };

    try {
      await retryWithBackoff(
        uploadWithRetry,
        episodeId,
        (attempt, maxAttempts, delay, error) => {
          console.warn(
            `Upload retry ${attempt}/${maxAttempts} in ${delay}ms for episode ${episodeId}:`,
            error.message
          );
          uploadManagerRef.current.incrementRetry(episodeId);

          setUploadStates(prev => ({
            ...prev,
            [episodeId]: {
              progress: 0,
              status: 'retrying',
              retryCount: attempt,
              nextRetryIn: delay
            }
          }));

          toast.info(`Thử lại upload (${attempt}/${maxAttempts})...`);
        }
      );

      // Batch refetch after successful upload
      scheduleBatchRefetch();
    } catch (error) {
      console.error('Upload failed:', error);
      uploadManagerRef.current.markFailed(episodeId, error);

      setUploadStates(prev => ({
        ...prev,
        [episodeId]: {
          progress: 0,
          status: 'failed',
          error: error.message
        }
      }));

      toast.error(`Upload thất bại: ${error.message}`);
    }
  };

  // ========================================================================
  // MANUAL RETRY UPLOAD
  // ========================================================================
  const handleRetryUpload = useCallback((episodeId) => {
    const upload = uploadManagerRef.current.getUpload(episodeId);
    if (!upload || !selectedFile) {
      toast.error('File không tìm thấy');
      return;
    }

    // Reset upload state
    uploadManagerRef.current.initUpload(episodeId, selectedFile.size);
    setUploadStates(prev => ({
      ...prev,
      [episodeId]: { progress: 0, status: 'pending' }
    }));

    handleUploadVideo(episodeId, selectedFile);
  }, [selectedFile]);

  // ========================================================================
  // ABORT UPLOAD
  // ========================================================================
  const handleAbortUpload = useCallback((episodeId) => {
    uploadManagerRef.current.abortUpload(episodeId);
    uploadManagerRef.current.clear(episodeId);

    setUploadStates(prev => {
      const newState = { ...prev };
      delete newState[episodeId];
      return newState;
    });

    toast.info('Upload bị hủy');
  }, []);

  // ========================================================================
  // CREATE/UPDATE EPISODE
  // ========================================================================
  const handleCreateOrUpdateEpisode = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      let episodeId = currentEpisode.id;

      // Create/Update episode record
      if (currentEpisode.id) {
        await episodeService.updateEpisode(currentEpisode.id, currentEpisode);
        toast.success('Thông tin tập phim đã được cập nhật!');
      } else {
        const res = await episodeService.createEpisode(
          currentEpisode.movieId,
          currentEpisode
        );
        episodeId = res.data.data.id;
        toast.success('Tập phim đã được tạo!');
      }

      // Handle video upload if file selected
      if (selectedFile && episodeId) {
        // Don't wait for upload to complete, let it process in background
        handleUploadVideo(episodeId, selectedFile);
      }

      setIsModalOpen(false);
      // Refetch to show new/updated episode
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Thao tác thất bại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ========================================================================
  // DELETE EPISODE
  // ========================================================================
  const handleDeleteEpisode = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa tập phim này không?')) {
      try {
        await episodeService.deleteEpisode(id);
        toast.success('Tập phim đã được xóa thành công!');
        refetch();
      } catch (err) {
        toast.error(err.response?.data?.message || 'Xóa tập phim thất bại.');
      }
    }
  };

  // ========================================================================
  // MODAL HANDLERS
  // ========================================================================
  const openCreateModal = useCallback(() => {
    setCurrentEpisode({
      id: null,
      movieId: '',
      episodeNumber: '',
      linkEpisode: '',
      duration: '',
      hlsUrl: '',
      status: 'pending'
    });
    setSelectedFile(null);
    setFormErrors({});
    setIsModalOpen(true);
  }, []);

  const openEditModal = useCallback((episode) => {
    setCurrentEpisode(episode);
    setSelectedFile(null);
    setFormErrors({});
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    // Clear states after modal closes
    setTimeout(() => {
      setSelectedFile(null);
      setFormErrors({});
    }, 300);
  }, []);

  // ========================================================================
  // HELPERS
  // ========================================================================
  const getMovieDefaultTitle = (titles) =>
    titles?.find(t => t.type === 'default')?.title || 'Không có tiêu đề';

  const getMovieTitleById = useCallback((movieId) => {
    const movie = movies.find(m => m.id === movieId);
    return movie ? getMovieDefaultTitle(movie.titles) : `Phim ID: ${movieId}`;
  }, [movies]);

  const handleSort = useCallback((field) => {
    const existingRule = queryParams.sortRules.find(rule => rule.field === field);
    setSortRules([{ field, order: existingRule?.order === 'asc' ? 'desc' : 'asc' }]);
  }, [queryParams.sortRules, setSortRules]);

  const getSortInfo = useCallback((field) => {
    const rule = queryParams.sortRules.find(r => r.field === field);
    return { isSorted: !!rule, direction: rule?.order };
  }, [queryParams.sortRules]);

  const getStatusBadge = (status) => {
    const badgeMap = {
      'ready': { class: 'badge-success', text: 'Ready' },
      'processing': { class: 'badge-warning', text: 'Processing' },
      'error': { class: 'badge-danger', text: 'Error' },
    };
    const badge = badgeMap[status] || { class: 'badge-secondary', text: 'Pending' };
    return <span className={`badge ${badge.class}`}>{badge.text}</span>;
  };

  const renderUploadProgress = (episodeId) => {
    const uploadState = uploadStates[episodeId];
    if (!uploadState) return null;

    const { progress, status, retryCount, error } = uploadState;

    if (status === 'failed' || status === 'retrying') {
      return (
        <div style={{ minWidth: '150px' }}>
          <div style={{ color: '#d32f2f', fontSize: '0.75rem', marginBottom: '4px' }}>
            {status === 'retrying' ? `Thử lại ${retryCount}...` : `Lỗi: ${error}`}
          </div>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              className="btn btn--small"
              onClick={() => handleRetryUpload(episodeId)}
              title="Thử lại upload"
            >
              <FaRedo size={10} /> Retry
            </button>
            <button
              className="btn btn--small"
              onClick={() => handleAbortUpload(episodeId)}
              title="Hủy upload"
            >
              Hủy
            </button>
          </div>
        </div>
      );
    }

    if (status === 'uploading' || status === 'completed') {
      return (
        <div style={{ minWidth: '120px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px' }}>
            <span>Upload: {status === 'uploading' ? 'Đang tải...' : 'Hoàn tất'}</span>
            <span>{progress}%</span>
          </div>
          <div style={{
            width: '100%',
            backgroundColor: '#e0e0e0',
            borderRadius: '4px',
            height: '6px',
            overflow: 'hidden'
          }}>
            <div
              style={{
                width: `${progress}%`,
                backgroundColor: status === 'completed' ? '#4caf50' : '#2196f3',
                height: '100%',
                transition: 'width 0.3s ease'
              }}
            />
          </div>
        </div>
      );
    }

    return null;
  };

  const renderTranscodingProgress = (episodeId) => {
    const progress = transcodingProgress[episodeId];
    if (!progress) return null;

    return (
      <div style={{ minWidth: '120px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px' }}>
          <span>{progress.message}</span>
          <span>{progress.progress}%</span>
        </div>
        <div style={{
          width: '100%',
          backgroundColor: '#e0e0e0',
          borderRadius: '4px',
          height: '6px',
          overflow: 'hidden'
        }}>
          <div
            style={{
              width: `${progress.progress}%`,
              backgroundColor: '#2196f3',
              height: '100%',
              transition: 'width 0.3s ease'
            }}
          />
        </div>
      </div>
    );
  };

  // ========================================================================
  // CLEANUP ON UNMOUNT
  // ========================================================================
  useEffect(() => {
    return () => {
      // Clear all timeouts
      Object.values(progressTimeoutsRef.current).forEach(id => clearTimeout(id));
      if (batchRefetchTimeoutRef.current) clearTimeout(batchRefetchTimeoutRef.current);

      // Cancel all ongoing uploads
      uploadManagerRef.current.clearAll();

      // Cancel debounced search
      if (debouncedSearchRef.current) {
        debouncedSearchRef.current.cancel();
      }
    };
  }, []);

  // ========================================================================
  // RENDER
  // ========================================================================
  if (isLoading && episodes.length === 0) {
    return <div className="admin-page__loading">Đang tải tập phim...</div>;
  }

  if (error) {
    return <div className="admin-page__error">Lỗi: {error.message}</div>;
  }

  const sortInfo = getSortInfo('episodeNumber');

  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <h1>Quản lý Tập phim</h1>
        <button className="btn btn-primary" onClick={openCreateModal}>
          <FaPlus /> Thêm Tập phim Mới
        </button>
      </div>

      <div className="admin-page__controls">
        <div className="admin-page__search">
          <input
            type="text"
            placeholder="Tìm theo số tập..."
            onChange={handleSearchChange}
          />
        </div>
        <div className="admin-page__limit-selector">
          <select
            value={queryParams.limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="form-select"
          >
            <option value="5">5 / trang</option>
            <option value="10">10 / trang</option>
            <option value="20">20 / trang</option>
          </select>
        </div>
      </div>

      <div className="admin-page__table-container">
        <table className="admin-page__table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Phim</th>
              <th
                className={classNames('sortable', {
                  'asc': sortInfo.direction === 'asc',
                  'desc': sortInfo.direction === 'desc'
                })}
                onClick={() => handleSort('episodeNumber')}
              >
                Số tập{' '}
                <i
                  className={classNames('sort-icon fas', {
                    'fa-sort-up': sortInfo.direction === 'asc',
                    'fa-sort-down': sortInfo.direction === 'desc',
                    'fa-sort': !sortInfo.isSorted
                  })}
                />
              </th>
              <th>Link / HLS</th>
              <th>Trang thái</th>
              <th>Thời lượng</th>
              <th>Lượt xem</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="8">Đang tải...</td>
              </tr>
            ) : episodes.length > 0 ? (
              episodes.map((episode) => (
                <tr key={episode.id}>
                  <td>{episode.id}</td>
                  <td>{getMovieTitleById(episode.movieId)}</td>
                  <td>{episode.episodeNumber}</td>
                  <td>
                    {episode.hlsUrl ? (
                      <span className="text-success" title={episode.hlsUrl}>
                        HLS Ready
                      </span>
                    ) : (
                      <a
                        href={episode.linkEpisode}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        External Link
                      </a>
                    )}
                  </td>
                  <td>
                    {renderUploadProgress(episode.id) ||
                      renderTranscodingProgress(episode.id) ||
                      getStatusBadge(episode.status)}
                  </td>
                  <td>{episode.duration || 'N/A'}</td>
                  <td>{episode.views}</td>
                  <td className="actions">
                    <button
                      className="btn btn--edit"
                      onClick={() => openEditModal(episode)}
                    >
                      <FaEdit /> Sửa
                    </button>
                    <button
                      className="btn btn--delete"
                      onClick={() => handleDeleteEpisode(episode.id)}
                    >
                      <FaTrash /> Xóa
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8">Không có tập phim nào.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {meta.totalPages > 1 && (
        <Pagination
          currentPage={meta.page}
          totalPages={meta.totalPages}
          onPageChange={setPage}
        />
      )}

      {isModalOpen && (
        <div className="admin-page__form-modal">
          <div className="admin-page__form-modal--content">
            <button
              className="admin-page__form-modal--close"
              onClick={closeModal}
            >
              &times;
            </button>
            <h2>
              {currentEpisode.id ? 'Chỉnh sửa Tập phim' : 'Thêm Tập phim Mới'}
            </h2>
            <form onSubmit={handleCreateOrUpdateEpisode}>
              <div className="form-group">
                <label htmlFor="movieId">Phim</label>
                <select
                  id="movieId"
                  name="movieId"
                  value={currentEpisode.movieId}
                  onChange={(e) =>
                    setCurrentEpisode({
                      ...currentEpisode,
                      movieId: e.target.value
                    })
                  }
                  required
                  disabled={!!currentEpisode.id}
                  className="form-select"
                >
                  <option value="">Chọn phim</option>
                  {movies.map(movie => (
                    <option key={movie.id} value={movie.id}>
                      {getMovieDefaultTitle(movie.titles)}
                    </option>
                  ))}
                </select>
                {formErrors.movieId && (
                  <p className="error-message">{formErrors.movieId}</p>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="episodeNumber">Số tập</label>
                <input
                  type="number"
                  id="episodeNumber"
                  name="episodeNumber"
                  value={currentEpisode.episodeNumber}
                  onChange={(e) =>
                    setCurrentEpisode({
                      ...currentEpisode,
                      episodeNumber: e.target.value
                    })
                  }
                  required
                  min="1"
                />
                {formErrors.episodeNumber && (
                  <p className="error-message">{formErrors.episodeNumber}</p>
                )}
              </div>

              <div className="form-group">
                <label>Upload Video (Thay thế Link)</label>
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                />
                {selectedFile && (
                  <p style={{ fontSize: '0.875rem', color: '#666', marginTop: '4px' }}>
                    File: {selectedFile.name} (
                    {(selectedFile.size / 1024 / 1024).toFixed(2)}MB)
                  </p>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="linkEpisode">
                  Link Tập phim (Dự phòng)
                </label>
                <input
                  type="text"
                  id="linkEpisode"
                  name="linkEpisode"
                  value={currentEpisode.linkEpisode}
                  onChange={(e) =>
                    setCurrentEpisode({
                      ...currentEpisode,
                      linkEpisode: e.target.value
                    })
                  }
                  placeholder="https://example.com/episode1.mp4"
                />
                {formErrors.linkEpisode && (
                  <p className="error-message">{formErrors.linkEpisode}</p>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="duration">
                  Thời lượng (ví dụ: 01:23:45)
                </label>
                <input
                  type="text"
                  id="duration"
                  name="duration"
                  value={currentEpisode.duration}
                  onChange={(e) =>
                    setCurrentEpisode({
                      ...currentEpisode,
                      duration: e.target.value
                    })
                  }
                  placeholder="hh:mm:ss hoặc mm:ss"
                />
              </div>

              <div className="form-actions">
                <button type="button" className="btn" onClick={closeModal}>
                  Hủy
                </button>
                <button
                  type="submit"
                  className="btn btn--submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Đang xử lý...' : 'Lưu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Episodes;