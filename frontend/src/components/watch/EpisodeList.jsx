import React from 'react';

const EpisodeList = ({ episodes, currentEpisode, onEpisodeChange }) => {
  if (!episodes || episodes.length === 0) return null;

  return (
    <div className="episode-grid">
      {episodes
        .sort((a, b) => a.episodeNumber - b.episodeNumber)
        .map((ep) => (
          <a
            key={ep.uuid}
            href="#"
            onClick={(e) => {
              e.preventDefault();
              onEpisodeChange(ep.episodeNumber);
            }}
            className={`episode-card ${ep.episodeNumber === currentEpisode.episodeNumber ? 'active' : ''}`}
          >
            <div className="episode-card__content">
              <span className="episode-card__number">Tập {ep.episodeNumber}</span>
            </div>
          </a>
        ))}
    </div>
  );
};

export default React.memo(EpisodeList);