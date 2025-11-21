import React from 'react';
import EpisodeList from './EpisodeList';
import RecommendedList from './RecommendedList';

const Sidebar = ({
  episodes,
  currentEpisode,
  recommendedMovies,
  onEpisodeChange,
  autoNext,
  onAutoNextChange,
}) => {
  return (
    <aside className="movie-watch-page__sidebar">
      <div className="sidebar__section">
        <div className="sidebar__title">
          <span>Danh sách tập</span>
          <div className="auto-next-toggle" title="Tự động chuyển tập">
            <label htmlFor="auto-next">Auto Next</label>
            <input
              type="checkbox"
              id="auto-next"
              checked={autoNext}
              onChange={(e) => onAutoNextChange(e.target.checked)}
            />
          </div>
        </div>
        <EpisodeList
          episodes={episodes}
          currentEpisode={currentEpisode}
          onEpisodeChange={onEpisodeChange}
        />
      </div>

      <div className="sidebar__section">
        <h3 className="sidebar__title">Phim đề xuất</h3>
        <RecommendedList recommendedMovies={recommendedMovies} />
      </div>
    </aside>
  );
};

export default Sidebar;