import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { uploadUserCover, deleteUserCover } from '@/store/slices/authSlice';
import { FaCamera, FaImage, FaSave, FaTrash, FaSpinner } from 'react-icons/fa';
import { getImageUrl } from '@/utils/getAvatarUrl';
import Modal from '@/components/common/Modal'; // Import the common Modal component

const UploadCoverModal = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const fileInputRef = useRef(null);

  const [coverPreview, setCoverPreview] = useState(null);
  const [selectedCoverFile, setSelectedCoverFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (user?.coverUrl) {
      setCoverPreview(getImageUrl(user.coverUrl));
    } else {
      setCoverPreview('https://placehold.co/1200x300?text=Cover+Image');
    }
    setSelectedCoverFile(null); // Reset file when modal opens/user changes
  }, [user, isOpen]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Vui lòng chọn file ảnh hợp lệ');
        return;
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast.error('Kích thước ảnh không được vượt quá 10MB');
        return;
      }
      setSelectedCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const handleUpload = async () => {
    if (!selectedCoverFile) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('cover', selectedCoverFile);
      await dispatch(uploadUserCover(formData)).unwrap();
      toast.success('Cập nhật ảnh bìa thành công!');
      onClose();
    } catch (err) {
      toast.error(err.message || 'Tải lên ảnh bìa thất bại.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!user?.coverUrl) return;
    if (!window.confirm('Bạn có chắc chắn muốn xóa ảnh bìa hiện tại?')) return;

    setDeleting(true);
    try {
      await dispatch(deleteUserCover()).unwrap();
      toast.success('Xóa ảnh bìa thành công!');
      onClose();
    } catch (err) {
      toast.error(err.message || 'Xóa ảnh bìa thất bại.');
    } finally {
      setDeleting(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Cập nhật ảnh bìa" size="lg" className="upload-cover-modal">
      <div className="upload-cover-modal__preview-wrapper">
        <img src={coverPreview} alt="Cover Preview" className="upload-cover-modal__preview" />
        <div className="upload-cover-modal__overlay" onClick={triggerFileInput}>
          <FaCamera className="upload-cover-modal__overlay-icon" />
          <span>Chọn ảnh mới</span>
        </div>
      </div>

      <input
        id="cover-upload-input"
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        ref={fileInputRef}
        className="upload-cover-modal__input"
        aria-label="Chọn ảnh bìa"
      />

      <div className="upload-cover-modal__actions">
        {selectedCoverFile && (
          <button
            type="button"
            onClick={handleUpload}
            className="upload-cover-modal__btn upload-cover-modal__btn--primary"
            disabled={uploading}
          >
            {uploading ? (
              <>
                <FaSpinner className="icon--spin" />
                <span>Đang lưu...</span>
              </>
            ) : (
              <>
                <FaSave />
                <span>Lưu ảnh bìa</span>
              </>
            )}
          </button>
        )}
        {user?.coverUrl && !selectedCoverFile && (
          <button
            type="button"
            onClick={handleDelete}
            className="upload-cover-modal__btn upload-cover-modal__btn--danger"
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
                  <span>Xóa ảnh bìa</span>
                </>
              )}
          </button>
        )}
        {!selectedCoverFile && (
          <button
            type="button"
            onClick={triggerFileInput}
            className="upload-cover-modal__btn upload-cover-modal__btn--secondary"
          >
            <FaImage />
            <span>Chọn ảnh</span>
          </button>
        )}
      </div>
    </Modal>
  );
};

export default UploadCoverModal;
