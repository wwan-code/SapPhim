import React, { useState, useEffect, useContext, useRef, useCallback } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useDeviceType } from '@/hooks/useDeviceType';
import { AuthPopupContext } from '@/app/AppLayout';
import classNames from '@/utils/classNames';
import SearchBar from '@/components/search/SearchBar';
import CustomOverlayTrigger from '@/components/CustomTooltip/CustomOverlayTrigger';
import NotificationDropdown from '@/components/notifications/NotificationDropdown';
import UserDropdown from '@/components/navigation/UserDropdown';
import { useNotificationQueries } from '@/hooks/useNotificationQueries';
import { useNotificationStore } from '@/stores/notificationStore';
import { useDropdown } from '@/hooks/useDropdown';
import { getAvatarUrl } from '@/utils/getAvatarUrl';
import { NAV_ITEMS } from '@/config/navItems';
import { FaBars, FaUser, FaBell } from 'react-icons/fa';

import '@/assets/scss/components/layout/_header.scss';


const Header = ({ toggleSidebar }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  const { user, accessToken } = useSelector((state) => state.auth);
  const deviceType = useDeviceType();
  const { openAuthPopup } = useContext(AuthPopupContext);

  const { unreadCount } = useNotificationQueries();
  const { isDropdownOpen, toggleDropdown, closeDropdown } = useNotificationStore();


  const { isOpen: isUserMenuOpen, toggle: toggleUserMenu } = useDropdown();
  const userMenuTriggerRef = useRef(null);
  const notificationTriggerRef = useRef(null);
  const navContainerRef = useRef(null);
  const navRefs = useRef({});
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0, opacity: 0 });
  const [navShellState, setNavShellState] = useState('idle');
  const [previousPath, setPreviousPath] = useState(location.pathname);
  const [isHeaderFixed, setIsHeaderFixed] = useState(false);
  const [scrollDirection, setScrollDirection] = useState('up');
  const lastScrollY = useRef(0);

  const handleScroll = () => {
    const currentScrollY = window.scrollY;
    if (currentScrollY > lastScrollY.current) {
      setScrollDirection('down');
    } else {
      setScrollDirection('up');
    }
    if (currentScrollY > 0) {
      setIsHeaderFixed(true);
    } else {
      setIsHeaderFixed(false);
    }
    lastScrollY.current = currentScrollY;
  };

  useEffect(() => {
    let ticking = false;
    const scrollListener = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', scrollListener, { passive: true });
    return () => {
      window.removeEventListener('scroll', scrollListener);
    };
  }, []);

  const updateIndicatorPosition = useCallback(() => {
    if (!navContainerRef.current || deviceType !== 'desktop') return;

    const activeNavItem = NAV_ITEMS.primary.find(item => {
      if (item.path === '/') {
        return location.pathname === '/';
      }
      return location.pathname.startsWith(item.path);
    });

    if (!activeNavItem) return;

    const activeElement = navRefs.current[activeNavItem.path];
    if (!activeElement) return;

    const navOffsetLeft = activeElement.offsetLeft;
    const navWidth = activeElement.offsetWidth;

    requestAnimationFrame(() => {
      setIndicatorStyle({
        left: navOffsetLeft,
        width: navWidth,
        opacity: 1,
      });
    });

  }, [location.pathname, deviceType]);

  useEffect(() => {
    if (deviceType !== 'desktop') return;

    let timeoutId;

    const debouncedUpdate = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        requestAnimationFrame(updateIndicatorPosition);
      }, 10);
    };

    const attemptUpdate = (attempt = 0) => {
      const maxAttempts = 8;

      if (attempt >= maxAttempts) return;

      const hasRefs = Object.keys(navRefs.current).length > 0;

      if (hasRefs) {
        requestAnimationFrame(() => {
          requestAnimationFrame(updateIndicatorPosition);
        });
      } else {
        setTimeout(() => attemptUpdate(attempt + 1), attempt === 0 ? 0 : 30 * attempt);
      }
    };

    attemptUpdate();

    let resizeTimeoutId;
    const handleResize = () => {
      clearTimeout(resizeTimeoutId);
      resizeTimeoutId = setTimeout(() => {
        requestAnimationFrame(updateIndicatorPosition);
      }, 100);
    };

    window.addEventListener('resize', handleResize, { passive: true });
    return () => {
      clearTimeout(timeoutId);
      clearTimeout(resizeTimeoutId);
      window.removeEventListener('resize', handleResize);
    };
  }, [location.pathname, deviceType, updateIndicatorPosition]);

  useEffect(() => {
    if (previousPath === location.pathname || deviceType !== 'desktop') {
      setPreviousPath(location.pathname);
      return;
    }

    setNavShellState('warping');

    const settleTimer = setTimeout(() => {
      setNavShellState('settling');
    }, 180);

    const idleTimer = setTimeout(() => {
      setNavShellState('idle');
    }, 450);

    setPreviousPath(location.pathname);
    return () => {
      clearTimeout(settleTimer);
      clearTimeout(idleTimer);
    };
  }, [location.pathname, previousPath, deviceType]);

  return (
    <header
      className={classNames('header', {
        'header--fixed': isHeaderFixed,
        'header--scroll-down': scrollDirection === 'down',
        'header--scroll-up': scrollDirection === 'up'
      })}
      role="banner"
    >
      <div className="header__left">
        {deviceType !== 'desktop' && (
          <button
            className="header__hamburger-menu"
            onClick={toggleSidebar}
            aria-label="Mở menu điều hướng"
            aria-expanded={false}
          >
            <FaBars />
          </button>
        )}
        <Link to="/" className="header__logo" aria-label={`Trang chủ ${import.meta.env.VITE_APP_NAME}`}>
          <img src="/images/logo.png" alt={`${import.meta.env.VITE_APP_NAME} Logo`} />
        </Link>
      </div>
      {deviceType === 'desktop' && (
        <div className="header__center">
          <div className="header__search">
            <SearchBar />
          </div>
        </div>
      )}
      <div className="header__right">
        {deviceType === 'desktop' && (
          <nav
            className={classNames('header__nav', {
              'header__nav--warping': navShellState === 'warping',
              'header__nav--settling': navShellState === 'settling',
            })}
            aria-label="Điều hướng chính"
          >
            <ul ref={navContainerRef} className="header__nav-list">
              <span
                className="header__nav-indicator-pill"
                style={{
                  transform: `translateX(${indicatorStyle.left}px)`,
                  width: `${indicatorStyle.width}px`,
                  opacity: indicatorStyle.opacity,
                }}
                aria-hidden="true"
              />
              {NAV_ITEMS.primary.map((item) => {
                const isActive = item.path === '/'
                  ? location.pathname === '/'
                  : location.pathname.startsWith(item.path);
                return (
                  <li key={item.path}
                    ref={(el) => {
                      if (el) {
                        navRefs.current[item.path] = el;
                      }
                    }}
                    className="header__nav-item">
                    <NavLink
                      to={item.path}
                      className={classNames('header__nav-link', {
                        'header__nav-link--active': isActive,
                      })}
                      aria-label={item.label}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      {item.icon && (
                        <span className="header__nav-link-icon">
                          {React.createElement(item.icon)}
                        </span>
                      )}
                      <span className="header__nav-link-text">{item.label}</span>
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </nav>
        )}
        {accessToken ? (
          <>
            <div className="header__notification">
              <button
                ref={notificationTriggerRef}
                className="header__notification-btn"
                onClick={() => toggleDropdown()}
                aria-haspopup="dialog"
                aria-expanded={isDropdownOpen}
                aria-label={`Thông báo, ${unreadCount} chưa đọc`}
              >
                <div className="header__notification-btn-wrapper">
                  <FaBell />
                  {unreadCount > 0 && (
                    <span className="header__notification-badge">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </div>
              </button>
              <NotificationDropdown
                isOpen={isDropdownOpen}
                onClose={closeDropdown}
                triggerRef={notificationTriggerRef}
              />
            </div>
            <button
              className="user-dropdown__trigger"
              onClick={() => toggleUserMenu('header-user-menu')}
              aria-haspopup="menu"
              aria-expanded={isUserMenuOpen('header-user-menu')}
              aria-label="Mở menu người dùng"
              ref={userMenuTriggerRef}
            >
              <img
                src={getAvatarUrl(user)}
                alt={`${user?.username || 'User'}'s Avatar`}
                className="user-dropdown__avatar"
              />
            </button>
            <UserDropdown
              isOpen={isUserMenuOpen('header-user-menu')}
              onClose={() => toggleUserMenu('header-user-menu', false)}
              triggerRef={userMenuTriggerRef}
            />
          </>
        ) : (
          <CustomOverlayTrigger
            placement="bottom"
            tooltipId="tooltip-info"
            tooltip={<>Đăng nhập/đăng ký</>}
          >
            <button
              onClick={openAuthPopup}
              className="header__btn header__btn--auth"
              aria-label={`Đăng nhập vào ${import.meta.env.VITE_APP_NAME}`}
            >
              <FaUser /> Thành viên
            </button>
          </CustomOverlayTrigger>
        )}
      </div>
    </header>
  );
};

export default Header;