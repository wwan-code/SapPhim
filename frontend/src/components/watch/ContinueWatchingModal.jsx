import React from 'react';
import PropTypes from 'prop-types';
import Modal from '@/components/common/Modal';
import styles from './ContinueWatchingModal.module.scss';

/**
 * ContinueWatchingModal Component
 * 
 * Displays a modal asking the user if they want to continue watching from where they left off
 * or start over from the beginning.
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {function} props.onClose - Callback when modal is closed
 * @param {number} props.progress - Saved watch progress in seconds
 * @param {function} props.onContinue - Callback when "Continue" is clicked
 * @param {function} props.onStartOver - Callback when "Start Over" is clicked
 * @param {boolean} props.isLoading - Loading state while seeking
 */
const ContinueWatchingModal = ({
    isOpen,
    onClose,
    progress,
    onContinue,
    onStartOver,
    isLoading = false,
}) => {
    /**
     * Format seconds to human-readable time string
     * @param {number} seconds - Time in seconds
     * @returns {string} Formatted time string (e.g., "5 phút 30 giây" or "45 giây")
     */
    const formatTime = (seconds) => {
        if (!seconds || seconds < 1) return '0 giây';

        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);

        const parts = [];
        if (hours > 0) parts.push(`${hours} giờ`);
        if (minutes > 0) parts.push(`${minutes} phút`);
        if (secs > 0 || parts.length === 0) parts.push(`${secs} giây`);

        return parts.join(' ');
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Tiếp tục xem?"
            size="sm"
            closeOnEsc={!isLoading}
            closeOnOutsideClick={!isLoading}
        >
            <div className={styles.modalContent}>
                <div className={styles.message}>
                    <p className={styles.messageText}>
                        Bạn đã xem đến <span className={styles.progressTime}>{formatTime(progress)}</span>.
                    </p>
                    <p className={styles.messageSubtext}>
                        Bạn muốn xem tiếp hay xem lại từ đầu?
                    </p>
                </div>

                <div className={styles.actions}>
                    <button
                        className={`${styles.actionButton} ${styles.continueButton}`}
                        onClick={onContinue}
                        disabled={isLoading}
                        autoFocus
                    >
                        {isLoading ? 'Đang tải...' : 'Xem tiếp'}
                    </button>
                    <button
                        className={`${styles.actionButton} ${styles.startOverButton}`}
                        onClick={onStartOver}
                        disabled={isLoading}
                    >
                        Xem lại từ đầu
                    </button>
                </div>
            </div>
        </Modal>
    );
};

ContinueWatchingModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    progress: PropTypes.number.isRequired,
    onContinue: PropTypes.func.isRequired,
    onStartOver: PropTypes.func.isRequired,
    isLoading: PropTypes.bool,
};

export default ContinueWatchingModal;
