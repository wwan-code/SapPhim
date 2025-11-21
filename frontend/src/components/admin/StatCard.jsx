import React from 'react';
import PropTypes from 'prop-types';
import classNames from '@/utils/classNames';
import CustomOverlayTrigger from '@/components/CustomTooltip/CustomOverlayTrigger';
import '@/assets/scss/components/admin/_stat-card.scss';

/**
 * StatCard Component - Hiển thị thống kê với icon và giá trị
 * @component
 * @param {object} props
 * @param {string} props.title - Tiêu đề của stat card
 * @param {string|number} props.value - Giá trị hiển thị
 * @param {React.ComponentType} props.icon - Icon component (từ react-icons)
 * @param {number} [props.trend] - Phần trăm thay đổi (dương hoặc âm)
 * @param {'primary'|'success'|'info'|'warning'|'danger'} [props.color='primary'] - Màu sắc theme
 * @param {string} [props.tooltip] - Tooltip text khi hover
 * @param {string} [props.className] - Class CSS tùy chỉnh
 * @param {boolean} [props.loading] - Trạng thái loading
 * @param {Function} [props.onClick] - Callback khi click vào card
 */
const StatCard = ({
  title,
  value,
  icon: Icon,
  trend,
  color = 'primary',
  tooltip,
  className,
  loading = false,
  onClick,
}) => {
  const cardClasses = classNames(
    'stat-card',
    `stat-card--${color}`,
    {
      'stat-card--skeleton': loading,
      'stat-card--clickable': onClick,
    },
    className
  );

  const renderTrend = () => {
    if (trend === undefined || trend === null) return null;

    const trendValue = Math.abs(trend);
    const isPositive = trend > 0;

    return (
      <CustomOverlayTrigger
        tooltip={`${isPositive ? 'Tăng' : 'Giảm'} ${trendValue}% so với kỳ trước`}
        tooltipId={`trend-${title}`}
        placement="bottom"
      >
        <span
          className={classNames('stat-card__trend', {
            'stat-card__trend--positive': isPositive,
            'stat-card__trend--negative': !isPositive,
          })}
        >
          {isPositive ? '↑' : '↓'} {trendValue}%
        </span>
      </CustomOverlayTrigger>
    );
  };

  const cardContent = (
    <>
      <div className="stat-card__icon" aria-hidden="true">
        {Icon && <Icon />}
      </div>
      <div className="stat-card__content">
        <h3 className="stat-card__title">{loading ? 'Loading...' : title}</h3>
        <p className="stat-card__value">{loading ? '---' : value}</p>
        {!loading && renderTrend()}
      </div>
    </>
  );

  if (onClick) {
    return (
      <button
        className={cardClasses}
        onClick={onClick}
        disabled={loading}
        aria-label={`${title}: ${value}`}
      >
        {cardContent}
      </button>
    );
  }

  if (tooltip) {
    return (
      <CustomOverlayTrigger
        tooltip={tooltip}
        tooltipId={`stat-${title}`}
        placement="top"
      >
        <div className={cardClasses} role="article" aria-label={`${title}: ${value}`}>
          {cardContent}
        </div>
      </CustomOverlayTrigger>
    );
  }

  return (
    <div className={cardClasses} role="article" aria-label={`${title}: ${value}`}>
      {cardContent}
    </div>
  );
};

StatCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  icon: PropTypes.elementType.isRequired,
  trend: PropTypes.number,
  color: PropTypes.oneOf(['primary', 'success', 'info', 'warning', 'danger']),
  tooltip: PropTypes.string,
  className: PropTypes.string,
  loading: PropTypes.bool,
  onClick: PropTypes.func,
};

export default StatCard;