import React, { useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { uploadUserAvatar, deleteUserAvatar } from '@/store/slices/authSlice';
import { FaUpload, FaTrash, FaImage, FaSpinner } from 'react-icons/fa';
import { useFloatingDropdown } from '@/hooks/useFloatingDropdown';
import ReactDOM from 'react-dom'; // Import ReactDOM
import classNames from '@/utils/classNames';

const AvatarMenu = ({ children, className }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const fileInputRef = useRef(null);

  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const {
    isOpen,
    setIsOpen,
    refs,
    floatingStyles,
    getReferenceProps,
    getFloatingProps,
    isMounted,
  } = useFloatingDropdown({
    placement: 'bottombottom-start',
    offset: { mainAxis: 10, crossAxis: 0 },
    trigger: 'click',
    openDuration: 350,
    closeDuration: 180,
  });

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Vui lòng chọn file ảnh hợp lệ');
        return;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('Kích thước ảnh không được vượt quá 5MB');
        return;
      }

      setUploading(true);
      const formData = new FormData();
      formData.append('avatar', file);
      try {
        await dispatch(uploadUserAvatar(formData)).unwrap();
        toast.success('Cập nhật ảnh đại diện thành công!');
        setIsOpen(false);
      } catch (err) {
        toast.error(err.message || 'Tải lên ảnh đại diện thất bại.');
      } finally {
        setUploading(false);
        e.target.value = null; // Clear file input
      }
    }
  };

  const handleDeleteAvatar = async () => {
    if (!user?.avatarUrl || user.avatarUrl.includes('ui-avatars.com')) {
      toast.info('Không có ảnh đại diện để xóa.');
      return;
    }
    if (!window.confirm('Bạn có chắc chắn muốn xóa ảnh đại diện hiện tại?')) return;

    setDeleting(true);
    try {
      await dispatch(deleteUserAvatar()).unwrap();
      toast.success('Xóa ảnh đại diện thành công!');
      setIsOpen(false);
    } catch (err) {
      toast.error(err.message || 'Xóa ảnh đại diện thất bại.');
    } finally {
      setDeleting(false);
    }
  };

  const handleChooseDefaultAvatar = () => {
    // Logic to choose from default avatars (if implemented)
    // For now, we'll just close the menu
    toast.info('Chức năng chọn ảnh mặc định đang được phát triển.');
    setIsOpen(false);
  };

  return (
    <>
      <div className={classNames('avatar-menu__trigger', className)} ref={refs.setReference} {...getReferenceProps()}>
        {children}
      </div>
      {isMounted && ReactDOM.createPortal(
        <div
          ref={refs.setFloating}
          style={floatingStyles}
          {...getFloatingProps()}
          className={classNames('avatar-menu', { 'is-open': isOpen })}
          data-open={isOpen}
        >
          <input
            id="avatar-upload-input"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            ref={fileInputRef}
            className="avatar-menu__input"
            aria-label="Chọn ảnh đại diện"
          />
          <ul className="avatar-menu__list">
            <li className="avatar-menu__item">
              <button
                className="avatar-menu__btn"
                onClick={() => fileInputRef.current.click()}
                disabled={uploading}
              >
                {uploading ? (
                  <>
                    <FaSpinner className="icon--spin" />
                    <span>Đang tải...</span>
                  </>
                ) : (
                  <>
                    <FaUpload />
                    <span>Tải ảnh mới</span>
                  </>
                )}
              </button>
            </li>
            <li className="avatar-menu__item">
              <button className="avatar-menu__btn" onClick={handleChooseDefaultAvatar}>
                <FaImage />
                <span>Chọn từ ảnh có sẵn</span>
              </button>
            </li>
            <li className="avatar-menu__item">
              <button
                className="avatar-menu__btn avatar-menu__btn--danger"
                onClick={handleDeleteAvatar}
                disabled={deleting}
              >
                {deleting ? (
                  <>
                    <FaSpinner className="icon--spin" />
                    <span>Đang xóa...</span>
                  </>
                ) : (
                  <>
                    <FaTrash />
                    <span>Xóa ảnh hiện tại</span>
                  </>
                )}
              </button>
            </li>
          </ul>
        </div>,
        document.body
      )}
    </>
  );
};

export default AvatarMenu;
