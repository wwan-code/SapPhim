import React, { useMemo, useState } from 'react';
import { FaMars, FaVenus, FaGenderless, FaGithub, FaTwitter, FaInstagram, FaFacebook, FaCamera } from 'react-icons/fa';
import { useSelector } from 'react-redux';
import classNames from '@/utils/classNames';
import { formatDistanceToNow } from '@/utils/dateUtils';
import { getAvatarUrl } from '@/utils/getAvatarUrl';
import { exportUserToPdf } from '@/utils/exportUserPdf';
import ProfileTabs from './ProfileTabs';
import UploadCoverModal from './modals/UploadCoverModal';
import AvatarMenu from './menus/AvatarMenu';

const ProfileSidebar = ({ user: propUser, activeTab, setActiveTab, isOwnProfile = true }) => {
  const { user: authUser } = useSelector((state) => state.auth);
  const user = propUser || authUser;

  const [isCoverModalOpen, setIsCoverModalOpen] = useState(false);

  const socialIcons = {
    github: <FaGithub />,
    twitter: <FaTwitter />,
    instagram: <FaInstagram />,
    facebook: <FaFacebook />,
  };

  const socialLabels = {
    github: 'GitHub',
    twitter: 'Twitter',
    instagram: 'Instagram',
    facebook: 'Facebook',
  };

  // Helper function to shorten URL for display
  const getShortenedUrl = (url) => {
    if (!url) return '';
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname.replace(/\/$/, ''); // Remove trailing slash
      const parts = pathname.split('/').filter(Boolean);
      return parts.length > 0 ? parts[parts.length - 1] : urlObj.hostname;
    } catch {
      return url;
    }
  };

  const getGenderIcon = (gender) => {
    const className = classNames('profile-sidebar__gender-icon', {
      male: gender === 'nam',
      female: gender === 'nữ',
      other: gender !== 'nam' && gender !== 'nữ',
    });

    if (gender === 'nam') return <FaMars className={className} />;
    if (gender === 'nữ') return <FaVenus className={className} />;
    return <FaGenderless className={className} />;
  };

  const coverImageUrl = user?.coverUrl
    ? `${import.meta.env.VITE_SERVER_URL}${user.coverUrl}`
    : 'https://placehold.co/1200x300?text=Cover+Image';

  const hasSocialLinks = user?.socialLinks && Object.values(user.socialLinks).some((link) => link);

  const statusText = useMemo(() => {
    if (!user) return '';
    return user.online ? 'Online' : `Offline — lần cuối ${user.lastOnline ? formatDistanceToNow(user.lastOnline) : 'không rõ'}`;
  }, [user]);

  return (
    <aside className="profile-sidebar">
      <div className="profile-sidebar__cover" style={{ backgroundImage: `url(${coverImageUrl})` }}>
        {isOwnProfile && (
          <button
            className="profile-sidebar__cover-edit-btn"
            onClick={() => setIsCoverModalOpen(true)}
            aria-label="Thay đổi ảnh bìa"
          >
            <FaCamera />
          </button>
        )}
        <AvatarMenu className="profile-sidebar__avatar-wrapper">
            <img src={getAvatarUrl(user)} alt="Avatar" className="profile-sidebar__avatar" />
            <span
              className={classNames('profile-sidebar__status', {
                'profile-sidebar__status--online': user?.online,
                'profile-sidebar__status--offline': !user?.online,
              })}
              title={statusText}
            ></span>
        </AvatarMenu>
      </div>
      <div className="profile-sidebar__info">
        <h3 className="profile-sidebar__username">
          {user?.username || 'Username'}
          {user?.sex && getGenderIcon(user.sex)}
        </h3>
        <p className="profile-sidebar__bio" dangerouslySetInnerHTML={{ __html: user?.bio || 'Chưa có tiểu sử' }}></p>
        
        {/* Social Links inline in info section */}
        {hasSocialLinks && (
          <div className="profile-sidebar__social-links">
            {Object.entries(user.socialLinks).map(([key, value]) =>
              value ? (
                <a
                  key={key}
                  href={value}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={classNames('profile-sidebar__social-item', `social-item--${key}`)}
                  title={`${socialLabels[key]}: ${value}`}
                >
                  <span className="social-item__icon">{socialIcons[key]}</span>
                  <span className="social-item__text">{getShortenedUrl(value)}</span>
                </a>
              ) : null
            )}
          </div>
        )}
      </div>
      <div className="profile-sidebar__tabs">
        <ProfileTabs
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isOwnProfile={isOwnProfile}
        />
      </div>
      {isOwnProfile && (
        <UploadCoverModal isOpen={isCoverModalOpen} onClose={() => setIsCoverModalOpen(false)} />
      )}
    </aside>
  );
};

export default ProfileSidebar;
