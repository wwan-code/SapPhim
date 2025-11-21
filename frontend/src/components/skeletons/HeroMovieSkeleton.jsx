import React from 'react';

const HeroMovieSkeleton = () => {
  return (
    <div className="hero-movie hero-movie--loading">
      {/* Background Layer */}
      <div className="hero-movie__background">
        <div className="hero-movie__background-image hero-movie__skeleton hero-movie__skeleton--background" />
      </div>

      {/* Content Layer */}
      <div className="hero-movie__content">
        {/* Left Column - Movie Information */}
        <div className="hero-movie__left">
          <div className="hero-movie__info">
            {/* Title Skeleton */}
            <div className="hero-movie__skeleton hero-movie__skeleton--title" />

            {/* Meta Skeleton */}
            <div className="hero-movie__meta">
              <div className="hero-movie__skeleton hero-movie__skeleton--meta" />
              <div className="hero-movie__skeleton hero-movie__skeleton--meta" />
              <div className="hero-movie__skeleton hero-movie__skeleton--meta" />
            </div>

            {/* Description Skeleton */}
            <div className="hero-movie__skeleton hero-movie__skeleton--description" />
            <div className="hero-movie__skeleton hero-movie__skeleton--description" />
            <div className="hero-movie__skeleton hero-movie__skeleton--description-short" />

            {/* Genres Skeleton */}
            <div className="hero-movie__skeleton hero-movie__skeleton--genres" />

            {/* Action Buttons Skeleton */}
            <div className="hero-movie__touch">
              <div className="hero-movie__skeleton hero-movie__skeleton--play-btn" />
              <div className="hero-movie__skeleton hero-movie__skeleton--touch-group" />
            </div>
          </div>
        </div>

        {/* Right Column - Carousel Skeleton */}
        <div className="hero-movie__right">
          <div className="hero-movie__carousel">
            <div className="hero-movie__swiper">
              <div className="hero-movie__skeleton-carousel">
                {[...Array(5)].map((_, index) => (
                  <div key={index} className="hero-movie__skeleton-card">
                    <div className="hero-movie__skeleton hero-movie__skeleton--card-poster" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroMovieSkeleton;
