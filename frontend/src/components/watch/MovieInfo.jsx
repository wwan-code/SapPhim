import React from 'react';
import { FaStepForward, FaExpand, FaCompress, FaEye } from 'react-icons/fa';

const MovieInfo = ({
  movie,
  currentEpisode,
  onToggleCinemaMode,
  isCinemaMode,
  onNextEpisode,
  hasNextEpisode,
}) => {
  if (!movie || !currentEpisode) return null;

  const defaultTitle = movie.titles?.find(t => t.type === 'default')?.title || 'Untitled';

  return (
    <div className="movie-info">
      <div className="movie-info__header">
        <div>
          <h1 className="movie-info__title">
            {defaultTitle}
          </h1>
          <div className="movie-info__views">
            <FaEye /> {movie.views?.toLocaleString() || 0} lượt xem
            <span style={{ margin: '0 8px' }}>•</span>
            <span>Tập {currentEpisode.episodeNumber}</span>
          </div>
        </div>

        <div className="movie-info__controls">
          {hasNextEpisode && (
            <button onClick={onNextEpisode} className="movie-info__next-btn">
              <FaStepForward /> Tập tiếp theo
            </button>
          )}
          <button onClick={onToggleCinemaMode} className="movie-info__cinema-btn">
            {isCinemaMode ? <FaCompress /> : <FaExpand />}
            {isCinemaMode ? 'Thoát rạp' : 'Chế độ rạp'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MovieInfo;