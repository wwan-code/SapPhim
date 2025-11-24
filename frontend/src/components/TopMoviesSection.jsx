import React, { useState, useRef } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import { useGetTopMovies } from '@/hooks/useMovieQueries';
import MovieSliderCard from '@/components/MovieSliderCard';
import MovieCardSkeleton from '@/components/skeletons/MovieCardSkeleton';
import 'swiper/css';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import classNames from '@/utils/classNames';

const TopMoviesSection = () => {
    const { data: movies = [], isLoading: loading, error } = useGetTopMovies();
    const navigationPrevRef = useRef(null);
    const navigationNextRef = useRef(null);
    const [isBeginning, setIsBeginning] = useState(true);
    const [isEnd, setIsEnd] = useState(false);

    if (error) {
        console.error('Error fetching top movies:', error);
    }

    const handleSlideChange = (swiper) => {
        setIsBeginning(swiper.isBeginning);
        setIsEnd(swiper.isEnd);
    };

    const renderSkeletons = () => {
        return Array.from({ length: 6 }).map((_, index) => (
            <SwiperSlide key={index}>
                <MovieCardSkeleton />
            </SwiperSlide>
        ));
    };

    return (
        <section className="card-section top-movies-section">
            <div className="section-title">
                <h3 className="section-title__text">Top 10 bộ phim đáng xem</h3>
            </div>
            <div className="top-movies-slider section-slider">
                <Swiper
                    modules={[Navigation]}
                    spaceBetween={24}
                    slidesPerView={6}
                    navigation={{
                        prevEl: navigationPrevRef.current,
                        nextEl: navigationNextRef.current,
                    }}
                    onBeforeInit={(swiper) => {
                        swiper.params.navigation.prevEl = navigationPrevRef.current;
                        swiper.params.navigation.nextEl = navigationNextRef.current;
                    }}
                    onSlideChange={(swiper) => {
                        handleSlideChange(swiper);
                    }}
                    onUpdate={(swiper) => {
                        handleSlideChange(swiper);
                    }}

                    breakpoints={{
                        320: {
                            slidesPerView: 2,
                            spaceBetween: 16,
                        },
                        768: {
                            slidesPerView: 4,
                            spaceBetween: 20,
                        },
                        1200: {
                            slidesPerView: 6,
                            spaceBetween: 24,
                        }
                    }}
                >
                    {loading
                        ? renderSkeletons()
                        : movies.map((movie) => (
                            <SwiperSlide key={movie.uuid}>
                                <MovieSliderCard movie={movie} />
                            </SwiperSlide>
                        ))}
                </Swiper>
                <button
                    className={classNames('swiper-button-custom swiper-button-prev-custom', { 'swiper-button-disabled': isBeginning })}
                    ref={navigationPrevRef}
                >
                    <FaChevronLeft />
                </button>
                <button
                    className={classNames('swiper-button-custom swiper-button-next-custom', { 'swiper-button-disabled': isEnd })}
                    ref={navigationNextRef}
                >
                    <FaChevronRight />
                </button>
            </div>
        </section>
    );
};

export default TopMoviesSection;
