import { useEffect } from 'react';
import { 
  AiOutlineClockCircle, 
  AiOutlineLoading3Quarters, 
  AiOutlineCheckCircle,
  AiOutlineExclamationCircle,
  AiOutlineQuestionCircle,
  AiOutlineSend,
  AiOutlineClose,
  AiOutlineRedo,
  AiOutlineDelete,
  AiOutlineInbox,
  AiOutlineUnorderedList
} from 'react-icons/ai';
import { FILE_STATUS } from '@/hooks/useImportAuthFiles';
import '@/assets/scss/components/auth/_import-entries-modal.scss';

const ImportEntriesModal = ({ fileEntries, isOpen, onClose, onRetry, onRemove, isProcessing }) => {
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

  if (!isOpen) return null;

  const getStatusIcon = (status) => {
    switch (status) {
      case FILE_STATUS.PENDING:
        return <AiOutlineClockCircle aria-label="Đang chờ" />;
      case FILE_STATUS.PARSING:
        return <AiOutlineLoading3Quarters className="spinning" aria-label="Đang phân tích" />;
      case FILE_STATUS.VALIDATING:
        return <AiOutlineCheckCircle aria-label="Đang xác thực" />;
      case FILE_STATUS.SUBMITTING:
        return <AiOutlineSend aria-label="Đang gửi" />;
      case FILE_STATUS.SUCCESS:
        return <AiOutlineCheckCircle aria-label="Thành công" />;
      case FILE_STATUS.ERROR:
        return <AiOutlineExclamationCircle aria-label="Lỗi" />;
      default:
        return <AiOutlineQuestionCircle aria-label="Không xác định" />;
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case FILE_STATUS.PENDING:
        return 'Đang chờ';
      case FILE_STATUS.PARSING:
        return 'Đang phân tích';
      case FILE_STATUS.VALIDATING:
        return 'Đang xác thực';
      case FILE_STATUS.SUBMITTING:
        return 'Đang gửi';
      case FILE_STATUS.SUCCESS:
        return 'Thành công';
      case FILE_STATUS.ERROR:
        return 'Lỗi';
      default:
        return 'Không xác định';
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case FILE_STATUS.PENDING:
        return 'import-entry__status--pending';
      case FILE_STATUS.PARSING:
      case FILE_STATUS.VALIDATING:
      case FILE_STATUS.SUBMITTING:
        return 'import-entry__status--processing';
      case FILE_STATUS.SUCCESS:
        return 'import-entry__status--success';
      case FILE_STATUS.ERROR:
        return 'import-entry__status--error';
      default:
        return '';
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const stats = {
    total: fileEntries.length,
    success: fileEntries.filter((e) => e.status === FILE_STATUS.SUCCESS).length,
    error: fileEntries.filter((e) => e.status === FILE_STATUS.ERROR).length,
    processing: fileEntries.filter(
      (e) =>
        e.status === FILE_STATUS.PENDING ||
        e.status === FILE_STATUS.PARSING ||
        e.status === FILE_STATUS.VALIDATING ||
        e.status === FILE_STATUS.SUBMITTING
    ).length,
  };

  return (
    <div className="import-entries-overlay" onClick={onClose} role="presentation">
      <div
        className="import-entries-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="import-entries-title"
      >
        {/* Header */}
        <div className="import-entries-modal__header">
          <h3 id="import-entries-title" className="import-entries-modal__title">
            Import Authentication Files
          </h3>
          <button
            className="import-entries-modal__close"
            onClick={onClose}
            aria-label="Đóng"
            disabled={isProcessing}
          >
            <AiOutlineClose />
          </button>
        </div>

        {/* Stats */}
        <div className="import-entries-modal__stats">
          <div className="import-stat">
            <span className="import-stat__label">Tổng:</span>
            <span className="import-stat__value">{stats.total}</span>
          </div>
          <div className="import-stat import-stat--success">
            <span className="import-stat__label">Thành công:</span>
            <span className="import-stat__value">{stats.success}</span>
          </div>
          <div className="import-stat import-stat--error">
            <span className="import-stat__label">Lỗi:</span>
            <span className="import-stat__value">{stats.error}</span>
          </div>
          <div className="import-stat import-stat--processing">
            <span className="import-stat__label">Đang xử lý:</span>
            <span className="import-stat__value">{stats.processing}</span>
          </div>
        </div>

        {/* File list */}
        <div className="import-entries-modal__list">
          {fileEntries.length === 0 ? (
            <div className="import-entries-modal__empty">
              <AiOutlineInbox />
              <p>Chưa có file nào được tải lên</p>
            </div>
          ) : (
            fileEntries.map((entry) => (
              <div key={entry.id} className="import-entry">
                {/* Status icon */}
                <div className={`import-entry__status ${getStatusClass(entry.status)}`}>
                  {getStatusIcon(entry.status)}
                </div>

                {/* File info */}
                <div className="import-entry__info">
                  <div className="import-entry__name" title={entry.fileName}>
                    {entry.fileName}
                  </div>
                  <div className="import-entry__meta">
                    <span className="import-entry__size">{formatFileSize(entry.fileSize)}</span>
                    <span className="import-entry__separator">•</span>
                    <span className="import-entry__status-label">{getStatusLabel(entry.status)}</span>
                  </div>

                  {/* Account details */}
                  {entry.selectedAccount && (
                    <div className="import-entry__account">
                      <span className="import-entry__account-badge">
                        {entry.selectedAccount.action === 'login' ? 'Đăng nhập' : 'Đăng ký'}
                      </span>
                      <span className="import-entry__account-email">{entry.selectedAccount.email}</span>
                    </div>
                  )}

                  {/* Register results details */}
                  {entry.registerResults && (
                    <div className="import-entry__register-results">
                      <div className="import-entry__register-stats">
                        <span className="import-entry__register-stat import-entry__register-stat--success">
                          ✓ {entry.registerResults.successCount} thành công
                        </span>
                        {entry.registerResults.failedCount > 0 && (
                          <span className="import-entry__register-stat import-entry__register-stat--failed">
                            ✗ {entry.registerResults.failedCount} thất bại
                          </span>
                        )}
                      </div>
                      {entry.registerResults.errors && entry.registerResults.errors.length > 0 && (
                        <div className="import-entry__register-errors">
                          {entry.registerResults.errors.map((err, idx) => (
                            <div key={idx} className="import-entry__register-error">
                              {err}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Valid/Invalid counts */}
                  {entry.validCount > 0 || entry.invalidCount > 0 ? (
                    <div className="import-entry__counts">
                      {entry.validCount > 0 && (
                        <span className="import-entry__count import-entry__count--valid">
                          ✓ {entry.validCount} hợp lệ
                        </span>
                      )}
                      {entry.invalidCount > 0 && (
                        <span className="import-entry__count import-entry__count--invalid">
                          ✗ {entry.invalidCount} không hợp lệ
                        </span>
                      )}
                    </div>
                  ) : null}

                  {/* Success message */}
                  {entry.status === FILE_STATUS.SUCCESS && entry.message && (
                    <div className="import-entry__message import-entry__message--success">
                      <AiOutlineCheckCircle />
                      {entry.message}
                    </div>
                  )}

                  {/* Error message */}
                  {entry.status === FILE_STATUS.ERROR && entry.error && (
                    <div className="import-entry__message import-entry__message--error">
                      <AiOutlineExclamationCircle />
                      {entry.error}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="import-entry__actions">
                  {entry.status === FILE_STATUS.ERROR && (
                    <button
                      className="import-entry__action import-entry__action--retry"
                      onClick={() => onRetry(entry.id)}
                      aria-label="Thử lại"
                      title="Thử lại"
                    >
                      <AiOutlineRedo />
                    </button>
                  )}
                  {(entry.status === FILE_STATUS.SUCCESS || entry.status === FILE_STATUS.ERROR) && (
                    <button
                      className="import-entry__action import-entry__action--remove"
                      onClick={() => onRemove(entry.id)}
                      aria-label="Xóa"
                      title="Xóa"
                    >
                      <AiOutlineDelete />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {isProcessing && (
          <div className="import-entries-modal__footer">
            <div className="import-entries-modal__progress">
              <AiOutlineLoading3Quarters className="spinning" />
              <span>Đang xử lý files...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImportEntriesModal;
