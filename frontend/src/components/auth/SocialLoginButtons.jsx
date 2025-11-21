import React from 'react';
import PropTypes from 'prop-types';
import { FaGoogle, FaFacebookF, FaGithub } from 'react-icons/fa';

/**
 * SocialLoginButtons Component
 * 
 * Hiển thị các nút đăng nhập bằng mạng xã hội (Google, Facebook, GitHub)
 * với accessible labels và disabled states.
 */
const SocialLoginButtons = ({ onSocialLogin, loading }) => {
  const socialProviders = [
    {
      name: 'google',
      Icon: FaGoogle,
      label: 'Đăng nhập với Google',
      className: 'btn-google',
    },
    {
      name: 'facebook',
      Icon: FaFacebookF,
      label: 'Đăng nhập với Facebook',
      className: 'btn-facebook',
    },
    {
      name: 'github',
      Icon: FaGithub,
      label: 'Đăng nhập với GitHub',
      className: 'btn-github',
    },
  ];

  return (
    <div className="auth-popup__social-login">
      <p className="auth-popup__social-text">Hoặc tiếp tục với</p>
      <div className="auth-popup__social-buttons">
        {socialProviders.map((provider) => {
          const { Icon } = provider;
          return (
            <button
              key={provider.name}
              type="button"
              className={`btn btn-social ${provider.className}`}
              onClick={() => onSocialLogin(provider.name)}
              disabled={loading}
              aria-label={provider.label}
              title={provider.label}
            >
              <Icon />
            </button>
          );
        })}
      </div>
    </div>
  );
};

SocialLoginButtons.propTypes = {
  onSocialLogin: PropTypes.func.isRequired,
  loading: PropTypes.bool,
};

SocialLoginButtons.defaultProps = {
  loading: false,
};

export default SocialLoginButtons;
