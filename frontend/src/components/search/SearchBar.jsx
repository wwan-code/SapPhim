import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { useDropdown } from '@/hooks/useDropdown';
import { useFloatingDropdown } from '@/hooks/useFloatingDropdown';
import movieService from '@/services/movieService';
import SearchResultDropdown from './SearchResultDropdown';
import classNames from '@/utils/classNames';
import { useNavigate } from 'react-router-dom';
import '@/assets/scss/components/search/_search-bar.scss';

const SEARCH_DROPDOWN_ID = 'search-results-dropdown';

const SearchBar = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeIndex, setActiveIndex] = useState(-1);
  const navigate = useNavigate();
  
  const abortControllerRef = useRef(null);
  const inputRef = useRef(null);
  
  // Debounced query for API calls
  const debouncedQuery = useDebounce(query, 280);

  // Dropdown state management (unified with other dropdowns)
  const dropdown = useDropdown();
  const isOpen = dropdown.isOpen(SEARCH_DROPDOWN_ID);

  // Floating UI positioning
  const floating = useFloatingDropdown({
    placement: 'bottom-start',
    offset: 8,
    margin: { x: 16, y: 16 },
    observe: true,
    trigger: 'manual', // Manual control via focus/blur
    isOpen,
    onOpenChange: (open) => {
      if (open) {
        dropdown.open(SEARCH_DROPDOWN_ID, {
          closeOnEscape: true,
          closeOnClickOutside: true,
          ariaLabel: 'Search results',
        });
      } else {
        dropdown.close(SEARCH_DROPDOWN_ID);
      }
    },
    openDuration: 500,
    closeDuration: 220,
    strategy: 'fixed',
  });

  // Fetch search results
  const fetchMovies = useCallback(async (searchQuery) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    try {
      const response = await movieService.searchMovies(
        { q: searchQuery, page: 1, limit: 10 },
        signal
      );

      if (response?.data) {
        setResults(response.data);
      } else {
        setResults([]);
      }
    } catch (err) {
      if (err.name !== 'CanceledError') {
        console.error('Search error:', err);
        setError('Đã có lỗi xảy ra. Vui lòng thử lại.');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debouncedQuery) {
      fetchMovies(debouncedQuery);
    } else {
      setResults([]);
    }
  }, [debouncedQuery, fetchMovies]);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    setActiveIndex(-1);
    
    if (value.trim() && !isOpen) {
      floating.setIsOpen(true);
    }
  };

  const handleFocus = () => {
    floating.setIsOpen(true);
  };

  const handleBlur = () => {
    setTimeout(() => {
      if (!inputRef.current?.contains(document.activeElement)) {
        floating.setIsOpen(false);
      }
    }, 150);
  };

  const handleKeyDown = (e) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex((prev) => 
          prev < results.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (activeIndex >= 0 && results[activeIndex]) {
          handleResultSelect(results[activeIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        floating.setIsOpen(false);
        inputRef.current?.blur();
        break;
      default:
        break;
    }
  };

  const handleResultSelect = (movie) => {
    setQuery('');
    setResults([]);
    floating.setIsOpen(false);
    navigate(`/movie/${movie.slug}`);
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setActiveIndex(-1);
    inputRef.current?.focus();
  };

  return (
    <div 
      className={classNames('search-bar', {
        'search-bar--focused': isOpen,
        'search-bar--has-value': query,
      })}
      ref={floating.refs.setReference}
    >
      <div className="search-bar__wrapper">
        <div className="search-bar__input-container">
          <i className="search-bar__icon fa-solid fa-search" aria-hidden="true" />
          
          <input
            ref={inputRef}
            type="text"
            className="search-bar__input"
            placeholder="Tìm kiếm phim..."
            value={query}
            onChange={handleInputChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            role="combobox"
            aria-autocomplete="list"
            aria-controls={SEARCH_DROPDOWN_ID}
            aria-expanded={isOpen}
            aria-activedescendant={
              activeIndex >= 0 ? `search-result-${activeIndex}` : undefined
            }
            {...floating.getReferenceProps()}
          />

          {query && (
            <button
              className="search-bar__clear"
              onClick={handleClear}
              aria-label="Xóa tìm kiếm"
              type="button"
            >
              <i className="fa-solid fa-times" aria-hidden="true" />
            </button>
          )}

          {isLoading && (
            <div className="search-bar__spinner" aria-label="Đang tìm kiếm">
              <i className="fa-solid fa-spinner fa-spin" aria-hidden="true" />
            </div>
          )}
        </div>
      </div>

      {floating.isMounted && (
        <SearchResultDropdown
          id={SEARCH_DROPDOWN_ID}
          results={results}
          isLoading={isLoading}
          error={error}
          query={debouncedQuery}
          activeIndex={activeIndex}
          isOpen={isOpen}
          placement={floating.placement}
          floatingStyles={floating.floatingStyles}
          floatingRef={floating.refs.setFloating}
          getFloatingProps={floating.getFloatingProps}
          onSelect={handleResultSelect}
          onClose={() => floating.setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default SearchBar;