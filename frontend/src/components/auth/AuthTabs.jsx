import React, { useState, useRef, useEffect, useCallback } from 'react';
import classNames from '@/utils/classNames';
import '@/assets/scss/components/auth/_auth-tabs.scss';

const TABS = [
  { key: 'login', label: 'Đăng nhập' },
  { key: 'register', label: 'Đăng ký' },
];

const AuthTabs = ({ activeTab, onTabChange, setContentState, setTabShellState, tabShellState }) => {
  const tabsContainerRef = useRef(null);
  const tabRefs = useRef({});
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0, opacity: 0 });

  useEffect(() => {
    const updateIndicator = () => {
      const activeTabElement = tabRefs.current[activeTab];
      const containerElement = tabsContainerRef.current;

      if (!activeTabElement || !containerElement) return;
      const left = activeTabElement.offsetLeft;
      const width = activeTabElement.offsetWidth;

      setIndicatorStyle({ left, width, opacity: 1 });
    };

    const initialTimeout = setTimeout(updateIndicator, 50);
    window.addEventListener('resize', updateIndicator);

    return () => {
      clearTimeout(initialTimeout);
      window.removeEventListener('resize', updateIndicator);
    };
  }, [activeTab]);

  const handleTabClick = useCallback((newTab) => {
    if (newTab === activeTab) return;

    setTabShellState('warping');
    setContentState('fading');

    setTimeout(() => {
      onTabChange(newTab);
    }, 60);

    setTimeout(() => {
      setTabShellState('settling');
    }, 180);

    setTimeout(() => {
      setContentState('revealing');
    }, 220);

    setTimeout(() => {
      setTabShellState('idle');
      setContentState('visible');
    }, 450);
  }, [activeTab, onTabChange, setContentState, setTabShellState]);

  return (
    <div
      ref={tabsContainerRef}
      className="auth-tabs"
      data-state={tabShellState}
      role="tablist"
    >
      <div
        className="auth-tabs__indicator"
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
            className={classNames('auth-tabs__tab-button', {
              'auth-tabs__tab-button--active': isActive,
            })}
            onClick={() => handleTabClick(tab.key)}
            role="tab"
            aria-selected={isActive}
          >
            <span className="auth-tabs__label">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default AuthTabs;
