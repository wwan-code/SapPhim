import React, { useRef, useEffect, useState, useCallback } from 'react';
import classNames from '@/utils/classNames';
import { useFriendStore } from '@/hooks/stores/useFriendStore';
import FriendList from '@/components/friends/FriendList';
import FriendRequestList from '@/components/friends/FriendRequestList';
import FriendSearch from '@/components/friends/FriendSearch';
import '@/assets/scss/components/friends/_friends-tab.scss';

const FriendsTab = ({ user, isOwnProfile = true }) => {
  const { activeTab, setActiveTab } = useFriendStore();

  const tabsContainerRef = useRef(null);
  const tabRefs = useRef({});
  const [indicatorStyle, setIndicatorStyle] = useState({ top: 0, left: 0, width: 0, height: 0, opacity: 0 });
  const [tabShellState, setTabShellState] = useState('idle');

  const subTabs = isOwnProfile ? [
    { id: 'friends-list', label: 'Bạn bè', icon: 'fas fa-user-friends' },
    { id: 'pending-requests', label: 'Lời mời đang chờ', icon: 'fas fa-user-clock' },
    { id: 'sent-requests', label: 'Lời mời đã gửi', icon: 'fas fa-paper-plane' },
    { id: 'friend-search', label: 'Tìm kiếm', icon: 'fas fa-search' },
  ] : [
    { id: 'friends-list', label: 'Bạn bè', icon: 'fas fa-user-friends' },
  ];

  useEffect(() => {
    if (!tabsContainerRef.current) return;

    const updateIndicator = () => {
      const activeTabElement = tabRefs.current[activeTab];
      const containerElement = tabsContainerRef.current;

      if (!activeTabElement || !containerElement) return;

      const tabHeight = activeTabElement.offsetHeight;
      const tabOffsetLeft = activeTabElement.offsetLeft;
      setIndicatorStyle({
        left: tabOffsetLeft,
        width: activeTabElement.offsetWidth,
        height: tabHeight,
        opacity: 1,
      });
    };

    updateIndicator();
    const timer1 = setTimeout(updateIndicator, 50);
    const timer2 = setTimeout(updateIndicator, 150);

    const handleResize = () => {
      requestAnimationFrame(updateIndicator);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      window.removeEventListener('resize', handleResize);
    };
  }, [activeTab]);

  const handleTabClick = useCallback((newTab) => {
    if (newTab === activeTab) return;

    setTabShellState('warping');

    setTimeout(() => {
      setActiveTab(newTab);
    }, 60);

    setTimeout(() => {
      setTabShellState('settling');
    }, 180);

    setTimeout(() => {
      setTabShellState('idle');
    }, 450);
  }, [activeTab, setActiveTab]);

  const renderSubTabContent = () => {
    switch (activeTab) {
      case 'friends-list':
        return <FriendList user={user} isOwnProfile={isOwnProfile} />;
      case 'pending-requests':
        return <FriendRequestList type="pending" />;
      case 'sent-requests':
        return <FriendRequestList type="sent" />;
      case 'friend-search':
        return <FriendSearch />;
      default:
        return null;
    }
  };

  return (
    <div className="friends-tab">
      <nav className="friends-tab__header">
        <ul
          ref={tabsContainerRef}
          className={classNames('friends-tab__nav', {
            'friends-tab__nav--warping': tabShellState === 'warping',
            'friends-tab__nav--settling': tabShellState === 'settling',
          })}
          role="tablist"
        >
          <span
            className="friends-tab__indicator-pill"
            style={{
              transform: `translateX(${indicatorStyle.left}px)`,
              width: `${indicatorStyle.width}px`,
              height: `${indicatorStyle.height}px`,
              opacity: indicatorStyle.opacity,
            }}
            aria-hidden="true"
          />

          {subTabs.map((tab) => {
            const isActive = activeTab === tab.id;

            return (
              <li
                key={tab.id}
                role="tab"
                ref={(el) => (tabRefs.current[tab.id] = el)}
                className={classNames('friends-tab__nav-item', {
                  'is-active': isActive
                })}
                onClick={() => handleTabClick(tab.id)}
                aria-selected={isActive}
                aria-controls={`${tab.id}-panel`}
                tabIndex={isActive ? 0 : -1}
              >
                <i className={classNames('friends-tab__nav-icon', tab.icon)} aria-hidden="true" />
                <span className="friends-tab__nav-label">{tab.label}</span>
              </li>
            );
          })}
        </ul>
      </nav>

      <div
        className="friends-tab__content"
        role="tabpanel"
        id={`${activeTab}-panel`}
      >
        {renderSubTabContent()}
      </div>
    </div>
  );
};

export default FriendsTab;
