import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import { updateUserProfile, updateUserSocialLinks } from '@/store/slices/authSlice';
import { exportUserToPdf } from '@/utils/exportUserPdf';
import { 
  FaFilePdf, 
  FaUser, 
  FaEnvelope, 
  FaPhone, 
  FaVenusMars, 
  FaEdit, 
  FaSpinner,
  FaCheck,
  FaGithub,
  FaTwitter,
  FaInstagram,
  FaFacebook,
  FaLink
} from 'react-icons/fa';

const EditProfileTab = () => {
  const dispatch = useDispatch();
  const { user, loading } = useSelector((state) => state.auth);

  const [isExporting, setIsExporting] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phoneNumber: '',
    sex: '',
    bio: ''
  });

  const [socialLinks, setSocialLinks] = useState({
    github: '',
    twitter: '',
    instagram: '',
    facebook: ''
  });

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        email: user.email || '',
        phoneNumber: user.phoneNumber || '',
        sex: user.sex || '',
        bio: user.bio || ''
      });
      setSocialLinks({
        github: user.socialLinks?.github || '',
        twitter: user.socialLinks?.twitter || '',
        instagram: user.socialLinks?.instagram || '',
        facebook: user.socialLinks?.facebook || ''
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSocialLinkChange = (e) => {
    const { name, value } = e.target;
    setSocialLinks((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmitProfile = async (e) => {
    e.preventDefault();
    try {
      await dispatch(updateUserProfile(formData)).unwrap();
      toast.success('Cập nhật thông tin thành công!');
    } catch (err) {
      toast.error(err.message || 'Cập nhật thông tin thất bại.');
    }
  };

  const handleSubmitSocialLinks = async (e) => {
    e.preventDefault();
    try {
      await dispatch(updateUserSocialLinks(socialLinks)).unwrap();
      toast.success('Cập nhật liên kết mạng xã hội thành công!');
    } catch (err) {
      toast.error(err.message || 'Cập nhật liên kết mạng xã hội thất bại.');
    }
  };

  const handleExportPdf = async () => {
    if (!user || isExporting) return;

    try {
      setIsExporting(true);
      await exportUserToPdf(user);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Có lỗi xảy ra khi xuất PDF. Vui lòng thử lại.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="edit-profile-tab">
      <form onSubmit={handleSubmitProfile} className="edit-profile-tab__form">
        <section className="edit-profile-tab__section">
          <h3 className="edit-profile-tab__subtitle">
            <FaEdit className="edit-profile-tab__subtitle-icon" />
            <span>Thông tin cá nhân</span>
          </h3>
          
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="username" className="form-group__label">
                <FaUser className="form-group__label-icon" />
                Tên người dùng
              </label>
              <input 
                type="text" 
                id="username" 
                name="username" 
                value={formData.username} 
                onChange={handleChange} 
                className="form-control"
                placeholder="Nhập tên người dùng"
                aria-required="true"
              />
            </div>

            <div className="form-group">
              <label htmlFor="email" className="form-group__label">
                <FaEnvelope className="form-group__label-icon" />
                Email
              </label>
              <div className="form-control-wrapper form-control-wrapper--disabled">
                <input 
                  type="email" 
                  id="email" 
                  name="email" 
                  value={formData.email} 
                  className="form-control" 
                  disabled 
                  aria-label="Email (không thể chỉnh sửa)"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="phoneNumber" className="form-group__label">
                <FaPhone className="form-group__label-icon" />
                Số điện thoại
              </label>
              <input 
                type="tel" 
                id="phoneNumber" 
                name="phoneNumber" 
                value={formData.phoneNumber} 
                onChange={handleChange} 
                className="form-control"
                placeholder="Nhập số điện thoại"
              />
            </div>

            <div className="form-group">
              <label htmlFor="sex" className="form-group__label">
                <FaVenusMars className="form-group__label-icon" />
                Giới tính
              </label>
              <select 
                id="sex" 
                name="sex" 
                value={formData.sex} 
                onChange={handleChange} 
                className="form-select"
                aria-label="Chọn giới tính"
              >
                <option value="">Chọn giới tính</option>
                <option value="nam">Nam</option>
                <option value="nữ">Nữ</option>
                <option value="khác">Khác</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="bio" className="form-group__label">
              <FaEdit className="form-group__label-icon" />
              Tiểu sử
            </label>
            <textarea 
              id="bio" 
              name="bio" 
              value={formData.bio} 
              onChange={handleChange} 
              className="form-control form-control--textarea" 
              rows="4"
              placeholder="Viết vài dòng về bản thân..."
              maxLength="500"
            ></textarea>
            <div className="form-group__hint">
              {formData.bio.length}/500 ký tự
            </div>
          </div>
        </section>

        {/* Action Buttons */}
        <div className="edit-profile-tab__actions">
          <button 
            type="submit" 
            className="edit-profile-tab__btn edit-profile-tab__btn--submit" 
            disabled={loading}
            aria-label="Lưu thay đổi thông tin cá nhân"
          >
            {loading ? (
              <>
                <FaSpinner className="edit-profile-tab__btn-icon--spin" />
                <span>Đang lưu...</span>
              </>
            ) : (
              <>
                <FaCheck />
                <span>Lưu thay đổi</span>
              </>
            )}
          </button>
          <button
            type="button"
            className="edit-profile-tab__btn edit-profile-tab__btn--export"
            onClick={handleExportPdf}
            disabled={isExporting}
            title="Xuất thông tin cá nhân ra PDF"
            aria-label="Xuất thông tin cá nhân ra PDF"
          >
            {isExporting ? (
              <>
                <FaSpinner className="edit-profile-tab__btn-icon--spin" />
                <span>Đang xuất...</span>
              </>
            ) : (
              <>
                <FaFilePdf />
                <span>Xuất PDF</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Social Links Section */}
      <form onSubmit={handleSubmitSocialLinks} className="edit-profile-tab__form">
        <section className="edit-profile-tab__section">
          <h3 className="edit-profile-tab__subtitle">
            <FaLink className="edit-profile-tab__subtitle-icon" />
            <span>Liên kết mạng xã hội</span>
          </h3>
          
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="github" className="form-group__label">
                <FaGithub className="form-group__label-icon" />
                GitHub
              </label>
              <input 
                type="url" 
                id="github" 
                name="github" 
                value={socialLinks.github} 
                onChange={handleSocialLinkChange} 
                className="form-control"
                placeholder="https://github.com/username"
              />
            </div>

            <div className="form-group">
              <label htmlFor="twitter" className="form-group__label">
                <FaTwitter className="form-group__label-icon" />
                Twitter
              </label>
              <input 
                type="url" 
                id="twitter" 
                name="twitter" 
                value={socialLinks.twitter} 
                onChange={handleSocialLinkChange} 
                className="form-control"
                placeholder="https://twitter.com/username"
              />
            </div>

            <div className="form-group">
              <label htmlFor="instagram" className="form-group__label">
                <FaInstagram className="form-group__label-icon" />
                Instagram
              </label>
              <input 
                type="url" 
                id="instagram" 
                name="instagram" 
                value={socialLinks.instagram} 
                onChange={handleSocialLinkChange} 
                className="form-control"
                placeholder="https://instagram.com/username"
              />
            </div>

            <div className="form-group">
              <label htmlFor="facebook" className="form-group__label">
                <FaFacebook className="form-group__label-icon" />
                Facebook
              </label>
              <input 
                type="url" 
                id="facebook" 
                name="facebook" 
                value={socialLinks.facebook} 
                onChange={handleSocialLinkChange} 
                className="form-control"
                placeholder="https://facebook.com/username"
              />
            </div>
          </div>
        </section>

        {/* Social Links Action Button */}
        <div className="edit-profile-tab__actions">
          <button 
            type="submit" 
            className="edit-profile-tab__btn edit-profile-tab__btn--submit" 
            disabled={loading}
            aria-label="Lưu liên kết mạng xã hội"
          >
            {loading ? (
              <>
                <FaSpinner className="edit-profile-tab__btn-icon--spin" />
                <span>Đang lưu...</span>
              </>
            ) : (
              <>
                <FaCheck />
                <span>Lưu liên kết</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditProfileTab;
