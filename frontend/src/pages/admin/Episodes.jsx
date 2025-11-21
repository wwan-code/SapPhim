import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import episodeService from '@/services/episodeService';
import movieService from '@/services/movieService';
import useTableData from '@/hooks/useTableData';
import Pagination from '@/components/common/Pagination';
import classNames from '@/utils/classNames';
import { FaEdit, FaTrash, FaPlus } from 'react-icons/fa';
import { debounce } from 'lodash';
import api from '@/services/api';
import { getSocket } from '@/socket/socketManager';

const Episodes = () => {
  // State cho modal form và dữ liệu liên quan
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentEpisode, setCurrentEpisode] = useState({ id: null, movieId: '', episodeNumber: '', linkEpisode: '', duration: '', hlsUrl: '', status: 'pending' });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [movies, setMovies] = useState([]);

  // Upload state
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [transcodingProgress, setTranscodingProgress] = useState({}); // { [episodeId]: { progress, stage, message } }

  // Sử dụng hook useTableData mới
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

  // Fetch movies cho form select (chỉ chạy 1 lần)
  useEffect(() => {
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

  // Helper functions để lấy tiêu đề phim
  const getMovieDefaultTitle = (titles) => titles?.find(t => t.type === 'default')?.title || 'Không có tiêu đề';
  const getMovieTitleById = useCallback((movieId) => {
    const movie = movies.find(m => m.id === movieId);
    return movie ? getMovieDefaultTitle(movie.titles) : `Phim ID: ${movieId}`;
  }, [movies]);

  // Xử lý sắp xếp
  const handleSort = (field) => {
    const existingRule = queryParams.sortRules.find(rule => rule.field === field);
    setSortRules([{ field, order: existingRule?.order === 'asc' ? 'desc' : 'asc' }]);
  };

  // Xử lý tìm kiếm (ví dụ tìm theo số tập)
  const debouncedSearch = debounce((value) => setFilters({ episodeNumber: value }), 300);
  const handleSearchChange = (e) => debouncedSearch(e.target.value);

  // Validate form
  const validateForm = useCallback(() => {
    const errors = {};
    if (!currentEpisode.movieId) errors.movieId = 'Phim là bắt buộc.';
    if (!currentEpisode.episodeNumber || currentEpisode.episodeNumber <= 0) errors.episodeNumber = 'Số tập phải là số dương.';
    // Link episode is not mandatory if uploading video
    if (!currentEpisode.linkEpisode.trim() && !selectedFile && !currentEpisode.hlsUrl) errors.linkEpisode = 'Link tập phim hoặc file video là bắt buộc.';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [currentEpisode, selectedFile]);

  // Socket.IO listeners for real-time progress
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleProgress = (data) => {
      const { episodeId, stage, progress, message } = data;

      setTranscodingProgress(prev => ({
        ...prev,
        [episodeId]: { stage, progress, message }
      }));

      if (stage === 'complete') {
        toast.success(`Xử lý video hoàn tất: Tập ${episodeId}`);
        refetch();
        // Clear progress after 3 seconds
        setTimeout(() => {
          setTranscodingProgress(prev => {
            const newState = { ...prev };
            delete newState[episodeId];
            return newState;
          });
        }, 3000);
      }
    };

    const handleError = (data) => {
      const { episodeId, message } = data;
      toast.error(message);
      setTranscodingProgress(prev => {
        const newState = { ...prev };
        delete newState[episodeId];
        return newState;
      });
      refetch();
    };

    socket.on('video:transcode:progress', handleProgress);
    socket.on('video:transcode:error', handleError);

    return () => {
      socket.off('video:transcode:progress', handleProgress);
      socket.off('video:transcode:error', handleError);
    };
  }, [refetch]);

  const handleUploadVideo = async (episodeId, file) => {
    setIsUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('video', file);
    formData.append('episodeId', episodeId);

    try {
      const res = await api.post('/episodes/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        },
      });

      toast.success('Video đã được upload và đang xử lý!');

      // Start polling if jobId is returned
      if (res.data.jobId) {
        // Initialize progress state
        setTranscodingProgress(prev => ({
          ...prev,
          [episodeId]: { stage: 'upload', progress: 100, message: 'Đang chờ xử lý...' }
        }));
      }

      refetch();
    } catch (error) {
      console.error(error);
      toast.error('Upload video thất bại.');
    } finally {
      setIsUploading(false);
    }
  };

  // Xử lý tạo/cập nhật
  const handleCreateOrUpdateEpisode = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      let episodeId = currentEpisode.id;

      // 1. Create/Update Episode record first
      if (currentEpisode.id) {
        await episodeService.updateEpisode(currentEpisode.id, currentEpisode);
        toast.success('Thông tin tập phim đã được cập nhật!');
      } else {
        const res = await episodeService.createEpisode(currentEpisode.movieId, currentEpisode);
        episodeId = res.data.data.id;
        toast.success('Tập phim đã được tạo!');
      }

      // 2. Handle Video Upload if file selected
      if (selectedFile && episodeId) {
        await handleUploadVideo(episodeId, selectedFile);
      }

      setIsModalOpen(false);
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Thao tác thất bại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Xử lý xóa
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

  // Mở modal
  const openCreateModal = () => {
    setCurrentEpisode({ id: null, movieId: '', episodeNumber: '', linkEpisode: '', duration: '', hlsUrl: '', status: 'pending' });
    setSelectedFile(null);
    setUploadProgress(0);
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (episode) => {
    setCurrentEpisode(episode);
    setSelectedFile(null);
    setUploadProgress(0);
    setFormErrors({});
    setIsModalOpen(true);
  };

  const getSortInfo = (field) => {
    const rule = queryParams.sortRules.find(r => r.field === field);
    return { isSorted: !!rule, direction: rule?.order };
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'ready': return <span className="badge badge-success">Ready</span>;
      case 'processing': return <span className="badge badge-warning">Processing</span>;
      case 'error': return <span className="badge badge-danger">Error</span>;
      default: return <span className="badge badge-secondary">Pending</span>;
    }
  };

  if (isLoading && episodes.length === 0) {
    return <div className="admin-page__loading">Đang tải tập phim...</div>;
  }

  if (error) {
    return <div className="admin-page__error">Lỗi: {error.message}</div>;
  }

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
          <select value={queryParams.limit} onChange={(e) => setLimit(Number(e.target.value))}
            className='form-select'
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
              <th className={classNames('sortable', { 'asc': getSortInfo('episodeNumber').direction === 'asc', 'desc': getSortInfo('episodeNumber').direction === 'desc' })} onClick={() => handleSort('episodeNumber')}>
                Số tập <i className={classNames('sort-icon fas', { 'fa-sort-up': getSortInfo('episodeNumber').direction === 'asc', 'fa-sort-down': getSortInfo('episodeNumber').direction === 'desc', 'fa-sort': !getSortInfo('episodeNumber').isSorted })}></i>
              </th>
              <th>Link / HLS</th>
              <th>Trạng thái</th>
              <th>Thời lượng</th>
              <th>Lượt xem</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan="8">Đang tải...</td></tr>
            ) : episodes.length > 0 ? (
              episodes.map((episode) => (
                <tr key={episode.id}>
                  <td>{episode.id}</td>
                  <td>{getMovieTitleById(episode.movieId)}</td>
                  <td>{episode.episodeNumber}</td>
                  <td>
                    {episode.hlsUrl ? (
                      <span className="text-success" title={episode.hlsUrl}>HLS Ready</span>
                    ) : (
                      <a href={episode.linkEpisode} target="_blank" rel="noopener noreferrer">External Link</a>
                    )}
                  </td>
                  <td>
                    {transcodingProgress[episode.id] ? (
                      <div style={{ minWidth: '120px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px' }}>
                          <span>{transcodingProgress[episode.id].message}</span>
                          <span>{transcodingProgress[episode.id].progress}%</span>
                        </div>
                        <div style={{ width: '100%', backgroundColor: '#e0e0e0', borderRadius: '4px', height: '6px' }}>
                          <div
                            style={{
                              width: `${transcodingProgress[episode.id].progress}%`,
                              backgroundColor: '#2196f3',
                              height: '100%',
                              borderRadius: '4px',
                              transition: 'width 0.3s ease'
                            }}
                          ></div>
                        </div>
                      </div>
                    ) : (
                      getStatusBadge(episode.status)
                    )}
                  </td>
                  <td>{episode.duration || 'N/A'}</td>
                  <td>{episode.views}</td>
                  <td className="actions">
                    <button className="btn btn--edit" onClick={() => openEditModal(episode)}><FaEdit /> Sửa</button>
                    <button className="btn btn--delete" onClick={() => handleDeleteEpisode(episode.id)}><FaTrash /> Xóa</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="8">Không có tập phim nào.</td></tr>
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
            <button className="admin-page__form-modal--close" onClick={() => setIsModalOpen(false)}>&times;</button>
            <h2>{currentEpisode.id ? 'Chỉnh sửa Tập phim' : 'Thêm Tập phim Mới'}</h2>
            <form onSubmit={handleCreateOrUpdateEpisode}>
              <div className="form-group">
                <label htmlFor="movieId">Phim</label>
                <select
                  id="movieId"
                  name="movieId"
                  value={currentEpisode.movieId}
                  onChange={(e) => setCurrentEpisode({ ...currentEpisode, movieId: e.target.value })}
                  required
                  disabled={!!currentEpisode.id}
                  className='form-select'
                >
                  <option value="">Chọn phim</option>
                  {movies.map(movie => (
                    <option key={movie.id} value={movie.id}>{getMovieDefaultTitle(movie.titles)}</option>
                  ))}
                </select>
                {formErrors.movieId && <p className="error-message">{formErrors.movieId}</p>}
              </div>
              <div className="form-group">
                <label htmlFor="episodeNumber">Số tập</label>
                <input
                  type="number"
                  id="episodeNumber"
                  name="episodeNumber"
                  value={currentEpisode.episodeNumber}
                  onChange={(e) => setCurrentEpisode({ ...currentEpisode, episodeNumber: e.target.value })}
                  required
                  min="1"
                />
                {formErrors.episodeNumber && <p className="error-message">{formErrors.episodeNumber}</p>}
              </div>

              <div className="form-group">
                <label>Upload Video (Thay thế Link)</label>
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => setSelectedFile(e.target.files[0])}
                />
                {isUploading && (
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${uploadProgress}%` }}>{uploadProgress}%</div>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="linkEpisode">Link Tập phim (Dự phòng)</label>
                <input
                  type="text"
                  id="linkEpisode"
                  name="linkEpisode"
                  value={currentEpisode.linkEpisode}
                  onChange={(e) => setCurrentEpisode({ ...currentEpisode, linkEpisode: e.target.value })}
                  placeholder="https://example.com/episode1.mp4"
                />
                {formErrors.linkEpisode && <p className="error-message">{formErrors.linkEpisode}</p>}
              </div>
              <div className="form-group">
                <label htmlFor="duration">Thời lượng (ví dụ: 01:23:45)</label>
                <input
                  type="text"
                  id="duration"
                  name="duration"
                  value={currentEpisode.duration}
                  onChange={(e) => setCurrentEpisode({ ...currentEpisode, duration: e.target.value })}
                  placeholder="hh:mm:ss hoặc mm:ss"
                />
              </div>
              <div className="form-actions">
                <button type="button" className="btn" onClick={() => setIsModalOpen(false)}>Hủy</button>
                <button type="submit" className="btn btn--submit" disabled={isSubmitting || isUploading}>
                  {isSubmitting || isUploading ? 'Đang xử lý...' : 'Lưu'}
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
