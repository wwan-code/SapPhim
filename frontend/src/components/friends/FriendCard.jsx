import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import classNames from '@/utils/classNames';
import {
  useSendFriendRequest,
  useAcceptFriendRequest,
  useRejectFriendRequest,
  useCancelFriendRequest,
  useRemoveFriend,
} from '@/hooks/useFriendQueries';
import { FaUserPlus, FaCheck, FaTimes, FaUserMinus, FaHourglassHalf, FaCommentDots } from 'react-icons/fa';
import { formatDistanceToNow } from '@/utils/dateUtils';
import { getAvatarUrl } from '@/utils/getAvatarUrl';
import '@/assets/scss/components/friends/_friend-card.scss';

const FriendCard = ({ user, type }) => {
  const navigate = useNavigate();
  const currentUser = useSelector((state) => state.auth.user);
  const friendStatus = useSelector((state) => state.friends.friendStatuses[user.id]);
  const [isHovered, setIsHovered] = useState(false);

  // Sử dụng các mutation hooks từ React Query
  const { mutate: sendRequest, isPending: isSending } = useSendFriendRequest();
  const { mutate: acceptRequest, isPending: isAccepting } = useAcceptFriendRequest();
  const { mutate: rejectRequest, isPending: isRejecting } = useRejectFriendRequest();
  const { mutate: cancelRequest, isPending: isCancelling } = useCancelFriendRequest();
  const { mutate: removeFriend, isPending: isRemoving } = useRemoveFriend();

  const isLoading = isSending || isAccepting || isRejecting || isRemoving || isCancelling;

  // Xử lý click vào username để điều hướng đến profile
  const handleUsernameClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (user.uuid) {
      navigate(`/profile/${user.uuid}`);
    }
  };

  const handleSendRequest = () => {
    sendRequest(user.id);
  };

  const handleAcceptRequest = () => {
    acceptRequest(user.friendshipId); // user.friendshipId sẽ là id của lời mời
  };

  const handleRejectRequest = () => {
    rejectRequest(user.friendshipId); // user.friendshipId sẽ là id của lời mời
  };



  const handleCancelRequest = () => {
    cancelRequest(user.friendshipId);
  };

  const handleRemoveFriend = () => {
    removeFriend(user.id);
  };

  const handleStartChat = () => {

  };

  const renderActions = () => {
    if (currentUser && currentUser.id === user.id) {
      return null; // Không hiển thị nút hành động cho chính người dùng
    }

    switch (user.friendshipStatus) {
      case 'none':
        return (
          <button
            className="friend-card__action-btn friend-card__action-btn--add"
            onClick={handleSendRequest}
            disabled={isLoading}
            title="Gửi lời mời kết bạn"
          >
            <FaUserPlus />
          </button>
        );
      case 'pending':
        if (type === 'pending') { // Người dùng hiện tại là receiver
          return (
            <>
              <button
                className="friend-card__action-btn friend-card__action-btn--accept"
                onClick={handleAcceptRequest}
                disabled={isLoading}
                title="Chấp nhận lời mời"
              >
                <FaCheck /> Chấp nhận
              </button>
              <button
                className="friend-card__action-btn friend-card__action-btn--reject"
                onClick={handleRejectRequest}
                disabled={isLoading}
                title="Từ chối lời mời"
              >
                <FaTimes /> Từ chối
              </button>
            </>
          );
        } else if (type === 'sent') { // Người dùng hiện tại là sender
          return (
            <button
              className="friend-card__action-btn friend-card__action-btn--reject"
              onClick={handleCancelRequest}
              disabled={isLoading}
              title="Hủy lời mời"
            >
              <FaTimes /> Hủy lời mời
            </button>
          );
        }
        return null;
      case 'accepted':
        return (
          <>
            <button
              className="friend-card__action-btn friend-card__action-btn--chat"
              onClick={handleStartChat}
              disabled={isLoading}
              title="Nhắn tin"
            >
              <FaCommentDots />
            </button>
            <button
              className="friend-card__action-btn friend-card__action-btn--remove"
              onClick={handleRemoveFriend}
              disabled={isLoading}
              title="Hủy kết bạn"
            >
              <FaUserMinus />
            </button>
          </>
        );
      case 'rejected':
        return (
          <button
            className="friend-card__action-btn friend-card__action-btn--add"
            onClick={handleSendRequest}
            disabled={isLoading}
            title="Gửi lại lời mời kết bạn"
          >
            <FaUserPlus />
          </button>
        );
      case 'cancelled': // Nếu người gửi hủy lời mời
        return (
          <button
            className="friend-card__action-btn friend-card__action-btn--add"
            onClick={handleSendRequest}
            disabled={isLoading}
            title="Gửi lời mời kết bạn"
          >
            <FaUserPlus />
          </button>
        );
      default:
        return null;
    }
  };

  const baseHidden = !!user.hidden;
  const baseOnline = baseHidden ? false : !!user.online;
  const baseLastOnline = baseHidden ? null : user.lastOnline;

  const hiddenStatus = friendStatus?.hidden ?? baseHidden;
  const effectiveOnline = hiddenStatus ? false : (friendStatus?.online ?? baseOnline);
  const effectiveLastOnline = hiddenStatus ? null : (friendStatus?.lastOnline ?? baseLastOnline);

  const statusTitle = hiddenStatus
    ? 'Người dùng đã ẩn trạng thái online.'
    : effectiveOnline
      ? 'Đang online'
      : `Offline — lần cuối ${effectiveLastOnline ? formatDistanceToNow(effectiveLastOnline) : 'không rõ'}`;

  return (
    <article
      className={classNames('friend-card', {
        'friend-card--hovered': isHovered,
        'friend-card--loading': isLoading,
      })}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="friend-card__header">
        <div
          className="friend-card__avatar-wrapper"
          onClick={handleUsernameClick}
          role="button"
          tabIndex={0}
          aria-label={`Xem trang cá nhân của ${user.username}`}
        >
          <img
            src={getAvatarUrl(user)}
            alt={`${user.username}'s avatar`}
            className="friend-card__avatar"
            loading="lazy"
          />
          <span
            className={classNames('friend-card__status-indicator', {
              'friend-card__status-indicator--online': effectiveOnline,
              'friend-card__status-indicator--offline': !effectiveOnline,
              'friend-card__status-indicator--hidden': hiddenStatus,
            })}
            title={statusTitle}
            aria-label={hiddenStatus ? 'Đang ẩn trạng thái' : effectiveOnline ? 'Đang online' : 'Đang offline'}
          />
        </div>

        <div className="friend-card__info">
          <h3
            className="friend-card__username"
            onClick={handleUsernameClick}
            title="Xem trang cá nhân"
          >
            {user.username}
          </h3>
          {user.friendshipStatus && user.friendshipStatus !== 'none' && (
            <p className="friend-card__status-text">
              {
                user.friendshipStatus === 'pending' ? 'Đang chờ' :
                  user.friendshipStatus === 'accepted' ? 'Bạn bè' :
                    user.friendshipStatus === 'rejected' ? 'Đã từ chối' :
                      user.friendshipStatus === 'cancelled' ? 'Đã hủy' : ''
              }
            </p>
          )}
        </div>
      </div>

      {renderActions() && (
        <div className="friend-card__actions">
          {renderActions()}
        </div>
      )}
    </article>
  );
};

export default FriendCard;
