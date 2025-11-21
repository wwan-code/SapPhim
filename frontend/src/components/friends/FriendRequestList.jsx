import React from 'react';
import { useGetPendingRequests, useGetSentRequests } from '@/hooks/useFriendQueries';
import FriendCard from './FriendCard';
import classNames from '@/utils/classNames';
import FriendCardSkeleton from './FriendCardSkeleton';
import '@/assets/scss/components/friends/_friend-request-list.scss';

const FriendRequestList = ({ type }) => {
  // Chọn hook phù hợp dựa trên 'type' prop
  const { 
    data, 
    isLoading, 
    isError, 
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = type === 'pending' ? useGetPendingRequests() : useGetSentRequests();

  // Flatten pages data
  const requests = data?.pages?.flatMap(page => page.data) || [];

  if (isLoading) {
    return (
      <div className="friend-request-list-container">
        <div className="friend-request-list">
          {Array.from({ length: 4 }).map((_, idx) => (
            <FriendCardSkeleton key={idx} />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="friend-request-list-empty">
        <i className="fas fa-exclamation-triangle friend-request-list-empty__icon" />
        <h3 className="friend-request-list-empty__title">Có lỗi xảy ra</h3>
        <p className="friend-request-list-empty__message">{error.message}</p>
      </div>
    );
  }

  if (!requests || requests.length === 0) {
    return (
      <div className="friend-request-list-empty">
        <i className={classNames('friend-request-list-empty__icon', 
          type === 'pending' ? 'fas fa-user-clock' : 'fas fa-paper-plane'
        )} />
        <h3 className="friend-request-list-empty__title">Không có lời mời</h3>
        <p className="friend-request-list-empty__message">
          {type === 'pending' ? 'Không có lời mời kết bạn nào đang chờ.' : 'Bạn chưa gửi lời mời kết bạn nào.'}
        </p>
      </div>
    );
  }

  return (
    <div className="friend-request-list-container">
      <div className="friend-request-list">
        {requests.map((request) => (
          <FriendCard
            key={request.id}
            user={{
              ...(type === 'pending' ? request.sender : request.receiver),
              friendshipStatus: 'pending',
              friendshipId: request.id,
            }}
            type={type}
          />
        ))}
      </div>

      {/* Load More Button */}
      {hasNextPage && (
        <div className="friend-request-list__load-more">
          <button 
            className="friend-request-list__load-more-btn"
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
      )}
    </div>
  );
};

export default FriendRequestList;
