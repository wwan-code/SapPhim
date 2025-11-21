import React from 'react';

const EpisodeList = ({ episodes, currentEpisode, onEpisodeChange }) => {
  if (!episodes || episodes.length === 0) return null;

  return (
    <ul className="episode-list">
      {episodes
        .sort((a, b) => a.episodeNumber - b.episodeNumber)
        .map((ep) => (
          <li key={ep.uuid}>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                onEpisodeChange(ep.episodeNumber);
              }}
              className={`episode-item ${ep.episodeNumber === currentEpisode.episodeNumber ? 'episode-item--active' : ''
                }`}
            >
              <img
                src={ep.thumbnail || `https://placehold.co/160x90/222/fff?text=EP${ep.episodeNumber}`}
                alt={`Tập ${ep.episodeNumber}`}
                className="episode-thumbnail"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = `https://placehold.co/160x90/222/fff?text=EP${ep.episodeNumber}`;
                }}
              />
              <div className="episode-info">
                <span className="episode-number">Tập {ep.episodeNumber}</span>
                <span className="episode-title">
                  {ep.title || `Episode ${ep.episodeNumber}`}
                </span>
              </div>
            </a>
          </li>
        ))}
    </ul>
  );
};

export default EpisodeList;