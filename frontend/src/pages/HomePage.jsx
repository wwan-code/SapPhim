import React from 'react';
import { useGetLatestMovies } from '@/hooks/useMovieQueries';
import MovieCardSkeleton from '@/components/skeletons/MovieCardSkeleton';
import MovieCard from '@/components/MovieCard';
import HeroMovie from '@/components/HeroMovie';
import ContinueWatching from '@/components/ContinueWatching';
import TopMoviesSection from '@/components/TopMoviesSection';
import '@/assets/scss/pages/_home-page.scss';
import MovieTheaterSection from '@/components/MovieTheaterSection';
import { Link } from 'react-router-dom';

const HomePage = () => {
  const { data: movies = [], isLoading: loading, error } = useGetLatestMovies(12);

  if (error) {
    console.error('Error fetching latest movies:', error);
  }

  const renderSkeletonGrid = (count = 12) => {
    return Array.from({ length: count }).map((_, index) => <MovieCardSkeleton key={index} isHorizontal={true} />);
  };

  return (
    <div className="home-page">
      <HeroMovie />
      <ContinueWatching />
      <TopMoviesSection />
      <MovieTheaterSection />
      <section className="card-section">
        <div className="section-title">
          <h3 className="section-title__text">Phim mới cập nhật</h3>
          <Link to={'/phim-moi-cap-nhat'} className="btn-view-more">
            Xem thêm
          </Link>
        </div>
        <div className="section-list section-list__multi section-list--column">
          {loading ? renderSkeletonGrid() : movies.map((movie) => (
            <MovieCard key={movie.id} movie={movie} isHorizontal={true} />
          ))}
        </div>
      </section>
    </div>
  );
};

export default HomePage;
