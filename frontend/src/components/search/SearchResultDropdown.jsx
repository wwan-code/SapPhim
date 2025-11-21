import React, { useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import useCustomScrollbar from '@/hooks/useCustomScrollbar';
import '@/assets/scss/components/search/_search-result-dropdown.scss';

const getDefaultTitle = (titles) => {
  if (!titles || titles.length === 0) return 'Không có tiêu đề';
  const defaultTitle = titles.find((t) => t.type === 'default');
  return defaultTitle ? defaultTitle.title : titles[0].title;
};

const Highlight = ({ text, highlight }) => {
  if (!highlight?.trim()) {
    return <span>{text}</span>;
  }

  const regex = new RegExp(`(${highlight})`, 'gi');
  const parts = text.split(regex);

  return (
    <span>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="search-results__highlight">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  );
};

const SkeletonItem = () => (
  <div className="search-results__skeleton-item">
    <div className="search-results__skeleton-poster" />
    <div className="search-results__skeleton-content">
      <div className="search-results__skeleton-line" />
      <div className="search-results__skeleton-line search-results__skeleton-line--short" />
    </div>
  </div>
);

const SearchResultDropdown = ({
  id,
  results,
  isLoading,
  error,
  query,
  activeIndex,
  isOpen,
  placement,
  floatingStyles,
  floatingRef,
  getFloatingProps,
  onSelect,
  onClose,
}) => {
  const { containerRef, scrollbarRef, refresh } = useCustomScrollbar([
    results.length,
    isLoading,
  ]);

  // Cleanup any duplicate instances
  useEffect(() => {
    const checkAndCleanup = () => {
      const instances = document.querySelectorAll(`#${id}`);
      if (instances.length > 1) {
        // Keep only the last instance
        instances.forEach((instance, index) => {
          if (index < instances.length - 1) {
            instance.remove();
          }
        });
      }
    };
    
    checkAndCleanup();
  }, [id, isOpen]);

  // Refresh scrollbar when results change
  useEffect(() => {
    refresh();
  }, [results, refresh]);

  // Scroll active item into view
  useEffect(() => {
    if (activeIndex >= 0 && containerRef.current) {
      const activeElement = containerRef.current.querySelector(
        `#search-result-${activeIndex}`
      );
      if (activeElement) {
        activeElement.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth',
        });
      }
    }
  }, [activeIndex, containerRef]);

  // Determine placement variant for animation
  const placementVariant = useMemo(() => {
    const [side] = placement.split('-');
    return side === 'top' ? 'up' : 'down';
  }, [placement]);

  const renderContent = () => {
    // Loading state
    if (isLoading && results.length === 0) {
      return (
        <div className="search-results__loading">
          {[...Array(5)].map((_, i) => (
            <SkeletonItem key={i} />
          ))}
        </div>
      );
    }

    // Error state
    if (error) {
      return (
        <div className="search-results__empty">
          <i className="fa-solid fa-exclamation-triangle" aria-hidden="true" />
          <p>{error}</p>
        </div>
      );
    }

    // Empty state
    if (results.length === 0 && query) {
      return (
        <div className="search-results__empty">
          <i className="fa-solid fa-search" aria-hidden="true" />
          <p>Không tìm thấy kết quả cho "{query}"</p>
        </div>
      );
    }

    if (results.length === 0) {
      return (
        <div className="search-results__empty">
          <i className="fa-solid fa-keyboard" aria-hidden="true" />
          <p>Nhập từ khóa để tìm kiếm</p>
        </div>
      );
    }

    // Results list
    return (
      <ul className="search-results__list" role="listbox">
        {results.map((movie, index) => (
          <li
            key={movie.uuid}
            id={`search-result-${index}`}
            className={`search-results__item ${
              index === activeIndex ? 'search-results__item--active' : ''
            }`}
            role="option"
            aria-selected={index === activeIndex}
            onClick={() => onSelect(movie)}
            onMouseEnter={() => {
              // Optional: Update active index on hover
            }}
          >
            <img
              src={
                movie.image?.posterUrl
                  ? `${import.meta.env.VITE_SERVER_URL}${movie.image.posterUrl}`
                  : 'https://placehold.co/50x75?text=No+Image'
              }
              alt={getDefaultTitle(movie.titles)}
              className="search-results__item-poster"
              loading="lazy"
            />
            <div className="search-results__item-content">
              <h4 className="search-results__item-title">
                <Highlight text={getDefaultTitle(movie.titles)} highlight={query} />
              </h4>
              <p className="search-results__item-meta">
                {movie.year || 'N/A'} • {movie.duration || 'N/A'}
              </p>
            </div>
            <div className="search-results__item-ripple" aria-hidden="true" />
          </li>
        ))}
      </ul>
    );
  };

  // Remove old instances before mounting new one
  useEffect(() => {
    if (isOpen) {
      const oldInstances = document.querySelectorAll(`#${id}`);
      oldInstances.forEach((instance, index) => {
        if (index < oldInstances.length - 1) {
          instance.remove();
        }
      });
    }
  }, [isOpen, id]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      const instances = document.querySelectorAll(`#${id}`);
      instances.forEach(instance => instance.remove());
    };
  }, [id]);

  const dropdownElement = (
    <div
      ref={floatingRef}
      id={id}
      className={`search-results ${isOpen ? 'search-results--open' : 'search-results--closing'}`}
      style={floatingStyles}
      data-open={isOpen}
      data-placement={placement}
      role="region"
      aria-label="Kết quả tìm kiếm"
      {...getFloatingProps()}
    >
      {/* Content wrapper for layered animation */}
      <div className="search-results__content-wrapper">
        <div className="search-results__container" ref={containerRef}>
          {renderContent()}
        </div>

        {/* Custom scrollbar */}
        <div className="search-results__scrollbar" aria-hidden="true">
          <div className="search-results__scrollbar-thumb" ref={scrollbarRef} />
        </div>
      </div>
    </div>
  );

  // Render via portal to escape stacking context
  return createPortal(dropdownElement, document.body);
};

export default SearchResultDropdown;