import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import classNames from '@/utils/classNames';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ErrorMessage from '@/components/common/ErrorMessage';

import '@/assets/scss/components/admin/_list-card.scss';

// Skeleton shimmer component for ListCard
const ListCardSkeleton = ({ type = 'default', count = 3 }) => {
  const renderSkeletonItem = (index) => {
    if (type === 'user') {
      return (
        <li key={index} className="list-card__skeleton-item">
          <div className="list-card__skeleton-avatar" />
          <div className="list-card__skeleton-content">
            <div className="list-card__skeleton-line list-card__skeleton-line--title" />
            <div className="list-card__skeleton-line list-card__skeleton-line--subtitle" />
          </div>
        </li>
      );
    } else if (type === 'movie') {
      return (
        <li key={index} className="list-card__skeleton-item">
          <div className="list-card__skeleton-poster" />
          <div className="list-card__skeleton-content">
            <div className="list-card__skeleton-line list-card__skeleton-line--title" />
            <div className="list-card__skeleton-line list-card__skeleton-line--subtitle" />
          </div>
        </li>
      );
    } else if (type === 'ranked') {
      return (
        <li key={index} className="list-card__skeleton-item">
          <div className="list-card__skeleton-rank" />
          <div className="list-card__skeleton-content">
            <div className="list-card__skeleton-line list-card__skeleton-line--title" />
            <div className="list-card__skeleton-line list-card__skeleton-line--subtitle" />
          </div>
        </li>
      );
    }
    // Default skeleton item
    return (
      <li key={index} className="list-card__skeleton-item">
        <div className="list-card__skeleton-content">
          <div className="list-card__skeleton-line list-card__skeleton-line--title" />
          <div className="list-card__skeleton-line list-card__skeleton-line--subtitle" />
        </div>
      </li>
    );
  };

  return (
    <ul className="list-card__list">
      {Array.from({ length: count }).map((_, index) => renderSkeletonItem(index))}
    </ul>
  );
};

const ListCard = ({
  title,
  subtitle,
  items,
  emptyMessage,
  renderItem,
  loading,
  error,
  actions,
  filters,
  className,
  skeletonType, // 'user', 'movie', 'ranked', or 'default'
  skeletonCount = 3,
  footerContent,
}) => {
  const cardClasses = classNames(
    'list-card',
    className,
    {
      'list-card--loading': loading,
      'list-card--error': error,
      'list-card--empty': !loading && !error && (!items || items.length === 0),
    }
  );

  const renderBody = useMemo(() => {
    if (loading) {
      return (
        <div className="list-card__body">
          {/* Skeleton shimmer bên trong card khi loading */}
          <ListCardSkeleton type={skeletonType} count={skeletonCount} />
        </div>
      );
    }

    if (error) {
      return (
        <div className="list-card__body list-card__error">
          <ErrorMessage
            title="Lỗi tải dữ liệu"
            message={error?.message || 'Không thể tải dữ liệu.'}
            variant="inline"
          />
        </div>
      );
    }

    if (!items || items.length === 0) {
      return (
        <div className="list-card__body list-card__empty">
          {emptyMessage || 'Chưa có dữ liệu.'}
        </div>
      );
    }

    return (
      <div className="list-card__body">
        <ul className="list-card__list">
          {items.map((item, index) => renderItem(item, index))}
        </ul>
      </div>
    );
  }, [loading, error, items, emptyMessage, renderItem, skeletonType, skeletonCount]);

  return (
    <div className={cardClasses}>
      <div className="list-card__header">
        <div className="list-card__header-content">
          <h2 className="list-card__title">{title}</h2>
          {subtitle && <p className="list-card__subtitle">{subtitle}</p>}
        </div>
        {filters && <div className="list-card__filters">{filters}</div>}
        {actions && <div className="list-card__actions">{actions}</div>}
      </div>
      {renderBody}
      {footerContent && <div className="list-card__footer">{footerContent}</div>}
    </div>
  );
};

ListCard.propTypes = {
  title: PropTypes.node.isRequired,
  subtitle: PropTypes.node,
  items: PropTypes.array,
  emptyMessage: PropTypes.string,
  renderItem: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  error: PropTypes.object, // { message: string }
  actions: PropTypes.node,
  filters: PropTypes.node,
  className: PropTypes.string,
  skeletonType: PropTypes.oneOf(['user', 'movie', 'ranked', 'default']),
  skeletonCount: PropTypes.number,
  footerContent: PropTypes.node,
};

ListCard.defaultProps = {
  items: [],
  subtitle: null,
  emptyMessage: 'Chưa có dữ liệu.',
  loading: false,
  error: null,
  actions: null,
  filters: null,
  className: '',
  skeletonType: 'default',
  skeletonCount: 3,
  footerContent: null,
};

export default ListCard;
