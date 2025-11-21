import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { FaExclamationTriangle, FaRedo, FaHome } from 'react-icons/fa';
import '@/assets/scss/components/common/_error-boundary.scss';

/**
 * ErrorBoundary - Bắt lỗi React và hiển thị UI thân thiện
 * Hỗ trợ recovery, logging, và fallback UI
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
      lastErrorTime: null,
    };
    this.resetTimer = null;
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error, errorInfo) {
    const { onError, logErrors, maxErrors, resetTimeout } = this.props;
    const now = Date.now();

    // Log error
    if (logErrors) {
      this.logError(error, errorInfo);
    }

    // Call custom error handler
    if (onError) {
      onError(error, errorInfo);
    }

    // Update state
    this.setState((prevState) => {
      const timeSinceLastError = now - (prevState.lastErrorTime || 0);
      const shouldResetCount = timeSinceLastError > resetTimeout;

      return {
        errorInfo,
        errorCount: shouldResetCount ? 1 : prevState.errorCount + 1,
        lastErrorTime: now,
      };
    });

    // Auto-reset after timeout
    if (this.resetTimer) {
      clearTimeout(this.resetTimer);
    }

    this.resetTimer = setTimeout(() => {
      this.setState({ errorCount: 0 });
    }, resetTimeout);
  }

  componentWillUnmount() {
    if (this.resetTimer) {
      clearTimeout(this.resetTimer);
    }
  }

  logError = (error, errorInfo) => {
    const errorLog = {
      message: error.toString(),
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', errorLog);
    }

    // Send to error tracking service
    if (window.errorTracker) {
      window.errorTracker.logError(errorLog);
    }

    // Store in localStorage for debugging
    try {
      const errors = JSON.parse(localStorage.getItem('app_errors') || '[]');
      errors.push(errorLog);
      // Keep only last 10 errors
      localStorage.setItem('app_errors', JSON.stringify(errors.slice(-10)));
    } catch (e) {
      console.warn('Failed to store error in localStorage', e);
    }
  };

  handleReset = () => {
    const { onReset } = this.props;

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
      lastErrorTime: null,
    });

    if (onReset) {
      onReset();
    }
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleReload = () => {
    window.location.reload();
  };

  renderFallback() {
    const { fallback, showDetails, level } = this.props;
    const { error, errorInfo, errorCount } = this.state;

    // Custom fallback
    if (fallback) {
      return typeof fallback === 'function'
        ? fallback({ error, errorInfo, resetError: this.handleReset })
        : fallback;
    }

    // Too many errors - critical
    const isCritical = errorCount >= this.props.maxErrors;

    return (
      <div className={`error-boundary error-boundary--${level}`}>
        <div className="error-boundary__container">
          <div className="error-boundary__icon">
            <FaExclamationTriangle size={64} />
          </div>

          <h1 className="error-boundary__title">
            {isCritical ? 'Lỗi nghiêm trọng' : 'Đã xảy ra lỗi'}
          </h1>

          <p className="error-boundary__message">
            {isCritical
              ? 'Ứng dụng gặp nhiều lỗi liên tiếp. Vui lòng tải lại trang hoặc liên hệ hỗ trợ.'
              : 'Đã xảy ra lỗi không mong muốn. Chúng tôi xin lỗi vì sự bất tiện này.'}
          </p>

          {showDetails && error && (
            <details className="error-boundary__details">
              <summary>Chi tiết lỗi (dành cho developer)</summary>
              <div className="error-boundary__code">
                <p>
                  <strong>Error:</strong> {error.toString()}
                </p>
                {error.stack && (
                  <pre>
                    <code>{error.stack}</code>
                  </pre>
                )}
                {errorInfo?.componentStack && (
                  <pre>
                    <code>{errorInfo.componentStack}</code>
                  </pre>
                )}
              </div>
            </details>
          )}

          <div className="error-boundary__actions">
            {!isCritical && (
              <button
                onClick={this.handleReset}
                className="error-boundary__btn error-boundary__btn--primary"
              >
                <FaRedo /> Thử lại
              </button>
            )}

            <button
              onClick={this.handleGoHome}
              className="error-boundary__btn error-boundary__btn--secondary"
            >
              <FaHome /> Về trang chủ
            </button>

            {isCritical && (
              <button
                onClick={this.handleReload}
                className="error-boundary__btn error-boundary__btn--primary"
              >
                <FaRedo /> Tải lại trang
              </button>
            )}
          </div>

          {errorCount > 1 && !isCritical && (
            <p className="error-boundary__warning">
              ⚠️ Lỗi đã xảy ra {errorCount} lần gần đây
            </p>
          )}
        </div>
      </div>
    );
  }

  render() {
    if (this.state.hasError) {
      return this.renderFallback();
    }

    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
  fallback: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
  onError: PropTypes.func,
  onReset: PropTypes.func,
  showDetails: PropTypes.bool,
  logErrors: PropTypes.bool,
  level: PropTypes.oneOf(['page', 'section', 'component']),
  maxErrors: PropTypes.number,
  resetTimeout: PropTypes.number,
};

ErrorBoundary.defaultProps = {
  fallback: null,
  onError: null,
  onReset: null,
  showDetails: process.env.NODE_ENV === 'development',
  logErrors: true,
  level: 'page',
  maxErrors: 5,
  resetTimeout: 30000, // 30 seconds
};

export default ErrorBoundary;

/**
 * HOC để wrap component với ErrorBoundary
 */
export function withErrorBoundary(Component, errorBoundaryProps = {}) {
  const WrappedComponent = (props) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${
    Component.displayName || Component.name || 'Component'
  })`;

  return WrappedComponent;
}

/**
 * Hook để throw error từ functional component
 */
export function useErrorHandler() {
  const [, setError] = React.useState();

  return React.useCallback(
    (error) => {
      setError(() => {
        throw error;
      });
    },
    [setError]
  );
}