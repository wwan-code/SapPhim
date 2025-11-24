import React from 'react';
import RecommendedList from './RecommendedList';

const Sidebar = ({
  recommendedMovies,
}) => {
  return (
    <aside className="movie-watch-page__sidebar">
      <div className="sidebar__section">
        <h3 className="sidebar__title">Đề xuất cho bạn</h3>
        <RecommendedList recommendedMovies={recommendedMovies} />
      </div>
    </aside>
  );
};

export default React.memo(Sidebar);