import React, { useEffect, useRef, useCallback, useState } from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import { AiOutlineClose } from 'react-icons/ai';
import classNames from '@/utils/classNames';
import '@/assets/scss/components/common/_modal.scss';

/**
 * Enhanced Modal Component với Liquid Glass UI
 * 
 * Tái cấu trúc với:
 * - Staggered animations (backdrop → dialog → content)
 * - Spring physics transitions
 * - Frosted glass backdrop với dynamic blur
 * - Glass morphism dialog với depth và reflection
 * - Enhanced accessibility và keyboard support
 * - Responsive design với mobile optimizations
 * 
 * @param {object} props - Props cho component.
 * @param {boolean} props.isOpen - Trạng thái mở/đóng của modal.
 * @param {() => void} props.onClose - Callback được gọi khi modal yêu cầu đóng.
 * @param {string | React.ReactNode} [props.title] - Tiêu đề của modal.
 * @param {'sm'|'md'|'lg'|'xl'|'fullscreen'|'sheet'} [props.size='md'] - Kích thước modal.
 * @param {boolean} [props.closeOnEsc=true] - Đóng modal khi nhấn phím ESC.
 * @param {boolean} [props.closeOnOutsideClick=true] - Đóng modal khi click bên ngoài.
 * @param {React.ReactNode} [props.footer] - Nội dung footer của modal.
 * @param {React.ReactNode} props.children - Nội dung chính của modal.
 * @param {React.Ref<HTMLElement>} [props.initialFocusRef] - Ref tới element sẽ được focus khi modal mở.
 * @param {boolean} [props.preventScroll=true] - Ngăn cuộn trang nền khi modal mở.
 * @param {number} [props.zIndex] - Tùy chỉnh z-index.
 * @param {string} [props.className] - Class CSS tùy chỉnh.
 * @param {string} [props.ariaDescribedBy] - ID của element mô tả modal.
 */
const Modal = ({
  isOpen,
  onClose,
  title,
  size = 'md',
  closeOnEsc = true,
  closeOnOutsideClick = true,
  footer,
  children,
  initialFocusRef,
  preventScroll = true,
  zIndex,
  className,
  ariaDescribedBy,
}) => {
  const modalRef = useRef(null);
  const lastActiveElement = useRef(null);
  const closeButtonRef = useRef(null);
  
  // Animation states với staggered timing
  const [shouldRender, setShouldRender] = useState(false);
  const [backdropVisible, setBackdropVisible] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [contentVisible, setContentVisible] = useState(false);

  // Staggered animation timing constants
  const ANIMATION_DELAYS = {
    BACKDROP: 10,        // Backdrop fades in first
    DIALOG: 80,          // Dialog scales in after backdrop
    CONTENT: 150,        // Content fades in last
    CLOSE_DURATION: 280, // Total close animation duration
  };

  // Enhanced open/close animation lifecycle
  useEffect(() => {
    if (isOpen) {
      // Opening sequence: staggered animations
      setShouldRender(true);
      
      const backdropTimer = setTimeout(() => {
        setBackdropVisible(true);
      }, ANIMATION_DELAYS.BACKDROP);
      
      const dialogTimer = setTimeout(() => {
        setDialogVisible(true);
      }, ANIMATION_DELAYS.DIALOG);
      
      const contentTimer = setTimeout(() => {
        setContentVisible(true);
      }, ANIMATION_DELAYS.CONTENT);
      
      return () => {
        clearTimeout(backdropTimer);
        clearTimeout(dialogTimer);
        clearTimeout(contentTimer);
      };
    } else {
      // Closing sequence: reverse order
      setContentVisible(false);
      setDialogVisible(false);
      setBackdropVisible(false);
      
      const unmountTimer = setTimeout(() => {
        setShouldRender(false);
      }, ANIMATION_DELAYS.CLOSE_DURATION);
      
      return () => clearTimeout(unmountTimer);
    }
  }, [isOpen]);

  // Enhanced keyboard handler với better UX
  const handleKeyDown = useCallback((event) => {
    if (event.key === 'Escape' && closeOnEsc) {
      event.preventDefault();
      event.stopPropagation();
      onClose();
    }
  }, [closeOnEsc, onClose]);

  // Enhanced focus trap với better selector
  const handleFocusTrap = useCallback((event) => {
    if (event.key !== 'Tab' || !modalRef.current) return;

    const focusableElements = modalRef.current.querySelectorAll(
      'a[href]:not([disabled]), button:not([disabled]), textarea:not([disabled]), ' +
      'input[type="text"]:not([disabled]), input[type="radio"]:not([disabled]), ' +
      'input[type="checkbox"]:not([disabled]), input[type="email"]:not([disabled]), ' +
      'input[type="password"]:not([disabled]), select:not([disabled]), ' +
      '[tabindex]:not([tabindex="-1"]):not([disabled])'
    );
    
    if (focusableElements.length === 0) return;
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey) {
      if (document.activeElement === firstElement) {
        lastElement.focus();
        event.preventDefault();
      }
    } else {
      if (document.activeElement === lastElement) {
        firstElement.focus();
        event.preventDefault();
      }
    }
  }, []);

  // Enhanced focus management
  useEffect(() => {
    if (isOpen && dialogVisible) {
      // Lưu last active element
      lastActiveElement.current = document.activeElement;

      // Prevent body scroll
      if (preventScroll) {
        const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
        document.body.style.overflow = 'hidden';
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }

      // Add event listeners
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('keydown', handleFocusTrap);

      // Set focus với intelligent fallback
      const focusTimer = setTimeout(() => {
        if (initialFocusRef && initialFocusRef.current) {
          initialFocusRef.current.focus();
        } else if (closeButtonRef.current) {
          closeButtonRef.current.focus();
        } else if (modalRef.current) {
          modalRef.current.focus();
        }
      }, ANIMATION_DELAYS.CONTENT + 50);

      return () => {
        clearTimeout(focusTimer);
        document.removeEventListener('keydown', handleKeyDown);
        document.removeEventListener('keydown', handleFocusTrap);
        
        if (preventScroll) {
          document.body.style.overflow = '';
          document.body.style.paddingRight = '';
        }
        
        // Restore focus
        if (lastActiveElement.current && lastActiveElement.current.focus) {
          lastActiveElement.current.focus();
        }
      };
    }
  }, [isOpen, dialogVisible, preventScroll, handleKeyDown, handleFocusTrap, initialFocusRef, ANIMATION_DELAYS.CONTENT]);

  if (!shouldRender) {
    return null;
  }

  // Enhanced class names với animation states
  const backdropClasses = classNames(
    'w-modal__backdrop',
    {
      'w-modal__backdrop--visible': backdropVisible,
      'w-modal__backdrop--closing': !isOpen && shouldRender,
    }
  );
  
  const dialogClasses = classNames(
    'w-modal__dialog',
    className,
    {
      'w-modal__dialog--visible': dialogVisible,
      'w-modal__dialog--closing': !isOpen && shouldRender,
    }
  );
  
  const contentClasses = classNames(
    'w-modal__content',
    {
      'w-modal__content--visible': contentVisible,
      'w-modal__content--closing': !isOpen && shouldRender,
    }
  );
  
  const modalWrapperClasses = classNames('w-modal', `w-modal--${size}`, {
    'w-modal--open': isOpen,
  });

  return ReactDOM.createPortal(
    <div className={modalWrapperClasses} style={{ zIndex }} role="presentation">
      {/* Frosted glass backdrop with dynamic blur */}
      <div
        className={backdropClasses}
        onClick={closeOnOutsideClick ? onClose : undefined}
        aria-hidden="true"
      />
      
      {/* Glass morphism dialog */}
      <div
        ref={modalRef}
        className={dialogClasses}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        aria-describedby={ariaDescribedBy}
        tabIndex={-1}
      >
        {/* Content wrapper với staggered fade-in */}
        <div className={contentClasses}>
          {/* Header với gradient accent */}
          {title && (
            <div className="w-modal__header">
              <h2 id="modal-title" className="w-modal__title">
                {title}
              </h2>
              <button
                ref={closeButtonRef}
                onClick={onClose}
                className="w-modal__close"
                aria-label="Đóng modal"
                type="button"
              >
                <AiOutlineClose className="w-modal__close-icon" />
              </button>
            </div>
          )}
          
          {/* Body với custom scrollbar */}
          <div className="w-modal__body">
            {children}
          </div>
          
          {/* Footer với action buttons */}
          {footer && (
            <div className="w-modal__footer">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

Modal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.node,
  size: PropTypes.oneOf(['sm', 'md', 'lg', 'xl', 'fullscreen', 'sheet']),
  closeOnEsc: PropTypes.bool,
  closeOnOutsideClick: PropTypes.bool,
  footer: PropTypes.node,
  children: PropTypes.node.isRequired,
  initialFocusRef: PropTypes.shape({ current: PropTypes.instanceOf(Element) }),
  preventScroll: PropTypes.bool,
  zIndex: PropTypes.number,
  className: PropTypes.string,
  ariaDescribedBy: PropTypes.string,
};

export default Modal;
