import React, { useRef, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  FaDownload,
  FaFileCsv,
  FaFileImage,
  FaRegFrown,
  FaArrowDown,
  FaArrowUp,
  FaMinus,
} from 'react-icons/fa';
import { captureChartAsBlob, exportToCsv, saveFile } from '@/utils/exportUtils';

import { useDropdown } from '@/hooks/useDropdown';
import classNames from '@/utils/classNames';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ErrorMessage from '@/components/common/ErrorMessage';
import CustomOverlayTrigger from '@/components/CustomTooltip/CustomOverlayTrigger';
import { debounce } from '@/utils/performanceUtils';

import '@/assets/scss/components/admin/_chart-card.scss';

// Helper to get trend icon
const getTrendIcon = (trend) => {
  switch (trend) {
    case 'up':
      return <FaArrowUp className="chart-card__metric-trend--up" />;
    case 'down':
      return <FaArrowDown className="chart-card__metric-trend--down" />;
    case 'flat':
      return <FaMinus className="chart-card__metric-trend--flat" />;
    default:
      return null;
  }
};

/**
 * A reusable card component for displaying charts in the admin dashboard.
 * It handles loading, error, empty states, and provides a consistent header, footer, and actions.
 * @param {object} props - Component props.
 */
const ChartCard = ({
  title,
  subtitle,
  timeframe,
  onTimeframeChange,
  filters,
  actions = [],
  metrics,
  height = 350,
  loading = false,
  error = null,
  empty = false,
  compact = false,
  className,
  renderChart,
  chartData, // Pass chart data for CSV export
}) => {
  const chartBodyRef = useRef(null);
  const chartContainerRef = useRef(null);
  const { isOpen, getTriggerProps, getDropdownProps } = useDropdown();
  const dropdownId = `chart-actions-${title.replace(/\s+/g, '-')}`;

  const debouncedTimeframeChange = useMemo(
    () => (onTimeframeChange ? debounce(onTimeframeChange, 300) : null),
    [onTimeframeChange]
  );

  const handleExportPNG = useCallback(async () => {
    if (chartContainerRef.current) {
      try {
        const blob = await captureChartAsBlob(chartContainerRef.current);
        saveFile(blob, `${title.replace(/\s+/g, '_').toLowerCase()}_chart.png`);
      } catch (err) {
        console.error('Error exporting chart as PNG:', err);
        alert('Không thể xuất biểu đồ thành ảnh PNG.');
      }
    }
  }, [title]);

  const handleExportCSV = useCallback(() => {
    if (!chartData || chartData.length === 0) {
      alert('Không có dữ liệu để xuất.');
      return;
    }
    exportToCsv(chartData, `${title.replace(/\s+/g, '_').toLowerCase()}_data.csv`);
  }, [chartData, title]);

  const defaultActions = useMemo(() => [
    {
      icon: <FaFileImage />,
      label: 'Export PNG',
      onClick: handleExportPNG,
      ariaLabel: 'Export chart as PNG image',
    },
    {
      icon: <FaFileCsv />,
      label: 'Export CSV',
      onClick: handleExportCSV,
      ariaLabel: 'Export chart data as CSV file',
    },
  ], [handleExportPNG, handleExportCSV]);

  const allActions = [...actions, ...defaultActions];

  const cardClasses = classNames(
    'chart-card',
    {
      '--loading': loading,
      '--error': !!error,
      '--empty': !loading && !error && empty,
      '--compact': compact,
    },
    className
  );

  const renderHeader = () => (
    <div className="chart-card__header">
      <div className="chart-card__title-wrapper">
        <h3 className="chart-card__title">{title}</h3>
        {subtitle && <p className="chart-card__subtitle">{subtitle}</p>}
      </div>
      <div className="chart-card__controls">
        {onTimeframeChange && (
          <div className="chart-card__timeframe">
            {['24h', '7d', '30d', '90d'].map((tf) => (
              <button
                key={tf}
                className={classNames('timeframe-btn', { '--active': timeframe === tf })}
                onClick={() => debouncedTimeframeChange(tf)}
                aria-pressed={timeframe === tf}
              >
                {tf.toUpperCase()}
              </button>
            ))}
          </div>
        )}
        {filters && <div className="chart-card__filters">{filters}</div>}
        {allActions.length > 0 && (
          <div className="chart-card__actions">
            <button
              {...getTriggerProps(dropdownId, { ariaLabel: 'Open chart actions menu' })}
              className="dropdown-toggle-btn"
            >
              <FaDownload />
            </button>
            {isOpen(dropdownId) && (
              <div className="dropdown-menu" {...getDropdownProps(dropdownId)}>
                <ul>
                  {allActions.map((action, index) => (
                    <li key={index}>
                      <button onClick={action.onClick} aria-label={action.ariaLabel} className="dropdown-item">
                        {action.icon} {action.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  const renderBody = () => (
    <div className="chart-card__body" ref={chartBodyRef} style={{ height: compact ? 'auto' : height }}>
      {loading && (
        <div className="chart-card__overlay chart-card__overlay--loading">
          <LoadingSpinner label="Đang tải dữ liệu..." />
        </div>
      )}
      {error && (
        <div className="chart-card__overlay chart-card__overlay--error">
          <ErrorMessage
            title="Lỗi"
            message={error.message || 'Không thể tải dữ liệu biểu đồ.'}
            code={error.code}
            onRetry={actions.find(a => a.label.toLowerCase() === 'refresh')?.onClick}
            variant="inline"
          />
        </div>
      )}
      {!loading && !error && empty && (
        <div className="chart-card__overlay chart-card__overlay--empty">
          <FaRegFrown className="empty-icon" />
          <p>Không có dữ liệu để hiển thị.</p>
          <span>Vui lòng thử lại hoặc thay đổi bộ lọc.</span>
        </div>
      )}
      <div className="chart-card__chart-container" ref={chartContainerRef}>
        {renderChart && !error && !empty && renderChart()}
      </div>
    </div>
  );

  const renderFooter = () => (
    metrics && metrics.length > 0 && !loading && !error && (
      <div className="chart-card__footer">
        {metrics.map((metric, index) => (
          <CustomOverlayTrigger
            key={index}
            tooltip={metric.hint || metric.label}
            tooltipId={`metric-tooltip-${index}`}
            placement="top"
          >
            <div className="chart-card__metric">
              <span className="chart-card__metric-label">{metric.label}</span>
              <div className="chart-card__metric-value">
                {metric.value}
                {getTrendIcon(metric.trend)}
              </div>
            </div>
          </CustomOverlayTrigger>
        ))}
      </div>
    )
  );

  return (
    <div className={cardClasses}>
      {renderHeader()}
      {renderBody()}
      {renderFooter()}
    </div>
  );
};

ChartCard.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  timeframe: PropTypes.oneOf(['24h', '7d', '30d', '90d', 'custom']),
  onTimeframeChange: PropTypes.func,
  filters: PropTypes.node,
  actions: PropTypes.arrayOf(
    PropTypes.shape({
      icon: PropTypes.node,
      label: PropTypes.string.isRequired,
      onClick: PropTypes.func.isRequired,
      ariaLabel: PropTypes.string,
    })
  ),
  metrics: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      trend: PropTypes.oneOf(['up', 'down', 'flat']),
      hint: PropTypes.string,
    })
  ),
  height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  loading: PropTypes.bool,
  error: PropTypes.shape({
    code: PropTypes.string,
    message: PropTypes.string.isRequired,
  }),
  empty: PropTypes.bool,
  compact: PropTypes.bool,
  className: PropTypes.string,
  renderChart: PropTypes.func,
  chartData: PropTypes.array, // Dữ liệu thô cho export CSV
};

export default ChartCard;
