import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import AuthTabs from './AuthTabs';
import SocialLoginButtons from './SocialLoginButtons';
import FileDropzone from './FileDropzone';
import ImportEntriesModal from './ImportEntriesModal';
import ImportGuideIcon from './ImportGuideIcon';
import ImportGuideModal from './ImportGuideModal';
import Modal from '@/components/common/Modal';
import Loader from '@/components/common/Loader';
import {
  login,
  register,
  loginWithThirdParty,
  clearError,
  setUser,
} from '@/store/slices/authSlice';
import {
  auth,
  googleProvider,
  facebookProvider,
  githubProvider,
} from '@/utils/firebase';
import { signInWithPopup } from 'firebase/auth';
import classNames from '@/utils/classNames';
import { useImportAuthFiles } from '@/hooks/useImportAuthFiles';
import {
  AiOutlineClose,
  AiOutlineFileAdd,
  AiOutlineCloseCircle,
  AiOutlineMail,
  AiOutlineLock,
  AiOutlineUser,
  AiOutlinePhone,
  AiOutlineImport,
  AiOutlineUnorderedList,
} from 'react-icons/ai';
import '@/assets/scss/components/auth/_auth-popup.scss';

const useFocusTrap = (ref, isOpen) => {
  useEffect(() => {
    if (!isOpen || !ref.current) return;

    const focusableElements = ref.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleKeyDown = (e) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    };

    firstElement?.focus();

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, ref]);
};

const AuthPopup = ({ isOpen, onClose }) => {
  const [isMounted, setIsMounted] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const popupRef = useRef(null);

  const [activeTab, setActiveTab] = useState('login');
  const [tabShellState, setTabShellState] = useState('idle');
  const [contentState, setContentState] = useState('visible');

  const [showImportModal, setShowImportModal] = useState(false);
  const [showImportZone, setShowImportZone] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  const [formData, setFormData] = useState({
    username: '', email: '', password: '', confPassword: '', phoneNumber: '',
  });

  const dispatch = useDispatch();
  const { loading, error, user } = useSelector((state) => state.auth);

  const {
    fileEntries,
    isProcessing,
    hasSuccessfulLogin,
    addFiles,
    retryFile,
    removeFile,
    clearAll,
  } = useImportAuthFiles({
    maxConcurrency: 3,
    autoLoginOnSuccess: true,
    onSuccessfulLogin: (result) => {
      toast.success('Đăng nhập thành công từ file import!');
    },
  });

  useFocusTrap(popupRef, isOpen && !isClosing);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
      setActiveTab('login');
    }, 250);
  }, [onClose]);

  useEffect(() => {
    setIsMounted(true);

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  useEffect(() => {
    if (user) {
      toast.success(`Chào mừng, ${user.username || user.email}!`);
      handleClose();
    }
  }, [user, handleClose]);

  useEffect(() => {
    if (hasSuccessfulLogin && user) {
      setTimeout(() => {
        handleClose();
        clearAll();
      }, 1500);
    }
  }, [hasSuccessfulLogin, user, handleClose, clearAll]);

  useEffect(() => {
    if (fileEntries.length > 0) {
      setShowImportModal(true);
    }
  }, [fileEntries]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      toast.error('Vui lòng nhập email và mật khẩu.');
      return;
    }
    dispatch(login({ email: formData.email, password: formData.password }));
  };

  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    if (!formData.username || !formData.email || !formData.password || !formData.confPassword) {
      toast.error('Vui lòng nhập đầy đủ các trường.');
      return;
    }
    if (formData.password !== formData.confPassword) {
      toast.error('Mật khẩu xác nhận không khớp.');
      return;
    }
    dispatch(register(formData));
  };

  const handleSocialLogin = async (provider) => {
    try {
      dispatch(setUser(null));

      let authProvider;
      switch (provider) {
        case 'google':
          authProvider = googleProvider;
          break;
        case 'facebook':
          authProvider = facebookProvider;
          break;
        case 'github':
          authProvider = githubProvider;
          break;
        default:
          toast.error('Provider không được hỗ trợ.');
          return;
      }

      const result = await signInWithPopup(auth, authProvider);
      const idToken = await result.user.getIdToken();

      dispatch(loginWithThirdParty({ idToken, provider }));
    } catch (error) {
      console.error(`Lỗi khi đăng nhập bằng ${provider}:`, error);

      if (error.code === 'auth/popup-closed-by-user') {
        toast.info('Bạn đã đóng cửa sổ đăng nhập.');
      } else if (error.code === 'auth/cancelled-popup-request') {
        return;
      } else if (error.code === 'auth/popup-blocked') {
        toast.error('Popup bị chặn bởi trình duyệt. Vui lòng cho phép popup và thử lại.');
      } else if (error.code === 'auth/network-request-failed') {
        toast.error('Lỗi kết nối mạng. Vui lòng kiểm tra kết nối internet của bạn.');
      } else if (error.code === 'auth/account-exists-with-different-credential') {
        toast.error('Email này đã được sử dụng với phương thức đăng nhập khác.');
      } else if (error.code === 'auth/invalid-credential') {
        toast.error('Thông tin xác thực không hợp lệ.');
      } else {
        toast.error(error.message || `Đăng nhập bằng ${provider} thất bại.`);
      }
    }
  };

  if (!isMounted) return null;

  return ReactDOM.createPortal(
    <>
      <div
        className={classNames('auth-popup-overlay', { 'auth-popup-overlay--open': isOpen && !isClosing })}
        onClick={handleClose}
        role="presentation"
      >
        <div
          ref={popupRef}
          className={classNames('auth-popup', { 'auth-popup--closing': isClosing })}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="auth-popup-header"
        >
          {loading && <Loader />}


          <div className="auth-popup__content-wrapper">
            <div id="auth-popup-header" className="auth-popup__header">
              <img src="/images/favicon.png" alt="logo Sạp Phim" />
              +
              <img src="/images/Logo_dhktdn.png" alt="logo Sạp Phim" />
              
              <button
                className="auth-popup__import-toggle"
                onClick={() => setShowImportZone(!showImportZone)}
                aria-label={showImportZone ? 'Ẩn import zone' : 'Hiện import zone'}
                title="Import tài khoản từ file"
              >
                {showImportZone ? <AiOutlineCloseCircle /> : <AiOutlineFileAdd />}
              </button>
              <button className="auth-popup__close-btn" onClick={handleClose} aria-label="Đóng">
                <AiOutlineClose />
              </button>
            </div>
            <AuthTabs
              activeTab={activeTab}
              onTabChange={setActiveTab}
              tabShellState={tabShellState}
              setTabShellState={setTabShellState}
              setContentState={setContentState}
            />
            <div
              className="auth-popup__form-container"
              data-content-state={contentState}
            >
              {activeTab === 'login' ? (
                <form onSubmit={handleLoginSubmit} className="auth-popup__form" noValidate>
                  <div className="form-group">
                    <input type="email" id="login-email" name="email" value={formData.email} onChange={handleChange} className="form-control" placeholder="Email" required />
                    <AiOutlineMail className="form-icon" />
                  </div>
                  <div className="form-group">
                    <input type="password" id="login-password" name="password" value={formData.password} onChange={handleChange} className="form-control" placeholder="Mật khẩu" required />
                    <AiOutlineLock className="form-icon" />
                  </div>
                  <button type="submit" className="btn auth-popup__submit-btn" disabled={loading}>Đăng nhập</button>
                </form>
              ) : (
                <form onSubmit={handleRegisterSubmit} className="auth-popup__form" noValidate>
                  <div className="form-group">
                    <input type="text" id="register-username" name="username" value={formData.username} onChange={handleChange} className="form-control" placeholder="Tên người dùng" required />
                    <AiOutlineUser className="form-icon" />
                  </div>
                  <div className="form-group">
                    <input type="email" id="register-email" name="email" value={formData.email} onChange={handleChange} className="form-control" placeholder="Email" required />
                    <AiOutlineMail className="form-icon" />
                  </div>
                  <div className="form-group">
                    <input type="password" id="register-password" name="password" value={formData.password} onChange={handleChange} className="form-control" placeholder="Mật khẩu" required />
                    <AiOutlineLock className="form-icon" />
                  </div>
                  <div className="form-group">
                    <input type="password" id="register-confPassword" name="confPassword" value={formData.confPassword} onChange={handleChange} className="form-control" placeholder="Xác nhận mật khẩu" required />
                    <AiOutlineLock className="form-icon" />
                  </div>
                  <div className="form-group">
                    <input type="tel" id="register-phoneNumber" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} className="form-control" placeholder="Số điện thoại (Tùy chọn)" />
                    <AiOutlinePhone className="form-icon" />
                  </div>
                  <button type="submit" className="btn auth-popup__submit-btn" disabled={loading}>Đăng ký</button>
                </form>
              )}

              <SocialLoginButtons onSocialLogin={handleSocialLogin} loading={loading} />

              {showImportZone && (
                <div className="auth-popup__import-zone">
                  <h4 className="auth-popup__import-title">
                    <AiOutlineImport />
                    Import từ file
                    <ImportGuideIcon
                      onClick={() => setIsGuideOpen(true)}
                      modalId="import-guide-modal"
                    />
                  </h4>
                  <FileDropzone
                    onFilesSelected={addFiles}
                    disabled={loading || isProcessing}
                    maxFiles={1}
                  />
                  {fileEntries.length > 0 && (
                    <button
                      className="auth-popup__view-imports-btn"
                      onClick={() => setShowImportModal(true)}
                    >
                      <AiOutlineUnorderedList />
                      Xem {fileEntries.length} file đã import
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <ImportEntriesModal
        fileEntries={fileEntries}
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onRetry={retryFile}
        onRemove={removeFile}
        isProcessing={isProcessing}
      />

      <Modal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        title="Hướng dẫn Import tài khoản"
        size="lg"
        closeOnEsc={true}
        closeOnOutsideClick={true}
        ariaDescribedBy="import-guide-modal"
        footer={
          <button
            className="btn btn-primary"
            onClick={() => setIsGuideOpen(false)}
          >
            Đóng
          </button>
        }
      >
        <ImportGuideModal />
      </Modal>
    </>,
    document.body
  );
};

export default AuthPopup;
