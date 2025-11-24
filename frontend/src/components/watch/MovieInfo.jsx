import React from 'react';
import { FaStepForward, FaEye, FaExpandAlt, FaCompressAlt, FaStar, FaCalendarAlt, FaClock, FaShareAlt, FaHeart } from 'react-icons/fa';
import { useDeviceType } from '@/hooks/useDeviceType';
import { getImageUrl } from '@/utils/getAvatarUrl';

const MovieInfo = ({
  movie,
  currentEpisode,
  onToggleCinemaMode,
  isCinemaMode,
  onNextEpisode,
  hasNextEpisode,
}) => {
  const deviceType = useDeviceType();

  if (!movie || !currentEpisode) return null;

  const defaultTitle = movie.titles?.find(t => t.type === 'default')?.title || 'Untitled';
  const originalTitle = movie.titles?.find(t => t.type === 'original')?.title;
  const posterUrl = getImageUrl(movie?.image?.posterUrl) || getImageUrl(movie?.image?.thumbnailUrl) || 'https://placehold.co/300x450/222/fff?text=No+Poster';

  return (
    <div className="movie-info">
      <div className="movie-info__poster">
        <img src={posterUrl} alt={defaultTitle} />
      </div>

      <div className="movie-info__content">
        <div className="movie-info__header">
          <div>
            <h1 className="movie-info__title">
              {defaultTitle}
            </h1>
            {originalTitle && <h2 className="movie-info__subtitle">{originalTitle}</h2>}

            <div className="movie-info__meta-row">
              {movie.voteAverage > 0 && (
                <span className="meta-badge imdb">
                  <span className="imdb-label">IMDb</span>
                  <span className="imdb-score">{movie.voteAverage.toFixed(1)}</span>
                </span>
              )}
              {movie.quality && <span className="meta-badge quality">{movie.quality}</span>}
              {movie.year && <span className="meta-badge year">{movie.year}</span>}
              {currentEpisode.duration && (
                <span className="meta-item">
                  <FaClock /> {currentEpisode.duration}
                </span>
              )}
              <span className="meta-item">
                <FaEye /> {movie.views?.toLocaleString() || 0}
              </span>
            </div>
          </div>

          <div className="movie-info__controls">
            {deviceType === 'desktop' && (
              <button onClick={onToggleCinemaMode} className="control-btn cinema-btn" title={isCinemaMode ? 'Thoát rạp' : 'Chế độ rạp'}>
                {isCinemaMode ? <FaCompressAlt /> : <FaExpandAlt />}
              </button>
            )}
          </div>
        </div>

        <div className="movie-info__actions">
          {hasNextEpisode && (
            <button onClick={onNextEpisode} className="action-btn primary">
              <FaStepForward /> Tập tiếp theo
            </button>
          )}
          <button className="action-btn secondary">
            <FaHeart /> Yêu thích
          </button>
          <button className="action-btn secondary">
            <FaShareAlt /> Chia sẻ
          </button>
        </div>

        <div className="movie-info__genres">
          {movie.genres?.map(genre => (
            <span key={genre.id} className="genre-tag">{genre.title}</span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default React.memo(MovieInfo);