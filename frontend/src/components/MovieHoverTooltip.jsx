import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { FaHeart, FaHeartBroken, FaInfoCircle, FaPlay, FaSpinner } from 'react-icons/fa';
import favoriteService from '@/services/favoriteService';
import CustomOverlayTrigger from './CustomTooltip/CustomOverlayTrigger';
import classNames from '../utils/classNames';
import { toast } from 'react-toastify';

const MovieHoverTooltip = ({ movie, position, onMouseEnter, onMouseLeave }) => {
    const { user: currentUser } = useSelector((state) => state.auth);
    const [isFavorite, setIsFavorite] = useState(false);
    const [loadingFavorite, setLoadingFavorite] = useState(true);
    const [isHovered, setIsHovered] = useState(false);

    useEffect(() => {
        const fetchStatus = async () => {
            if (!movie || !currentUser || !movie.id) {
                setLoadingFavorite(false);
                return;
            }

            setLoadingFavorite(true);

            try {
                const response = await favoriteService.check(movie.id);
                setIsFavorite(response.data.isFavorite);
            } catch (error) {
                console.error('Error checking favorite:', error);
            } finally {
                setLoadingFavorite(false);
            }
        };
        fetchStatus();
    }, [movie, currentUser]);

    const handleFavoriteClick = async () => {
        if (!currentUser) {
            toast.error("Vui lòng đăng nhập để thực hiện thao tác này.");
            return;
        }
        const originalIsFavorite = isFavorite;
        setIsFavorite(!originalIsFavorite);

        try {
            let response;
            if (originalIsFavorite) {
                response = await favoriteService.remove(movie.id);
            } else {
                response = await favoriteService.add(movie.id);
            }
            toast.success(response.data.message);
        } catch (error) {
            setIsFavorite(originalIsFavorite);
        }
    };

    if (!movie) return null;
    const defaultTitle = movie.titles?.find(t => t.type === 'default')?.title || 'No title';
    const originalTitle = movie.titles?.find(t => t.type !== 'default')?.title || '';

    return (
        <article
            className={classNames('movie-hover-tooltip', { 'movie-hover-tooltip--hovered': isHovered })}
            style={{ top: position.top, left: position.left }}
            onMouseEnter={() => {
                setIsHovered(true);
                onMouseEnter?.();
            }}
            onMouseLeave={() => {
                setIsHovered(false);
                onMouseLeave?.();
            }}
            role="dialog"
            aria-label={`Thông tin phim ${defaultTitle}`}
        >
            <div className="movie-hover-tooltip__media">
                <picture>
                    <source srcSet={`${import.meta.env.VITE_SERVER_URL}${movie.image.bannerUrl}`} type="image/webp" />
                    <img
                        src={`${import.meta.env.VITE_SERVER_URL}${movie.image.bannerUrl}`}
                        alt={defaultTitle}
                        loading="lazy"
                        className="movie-hover-tooltip__image"
                    />
                </picture>
                <div className="movie-hover-tooltip__gradient" aria-hidden="true" />
            </div>

            <div className="movie-hover-tooltip__body">
                <header className="movie-hover-tooltip__header">
                    <h4 className="movie-hover-tooltip__title line-count-2">{defaultTitle}</h4>
                    {originalTitle && (
                        <p className="movie-hover-tooltip__subtitle line-count-1">{originalTitle}</p>
                    )}
                </header>

                <div className="movie-hover-tooltip__actions">
                    <Link 
                        to={`/watch/${movie.slug}`} 
                        className="movie-hover-tooltip__btn movie-hover-tooltip__btn--play"
                        aria-label={`Xem phim ${defaultTitle}`}
                    >
                        <FaPlay className="movie-hover-tooltip__btn-icon" />
                        <span className="movie-hover-tooltip__btn-text">Xem ngay</span>
                    </Link>
                    <CustomOverlayTrigger
                        placement="top"
                        tooltipId={`favorite-tooltip-${movie.id}`}
                        tooltip={isFavorite ? 'Bỏ yêu thích' : 'Yêu thích'}
                    >
                        <button 
                            className={classNames('movie-hover-tooltip__btn movie-hover-tooltip__btn--favorite', { 
                                'movie-hover-tooltip__btn--active': isFavorite,
                                'movie-hover-tooltip__btn--disabled': !currentUser 
                            })} 
                            onClick={handleFavoriteClick} 
                            aria-label={isFavorite ? 'Bỏ yêu thích' : 'Thêm vào yêu thích'} 
                            disabled={!currentUser || loadingFavorite}
                        >
                            {loadingFavorite ? (
                                <FaSpinner className="movie-hover-tooltip__btn-icon movie-hover-tooltip__btn-icon--spin" />
                            ) : isFavorite ? (
                                <FaHeartBroken className="movie-hover-tooltip__btn-icon" />
                            ) : (
                                <FaHeart className="movie-hover-tooltip__btn-icon" />
                            )}
                        </button>
                    </CustomOverlayTrigger>
                     <CustomOverlayTrigger
                        placement="top"
                        tooltipId={`info-tooltip-${movie.id}`}
                        tooltip={'Chi tiết phim'}
                    >
                        <Link 
                        to={`/movie/${movie.slug}`} 
                        className="movie-hover-tooltip__btn movie-hover-tooltip__btn--info"
                        aria-label={`Chi tiết phim ${defaultTitle}`}
                    >
                        <FaInfoCircle className="movie-hover-tooltip__btn-icon" />
                    </Link>
                    </CustomOverlayTrigger>
                    
                </div>

                <div className="movie-hover-tooltip__meta" role="list" aria-label="Thông tin phim">
                    {movie.imdb && (
                        <span className="movie-hover-tooltip__badge movie-hover-tooltip__badge--imdb" role="listitem">
                            <span className="movie-hover-tooltip__badge-value">{movie.imdb}</span>
                        </span>
                    )}
                    {movie.year && (
                        <span className="movie-hover-tooltip__badge" role="listitem">{movie.year}</span>
                    )}
                    {movie.season && (
                        <span className="movie-hover-tooltip__badge" role="listitem">{movie.season}</span>
                    )}
                    {movie.duration && (
                        <span className="movie-hover-tooltip__badge" role="listitem">{movie.duration}</span>
                    )}
                </div>

                {movie.genres?.length > 0 && (
                    <div className="movie-hover-tooltip__tags" role="list" aria-label="Thể loại phim">
                        <span role="listitem">{movie.genres.slice(0, 4).map((g) => g.title).join(', ')}</span>
                    </div>
                )}
            </div>
        </article>
    );
};

MovieHoverTooltip.propTypes = {
    movie: PropTypes.object.isRequired,
    position: PropTypes.shape({ top: PropTypes.number, left: PropTypes.number }).isRequired,
    onMouseEnter: PropTypes.func,
    onMouseLeave: PropTypes.func,
};

export default MovieHoverTooltip;
