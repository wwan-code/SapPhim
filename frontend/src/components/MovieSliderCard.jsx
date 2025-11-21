import React, { useState, useRef, useEffect, memo, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { FaPlay } from 'react-icons/fa';
import { createPortal } from 'react-dom';
import MovieHoverTooltip from './MovieHoverTooltip';
import { useDeviceType } from '@/hooks/useDeviceType';

// Global tooltip state management
class TooltipManager {
    constructor() {
        this.activeTooltip = null;
        this.showTimeout = null;
    }

    setActive(setterFn) {
        if (this.activeTooltip && this.activeTooltip !== setterFn) {
            this.activeTooltip(false);
        }
        this.activeTooltip = setterFn;
    }

    clearActive(setterFn) {
        if (this.activeTooltip === setterFn) {
            this.activeTooltip = null;
        }
    }

    clearTimeout() {
        if (this.showTimeout) {
            clearTimeout(this.showTimeout);
            this.showTimeout = null;
        }
    }

    setTimeout(callback, delay) {
        this.clearTimeout();
        this.showTimeout = setTimeout(callback, delay);
    }
}

const tooltipManager = new TooltipManager();

// Custom hooks
const useReducedMotion = () => {
    return useMemo(() => {
        if (typeof window === 'undefined' || !window.matchMedia) return false;
        try {
            return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        } catch {
            return false;
        }
    }, []);
};

const useIntersectionObserver = (ref, priority, rootMargin = '200px') => {
    const [isVisible, setIsVisible] = useState(priority);

    useEffect(() => {
        if (priority) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect();
                }
            },
            { rootMargin }
        );

        const currentRef = ref.current;
        if (currentRef) {
            observer.observe(currentRef);
        }

        return () => {
            if (currentRef) {
                observer.unobserve(currentRef);
            }
        };
    }, [ref, priority, rootMargin]);

    return isVisible;
};

const useTooltipPosition = (cardRef, device) => {
    const computePosition = useCallback(() => {
        if (!cardRef.current) return { top: 0, left: 0 };
        
        const rect = cardRef.current.getBoundingClientRect();
        const tooltipWidth = device === 'mobile' ? Math.min(window.innerWidth - 24, 420) : 420;
        const tooltipHeight = 360;
        const margin = 10;
        const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
        const scrollY = window.pageYOffset || document.documentElement.scrollTop;

        // Center tooltip relative to card
        let top = rect.top + scrollY + (rect.height - tooltipHeight) / 2;
        let left = rect.left + scrollX + (rect.width - tooltipWidth) / 2;

        // Horizontal boundary checks
        if (left < scrollX + margin) {
            left = scrollX + margin;
        } else if (left + tooltipWidth > window.innerWidth + scrollX - margin) {
            left = window.innerWidth + scrollX - tooltipWidth - margin;
        }

        // Vertical boundary checks
        if (top < scrollY + margin) {
            top = scrollY + margin;
        } else if (top + tooltipHeight > window.innerHeight + scrollY - margin) {
            top = window.innerHeight + scrollY - tooltipHeight - margin;
        }

        return { top, left };
    }, [cardRef, device]);

    return computePosition;
};

const MovieSliderCard = ({ movie, priority = false, className = '' }) => {
        // Static ref for mobile hover management
        if (typeof window !== 'undefined' && !window._activeMovieSliderCardTouch) window._activeMovieSliderCardTouch = null;
    const [tooltipVisible, setTooltipVisible] = useState(false);
    const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageError, setImageError] = useState(false);
    
    const cardRef = useRef(null);
    const hideTimeoutRef = useRef(null);
    const rafRef = useRef(null);
    const touchDataRef = useRef({
        startTime: null,
        startPos: null,
        hasMoved: false
    });

    const device = useDeviceType() || 'desktop';
    const prefersReducedMotion = useReducedMotion();
    const isVisible = useIntersectionObserver(cardRef, priority);
    const computeTooltipPosition = useTooltipPosition(cardRef, device);

    // Memoized movie data
    const movieData = useMemo(() => {
        const safePoster = movie?.image?.posterUrl || '';
        const defaultTitle = movie.titles?.find(t => t.type === 'default')?.title || 'Tên phim không có sẵn';
        const episodeInfo = movie.belongToCategory !== "Phim lẻ" && movie.episodes?.length > 0
            ? `Tập ${movie.episodes[0].episodeNumber}`
            : null;
        
        const serverUrl = import.meta.env.VITE_SERVER_URL || '';
        const posterSrc = safePoster ? `${serverUrl}${safePoster}` : null;
        const fallbackGradient = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 450"%3E%3Cdefs%3E%3ClinearGradient id="g" x1="0%25" y1="0%25" x2="100%25" y2="100%25"%3E%3Cstop offset="0%25" style="stop-color:%23667eea;stop-opacity:0.3"%2F%3E%3Cstop offset="100%25" style="stop-color:%23764ba2;stop-opacity:0.3"%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Crect width="300" height="450" fill="url(%23g)"%2F%3E%3C%2Fsvg%3E';
        
        return {
            safePoster,
            defaultTitle,
            episodeInfo,
            posterSrc,
            fallbackGradient,
            viewCount: movie.viewCount || 0,
            quality: movie.quality || null,
            year: movie.year || null
        };
    }, [movie]);

    // Image loading handlers
    const handleImageLoad = useCallback(() => {
        setImageLoaded(true);
        setImageError(false);
    }, []);

    const handleImageError = useCallback((e) => {
        setImageError(true);
        setImageLoaded(false);
        if (e.target && movieData.fallbackGradient) {
            e.target.src = movieData.fallbackGradient;
        }
    }, [movieData.fallbackGradient]);

    // Tooltip show/hide handlers
    const showTooltip = useCallback(() => {
        if (device === 'mobile') return;

        tooltipManager.setActive(setTooltipVisible);
        
        const delay = prefersReducedMotion ? 100 : 800;
        tooltipManager.setTimeout(() => {
            const position = computeTooltipPosition();
            setTooltipPosition(position);
            setTooltipVisible(true);
        }, delay);
    }, [device, prefersReducedMotion, computeTooltipPosition]);

    const hideTooltip = useCallback((delay = 120) => {
        tooltipManager.clearTimeout();
        
        if (hideTimeoutRef.current) {
            clearTimeout(hideTimeoutRef.current);
        }
        
        hideTimeoutRef.current = setTimeout(() => {
            setTooltipVisible(false);
            tooltipManager.clearActive(setTooltipVisible);
        }, delay);
    }, []);

    // Mouse event handlers
    const handleMouseEnter = useCallback(() => {
        if (hideTimeoutRef.current) {
            clearTimeout(hideTimeoutRef.current);
            hideTimeoutRef.current = null;
        }
        showTooltip();
    }, [showTooltip]);

    const handleMouseLeave = useCallback(() => {
        hideTooltip();
    }, [hideTooltip]);

    // Touch event handlers
    const handleTouchStart = useCallback((e) => {
        if (device !== 'mobile') return;
        // Only run on touch devices
        if (window._activeMovieSliderCardTouch && window._activeMovieSliderCardTouch !== setTooltipVisible) {
            window._activeMovieSliderCardTouch(false);
        }
        window._activeMovieSliderCardTouch = setTooltipVisible;

        const touch = e.touches[0];
        touchDataRef.current = {
            startTime: Date.now(),
            startPos: { x: touch.clientX, y: touch.clientY },
            hasMoved: false
        };

        tooltipManager.setTimeout(() => {
            if (!touchDataRef.current.hasMoved) {
                const position = computeTooltipPosition();
                setTooltipPosition(position);
                setTooltipVisible(true);
            }
        }, 500);
    }, [device, computeTooltipPosition]);

    const handleTouchMove = useCallback((e) => {
        if (device !== 'mobile' || !touchDataRef.current.startPos) return;
        
        const touch = e.touches[0];
        const dx = Math.abs(touch.clientX - touchDataRef.current.startPos.x);
        const dy = Math.abs(touch.clientY - touchDataRef.current.startPos.y);
        
        if (dx > 10 || dy > 10) {
            touchDataRef.current.hasMoved = true;
            tooltipManager.clearTimeout();
        }
    }, [device]);

    const handleTouchEnd = useCallback(() => {
        if (device !== 'mobile') return;
        tooltipManager.clearTimeout();
        setTooltipVisible(false);
        if (window._activeMovieSliderCardTouch === setTooltipVisible) {
            window._activeMovieSliderCardTouch = null;
        }
        const touchDuration = Date.now() - (touchDataRef.current.startTime || 0);
        if (touchDuration < 500 && !touchDataRef.current.hasMoved) {
            hideTooltip(0);
        }
    }, [device, hideTooltip]);

    // Effects
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden) {
                setTooltipVisible(false);
                tooltipManager.clearTimeout();
                if (hideTimeoutRef.current) {
                    clearTimeout(hideTimeoutRef.current);
                }
            }
        };

        const handleEscKey = (e) => {
            if (e.key === 'Escape' && tooltipVisible) {
                hideTooltip(0);
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        document.addEventListener('keydown', handleEscKey);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            document.removeEventListener('keydown', handleEscKey);
        };
    }, [tooltipVisible, hideTooltip]);

    useEffect(() => {
        if (!tooltipVisible) return;

        const handleScrollResize = () => {
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
            }
            
            rafRef.current = requestAnimationFrame(() => {
                setTooltipPosition(computeTooltipPosition());
            });
        };

        window.addEventListener('scroll', handleScrollResize, { passive: true });
        window.addEventListener('resize', handleScrollResize, { passive: true });

        return () => {
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
            }
            window.removeEventListener('scroll', handleScrollResize);
            window.removeEventListener('resize', handleScrollResize);
        };
    }, [tooltipVisible, computeTooltipPosition]);

    // Cleanup effect
    useEffect(() => {
        return () => {
            tooltipManager.clearTimeout();
            if (hideTimeoutRef.current) {
                clearTimeout(hideTimeoutRef.current);
            }
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
            }
        };
    }, []);

    // Render placeholder if not visible
    if (!isVisible) {
        return (
            <div 
                className={`movie-slider-card-placeholder ${className}`.trim()} 
                ref={cardRef}
                aria-hidden="true"
            />
        );
    }

    return (
        <div
            className={`movie-slider-card ${imageLoaded ? 'movie-slider-card--loaded' : ''} ${imageError ? 'movie-slider-card--error' : ''} ${className}`.trim()}
            ref={cardRef}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            role="button"
            tabIndex={0}
            aria-haspopup="true"
            aria-expanded={tooltipVisible}
            aria-label={`Thông tin chi tiết cho ${movieData.defaultTitle}`}
        >
            <Link 
                to={`/movie/${movie.slug}`} 
                className="movie-slider-card__link" 
                aria-label={`Xem ${movieData.defaultTitle}`}
            >
                <div className="movie-slider-card__image-wrapper">
                    {/* Loading shimmer */}
                    {!imageLoaded && !imageError && (
                        <div className="movie-slider-card__loading" aria-hidden="true" />
                    )}

                    <picture className="movie-slider-card__picture">
                        {movieData.posterSrc && (
                            <>
                                <source srcSet={movieData.posterSrc} type="image/jpeg" />
                                <img
                                    src={priority ? movieData.posterSrc : movieData.fallbackGradient}
                                    data-src={priority ? undefined : movieData.posterSrc}
                                    alt={movieData.defaultTitle}
                                    className={`movie-slider-card__image ${imageLoaded ? 'movie-slider-card__image--loaded' : ''}`}
                                    loading={priority ? 'eager' : 'lazy'}
                                    decoding="async"
                                    onLoad={handleImageLoad}
                                    onError={handleImageError}
                                />
                            </>
                        )}
                        {!movieData.posterSrc && (
                            <div 
                                className="movie-slider-card__image movie-slider-card__image--placeholder"
                                role="img"
                                aria-label={`Poster không có sẵn cho ${movieData.defaultTitle}`}
                            />
                        )}
                    </picture>

                    {/* Quality badge */}
                    {movieData.quality && (
                        <span className="movie-slider-card__quality-badge" aria-label={`Chất lượng: ${movieData.quality}`}>
                            {movieData.quality}
                        </span>
                    )}

                    {/* Play overlay */}
                    <div className="movie-slider-card__overlay" aria-hidden="true">
                        <div className="movie-slider-card__play-button">
                            <FaPlay />
                        </div>
                    </div>
                </div>
                
                {device !== "desktop" && (
                    <div className="movie-slider-card__content">
                        <h3 className="movie-slider-card__title">{movieData.defaultTitle}</h3>
                        <div className="movie-slider-card__stats">
                            {movieData.episodeInfo && (
                                <span className="movie-slider-card__stat">
                                    {movieData.episodeInfo}
                                </span>
                            )}
                            {movieData.year && (
                                <span className="movie-slider-card__stat">
                                    {movieData.year}
                                </span>
                            )}
                            {movieData.viewCount > 0 && (
                                <span className="movie-slider-card__stat">
                                    {formatViews(movieData.viewCount)} lượt xem
                                </span>
                            )}
                        </div>
                    </div>
                )}
            </Link>
            
            {tooltipVisible && createPortal(
                <MovieHoverTooltip
                    movie={movie}
                    position={tooltipPosition}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                />, 
                document.body
            )}
        </div>
    );
};

// Helper function to format view counts
const formatViews = (count) => {
    if (count >= 1000000) {
        return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
        return `${(count / 1000).toFixed(1)}K`;
    }
    return count;
};

MovieSliderCard.propTypes = {
    movie: PropTypes.shape({
        slug: PropTypes.string.isRequired,
        image: PropTypes.shape({
            posterUrl: PropTypes.string,
        }),
        titles: PropTypes.arrayOf(PropTypes.shape({
            type: PropTypes.string,
            title: PropTypes.string,
        })).isRequired,
        belongToCategory: PropTypes.string,
        episodes: PropTypes.arrayOf(PropTypes.object),
    }).isRequired,
    priority: PropTypes.bool,
    className: PropTypes.string,
};

export default memo(MovieSliderCard);