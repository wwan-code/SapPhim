import React from 'react';
import '@/assets/scss/components/friends/_friend-card-skeleton.scss';

const FriendCardSkeleton = () => {
  return (
    <div className="friend-card-skeleton">
      {/* Glass Reflection Layer */}
      <div className="friend-card-skeleton__glass-reflection" aria-hidden="true" />
      
      <div className="friend-card-skeleton__header">
        <div className="friend-card-skeleton__avatar-wrapper">
          <div className="friend-card-skeleton__avatar" />
          <div className="friend-card-skeleton__status" />
        </div>
        
        <div className="friend-card-skeleton__info">
          <div className="friend-card-skeleton__username" />
          <div className="friend-card-skeleton__status-text" />
        </div>
      </div>
      
      <div className="friend-card-skeleton__actions">
        <div className="friend-card-skeleton__action-btn" />
        <div className="friend-card-skeleton__action-btn friend-card-skeleton__action-btn--small" />
      </div>
    </div>
  );
};

export default FriendCardSkeleton;
