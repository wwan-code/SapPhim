import React, { useState } from 'react';
import {
  useAccountInfo,
  useDownloadUserData,
  useDeleteAccount,
  useLoginHistory,
  useRevokeLoginSession,
  useRevokeAllOtherSessions,
} from '@/hooks/useSettingQueries';
import { formatDistanceToNow } from '@/utils/dateUtils';
import { 
  getDeviceIcon, 
  formatDeviceDisplay, 
  truncateIP,
  getProviderDisplayName,
  getProviderColor 
} from '@/utils/deviceUtils';
import { FaComment, FaFilm, FaHeart, FaUserFriends, FaChevronLeft, FaChevronRight, FaTrash, FaBan } from 'react-icons/fa';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ErrorMessage from '@/components/common/ErrorMessage';
import Modal from '@/components/common/Modal';
import '@/assets/scss/components/settings/_account-management.scss';

const AccountManagement = () => {
  const { data: accountData, isLoading: accountLoading, isError: accountError, error: accountErr } = useAccountInfo();
  const downloadDataMutation = useDownloadUserData();
  const deleteAccountMutation = useDeleteAccount();
  const revokeSessionMutation = useRevokeLoginSession();
  const revokeAllSessionsMutation = useRevokeAllOtherSessions();
  const [loginHistoryPage, setLoginHistoryPage] = useState(1);
  const { data: loginHistoryData, isLoading: historyLoading } = useLoginHistory(loginHistoryPage, 10);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [showRevokeAllModal, setShowRevokeAllModal] = useState(false);

  const handleDownloadData = () => {
    downloadDataMutation.mutate();
  };

  const handleDeleteAccount = () => {
    if (!deletePassword) {
      // This could be replaced with a more elegant notification
      return;
    }
    deleteAccountMutation.mutate(deletePassword, {
      onSuccess: () => {
        setShowDeleteModal(false);
        // Optionally: show a success message and redirect
      },
    });
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    try {
      return formatDistanceToNow(date, 'vi-VN');
    } catch (error) {
      return 'N/A';
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= (loginHistoryData?.pagination?.totalPages || 1)) {
      setLoginHistoryPage(newPage);
    }
  };

  const handleRevokeSession = (sessionId) => {
    if (window.confirm('Bạn có chắc muốn hủy phiên đăng nhập này?')) {
      revokeSessionMutation.mutate(sessionId);
    }
  };

  const handleRevokeAllOtherSessions = () => {
    revokeAllSessionsMutation.mutate(undefined, {
      onSuccess: () => {
        setShowRevokeAllModal(false);
      },
    });
  };

  if (accountLoading) {
    return <LoadingSpinner fullscreen label="Đang tải thông tin tài khoản..." />;
  }

  if (accountError) {
    return (
      <ErrorMessage
        variant="card"
        title="Lỗi tải dữ liệu"
        message="Không thể tải thông tin tài khoản của bạn. Vui lòng thử lại sau."
        details={accountErr?.message}
      />
    );
  }

  return (
    <div className="account-management">
      <div className="account-management__header">
        <h2 className="account-management__title">Quản Lý Tài Khoản</h2>
        <p className="account-management__description">
          Xem thông tin tài khoản và quản lý dữ liệu của bạn
        </p>
      </div>

      <div className="account-management__content">
        {/* Mutations Error */}
        {downloadDataMutation.isError && (
          <ErrorMessage
            variant="banner"
            title="Tải dữ liệu thất bại"
            message={downloadDataMutation.error?.message || 'Đã có lỗi xảy ra khi tạo file dữ liệu của bạn.'}
            dismissible
          />
        )}
        {deleteAccountMutation.isError && (
          <ErrorMessage
            variant="banner"
            title="Xóa tài khoản thất bại"
            message={deleteAccountMutation.error?.message || 'Đã có lỗi xảy ra. Vui lòng thử lại.'}
            dismissible
          />
        )}

        {/* Account Overview */}
        <div className="account-management__section">
          <h3 className="account-management__section-title">Thông tin tài khoản</h3>
          <div className="account-management__info-grid">
            <div className="account-management__info-item">
              <span className="account-management__info-label">Tên người dùng:</span>
              <span className="account-management__info-value">{accountData?.user?.username}</span>
            </div>
            <div className="account-management__info-item">
              <span className="account-management__info-label">Email:</span>
              <span className="account-management__info-value">{accountData?.user?.email}</span>
            </div>
            <div className="account-management__info-item">
              <span className="account-management__info-label">Ngày tạo:</span>
              <span className="account-management__info-value">
                {formatDate(accountData?.user?.createdAt)}
              </span>
            </div>
            <div className="account-management__info-item">
              <span className="account-management__info-label">UUID:</span>
              <span className="account-management__info-value account-management__info-value--small">
                {accountData?.user?.uuid}
              </span>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="account-management__section">
          <h3 className="account-management__section-title">Thống kê hoạt động</h3>
          <div className="account-management__stats-grid">
            <div className="account-management__stat-card">
              <div className="account-management__stat-icon"><FaUserFriends /></div>
              <div className="account-management__stat-value">{accountData?.stats?.friendsCount || 0}</div>
              <div className="account-management__stat-label">Bạn bè</div>
            </div>
            <div className="account-management__stat-card">
              <div className="account-management__stat-icon"><FaHeart /></div>
              <div className="account-management__stat-value">{accountData?.stats?.favoritesCount || 0}</div>
              <div className="account-management__stat-label">Phim yêu thích</div>
            </div>
            <div className="account-management__stat-card">
              <div className="account-management__stat-icon"><FaFilm /></div>
              <div className="account-management__stat-value">{accountData?.stats?.watchHistoryCount || 0}</div>
              <div className="account-management__stat-label">Đã xem</div>
            </div>
            <div className="account-management__stat-card">
              <div className="account-management__stat-icon"><FaComment /></div>
              <div className="account-management__stat-value">{accountData?.stats?.commentsCount || 0}</div>
              <div className="account-management__stat-label">Bình luận</div>
            </div>
          </div>
        </div>

        {/* Data Management */}
        <div className="account-management__section">
          <h3 className="account-management__section-title">Quản lý dữ liệu</h3>
          <div className="account-management__data-actions">
            <div className="account-management__data-action">
              <div className="account-management__data-action-info">
                <h4 className="account-management__data-action-title">Tải xuống dữ liệu của bạn</h4>
                <p className="account-management__data-action-desc">
                  Tải về một bản sao tất cả dữ liệu cá nhân của bạn (bạn bè, phim yêu thích, lịch sử xem, v.v.)
                </p>
              </div>
              <button
                className="account-management__btn account-management__btn--primary"
                onClick={handleDownloadData}
                disabled={downloadDataMutation.isLoading}
              >
                {downloadDataMutation.isLoading ? 'Đang tạo file...' : 'Tải xuống'}
              </button>
            </div>
          </div>
        </div>

        {/* Login History */}
        <div className="account-management__section">
          <h3 className="account-management__section-title">Lịch sử đăng nhập</h3>
          {historyLoading ? (
            <LoadingSpinner label="Đang tải lịch sử..." />
          ) : loginHistoryData?.data && loginHistoryData.data.length > 0 ? (
            <>
              <div className="account-management__login-history">
                {loginHistoryData.data.map((login) => (
                  <div key={login.id} className="account-management__login-item">
                    <div className="account-management__login-icon">
                      {getDeviceIcon(login.deviceType)}
                    </div>
                    <div className="account-management__login-info">
                      <div className="account-management__login-device">
                        {formatDeviceDisplay(login)}
                      </div>
                      <div className="account-management__login-details">
                        <span className="account-management__login-ip">
                          {truncateIP(login.ipAddress)}
                        </span>
                        <span className="account-management__login-time">
                          {formatDate(login.loginAt)}
                        </span>
                        {login.logoutAt && (
                          <span className="account-management__login-duration">
                            Đăng xuất: {formatDate(login.logoutAt)}
                          </span>
                        )}
                      </div>
                    </div>
                    {login.provider && (
                      <div className={`account-management__login-provider ${getProviderColor(login.provider)}`}>
                        {getProviderDisplayName(login.provider)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              {/* Pagination */}
              {loginHistoryData?.pagination && loginHistoryData.pagination.totalPages > 1 && (
                <div className="account-management__pagination">
                  <button
                    className="account-management__pagination-btn"
                    onClick={() => handlePageChange(loginHistoryPage - 1)}
                    disabled={loginHistoryPage === 1}
                  >
                    <FaChevronLeft />
                  </button>
                  <span className="account-management__pagination-info">
                    Trang {loginHistoryPage} / {loginHistoryData.pagination.totalPages}
                  </span>
                  <button
                    className="account-management__pagination-btn"
                    onClick={() => handlePageChange(loginHistoryPage + 1)}
                    disabled={loginHistoryPage === loginHistoryData.pagination.totalPages}
                  >
                    <FaChevronRight />
                  </button>
                </div>
              )}
            </>
          ) : (
            <p className="account-management__empty">Không có lịch sử đăng nhập.</p>
          )}
        </div>

        {/* Danger Zone */}
        <div className="account-management__section account-management__section--danger">
          <h3 className="account-management__section-title">Vùng nguy hiểm</h3>
          <div className="account-management__danger-zone">
            <div className="account-management__danger-info">
              <h4 className="account-management__danger-title">Xóa tài khoản</h4>
              <p className="account-management__danger-desc">
                Xóa vĩnh viễn tài khoản và tất cả dữ liệu của bạn. Hành động này không thể hoàn tác.
              </p>
            </div>
            <button
              className="account-management__btn account-management__btn--danger"
              onClick={() => setShowDeleteModal(true)}
            >
              Xóa tài khoản
            </button>
          </div>
        </div>
      </div>

      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Xác nhận xóa tài khoản"
        size="md"
        footer={
          <>
            <button
              className="account-management__btn account-management__btn--secondary"
              onClick={() => setShowDeleteModal(false)}
              disabled={deleteAccountMutation.isLoading}
            >
              Hủy
            </button>
            <button
              className="account-management__btn account-management__btn--danger"
              onClick={handleDeleteAccount}
              disabled={deleteAccountMutation.isLoading || !deletePassword}
            >
              {deleteAccountMutation.isLoading ? (
                <LoadingSpinner size="xs" />
              ) : (
                'Xóa vĩnh viễn'
              )}
            </button>
          </>
        }
      >
        <p className="account-management__modal-warning">
          ⚠️ Cảnh báo: Hành động này sẽ xóa vĩnh viễn tài khoản và tất cả dữ liệu của bạn.
          Bạn sẽ không thể khôi phục lại.
        </p>
        <div className="account-management__modal-input">
          <label htmlFor="delete-password">Nhập mật khẩu để xác nhận:</label>
          <input
            type="password"
            id="delete-password"
            value={deletePassword}
            onChange={(e) => setDeletePassword(e.target.value)}
            placeholder="Mật khẩu của bạn"
            autoComplete="current-password"
          />
        </div>
      </Modal>

      <Modal
        isOpen={showRevokeAllModal}
        onClose={() => setShowRevokeAllModal(false)}
        title="Hủy tất cả phiên đăng nhập khác"
        size="md"
        footer={
          <>
            <button
              className="account-management__btn account-management__btn--secondary"
              onClick={() => setShowRevokeAllModal(false)}
              disabled={revokeAllSessionsMutation.isLoading}
            >
              Hủy
            </button>
            <button
              className="account-management__btn account-management__btn--danger"
              onClick={handleRevokeAllOtherSessions}
              disabled={revokeAllSessionsMutation.isLoading}
            >
              {revokeAllSessionsMutation.isLoading ? (
                <LoadingSpinner size="xs" />
              ) : (
                'Xác nhận'
              )}
            </button>
          </>
        }
      >
        <p className="account-management__modal-warning">
          ⚠️ Cảnh báo: Hành động này sẽ đăng xuất tất cả các thiết bị khác đang đăng nhập vào tài khoản của bạn.
        </p>
        <p style={{ marginTop: 'var(--w-spacing-md)', fontSize: 'var(--w-font-size-sm)', color: 'var(--w-text-color-light)' }}>
          Bạn sẽ cần đăng nhập lại trên các thiết bị đó.
        </p>
      </Modal>
    </div>
  );
};

export default AccountManagement;
