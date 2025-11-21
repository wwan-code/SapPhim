import React, { memo } from 'react';
import ReactDOM from 'react-dom';
import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '@/store/slices/authSlice';
import { useTheme } from '@/hooks/useTheme';
import { useDeviceType } from '@/hooks/useDeviceType';
import { useFloatingDropdown } from '@/hooks/useFloatingDropdown';
import { getAvatarUrl } from '@/utils/getAvatarUrl';
import classNames from '@/utils/classnames';
import '@/assets/scss/components/navigation/_user-dropdown.scss';

const UserDropdown = ({ isOpen, onClose, triggerRef }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { theme, toggleTheme } = useTheme();
  const deviceType = useDeviceType();

  const {
    isMounted,
    refs,
    floatingStyles,
    getFloatingProps,
  } = useFloatingDropdown({
    isOpen,
    onOpenChange: onClose,
    placement: 'bottom-end',
    offset: 12, // Add a bit more gap from the trigger
  });

  // Set the external trigger ref
  React.useEffect(() => {
    refs.setReference(triggerRef.current);
  }, [refs, triggerRef]);

  // Disable body scroll when dropdown is open on mobile
  React.useEffect(() => {
    if (isOpen && deviceType === 'mobile') {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, deviceType]);

  const handleLogout = () => {
    dispatch(logout());
    onClose();
  };

  const handleMenuItemClick = () => {
    onClose();
  };

  if (!isMounted) {
    return null;
  }

  return ReactDOM.createPortal(
    <div
      ref={refs.setFloating}
      style={floatingStyles}
      className={classNames('user-dropdown__content', {
        'user-dropdown__content--mobile': deviceType === 'mobile',
      })}
      data-open={isOpen}
      {...getFloatingProps()}
      role="menu"
      aria-orientation="vertical"
      aria-labelledby="user-menu-button"
    >
      <div className="user-dropdown__content-wrapper">
        <div className="user-dropdown__header">
          <div className="user-dropdown__header-main">
            <img
              src={getAvatarUrl(user)}
              alt={`${user?.username || 'User'}'s Avatar`}
              className="user-dropdown__header-avatar"
            />
            <div className="user-dropdown__header-info">
              <h3 className="user-dropdown__title">{user?.username || 'User'}</h3>
              <p className="user-dropdown__subtitle">{user?.email || 'user@example.com'}</p>
            </div>
          </div>
          {deviceType === 'mobile' && (
            <button
              className="user-dropdown__close-btn"
              onClick={onClose}
              aria-label="Đóng menu"
            >
              <i className="fas fa-times" />
            </button>
          )}
        </div>

        <ul className="user-dropdown__menu" role="none">
          <li className="user-dropdown__menu-item" role="none">
            <Link
              role="menuitem"
              to="/profile"
              className="user-dropdown__menu-link"
              onClick={handleMenuItemClick}
              tabIndex={isOpen ? 0 : -1}
            >
              <i className="fas fa-user-circle"></i>
              <span>Hồ sơ</span>
            </Link>
          </li>

          <li className="user-dropdown__menu-item" role="none">
            <Link
              role="menuitem"
              to="/settings"
              className="user-dropdown__menu-link"
              onClick={handleMenuItemClick}
              tabIndex={isOpen ? 0 : -1}
            >
              <i className="fas fa-cog"></i>
              <span>Cài đặt</span>
            </Link>
          </li>

          {user?.roles?.find(role => role.name === 'admin' || role.name === 'editor') && (
            <li className="user-dropdown__menu-item" role="none">
              <Link
                role="menuitem"
                to="/admin/dashboard"
                className="user-dropdown__menu-link"
                onClick={handleMenuItemClick}
                tabIndex={isOpen ? 0 : -1}
              >
                <i className="fas fa-tachometer-alt"></i>
                <span>Trang quản trị</span>
              </Link>
            </li>
          )}

          <li className="user-dropdown__menu-item" role="none">
            <button
              role="menuitem"
              className="user-dropdown__menu-button"
              onClick={toggleTheme}
              tabIndex={isOpen ? 0 : -1}
            >
              {theme === 'light' ? (
                <>
                  <i className="fas fa-moon"></i>
                  <span>Giao diện tối</span>
                </>
              ) : (
                <>
                  <i className="fas fa-sun"></i>
                  <span>Giao diện sáng</span>
                </>
              )}
            </button>
          </li>

          <li className="user-dropdown__menu-item" role="none">
            <button
              role="menuitem"
              className="user-dropdown__menu-button user-dropdown__menu-button--danger"
              onClick={handleLogout}
              tabIndex={isOpen ? 0 : -1}
            >
              <i className="fas fa-sign-out-alt"></i>
              <span>Đăng xuất</span>
            </button>
          </li>
        </ul>
      </div>
    </div>,
    document.body
  );
};

export default memo(UserDropdown);
