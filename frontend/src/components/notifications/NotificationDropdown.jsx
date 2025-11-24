import React, { useEffect, useRef, useCallback, useState, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { useNotificationQueries } from '@/hooks/useNotificationQueries';
import { useNotificationStore } from '@/hooks/stores/notificationStore';
import { useDeviceType } from '@/hooks/useDeviceType';
import { useFloatingDropdown } from '@/hooks/useFloatingDropdown';
import classNames from '@/utils/classnames';
import '@/assets/scss/components/notifications/_notification-dropdown.scss';
import NotificationItem from './NotificationItem';

const TABS = [
  { key: 'all', label: 'Tất cả' },
  { key: 'unread', label: 'Chưa đọc' },
  { key: 'system', label: 'Hệ thống' },
];


const NotificationDropdown = React.memo(({ isOpen, onClose, triggerRef }) => {
  const { activeTab, setActiveTab } = useNotificationStore();
  const {
    notifications,
    unreadCount,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    markAllAsRead,
  } = useNotificationQueries();

  const deviceType = useDeviceType();
  const observer = useRef();

  // 🌊 LIQUID GLASS TAB STATE
  const tabsContainerRef = useRef(null);
  const tabRefs = useRef({});
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0, opacity: 0 });
  const [tabShellState, setTabShellState] = useState('idle'); // 'idle' | 'warping' | 'settling'
  const [contentState, setContentState] = useState('visible'); // 'visible' | 'fading' | 'revealing'

  const {
    isMounted,
    refs,
    floatingStyles,
    getFloatingProps,
  } = useFloatingDropdown({
    isOpen,
    onOpenChange: onClose,
    placement: 'bottom-end',
    offset: 12,
  });

  // Set the external trigger ref
  useEffect(() => {
    refs.setReference(triggerRef.current);
  }, [refs, triggerRef]);

  // Disable body scroll when dropdown is open on mobile
  useEffect(() => {
    if (isOpen && deviceType === 'mobile') {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, deviceType]);

  // 🎯 LIQUID GLASS TAB ANIMATION ORCHESTRATION
  // Update indicator position on mount and when activeTab changes
  useEffect(() => {
    if (!isOpen || !tabsContainerRef.current) return;
    const updateIndicator = () => {
      const activeTabElement = tabRefs.current[activeTab];
      const containerElement = tabsContainerRef.current;
      if (!activeTabElement || !containerElement) return;
      const tabOffsetLeft = activeTabElement.offsetLeft;
      const tabWidth = activeTabElement.offsetWidth;
      setIndicatorStyle({ left: tabOffsetLeft, width: tabWidth, opacity: 1 });
    };
    updateIndicator();
    const timer1 = setTimeout(updateIndicator, 50);
    const timer2 = setTimeout(updateIndicator, 150);
    const handleResize = () => { requestAnimationFrame(updateIndicator); };
    window.addEventListener('resize', handleResize);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      window.removeEventListener('resize', handleResize);
    };
  }, [activeTab, isOpen]);

  // Handle tab change with orchestrated animation sequence
  const handleTabChange = useCallback((newTab) => {
    if (newTab === activeTab) return;
    setTabShellState('warping');
    setContentState('fading');
    setTimeout(() => { setActiveTab(newTab); }, 60);
    setTimeout(() => { setTabShellState('settling'); }, 180);
    setTimeout(() => { setContentState('revealing'); }, 220);
    setTimeout(() => {
      setTabShellState('idle');
      setContentState('visible');
    }, 450);
  }, [activeTab, setActiveTab]);

  // Memoized notifications for performance
  const memoNotifications = useMemo(() => notifications, [notifications]);

  // Logic for infinite scroll
  const lastNotificationElementRef = useCallback(
    (node) => {
      if (isFetchingNextPage) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasNextPage) {
          fetchNextPage();
        }
      });
      if (node) observer.current.observe(node);
    },
    [isFetchingNextPage, hasNextPage, fetchNextPage]
  );

  const handleMarkAllRead = useCallback(() => {
    if (unreadCount > 0) {
      markAllAsRead();
    }
  }, [unreadCount, markAllAsRead]);

  if (!isMounted) return null;

  return ReactDOM.createPortal(
    <div
      ref={refs.setFloating}
      style={floatingStyles}
      className={classNames('notification-dropdown', {
        'notification-dropdown--mobile': deviceType === 'mobile',
      })}
      data-open={isOpen}
      {...getFloatingProps()}
      role="dialog"
      aria-modal="true"
      aria-label="Thông báo"
    >
      <div className="notification-dropdown__content-wrapper">
        {/* Glass reflection layer */}
        <div className="notification-dropdown__glass-reflection" aria-hidden="true" />

        {/* Header */}
        <div className="notification-dropdown__header">
          <h3 className="notification-dropdown__title">Thông báo</h3>
          <div className="notification-dropdown__actions">
            {unreadCount > 0 && (
              <button
                className="notification-dropdown__action-btn"
                onClick={handleMarkAllRead}
                title="Đánh dấu tất cả đã đọc"
                aria-label="Đánh dấu tất cả đã đọc"
              >
                <i className="fas fa-check-double" />
              </button>
            )}
            <button
              className="notification-dropdown__action-btn"
              onClick={onClose}
              title="Đóng"
              aria-label="Đóng thông báo"
            >
              <i className="fas fa-times" />
            </button>
          </div>
        </div>

        {/* 🌊 LIQUID GLASS TABS */}
        <div
          ref={tabsContainerRef}
          className={classNames('notification-dropdown__tabs', {
            'notification-dropdown__tabs--warping': tabShellState === 'warping',
            'notification-dropdown__tabs--settling': tabShellState === 'settling',
          })}
          role="tablist"
        >
          {/* Animated Indicator - Glides with spring overshoot */}
          <span
            className="notification-dropdown__tab-indicator-pill"
            style={{
              transform: `translateX(${indicatorStyle.left}px)`,
              width: `${indicatorStyle.width}px`,
              opacity: indicatorStyle.opacity,
            }}
            aria-hidden="true"
          />

          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                ref={(el) => (tabRefs.current[tab.key] = el)}
                role="tab"
                aria-selected={isActive}
                className={classNames('notification-dropdown__tab', {
                  'notification-dropdown__tab--active': isActive,
                })}
                onClick={() => handleTabChange(tab.key)}
              >
                <span className="notification-dropdown__tab-label">
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Body - Content with delayed reveal */}
        <div
          className={classNames('notification-dropdown__content', {
            'notification-dropdown__content--fading': contentState === 'fading',
            'notification-dropdown__content--revealing': contentState === 'revealing',
          })}
          tabIndex={0}
          role="region"
          aria-label="Danh sách thông báo"
        >
          {isLoading && (
            <div className="notification-dropdown__skeleton">
              {Array.from({ length: 5 }).map((_, idx) => (
                <div className="notification-dropdown__skeleton-item" key={idx}>
                  <div className="notification-dropdown__skeleton-avatar" />
                  <div className="notification-dropdown__skeleton-lines">
                    <div className="notification-dropdown__skeleton-line" />
                    <div className="notification-dropdown__skeleton-line--short" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {isError && (
            <div className="notification-dropdown__error" role="alert">
              <i className="fas fa-exclamation-triangle" />
              <span>{error.message || 'Đã có lỗi xảy ra'}</span>
            </div>
          )}

          {!isLoading && !isError && memoNotifications.length === 0 && (
            <div className="notification-dropdown__empty">
              <i className="fas fa-bell-slash" />
              <p>Chưa có thông báo nào</p>
            </div>
          )}

          <ul className="notification-dropdown__list" role="listbox">
            {memoNotifications.map((notification, index) => {
              const ref = memoNotifications.length === index + 1 ? lastNotificationElementRef : null;
              return (
                <NotificationItem
                  ref={ref}
                  key={notification.id}
                  notification={notification}
                  onClose={onClose}
                />
              );
            })}
          </ul>

          {isFetchingNextPage && (
            <div className="notification-dropdown__loading-more">
              <i className="fas fa-spinner fa-spin" /> Đang tải thêm...
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
});

export default NotificationDropdown;