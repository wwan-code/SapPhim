import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import genreService from '@/services/genreService';
import movieService from '@/services/movieService';
import MovieCard from '@/components/MovieCard';
import MovieCardSkeleton from '@/components/skeletons/MovieCardSkeleton';
import { toast } from 'react-toastify';
import classNames from '@/utils/classNames';

const GenresPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // States
  const [allGenres, setAllGenres] = useState([]);
  const [genresLoading, setGenresLoading] = useState(true);
  const [movies, setMovies] = useState([]);
  const [moviesLoading, setMoviesLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [sortBy, setSortBy] = useState('updatedAt:desc');

  // Get selected genres from URL
  const selectedGenreSlugs = useMemo(() => {
    const genreParam = searchParams.get('genre');
    return genreParam ? genreParam.split(',').filter(Boolean) : [];
  }, [searchParams]);

  // Fetch all genres on mount
  useEffect(() => {
    const fetchGenres = async () => {
      setGenresLoading(true);
      try {
        const response = await genreService.getAllGenres();
        if (response.success) {
          setAllGenres(response.data);
        } else {
          toast.error('Không thể tải danh sách thể loại');
        }
      } catch (err) {
        console.error('Error fetching genres:', err);
        toast.error('Lỗi khi tải thể loại');
      } finally {
        setGenresLoading(false);
      }
    };

    fetchGenres();
  }, []);

  // Fetch movies based on selected genres (or random if none selected)
  const fetchMovies = useCallback(async (pageNum = 1) => {
    setMoviesLoading(true);
    setError(null);
    
    try {
      const params = {
        page: pageNum,
        limit: 18,
        sort: sortBy,
      };

      // If genres are selected, filter by them. Otherwise, get random movies
      if (selectedGenreSlugs.length > 0) {
        params.genre = selectedGenreSlugs.join(',');
      }

      const response = await movieService.getMovies(params);

      if (response.success) {
        if (pageNum === 1) {
          setMovies(response.data);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          setMovies(prev => [...prev, ...response.data]);
        }
        setTotalPages(response.meta.totalPages);
        setPage(pageNum);
      } else {
        toast.error(response.message || 'Lỗi khi tải phim');
        setError('Không thể tải phim');
      }
    } catch (err) {
      console.error('Error fetching movies:', err);
      setError('Không thể tải phim. Vui lòng thử lại sau.');
      toast.error('Lỗi khi tải phim');
    } finally {
      setMoviesLoading(false);
    }
  }, [selectedGenreSlugs, sortBy]);

  // Fetch movies when selected genres or sort changes
  useEffect(() => {
    fetchMovies(1);
  }, [fetchMovies]);

  // SEO
  useEffect(() => {
    document.title = selectedGenreSlugs.length > 0 
      ? `Phim ${selectedGenreSlugs.join(', ')} - Sạp Phim` 
      : 'Thể loại phim - Sạp Phim';
    
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      document.head.appendChild(metaDescription);
    }
    metaDescription.setAttribute('content', 'Khám phá phim theo thể loại yêu thích trên Sạp Phim.');
  }, [selectedGenreSlugs]);

  // Filter genres by search query
  const filteredGenres = useMemo(() => {
    if (!searchQuery.trim()) return allGenres;
    return allGenres.filter(genre =>
      genre.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [allGenres, searchQuery]);

  // Handle genre selection
  const handleGenreToggle = (slug) => {
    const newSelected = selectedGenreSlugs.includes(slug)
      ? selectedGenreSlugs.filter(s => s !== slug)
      : [...selectedGenreSlugs, slug];
    
    if (newSelected.length > 0) {
      setSearchParams({ genre: newSelected.join(',') });
    } else {
      setSearchParams({});
    }
  };

  // Handle clear all genres
  const handleClearAll = () => {
    setSearchParams({});
    setSearchQuery('');
  };

  // Handle load more
  const handleLoadMore = () => {
    if (page < totalPages && !moviesLoading) {
      fetchMovies(page + 1);
    }
  };

  // Handle sort change
  const handleSortChange = (e) => {
    setSortBy(e.target.value);
  };

  // Render genre chips
  const renderGenreChips = () => {
    if (genresLoading) {
      return (
        <div className="genres-page__chips-loading">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="genres-page__chip genres-page__chip--loading"></div>
          ))}
        </div>
      );
    }

    if (filteredGenres.length === 0) {
      return (
        <div className="genres-page__empty-search">
          <i className="fa-solid fa-search"></i>
          <p>Không tìm thấy thể loại nào phù hợp</p>
        </div>
      );
    }

    return (
      <div className="genres-page__chips">
        {filteredGenres.map((genre) => (
          <button
            key={genre.id}
            onClick={() => handleGenreToggle(genre.slug)}
            className={classNames('genres-page__chip', {
              'genres-page__chip--active': selectedGenreSlugs.includes(genre.slug),
            })}
          >
            <span className="genres-page__chip-text">{genre.title}</span>
            {selectedGenreSlugs.includes(genre.slug) && (
              <i className="fa-solid fa-check genres-page__chip-icon"></i>
            )}
          </button>
        ))}
      </div>
    );
  };

  // Render movie grid
  const renderMovieGrid = () => {
    if (error) {
      return (
        <div className="genres-page__error">
          <i className="fa-solid fa-exclamation-triangle"></i>
          <h3>Đã xảy ra lỗi</h3>
          <p>{error}</p>
          <button onClick={() => fetchMovies(1)} className="btn btn-primary">
            Thử lại
          </button>
        </div>
      );
    }

    if (movies.length === 0 && !moviesLoading) {
      return (
        <div className="genres-page__empty">
          <i className="fa-solid fa-folder-open"></i>
          <h3>Chưa có phim nào</h3>
          <p>
            {selectedGenreSlugs.length > 0 
              ? 'Không tìm thấy phim nào cho thể loại đã chọn' 
              : 'Không có phim nào trong hệ thống'}
          </p>
          {selectedGenreSlugs.length > 0 && (
            <button onClick={handleClearAll} className="btn btn-primary">
              Xóa bộ lọc
            </button>
          )}
        </div>
      );
    }

    return (
      <>
        <div className="section-list section-list__multi">
          {movies.map((movie) => (
            <div key={movie.id} className="section-list__item">
              <MovieCard movie={movie} />
            </div>
          ))}
          {moviesLoading && Array.from({ length: 6 }).map((_, i) => (
            <div key={`skeleton-${i}`} className="section-list__item">
              <MovieCardSkeleton />
            </div>
          ))}
        </div>

        {/* Pagination */}
        {page < totalPages && !moviesLoading && (
          <div className="genres-page__pagination">
            <button onClick={handleLoadMore} className="btn btn-primary">
              <i className="fa-solid fa-plus"></i>
              Xem thêm
            </button>
          </div>
        )}

        {moviesLoading && page > 1 && (
          <div className="genres-page__loading-more">
            <i className="fa-solid fa-spinner fa-spin"></i>
            <span>Đang tải...</span>
          </div>
        )}
      </>
    );
  };

  return (
    <div className="genres-page">
      {/* Mobile Filter Toggle */}
      <button
        className="genres-page__filter-toggle"
        onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
        aria-label="Toggle filter"
      >
        <i className="fa-solid fa-filter"></i>
        <span>Lọc thể loại</span>
        {selectedGenreSlugs.length > 0 && (
          <span className="genres-page__filter-badge">{selectedGenreSlugs.length}</span>
        )}
      </button>

      <div className="genres-page__layout">
        {/* Sidebar */}
        <aside
          className={classNames('genres-page__sidebar', {
            'genres-page__sidebar--open': isMobileFilterOpen,
          })}
        >
          <div className="genres-page__sidebar-header">
            <h2 className="genres-page__sidebar-title">
              <i className="fa-solid fa-film"></i>
              Thể loại
            </h2>
            <button
              className="genres-page__sidebar-close"
              onClick={() => setIsMobileFilterOpen(false)}
              aria-label="Close filter"
            >
              <i className="fa-solid fa-times"></i>
            </button>
          </div>

          {/* Search */}
          <div className="genres-page__search">
            <input
              type="text"
              placeholder="Tìm kiếm thể loại..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="genres-page__search-input"
            />
            <i className="fa-solid fa-search genres-page__search-icon"></i>
          </div>

          {/* Selected count & Clear */}
          {selectedGenreSlugs.length > 0 && (
            <div className="genres-page__selected-info">
              <span className="genres-page__selected-count">
                Đã chọn: {selectedGenreSlugs.length}
              </span>
              <button
                onClick={handleClearAll}
                className="genres-page__clear-btn"
              >
                <i className="fa-solid fa-times"></i>
                Xóa tất cả
              </button>
            </div>
          )}

          {/* Genre chips */}
          {renderGenreChips()}
        </aside>

        {/* Backdrop for mobile */}
        {isMobileFilterOpen && (
          <div
            className="genres-page__backdrop"
            onClick={() => setIsMobileFilterOpen(false)}
          ></div>
        )}

        {/* Main content */}
        <main className="genres-page__content">
          {/* Header */}
          <div className="genres-page__header">
            <div className="genres-page__header-text">
              <h1 className="genres-page__title">
                {selectedGenreSlugs.length > 0
                  ? `Phim ${selectedGenreSlugs.slice(0, 3).join(', ')}${selectedGenreSlugs.length > 3 ? '...' : ''}`
                  : 'Khám phá phim theo thể loại'}
              </h1>
              <p className="genres-page__subtitle">
                {selectedGenreSlugs.length > 0
                  ? `Tìm thấy ${movies.length > 0 ? `${movies.length} phim` : 'kết quả'}`
                  : 'Tất cả các phim'}
              </p>
            </div>

            {/* Sort dropdown - Always show */}
            <div className="genres-page__sort">
              <label htmlFor="sort-select" className="genres-page__sort-label">
                <i className="fa-solid fa-sort"></i>
                Sắp xếp:
              </label>
              <select
                id="sort-select"
                value={sortBy}
                onChange={handleSortChange}
                className="genres-page__sort-select"
              >
                <option value="updatedAt:desc">Mới cập nhật</option>
                <option value="views:desc">Xem nhiều nhất</option>
                <option value="releaseDate:desc">Mới phát hành</option>
                <option value="createdAt:desc">Mới thêm</option>
              </select>
            </div>
          </div>

          {/* Movies grid */}
          <div className="genres-page__movies">
            {renderMovieGrid()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default GenresPage;
