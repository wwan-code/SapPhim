import React from 'react';
import { Link } from 'react-router-dom';

const RecommendedList = ({ recommendedMovies }) => {
  if (!recommendedMovies || recommendedMovies.length === 0) return null;

  return (
    <ul className="episode-list">
      {recommendedMovies.map((movie) => {
        const title = movie.titles?.find((t) => t.type === 'default')?.title || 'Untitled';
        return (
          <li key={movie.uuid}>
            <Link to={`/movie/${movie.slug}`} className="episode-item">
              <img
                src={movie.image || `https://placehold.co/160x90/222/fff?text=Movie`}
                alt={title}
                className="episode-thumbnail"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = `https://placehold.co/160x90/222/fff?text=Movie`;
                }}
              />
              <div className="episode-info">
                <span className="episode-number" style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>
                  {title}
                </span>
                <span className="episode-title">
                  {movie.year || 'N/A'} • {movie.quality || 'HD'}
                </span>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
};

export default RecommendedList;