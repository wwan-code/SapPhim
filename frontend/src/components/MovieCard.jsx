import React, { useState, useRef, useEffect, useMemo, memo } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import classNames from '@/utils/classNames';
import { ObserverManager } from '@/utils/performanceUtils';

// Placeholder image với gradient
const PLACEHOLDER_GRADIENT = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 450"%3E%3Cdefs%3E%3ClinearGradient id="g" x1="0%25" y1="0%25" x2="100%25" y2="100%25"%3E%3Cstop offset="0%25" style="stop-color:%23667eea;stop-opacity:0.3"%2F%3E%3Cstop offset="100%25" style="stop-color:%23764ba2;stop-opacity:0.3"%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Crect width="300" height="450" fill="url(%23g)"%2F%3E%3C%2Fsvg%3E';

// Shared IntersectionObserver instance
let sharedObserver = null;
const getSharedObserver = () => {
  if (!sharedObserver && typeof window !== 'undefined' && 'IntersectionObserver' in window) {
    sharedObserver = new ObserverManager(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target;
            const dataSrc = img.getAttribute('data-src');
            if (dataSrc) {
              img.src = dataSrc;
              img.removeAttribute('data-src');
            }
          }
        });
      },
      {
        rootMargin: '50px 0px',
        threshold: 0.01,
      }
    );
  }
  return sharedObserver;
};

const MovieCard = ({ movie, isMini = false, isHorizontal = false, priority = false, onImageLoad, onImageError }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const imgRef = useRef(null);
  const cardRef = useRef(null);

  // Static ref for mobile hover management
  // eslint-disable-next-line no-underscore-dangle
  if (!window._activeMovieCardTouch) window._activeMovieCardTouch = null;

  // Memoize computed values
  const { defaultTitle, imageUrl, fallbackUrl } = useMemo(() => {
    if (!movie) return { defaultTitle: 'Untitled', imageUrl: '', fallbackUrl: PLACEHOLDER_GRADIENT };

    const title = movie.titles?.find(t => t.type === 'default')?.title || 'Untitled';
    const serverUrl = import.meta.env.VITE_SERVER_URL || '';
    
    let url = '';
    if (isHorizontal && movie.image?.bannerUrl) {
      url = `${serverUrl}${movie.image.bannerUrl}`;
    } else if (movie.image?.posterUrl) {
      url = `${serverUrl}${movie.image.posterUrl}`;
    }

    return {
      defaultTitle: title,
      imageUrl: url,
      fallbackUrl: PLACEHOLDER_GRADIENT,
    };
  }, [movie, isHorizontal]);

  // IntersectionObserver for lazy loading
  useEffect(() => {
    const img = imgRef.current;
    if (!img || priority || !imageUrl) return;

    const observer = getSharedObserver();
    if (observer) {
      observer.observe(img);
      return () => observer.unobserve(img);
    } else {
      // Fallback: load immediately if IntersectionObserver not supported
      if (img.getAttribute('data-src')) {
        img.src = img.getAttribute('data-src');
        img.removeAttribute('data-src');
      }
    }
  }, [imageUrl, priority]);

  // Handle image load
  const handleImageLoad = (e) => {
    setImageLoaded(true);
    setImageError(false);
    onImageLoad?.();
  };

  // Handle image error
  const handleImageError = (e) => {
    setImageError(true);
    setImageLoaded(false);
    e.target.src = fallbackUrl;
    onImageError?.(e);
  };

  // Touch/hover handlers for better mobile UX
  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => setIsHovered(false);
  const handleTouchStart = (e) => {
    // Only run on touch devices
    if (window._activeMovieCardTouch && window._activeMovieCardTouch !== setIsHovered) {
      window._activeMovieCardTouch(false);
    }
    setIsHovered(true);
    window._activeMovieCardTouch = setIsHovered;
  };

  const handleTouchEnd = () => {
    setIsHovered(false);
    if (window._activeMovieCardTouch === setIsHovered) {
      window._activeMovieCardTouch = null;
    }
  };

  const handleTouchCancel = () => {
    setIsHovered(false);
    if (window._activeMovieCardTouch === setIsHovered) {
      window._activeMovieCardTouch = null;
    }
  };

  if (!movie) {
    return null;
  }

  const cardClasses = classNames('movie-card', {
    'movie-card--mini': isMini,
    'movie-card--horizontal': isHorizontal,
    'movie-card--loaded': imageLoaded,
    'movie-card--error': imageError,
    'movie-card--hovered': isHovered,
  });

  return (
    <Link
      to={`/movie/${movie.slug}`}
      className={cardClasses}
      ref={cardRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
      aria-label={`Watch ${defaultTitle}`}
    >
      <div className="movie-card__cover-wrap">
        {/* Progressive image loading */}
        <img
          ref={imgRef}
          src={priority ? imageUrl : fallbackUrl}
          data-src={priority ? undefined : imageUrl}
          alt={defaultTitle}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          onLoad={handleImageLoad}
          onError={handleImageError}
          className={classNames('movie-card__image', {
            'movie-card__image--loaded': imageLoaded,
          })}
        />
        
        {/* Loading shimmer overlay */}
        {!imageLoaded && !imageError && (
          <div className="movie-card__loading" aria-hidden="true" />
        )}

        {/* Play button overlay */}
        <div className="movie-card__overlay" aria-hidden="true">
          <div className="movie-card__play-button">
            <i className="fas fa-play"></i>
          </div>
        </div>

        {/* Quality badge */}
        {movie.quality && (
          <span className="movie-card__quality-badge" aria-label={`Quality: ${movie.quality}`}>
            {movie.quality}
          </span>
        )}
      </div>

      <div className="movie-card__info">
        <h3 className="movie-card__title" title={defaultTitle}>
          {defaultTitle}
        </h3>
        <div className="movie-card__meta">
          {movie.year && (
            <span className="movie-card__year" aria-label={`Year: ${movie.year}`}>
              {movie.year}
            </span>
          )}
          {movie.category?.name && (
            <span className="movie-card__category" aria-label={`Category: ${movie.category.name}`}>
              {movie.category.name}
            </span>
          )}
          {movie.viewCount !== undefined && (
            <span className="movie-card__views" aria-label={`${movie.viewCount} views`}>
              <i className="fas fa-eye" aria-hidden="true"></i> {formatViews(movie.viewCount)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
};

// Helper function to format view counts
const formatViews = (count) => {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  } else if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count;
};

MovieCard.propTypes = {
  movie: PropTypes.shape({
    slug: PropTypes.string.isRequired,
    titles: PropTypes.arrayOf(
      PropTypes.shape({
        type: PropTypes.string,
        title: PropTypes.string,
      })
    ),
    image: PropTypes.shape({
      posterUrl: PropTypes.string,
      bannerUrl: PropTypes.string,
    }),
    year: PropTypes.number,
    quality: PropTypes.string,
    category: PropTypes.shape({
      name: PropTypes.string,
    }),
    viewCount: PropTypes.number,
  }).isRequired,
  isMini: PropTypes.bool,
  isHorizontal: PropTypes.bool,
  priority: PropTypes.bool,
  onImageLoad: PropTypes.func,
  onImageError: PropTypes.func,
};

export default memo(MovieCard);