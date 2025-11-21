import React, { useState, useEffect, useCallback, useMemo, useRef, memo } from 'react';
import { useSelector } from 'react-redux';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import { FaPlay, FaClock, FaInfoCircle, FaHeart } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import movieService from '@/services/movieService';
import favoriteService from '@/services/favoriteService';
import HeroMovieSkeleton from './skeletons/HeroMovieSkeleton';
import CustomOverlayTrigger from './CustomTooltip/CustomOverlayTrigger';
import classNames from '@/utils/classNames';
import { debounce, rafThrottle } from '@/utils/performanceUtils';

import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/effect-coverflow';

// Memoized Card Component to prevent unnecessary re-renders
const MovieCard = memo(({ movie, index, isActive, onClick, getMovieTitle, getPosterUrl }) => {
  const imgRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isLoaded) {
            const imgElement = entry.target;
            imgElement.src = imgElement.dataset.src;
            imgElement.onload = () => setIsLoaded(true);
            observer.unobserve(imgElement);
          }
        });
      },
      { rootMargin: '50px' }
    );

    observer.observe(img);
    return () => observer.disconnect();
  }, [isLoaded]);

  return (
    <div
      className={classNames('hero-movie__card', {
        'hero-movie__card--active': isActive
      })}
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label={`Chọn phim ${getMovieTitle(movie)}`}
      onKeyPress={(e) => {
        if (e.key === 'Enter') onClick();
      }}
    >
      <div className="hero-movie__card-poster">
        <img
          ref={imgRef}
          data-src={getPosterUrl(movie)}
          alt={getMovieTitle(movie)}
          className={classNames('hero-movie__card-image', { 'loaded': isLoaded })}
          loading="lazy"
        />
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  return prevProps.isActive === nextProps.isActive && 
         prevProps.movie.uuid === nextProps.movie.uuid;
});

MovieCard.displayName = 'MovieCard';

const HeroMovie = () => {
  const { user: currentUser } = useSelector((state) => state.auth);
  
  // States
  const [trendingMovies, setTrendingMovies] = useState([]);
  const [currentMovie, setCurrentMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [loadingFavorite, setLoadingFavorite] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  // Refs
  const swiperRef = useRef(null);
  const imagePreloadRef = useRef(null);
  const favoriteAbortControllerRef = useRef(null);

  // Utility functions (stable references) - Định nghĩa trước để dùng trong effects
  const serverUrl = import.meta.env.VITE_SERVER_URL;

  const getMovieTitle = useCallback((movie) => {
    if (!movie?.titles) return 'Unknown Title';
    const defaultTitle = movie.titles.find(t => t.type === 'default');
    return defaultTitle?.title || movie.titles[0]?.title || 'Unknown Title';
  }, []);

  const getCoverUrl = useCallback((movie) => {
    if (!movie?.image?.coverUrl) {
      return 'https://placehold.co/1920x1080?text=No+Cover';
    }
    return `${serverUrl}${movie.image.coverUrl}`;
  }, [serverUrl]);

  const getPosterUrl = useCallback((movie) => {
    if (!movie?.image?.posterUrl) {
      return 'https://placehold.co/300x450?text=No+Poster';
    }
    return `${serverUrl}${movie.image.posterUrl}`;
  }, [serverUrl]);

  // Check favorite status with debounce and abort controller
  useEffect(() => {
    if (!currentMovie?.id || !currentUser) {
      setLoadingFavorite(false);
      return;
    }

    // Cancel previous request
    if (favoriteAbortControllerRef.current) {
      favoriteAbortControllerRef.current.abort();
    }

    favoriteAbortControllerRef.current = new AbortController();
    const signal = favoriteAbortControllerRef.current.signal;

    const fetchFavoriteStatus = async () => {
      setLoadingFavorite(true);
      try {
        const response = await favoriteService.check(currentMovie.id);
        if (!signal.aborted && response.success) {
          setIsFavorite(response.data.isFavorite);
        }
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Error checking favorite status:', error);
        }
      } finally {
        if (!signal.aborted) {
          setLoadingFavorite(false);
        }
      }
    };

    const timeoutId = setTimeout(fetchFavoriteStatus, 150);

    return () => {
      clearTimeout(timeoutId);
      if (favoriteAbortControllerRef.current) {
        favoriteAbortControllerRef.current.abort();
      }
    };
  }, [currentMovie?.id, currentUser]);

  // Fetch trending movies
  useEffect(() => {
    const fetchTrendingMovies = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await movieService.getTrendingMovies({ limit: 5 });
        
        if (response.success && Array.isArray(response.data)) {
          setTrendingMovies(response.data);
          if (response.data.length > 0) {
            setCurrentMovie(response.data[0]);
            setActiveSlideIndex(0);
          }
        }
      } catch (error) {
        console.error('Error fetching trending movies:', error);
        setError(error.message || 'Không thể tải danh sách phim trending');
      } finally {
        setLoading(false);
      }
    };

    fetchTrendingMovies();
  }, []);

  // Handle image load with preloading
  useEffect(() => {
    if (!currentMovie) return;

    setImageLoaded(false);
    
    // Cancel previous preload
    if (imagePreloadRef.current) {
      imagePreloadRef.current.onload = null;
      imagePreloadRef.current.onerror = null;
    }

    const img = new Image();
    img.decoding = 'async';
    img.loading = 'eager';
    const coverUrl = getCoverUrl(currentMovie);
    
    img.onload = () => {
      setImageLoaded(true);
      imagePreloadRef.current = null;
    };
    
    img.onerror = () => {
      setImageLoaded(true); // Show anyway to prevent infinite loading
      imagePreloadRef.current = null;
    };
    
    img.src = coverUrl;
    imagePreloadRef.current = img;

    return () => {
      if (imagePreloadRef.current) {
        imagePreloadRef.current.onload = null;
        imagePreloadRef.current.onerror = null;
      }
    };
  }, [currentMovie, getCoverUrl]);

  // Handlers with performance optimizations
  const handleSlideChange = useCallback(
    rafThrottle((swiper) => {
      const activeIndex = swiper.activeIndex;
      if (trendingMovies[activeIndex]) {
        setActiveSlideIndex(activeIndex);
        setCurrentMovie(trendingMovies[activeIndex]);
      }
    }),
    [trendingMovies]
  );

  const handleSlideClick = useCallback((movie, index) => {
    setActiveSlideIndex(index);
    setCurrentMovie(movie);
    if (swiperRef.current) {
      swiperRef.current.slideTo(index, 300);
    }
  }, []);

  const handleFavoriteToggle = useCallback(async () => {
    if (!currentUser) {
      toast.error("Vui lòng đăng nhập để thực hiện thao tác này.");
      return;
    }

    if (!currentMovie?.id) return;

    const originalIsFavorite = isFavorite;
    setIsFavorite(!originalIsFavorite);

    try {
      const response = originalIsFavorite 
        ? await favoriteService.remove(currentMovie.id)
        : await favoriteService.add(currentMovie.id);
      
      toast.success(response.message);
    } catch (error) {
      setIsFavorite(originalIsFavorite);
      toast.error(
        error.response?.data?.message || 
        "Đã xảy ra lỗi khi thay đổi trạng thái yêu thích."
      );
    }
  }, [currentUser, currentMovie?.id, isFavorite]);

  const handlePlayNow = useCallback(() => {
    if (currentMovie?.uuid) {
      window.location.href = `/watch/${currentMovie.uuid}/episode/1`;
    }
  }, [currentMovie?.uuid]);

  // Other utility functions
  const formatDuration = useCallback((duration) => {
    return duration || 'N/A';
  }, []);

  const getIMDbRating = useCallback((movie) => {
    return movie?.imdb || 'N/A';
  }, []);

  const getClassification = useCallback((movie) => {
    return movie?.classification || 'N/A';
  }, []);

  const getDescription = useCallback((movie) => {
    if (!movie?.description) return 'Chưa có mô tả cho phim này.';
    return movie.description;
  }, []);

  const getGenres = useCallback((movie) => {
    if (!movie?.genres || !Array.isArray(movie.genres)) return [];
    return movie.genres.map(genre => genre.title);
  }, []);

  // Memoized values
  const genresList = useMemo(() => getGenres(currentMovie), [currentMovie, getGenres]);
  const movieTitle = useMemo(() => getMovieTitle(currentMovie), [currentMovie, getMovieTitle]);
  const coverUrl = useMemo(() => getCoverUrl(currentMovie), [currentMovie, getCoverUrl]);

  // Render states
  if (loading) {
    return <HeroMovieSkeleton />;
  }

  if (error) {
    return (
      <div className="hero-movie">
        <div className="hero-movie__background hero-movie__background--error">
          <div className="container">
            <div className="hero-movie__error">
              <h2>Lỗi tải phim</h2>
              <p>{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!currentMovie) {
    return (
      <div className="hero-movie">
        <div className="hero-movie__background hero-movie__background--empty">
          <div className="container">
            <div className="hero-movie__error">
              <h2>Không có phim trending</h2>
              <p>Vui lòng thử lại sau.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="hero-movie">
      {/* Background Layer */}
      <div className="hero-movie__background">
        <div
          className={classNames('hero-movie__background-image', {
            'loaded': imageLoaded
          })}
          style={{ backgroundImage: `url(${coverUrl})` }}
          aria-hidden="true"
        />
        <div className="hero-movie__cover-fade">
          <div
            className="hero-movie__cover-image"
            style={{ backgroundImage: `url(${coverUrl})` }}
            aria-hidden="true"
          />
        </div>
      </div>

      {/* Content Layer */}
      <div className="hero-movie__content">
        {/* Left Section - Movie Info */}
        <div className="hero-movie__left">
          <div className="hero-movie__info" key={currentMovie.uuid}>
            {/* Title */}
            <h1 className="hero-movie__title texture-text">
              {movieTitle}
            </h1>

            {/* Meta Information */}
            <div className="hero-movie__meta">
              <div className="hero-movie__classification">
                {getClassification(currentMovie)}
              </div>

              <div className="hero-movie__imdb">
                <span className="hero-movie__imdb-text">
                  {getIMDbRating(currentMovie)}
                </span>
              </div>

              <div className="hero-movie__duration">
                <FaClock className="hero-movie__duration-icon" />
                <span className="hero-movie__duration-text">
                  {formatDuration(currentMovie.duration)}
                </span>
              </div>
            </div>

            {/* Description */}
            <p className="hero-movie__description">
              {getDescription(currentMovie)}
            </p>

            {/* Details */}
            {genresList.length > 0 && (
              <div className="hero-movie__details">
                <div className="hero-movie__genres">
                  <span className="hero-movie__genres-label">Thể loại:</span>
                  <span className="hero-movie__genres-list">
                    {genresList.join(', ')}
                  </span>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="hero-movie__touch">
              <button
                className="hero-movie__play-btn"
                onClick={handlePlayNow}
                aria-label="Phát ngay"
              >
                <FaPlay className="hero-movie__play-icon" />
              </button>

              <div className="hero-movie__touch-group">
                <CustomOverlayTrigger
                  placement="top"
                  tooltipId="tooltip-favorite"
                  tooltip={isFavorite ? 'Bỏ yêu thích' : 'Yêu thích'}
                >
                  <button
                    className={classNames('touch-btn', {
                      'active': isFavorite,
                      'disabled': !currentUser || loadingFavorite
                    })}
                    onClick={handleFavoriteToggle}
                    disabled={!currentUser || loadingFavorite}
                    aria-label={isFavorite ? 'Bỏ yêu thích' : 'Thêm vào yêu thích'}
                  >
                    {loadingFavorite ? (
                      <i className="fas fa-spinner fa-spin" />
                    ) : (
                      <FaHeart />
                    )}
                  </button>
                </CustomOverlayTrigger>

                <CustomOverlayTrigger
                  placement="top"
                  tooltipId="tooltip-info"
                  tooltip="Chi tiết"
                >
                  <Link
                    className="touch-btn"
                    to={`/movie/${currentMovie.slug}`}
                    aria-label="Xem chi tiết phim"
                  >
                    <FaInfoCircle />
                  </Link>
                </CustomOverlayTrigger>
              </div>
            </div>
          </div>
        </div>

        {/* Right Section - Carousel */}
        <div className="hero-movie__right">
          <div className="hero-movie__carousel">
            <Swiper
              onSwiper={(swiper) => { swiperRef.current = swiper; }}
              onSlideChange={handleSlideChange}
              modules={[Navigation]}
              spaceBetween={16}
              slidesPerView="auto"
              speed={300}
              preventInteractionOnTransition
              touchRatio={1.2}
              resistance={true}
              resistanceRatio={0.85}
              breakpoints={{
                320: {
                  slidesPerView: 4.5,
                  spaceBetween: 12,
                },
                576: {
                  slidesPerView: 5.5,
                  spaceBetween: 12,
                },
                768: {
                  slidesPerView: 6.5,
                  spaceBetween: 14,
                },
                992: {
                  slidesPerView: 3.2,
                  spaceBetween: 16,
                },
                1200: {
                  slidesPerView: 3.2,
                  spaceBetween: 16,
                },
                1400: {
                  slidesPerView: 3.5,
                  spaceBetween: 16,
                }
              }}
              centeredSlides={false}
              initialSlide={activeSlideIndex}
              watchSlidesProgress={false}
              className="hero-movie__swiper"
            >
              {trendingMovies.map((movie, index) => (
                <SwiperSlide
                  key={movie.uuid}
                  className={classNames('hero-movie__slide', {
                    'hero-movie__slide--active': activeSlideIndex === index
                  })}
                >
                  <MovieCard
                    movie={movie}
                    index={index}
                    isActive={activeSlideIndex === index}
                    onClick={() => handleSlideClick(movie, index)}
                    getMovieTitle={getMovieTitle}
                    getPosterUrl={getPosterUrl}
                  />
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(HeroMovie);