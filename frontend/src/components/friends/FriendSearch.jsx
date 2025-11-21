import React, { useState } from 'react';
import { useSearchUsers } from '@/hooks/useFriendQueries';
import { useDebounce } from '@/hooks/useDebounce';
import FriendCard from './FriendCard';
import FriendCardSkeleton from './FriendCardSkeleton';
import '@/assets/scss/components/friends/_friend-search.scss';

const FriendSearch = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500); // Debounce 500ms

  const {
    data: searchResults,
    isLoading,
    isFetching,
    isError,
    error,
  } = useSearchUsers(debouncedSearchTerm, {
    // Chỉ chạy query khi debouncedSearchTerm có giá trị
    enabled: debouncedSearchTerm.length > 0,
  });

  const loading = isLoading || isFetching;

  return (
    <div className="friend-search">
      {/* 🌊 LIQUID GLASS SEARCH INPUT */}
      <div className="friend-search__input-wrapper">
        <div className="friend-search__input-group">
          <i className="friend-search__input-icon fas fa-search" aria-hidden="true" />
          <input
            type="text"
            className="friend-search__input"
            placeholder="Tìm kiếm bạn bè theo tên, email hoặc UUID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Tìm kiếm bạn bè"
          />
          {searchTerm && (
            <button 
              className="friend-search__clear-btn"
              onClick={() => setSearchTerm('')}
              aria-label="Xóa tìm kiếm"
            >
              <i className="fas fa-times" />
            </button>
          )}
          {loading && (
            <i className="friend-search__loading-icon fas fa-spinner fa-spin" aria-hidden="true" />
          )}
        </div>
      </div>

      {/* Error State */}
      {isError && (
        <div className="friend-search-empty">
          <i className="fas fa-exclamation-triangle friend-search-empty__icon" />
          <h3 className="friend-search-empty__title">Có lỗi xảy ra</h3>
          <p className="friend-search-empty__message">{error.message}</p>
        </div>
      )}

      {/* Loading State */}
      {loading && debouncedSearchTerm && (
        <div className="friend-search__results">
          {Array.from({ length: 3 }).map((_, idx) => (
            <FriendCardSkeleton key={idx} />
          ))}
        </div>
      )}

      {/* Results */}
      {!loading && searchResults && searchResults.length > 0 && (
        <div className="friend-search__results">
          <div className="friend-search__results-header">
            <h3 className="friend-search__results-title">
              Tìm thấy {searchResults.length} kết quả
            </h3>
          </div>
          {searchResults.map((user) => (
            <FriendCard key={user.id} user={user} type="search" />
          ))}
        </div>
      )}

      {/* No Results */}
      {!loading && debouncedSearchTerm && (!searchResults || searchResults.length === 0) && !isError && (
        <div className="friend-search-empty">
          <i className="fas fa-user-slash friend-search-empty__icon" />
          <h3 className="friend-search-empty__title">Không tìm thấy</h3>
          <p className="friend-search-empty__message">
            Không tìm thấy người dùng nào với từ khóa <strong>"{debouncedSearchTerm}"</strong>
          </p>
        </div>
      )}

      {/* Initial State */}
      {!debouncedSearchTerm && !loading && (
        <div className="friend-search-empty friend-search-empty--initial">
          <i className="fas fa-search friend-search-empty__icon" />
          <h3 className="friend-search-empty__title">Tìm kiếm bạn bè</h3>
          <p className="friend-search-empty__message">
            Nhập tên, email hoặc UUID để bắt đầu tìm kiếm
          </p>
        </div>
      )}
    </div>
  );
};

export default FriendSearch;
