import React, { useEffect, useRef, useMemo } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import classNames from '@/utils/classNames';
import { NAV_ITEMS, getVisibleNavItems, isRouteActive } from '@/config/navItems';
import SearchBar from '@/components/search/SearchBar';
import '@/assets/scss/components/layout/_sidebar.scss';

const SIDEBAR_STORAGE_KEY = 'wwan:sidebar:open';

/**
 * Sidebar Component - Navigation chính với Liquid Glass Effect
 * 
 * Features:
 * - CSS-only animated indicator pill (không cần JS đo lường)
 * - Frosted glass backdrop với blur effect
 * - Staggered animation khi mở sidebar
 * - Keyboard navigation (Tab, Escape)
 * - Persistent state với localStorage
 * - Fully accessible (ARIA, focus management)
 */
const Sidebar = ({ isOpen, toggleSidebar }) => {
  const { user } = useSelector((state) => state.auth);
  const location = useLocation();

  // ============================================================================
  // REFS
  // ============================================================================
  
  const sidebarRef = useRef(null);
  const contentRef = useRef(null);
  const backdropRef = useRef(null);

  // ============================================================================
  // MEMOIZED VALUES
  // ============================================================================
  
  // Danh sách nav items hiển thị dựa trên user permissions
  const visibleNavItems = useMemo(() => getVisibleNavItems(user), [user]);

  // ============================================================================
  // EFFECTS
  // ============================================================================
  
  /**
   * Effect 1: Persist sidebar state vào localStorage
   */
  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_STORAGE_KEY, JSON.stringify(isOpen));
    } catch (error) {
      console.warn('[Sidebar] localStorage write error:', error);
    }
  }, [isOpen]);

  /**
   * Effect 2: Keyboard navigation (Tab trap, Escape)
   */
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      // ESC: Đóng sidebar
      if (e.key === 'Escape') {
        e.preventDefault();
        toggleSidebar();
        return;
      }

      // TAB: Trap focus trong sidebar
      if (e.key === 'Tab') {
        const focusableElements = contentRef.current?.querySelectorAll(
          'a, button, input, [tabindex]:not([tabindex="-1"])'
        );

        if (!focusableElements?.length) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          // SHIFT+TAB: Từ first -> last
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement?.focus();
          }
        } else {
          // TAB: Từ last -> first
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement?.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, toggleSidebar]);

  // ============================================================================
  // RENDER
  // ============================================================================
  
  return (
    <div
      ref={sidebarRef}
      className={classNames('sidebar', {
        'sidebar--open': isOpen,
      })}
      role="complementary"
      aria-label="Điều hướng chính"
    >
      {/* ===== BACKDROP ===== */}
      <div
        ref={backdropRef}
        className="sidebar__backdrop"
        onClick={toggleSidebar}
        aria-hidden="true"
        role="presentation"
      />

      {/* ===== CONTENT SHELL ===== */}
      <div
        ref={contentRef}
        className="sidebar__content"
        role="region"
        aria-label="Nội dung điều hướng"
      >
        {/* ===== HEADER: Logo + Close Button ===== */}
        <div className="sidebar__header">
          <Link
            to="/"
            className="sidebar__logo"
            onClick={toggleSidebar}
            aria-label={`Trang chủ ${import.meta.env.VITE_APP_NAME}`}
          >
            <img
              src="/images/logo.png"
              alt={`${import.meta.env.VITE_APP_NAME} Logo`}
              className="sidebar__logo-img"
            />
          </Link>
          
          <button
            className="sidebar__close-btn"
            onClick={toggleSidebar}
            aria-label="Đóng menu điều hướng"
            title="Đóng (ESC)"
          >
            <i className="fas fa-times" aria-hidden="true"></i>
          </button>
        </div>

        {/* ===== SEARCH BAR ===== */}
        <div className="sidebar__search">
          <SearchBar />
        </div>

        {/* ===== NAVIGATION ===== */}
        <nav className="sidebar__nav" aria-label="Danh mục chính">
          <div className="sidebar__nav-container">
            {/* ===== NAV ITEMS LIST ===== */}
            <ul className="sidebar__nav-list" role="list">
              {visibleNavItems.map((item, index) => {
                const isActive = isRouteActive(
                  item.path, 
                  location.pathname, 
                  item.exact
                );

                return (
                  <li 
                    key={item.path}
                    style={{ '--stagger-index': index }} // CSS variable cho stagger animation
                    role="none"
                  >
                    <NavLink
                      to={item.path}
                      onClick={toggleSidebar}
                      className={({ isActive: linkIsActive }) =>
                        classNames('sidebar__nav-link', {
                          'sidebar__nav-link--active': linkIsActive,
                        })
                      }
                      aria-current={isActive ? 'page' : undefined}
                    >
                      {/* Icon: SVG hoặc FontAwesome */}
                      {item.svg ? (
                        <span className="sidebar__nav-icon sidebar__nav-icon--svg">
                          {item.svg}
                        </span>
                      ) : item.icon ? (
                        <i 
                          className={classNames('sidebar__nav-icon', item.icon)}
                          aria-hidden="true"
                        ></i>
                      ) : null}

                      {/* Label */}
                      <span className="sidebar__nav-label">{item.label}</span>
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>

        {/* ===== FOOTER: Copyright + Social Links ===== */}
        <div className="sidebar__footer">
          <div className="sidebar__footer-info">
            <p>
              &copy; {new Date().getFullYear()} {import.meta.env.VITE_APP_NAME}. 
              All rights reserved.
            </p>
            <p>Liên hệ: support@wwan.com</p>
          </div>

          <div className="sidebar__social-links" aria-label="Liên kết xã hội">
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              title="Truy cập Facebook"
            >
              <i className="fab fa-facebook-f" aria-hidden="true"></i>
            </a>
            <a
              href="https://discord.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Discord"
              title="Truy cập Discord"
            >
              <i className="fab fa-discord" aria-hidden="true"></i>
            </a>
            <a
              href="https://youtube.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="YouTube"
              title="Truy cập YouTube"
            >
              <i className="fab fa-youtube" aria-hidden="true"></i>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;