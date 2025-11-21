import React, { useRef, useEffect, useState, useCallback } from 'react';
import { FaHeart, FaUserFriends, FaHistory, FaInfoCircle } from 'react-icons/fa';
import classNames from '@/utils/classNames';

const ProfileTabs = ({ activeTab, setActiveTab, isOwnProfile = true }) => {
  const tabsRef = useRef(null);
  const activeTabRef = useRef(null);
  const tabRefs = useRef({});

  // 🌊 LIQUID GLASS TAB STATE
  const [indicatorStyle, setIndicatorStyle] = useState({ top: 0, left: 0, width: 0, height: 0, opacity: 0 });
  const [tabShellState, setTabShellState] = useState('idle'); // 'idle' | 'warping' | 'settling'

  const tabs = [
    { id: 'friends', label: 'Bạn bè', icon: <FaUserFriends />, ariaLabel: 'Xem danh sách bạn bè' },
    { id: 'favorites', label: 'Yêu thích', icon: <FaHeart />, ariaLabel: 'Xem danh sách phim yêu thích' },
    { id: 'history', label: 'Lịch sử', icon: <FaHistory />, ariaLabel: 'Xem lịch sử xem phim' },
    ...(isOwnProfile ? [
      { id: 'edit-profile', label: 'Thông tin', icon: <FaInfoCircle />, ariaLabel: 'Chỉnh sửa thông tin cá nhân' },
    ] : []),
  ];

  // 🎯 LIQUID GLASS TAB ANIMATION ORCHESTRATION
  // Update indicator position on mount and when activeTab changes
  useEffect(() => {
    if (!tabsRef.current) return;

    const updateIndicator = () => {
      const activeTabElement = tabRefs.current[activeTab];
      const containerElement = tabsRef.current;

      if (!activeTabElement || !containerElement) return;

      const isMobile = window.innerWidth < 768;

      if (isMobile) {
        // Horizontal movement on mobile
        const tabOffsetLeft = activeTabElement.offsetLeft;
        const tabWidth = activeTabElement.offsetWidth;

        setIndicatorStyle({
          left: tabOffsetLeft,
          top: 0,
          width: tabWidth,
          height: activeTabElement.offsetHeight,
          opacity: 1,
        });
      } else {
        // Vertical movement on desktop
        const tabOffsetTop = activeTabElement.offsetTop;
        const tabHeight = activeTabElement.offsetHeight;

        setIndicatorStyle({
          top: tabOffsetTop,
          left: 0,
          width: activeTabElement.offsetWidth,
          height: tabHeight,
          opacity: 1,
        });
      }
    };

    // Initial position with multiple attempts to ensure DOM is ready
    updateIndicator();
    const timer1 = setTimeout(updateIndicator, 50);
    const timer2 = setTimeout(updateIndicator, 150);
    
    // Update on window resize
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

  // Scroll active tab into view on mobile
  useEffect(() => {
    if (activeTabRef.current && tabsRef.current) {
      const container = tabsRef.current;
      const activeElement = activeTabRef.current;
      
      // Check if we're on mobile (horizontal scroll)
      const isMobile = window.innerWidth < 768;
      
      if (isMobile && container.scrollWidth > container.clientWidth) {
        const scrollLeft = activeElement.offsetLeft - (container.clientWidth / 2) + (activeElement.offsetWidth / 2);
        container.scrollTo({
          left: scrollLeft,
          behavior: 'smooth'
        });
      }
    }
  }, [activeTab]);

  // Handle tab change with orchestrated animation sequence
  const handleTabClick = useCallback((newTab) => {
    if (newTab === activeTab) return;

    // 1. WARP: Shell begins morphing
    setTabShellState('warping');

    // 2. GLIDE: Update active tab (triggers indicator animation)
    setTimeout(() => {
      setActiveTab(newTab);
    }, 60);

    // 3. SETTLE: Shell settling phase
    setTimeout(() => {
      setTabShellState('settling');
    }, 180);

    // 4. IDLE: Return to idle state
    setTimeout(() => {
      setTabShellState('idle');
    }, 450);
  }, [activeTab, setActiveTab]);

  const handleKeyDown = (event, tabId, index) => {
    const tabCount = tabs.length;
    let nextIndex = index;

    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        event.preventDefault();
        nextIndex = (index + 1) % tabCount;
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        event.preventDefault();
        nextIndex = (index - 1 + tabCount) % tabCount;
        break;
      case 'Home':
        event.preventDefault();
        nextIndex = 0;
        break;
      case 'End':
        event.preventDefault();
        nextIndex = tabCount - 1;
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        handleTabClick(tabId);
        return;
      default:
        return;
    }

    // Focus next tab
    const nextTab = tabs[nextIndex];
    const nextElement = tabsRef.current?.querySelector(`[data-tab-id="${nextTab.id}"]`);
    if (nextElement) {
      nextElement.focus();
    }
  };

  return (
    <nav className="profile-tabs" aria-label="Profile sections">
      <ul 
        className={classNames('profile-tabs__list', {
          'profile-tabs__list--warping': tabShellState === 'warping',
          'profile-tabs__list--settling': tabShellState === 'settling',
        })}
        role="tablist" 
        ref={tabsRef}
      >
        {/* Animated Indicator - Glides with spring overshoot */}
        <span
          className="profile-tabs__tab-indicator-pill"
          style={{
            transform: `translate(${indicatorStyle.left}px, ${indicatorStyle.top}px)`,
            width: `${indicatorStyle.width}px`,
            height: `${indicatorStyle.height}px`,
            opacity: indicatorStyle.opacity,
          }}
          aria-hidden="true"
        />

        {tabs.map((tab, index) => {
          const isActive = activeTab === tab.id;
          
          return (
            <li
              key={tab.id}
              role="tab"
              className={classNames('profile-tabs__item', { 
                'is-active': isActive,
              })}
              onClick={() => handleTabClick(tab.id)}
              ref={(el) => {
                tabRefs.current[tab.id] = el;
                if (isActive) activeTabRef.current = el;
              }}
              data-tab-id={tab.id}
              tabIndex={isActive ? 0 : -1}
              aria-selected={isActive}
              aria-controls={`${tab.id}-panel`}
              aria-label={tab.ariaLabel}
              onKeyDown={(e) => handleKeyDown(e, tab.id, index)}
            >
              <span className="profile-tabs__icon" aria-hidden="true">
                {tab.icon}
              </span>
              <span className="profile-tabs__label">{tab.label}</span>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default ProfileTabs;
