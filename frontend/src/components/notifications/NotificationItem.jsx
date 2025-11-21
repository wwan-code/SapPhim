/**
 * 🌊 LIQUID GLASS NOTIFICATION ITEM
 * 
 * Features:
 * - Glass surface with hover bend effect
 * - Ripple animation on interaction
 * - Parallax depth on hover
 * - Smooth micro-interactions
 * - Accessibility compliant
 */

import React, { forwardRef, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotificationQueries } from '@/hooks/useNotificationQueries';
import { formatDistanceToNow } from '@/utils/dateUtils';
import classNames from '@/utils/classNames';
import '@/assets/scss/components/notifications/_notification-item.scss';

// Map loại thông báo với icon FontAwesome tương ứng
const iconByType = {
  friend_request: 'fas fa-user-plus',
  friend_request_status: 'fas fa-user-check',
  new_comment: 'fas fa-comment-dots',
  movie_update: 'fas fa-film',
  system_message: 'fas fa-info-circle',
  new_follower: 'fas fa-users',
  comment_report: 'fas fa-flag',
  user_mention: 'fas fa-at',
  like_comment: 'fas fa-heart',
  default: 'fas fa-bell',
};

const NotificationItem = forwardRef(({ notification, onClose }, ref) => {
  const navigate = useNavigate();
  const { markAsRead, deleteNotification } = useNotificationQueries();

  // Ripple effect state
  const [ripples, setRipples] = useState([]);

  // Xử lý khi click vào toàn bộ item
  const handleItemClick = useCallback((e) => {
    // Create ripple effect
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const ripple = {
      x,
      y,
      id: Date.now(),
    };
    
    setRipples(prev => [...prev, ripple]);
    
    // Remove ripple after animation
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== ripple.id));
    }, 600);

    // Tự động đánh dấu đã đọc khi click nếu chưa đọc
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    // Điều hướng nếu có link
    if (notification.link) {
      navigate(notification.link);
      onClose?.(); // Đóng dropdown sau khi điều hướng
    }
  }, [notification, markAsRead, navigate, onClose]);

  // Xử lý khi click nút xóa
  const handleDeleteClick = useCallback((e) => {
    e.stopPropagation(); // Ngăn không cho sự kiện click của item cha chạy
    deleteNotification(notification.id);
  }, [notification.id, deleteNotification]);

  // Xác định avatar và icon
  const senderAvatar = notification.sender?.avatarUrl
    ? notification.sender.avatarUrl?.startsWith('http') ? notification.sender.avatarUrl : `${import.meta.env.VITE_SERVER_URL}${notification.sender.avatarUrl}`
    : null;
  const typeIcon = iconByType[notification.type] || iconByType.default;

  return (
    <li
      ref={ref}
      className={classNames('notification-item', {
        'notification-item--unread': !notification.isRead,
      })}
      onClick={handleItemClick}
      role="listitem"
      tabIndex={0}
      aria-label={`Thông báo: ${notification.title}`}
    >
      {/* Glass reflection layer */}
      <div className="notification-item__glass-reflection" aria-hidden="true" />
      
      {/* Ripple effects */}
      {ripples.map(ripple => (
        <span
          key={ripple.id}
          className="notification-item__ripple"
          style={{
            left: `${ripple.x}px`,
            top: `${ripple.y}px`,
          }}
          aria-hidden="true"
        />
      ))}

      <div className="notification-item__avatar-container">
        {senderAvatar ? (
          <img
            src={senderAvatar}
            alt={notification.sender?.username || 'Sender'}
            className="notification-item__avatar"
          />
        ) : (
          <div className="notification-item__icon-wrapper">
            <i className={typeIcon} aria-hidden="true" />
          </div>
        )}
      </div>

      <div className="notification-item__content">
        {/* Sử dụng dangerouslySetInnerHTML nếu title/body chứa HTML đã được sanitize từ BE */}
        <p className="notification-item__body">{notification.body}</p>
        <span className="notification-item__time">
          {formatDistanceToNow(new Date(notification.createdAt))}
        </span>
      </div>

      <div className="notification-item__actions">
        <button
          className="notification-item__btn notification-item__btn--delete"
          onClick={handleDeleteClick}
          title="Xóa thông báo"
          aria-label="Xóa thông báo"
        >
          <i className="fas fa-times" />
        </button>
        {!notification.isRead && (
          <div className="notification-item__unread-indicator" title="Chưa đọc" />
        )}
      </div>
    </li>
  );
});

NotificationItem.displayName = 'NotificationItem';

export default NotificationItem;
