import React from 'react';
import { Link } from 'react-router-dom';
import { getImageUrl } from '@/utils/getAvatarUrl';

const RecommendedList = ({ recommendedMovies }) => {
  if (!recommendedMovies || recommendedMovies.length === 0) return null;

  return (
    <div className="recommended-list">
      {recommendedMovies.map((movie) => {
        const title = movie.titles?.find((t) => t.type === 'default')?.title || 'Untitled';
        const originalTitle = movie.titles?.find(t => t.type === 'original')?.title;

        return (
          <Link key={movie.uuid} to={`/movie/${movie.slug}`} className="recommended-card">
            <div className="recommended-card__poster">
              <img
                src={getImageUrl(movie?.image?.posterUrl) || `https://placehold.co/160x240/222/fff?text=Movie`}
                alt={title}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = `https://placehold.co/160x240/222/fff?text=Movie`;
                }}
              />
            </div>
            <div className="recommended-card__info">
              <h4 className="recommended-card__title" title={title}>{title}</h4>
              {originalTitle && <span className="recommended-card__subtitle">{originalTitle}</span>}
              <div className="recommended-card__meta">
                <span className="meta-tag">{movie.quality || 'HD'}</span>
                <span className="meta-dot">•</span>
                <span>{movie.year || 'N/A'}</span>
                {movie.currentEpisode && (
                  <>
                    <span className="meta-dot">•</span>
                    <span>Tập {movie.currentEpisode}</span>
                  </>
                )}
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
};

export default React.memo(RecommendedList);