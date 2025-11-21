import React, { memo } from 'react';
import PropTypes from 'prop-types';
import MovieCard from './MovieCard';
import MovieCardSkeleton from './skeletons/MovieCardSkeleton';
import classNames from '@/utils/classNames';
import { useMovieCardOptimization, useImageLoadTracking } from '@/hooks/useMovieCardOptimization';

/**
 * Optimized grid component for MovieCard rendering
 * Features:
 * - Virtual scrolling support
 * - Staggered skeleton loading
 * - Image load tracking
 * - Responsive grid layout
 */
const MovieCardGrid = ({
  movies,
  isLoading = false,
  skeletonCount = 12,
  gridColumns = { xs: 2, sm: 3, md: 4, lg: 5, xl: 6 },
  enableVirtualization = false,
  isMini = false,
  isHorizontal = false,
  className = '',
  onMovieClick,
}) => {
  const { 
    containerRef, 
    shouldRenderItem, 
    getSkeletonDelay, 
    getImagePriority 
  } = useMovieCardOptimization({
    enableVirtualization,
    itemHeight: isMini ? 120 : 300,
  });

  const { stats, trackImageLoad, trackImageError } = useImageLoadTracking();

  // Generate grid class based on column configuration
  const gridClass = classNames(
    'movie-card-grid',
    {
      'movie-card-grid--mini': isMini,
      'movie-card-grid--horizontal': isHorizontal,
    },
    className
  );

  // Render skeleton loaders
  const renderSkeletons = () => {
    return Array.from({ length: skeletonCount }).map((_, index) => (
      <MovieCardSkeleton
        key={`skeleton-${index}`}
        isMini={isMini}
        isHorizontal={isHorizontal}
        delay={getSkeletonDelay(index)}
      />
    ));
  };

  // Render movie cards with optimization
  const renderMovies = () => {
    if (!movies || movies.length === 0) {
      return (
        <div className="movie-card-grid__empty">
          <i className="fas fa-film" aria-hidden="true"></i>
          <p>No movies found</p>
        </div>
      );
    }

    return movies.map((movie, index) => {
      // Virtual scrolling optimization
      if (!shouldRenderItem(index)) {
        return (
          <div
            key={movie.id || movie.slug}
            className="movie-card-grid__placeholder"
            style={{ height: isMini ? 120 : 300 }}
            aria-hidden="true"
          />
        );
      }

      return (
        <MovieCard
          key={movie.id || movie.slug}
          movie={movie}
          isMini={isMini}
          isHorizontal={isHorizontal}
          priority={getImagePriority(index)}
          onImageLoad={() => trackImageLoad(Date.now())}
          onImageError={trackImageError}
          onClick={onMovieClick}
        />
      );
    });
  };

  return (
    <div
      ref={containerRef}
      className={gridClass}
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(auto-fill, minmax(${isMini ? '280px' : '180px'}, 1fr))`,
        gap: 'var(--w-spacing-lg)',
      }}
    >
      {isLoading ? renderSkeletons() : renderMovies()}

      {/* Performance stats (dev only) */}
      {process.env.NODE_ENV === 'development' && stats.totalImages > 0 && (
        <div className="movie-card-grid__stats" style={{ gridColumn: '1 / -1' }}>
          <small>
            Images: {stats.loadedImages}/{stats.totalImages} | 
            Failed: {stats.failedImages} | 
            Avg Load: {stats.averageLoadTime.toFixed(0)}ms
          </small>
        </div>
      )}
    </div>
  );
};

MovieCardGrid.propTypes = {
  movies: PropTypes.arrayOf(PropTypes.object),
  isLoading: PropTypes.bool,
  skeletonCount: PropTypes.number,
  gridColumns: PropTypes.object,
  enableVirtualization: PropTypes.bool,
  isMini: PropTypes.bool,
  isHorizontal: PropTypes.bool,
  className: PropTypes.string,
  onMovieClick: PropTypes.func,
};

export default memo(MovieCardGrid);
