import React from 'react';
import '@/assets/scss/components/_movie-detail-skeleton.scss';

const MovieDetailSkeleton = () => {
    return (
        <div className="movie-detail-skeleton">
            <div className="movie-detail-skeleton__hero">
                <div className="movie-detail-skeleton__hero-background"></div>
                <div className="movie-detail-skeleton__hero-cover">
                    <div className="movie-detail-skeleton__hero-image"></div>
                </div>
            </div>

            <div className="container movie-detail-skeleton__content">
                <div className="movie-detail-skeleton__main-info">
                    <div className="movie-detail-skeleton__main-left">
                        <div className="movie-detail-skeleton__poster"></div>
                    </div>
                    <div className="movie-detail-skeleton__main-right">
                        <div className="movie-detail-skeleton__details">
                            <div className="movie-detail-skeleton__title"></div>

                            <div className="movie-detail-skeleton__meta">
                                <div className="movie-detail-skeleton__meta-item" style={{ width: '60px' }}></div>
                                <div className="movie-detail-skeleton__meta-item" style={{ width: '80px' }}></div>
                                <div className="movie-detail-skeleton__meta-item" style={{ width: '50px' }}></div>
                                <div className="movie-detail-skeleton__meta-item" style={{ width: '100px' }}></div>
                            </div>

                            <div className="movie-detail-skeleton__genres">
                                <div className="movie-detail-skeleton__genre"></div>
                                <div className="movie-detail-skeleton__genre"></div>
                                <div className="movie-detail-skeleton__genre"></div>
                            </div>

                            <div className="movie-detail-skeleton__description">
                                <div className="skeleton-line"></div>
                                <div className="skeleton-line"></div>
                                <div className="skeleton-line" style={{ width: '70%' }}></div>
                            </div>

                            <div className="movie-detail-skeleton__actions">
                                <div className="movie-detail-skeleton__actions-left">
                                    <div className="movie-detail-skeleton__cta"></div>
                                    <div className="movie-detail-skeleton__quick">
                                        <div className="movie-detail-skeleton__quick-item"></div>
                                        <div className="movie-detail-skeleton__quick-item"></div>
                                        <div className="movie-detail-skeleton__quick-item"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="movie-detail-skeleton__section">
                    <div className="movie-detail-skeleton__section-title"></div>
                    <div className="movie-detail-skeleton__episodes">
                        {[...Array(10)].map((_, i) => (
                            <div key={i} className="movie-detail-skeleton__episode-card"></div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MovieDetailSkeleton;
