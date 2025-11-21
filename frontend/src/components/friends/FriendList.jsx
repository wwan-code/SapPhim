import React, { useState, useEffect } from 'react';
import { useGetFriends } from '@/hooks/useFriendQueries';
import userService from '@/services/userService';
import FriendCard from './FriendCard';
import FriendCardSkeleton from './FriendCardSkeleton';
import '@/assets/scss/components/friends/_friend-list.scss';

const FriendList = ({ user, isOwnProfile = true }) => {
  // Sử dụng React Query Infinite Query để fetch danh sách bạn bè
  const { 
    data, 
    isLoading, 
    isError, 
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useGetFriends();

  // State để lưu danh sách bạn bè của người dùng khác với pagination
  const [otherUserFriends, setOtherUserFriends] = useState([]);
  const [otherUserLoading, setOtherUserLoading] = useState(false);
  const [otherUserError, setOtherUserError] = useState(null);
  const [otherUserPage, setOtherUserPage] = useState(1);
  const [otherUserHasMore, setOtherUserHasMore] = useState(false);
  const [otherUserLoadingMore, setOtherUserLoadingMore] = useState(false);

  // Fetch other user's friends with pagination
  const fetchOtherUserFriends = async (page = 1, append = false) => {
    if (!user?.uuid) return;
    
    if (append) {
      setOtherUserLoadingMore(true);
    } else {
      setOtherUserLoading(true);
    }
    
    setOtherUserError(null);
    
    try {
      const response = await userService.getUserFriendsByUuid(user.uuid, { page, limit: 10 });
      const newFriends = response.data || [];
      console.log("newFriends", newFriends);
      
      if (append) {
        setOtherUserFriends(prev => [...prev, ...newFriends]);
      } else {
        setOtherUserFriends(newFriends);
      }
      
      setOtherUserHasMore(response.meta?.hasMore || false);
      setOtherUserPage(page);
    } catch (e) {
      setOtherUserError(e?.response?.data?.message || 'Không thể tải danh sách bạn bè.');
    } finally {
      setOtherUserLoading(false);
      setOtherUserLoadingMore(false);
    }
  };

  useEffect(() => {
    if (!isOwnProfile && user?.uuid) {
      fetchOtherUserFriends(1, false);
    }
  }, [isOwnProfile, user?.uuid]);

  // Load more handler for other user
  const handleLoadMoreOtherUser = () => {
    fetchOtherUserFriends(otherUserPage + 1, true);
  };

  // Flatten pages data for own profile
  const friendsList = isOwnProfile 
    ? data?.pages?.flatMap(page => page.data) || []
    : otherUserFriends;

  const isLoadingState = isOwnProfile ? isLoading : otherUserLoading;
  const isErrorState = isOwnProfile ? isError : !!otherUserError;
  const errorState = isOwnProfile ? error?.message : otherUserError;

  if (isLoadingState) {
    return (
      <div className="friend-list-container">
        <div className="friend-list">
          {Array.from({ length: 6 }).map((_, idx) => (
            <FriendCardSkeleton key={idx} />
          ))}
        </div>
      </div>
    );
  }

  if (isErrorState) {
    return (
      <div className="friend-list-empty">
        <i className="fas fa-exclamation-triangle friend-list-empty__icon" />
        <h3 className="friend-list-empty__title">Có lỗi xảy ra</h3>
        <p className="friend-list-empty__message">{errorState}</p>
      </div>
    );
  }

  if (!friendsList || friendsList.length === 0) {
    const message = isOwnProfile ? 'Bạn chưa có người bạn nào.' : 'Người này chưa có người bạn nào.';
    return (
      <div className="friend-list-empty">
        <i className="fas fa-user-friends friend-list-empty__icon" />
        <h3 className="friend-list-empty__title">Chưa có bạn bè</h3>
        <p className="friend-list-empty__message">{message}</p>
      </div>
    );
  }

  return (
    <div className="friend-list-container">
      <div className="friend-list">
        {friendsList.map((friend) => (
          <FriendCard key={friend.id} user={{ ...friend, friendshipStatus: 'accepted' }} type="friends" />
        ))}
      </div>
      
      {/* Load More Button */}
      {isOwnProfile ? (
        // Own profile - use infinite query
        hasNextPage && (
          <div className="friend-list__load-more">
            <button 
              className="friend-list__load-more-btn"
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
            >
              {isFetchingNextPage ? (
                <>
                  <i className="fas fa-spinner fa-spin" />
                  <span>Đang tải...</span>
                </>
              ) : (
                <>
                  <i className="fas fa-chevron-down" />
                  <span>Xem thêm</span>
                </>
              )}
            </button>
          </div>
        )
      ) : (
        // Other user profile - use manual pagination
        otherUserHasMore && (
          <div className="friend-list__load-more">
            <button 
              className="friend-list__load-more-btn"
              onClick={handleLoadMoreOtherUser}
              disabled={otherUserLoadingMore}
            >
              {otherUserLoadingMore ? (
                <>
                  <i className="fas fa-spinner fa-spin" />
                  <span>Đang tải...</span>
                </>
              ) : (
                <>
                  <i className="fas fa-chevron-down" />
                  <span>Xem thêm</span>
                </>
              )}
            </button>
          </div>
        )
      )}
    </div>
  );
};

export default FriendList;
