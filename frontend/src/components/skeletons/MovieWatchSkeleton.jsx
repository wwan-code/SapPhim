import React from 'react';
import '@/assets/scss/components/_movie-watch-skeleton.scss';

const MovieWatchSkeleton = () => {
    return (
        <div className="movie-watch-skeleton">
            <div className="movie-watch-skeleton__main-content">
                {/* Player Placeholder */}
                <div className="movie-watch-skeleton__player"></div>

                {/* Info Placeholder */}
                <div className="movie-watch-skeleton__info">
                    <div className="movie-watch-skeleton__poster"></div>
                    <div className="movie-watch-skeleton__details">
                        <div className="movie-watch-skeleton__header">
                            <div className="movie-watch-skeleton__title"></div>
                            <div className="movie-watch-skeleton__subtitle"></div>
                        </div>

                        <div className="movie-watch-skeleton__meta-row">
                            <div className="movie-watch-skeleton__badge"></div>
                            <div className="movie-watch-skeleton__badge"></div>
                            <div className="movie-watch-skeleton__badge"></div>
                        </div>

                        <div className="movie-watch-skeleton__actions">
                            <div className="movie-watch-skeleton__btn"></div>
                            <div className="movie-watch-skeleton__btn"></div>
                        </div>

                        <div className="movie-watch-skeleton__genres">
                            <div className="movie-watch-skeleton__genre"></div>
                            <div className="movie-watch-skeleton__genre"></div>
                            <div className="movie-watch-skeleton__genre"></div>
                        </div>
                    </div>
                </div>

                {/* Episode List Placeholder */}
                <div className="movie-watch-skeleton__episodes">
                    <div className="movie-watch-skeleton__section-title"></div>
                    <div className="movie-watch-skeleton__episode-grid">
                        {[...Array(12)].map((_, i) => (
                            <div key={i} className="movie-watch-skeleton__episode-card"></div>
                        ))}
                    </div>
                </div>

                {/* Meta Placeholder */}
                <div className="movie-watch-skeleton__meta-panel">
                    <div className="movie-watch-skeleton__tags">
                        <div className="movie-watch-skeleton__tag"></div>
                        <div className="movie-watch-skeleton__tag"></div>
                    </div>
                    <div className="movie-watch-skeleton__text-line"></div>
                    <div className="movie-watch-skeleton__text-line" style={{ width: '80%' }}></div>
                </div>
            </div>

            {/* Sidebar Placeholder */}
            <div className="movie-watch-skeleton__sidebar">
                <div className="movie-watch-skeleton__section-title"></div>
                <div className="movie-watch-skeleton__recommended-list">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="movie-watch-skeleton__recommended-card">
                            <div className="movie-watch-skeleton__card-poster"></div>
                            <div className="movie-watch-skeleton__card-info">
                                <div className="movie-watch-skeleton__card-title"></div>
                                <div className="movie-watch-skeleton__card-subtitle"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default MovieWatchSkeleton;
