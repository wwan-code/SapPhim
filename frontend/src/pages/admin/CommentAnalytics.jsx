import React, { useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import {
  FaCommentDots,
  FaCheckCircle,
  FaEyeSlash,
  FaExclamationTriangle,
  FaChartLine,
  FaSync,
  FaUsers,
  FaFileAlt,
  FaFilter,
  FaTimes,
  FaSmile,
  FaFrown,
  FaMeh,
  FaSkull,
  FaEnvelope,
  FaAngry,
} from 'react-icons/fa';

import { useCommentStatsAdmin } from '@/hooks/useCommentQueries';
import { useTheme } from '@/hooks/useTheme';

import LoadingSpinner from '@/components/common/LoadingSpinner';
import ErrorMessage from '@/components/common/ErrorMessage';
import StatCard from '@/components/admin/StatCard';
import ChartCard from '@/components/admin/ChartCard';
import ListCard from '@/components/admin/ListCard'; // Import ListCard mới
import { debounce } from '@/utils/performanceUtils';

import '@/assets/scss/pages/admin/_comment-analytics.scss';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const CONTENT_TYPE_OPTIONS = [
  { value: '', label: 'Tất cả' },
  { value: 'movie', label: 'Phim' },
  { value: 'episode', label: 'Tập phim' },
];

const SENTIMENT_CONFIG = [
  { key: 'positive', label: 'Tích cực', color: 'rgba(40, 167, 69, 0.8)', icon: FaSmile },
  { key: 'negative', label: 'Tiêu cực', color: 'rgba(220, 53, 69, 0.8)', icon: FaFrown },
  { key: 'neutral', label: 'Trung lập', color: 'rgba(108, 117, 125, 0.8)', icon: FaMeh },
  { key: 'toxic', label: 'Độc hại', color: 'rgba(255, 193, 7, 0.8)', icon: FaSkull },
  { key: 'spam', label: 'Spam', color: 'rgba(23, 162, 184, 0.8)', icon: FaEnvelope },
  { key: 'hateSpeech', label: 'Thù địch', color: 'rgba(111, 66, 193, 0.8)', icon: FaAngry },
];

const CommentAnalytics = () => {
  const { theme } = useTheme();
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    contentType: '',
    contentId: '',
    userId: '',
  });
  const [showFilters, setShowFilters] = useState(false);

  const { data: stats, isLoading, isError, error, refetch } = useCommentStatsAdmin(filters);

  // Debounced filter handler
  const debouncedFilterChange = useCallback(
    debounce((name, value) => {
      setFilters(prev => ({ ...prev, [name]: value }));
    }, 500),
    []
  );

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    debouncedFilterChange(name, value);
  };

  const handleClearFilter = (filterName) => {
    setFilters(prev => ({ ...prev, [filterName]: '' }));
  };

  const handleClearAllFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      contentType: '',
      contentId: '',
      userId: '',
    });
  };

  // Active filters count
  const activeFiltersCount = Object.values(filters).filter(v => v !== '').length;

  // Chart options with theme support
  const chartOptions = useMemo(() => {
    const textColor = getComputedStyle(document.documentElement)
      .getPropertyValue('--w-text-color')
      .trim();
    const textColorLight = getComputedStyle(document.documentElement)
      .getPropertyValue('--w-text-color-light')
      .trim();
    const borderColor = getComputedStyle(document.documentElement)
      .getPropertyValue('--w-border-color')
      .trim();

    return {
      line: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            backgroundColor: theme === 'dark' ? '#1a1a1a' : '#ffffff',
            titleColor: textColor,
            bodyColor: textColor,
            borderColor: borderColor,
            borderWidth: 1,
            padding: 12,
            cornerRadius: 8,
            callbacks: {
              label: (context) => {
                const value = new Intl.NumberFormat('vi-VN').format(context.parsed.y);
                return `${context.dataset.label}: ${value}`;
              },
            },
          },
        },
        scales: {
          x: {
            ticks: {
              color: textColorLight,
              font: { size: 11 },
            },
            grid: {
              display: false,
            },
          },
          y: {
            ticks: {
              color: textColorLight,
              font: { size: 11 },
              callback: (value) => new Intl.NumberFormat('vi-VN', {
                notation: 'compact',
                compactDisplay: 'short'
              }).format(value),
            },
            grid: {
              color: borderColor,
              drawBorder: false,
            },
          },
        },
      },
      doughnut: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: textColor,
              padding: 15,
              font: { size: 12 },
              usePointStyle: true,
              pointStyle: 'circle',
            },
          },
          tooltip: {
            backgroundColor: theme === 'dark' ? '#1a1a1a' : '#ffffff',
            titleColor: textColor,
            bodyColor: textColor,
            borderColor: borderColor,
            borderWidth: 1,
            padding: 12,
            cornerRadius: 8,
            callbacks: {
              label: (context) => {
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const value = context.parsed;
                const percentage = ((value / total) * 100).toFixed(1);
                return `${context.label}: ${value.toLocaleString('vi-VN')} (${percentage}%)`;
              },
            },
          },
        },
      },
    };
  }, [theme]);

  // Comments by date chart data
  const commentsByDateData = useMemo(() => {
    if (!stats?.commentsByDate) return null;

    return {
      labels: stats.commentsByDate.map(item => item.date),
      datasets: [{
        label: 'Số bình luận',
        data: stats.commentsByDate.map(item => item.count),
        borderColor: 'rgb(232, 194, 110)',
        backgroundColor: 'rgba(232, 194, 110, 0.3)',
        tension: 0.4,
        fill: true,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: 'rgb(232, 194, 110)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
      }],
    };
  }, [stats]);

  // Sentiment analysis chart data
  const sentimentData = useMemo(() => {
    if (!stats?.sentimentStats) return null;

    const sentimentStats = stats.sentimentStats;
    const labels = SENTIMENT_CONFIG.map(s => s.label);
    const data = SENTIMENT_CONFIG.map(s => sentimentStats[s.key] || 0);
    const backgroundColor = SENTIMENT_CONFIG.map(s => s.color);
    const borderColor = backgroundColor.map(c => c.replace('0.8', '1'));

    return {
      labels,
      datasets: [{
        data,
        backgroundColor,
        borderColor,
        borderWidth: 2,
      }],
    };
  }, [stats]);

  // Render function for top users
  const renderUserRankedItem = useCallback((user, index) => (
    <Link
      key={user.userId}
      to={`/admin/users/${user.userId}`}
      className="list-card__item"
    >
      <div className="list-card__rank">{index + 1}</div>
      <div className="list-card__info">
        <span className="list-card__name">{user.user.username}</span>
        <span className="list-card__meta">
          <FaCommentDots /> {user.commentCount} bình luận
        </span>
      </div>
    </Link>
  ), []);

  // Render function for top content
  const renderContentRankedItem = useCallback((content, index) => (
    <div
      key={`${content.contentType}-${content.contentId}`}
      className="list-card__item"
    >
      <div className="list-card__rank">{index + 1}</div>
      <div className="list-card__info">
        <span className="list-card__name">
          {content.contentType === 'movie' ? 'Phim' : 'Tập'} #{content.contentId}
        </span>
        <span className="list-card__meta">
          <FaCommentDots /> {content.commentCount} bình luận
        </span>
      </div>
    </div>
  ), []);

  if (isLoading) {
    return <LoadingSpinner fullscreen label="Đang tải thống kê bình luận..." />;
  }

  if (isError) {
    return (
      <ErrorMessage
        title="Lỗi tải dữ liệu"
        message={error?.message || 'Không thể tải thống kê bình luận.'}
        onRetry={refetch}
        variant="card"
      />
    );
  }

  return (
    <div className="comment-analytics">
      {/* Header */}
      <div className="comment-analytics__header">
        <div className="comment-analytics__header-content">
          <h1 className="comment-analytics__title">
            <FaChartLine /> Thống kê & Phân tích Bình luận
          </h1>
          <p className="comment-analytics__subtitle">
            Phân tích chi tiết về hoạt động bình luận và cảm xúc người dùng
          </p>
        </div>
        <button
          className="comment-analytics__filter-toggle"
          onClick={() => setShowFilters(!showFilters)}
        >
          <FaFilter />
          Bộ lọc
          {activeFiltersCount > 0 && (
            <span className="comment-analytics__filter-badge">{activeFiltersCount}</span>
          )}
        </button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="comment-analytics__filters">
          <div className="comment-analytics__filters-grid">
            <div className="filter-group">
              <label htmlFor="start-date">Từ ngày</label>
              <input
                type="date"
                id="start-date"
                name="startDate"
                defaultValue={filters.startDate}
                onChange={handleFilterChange}
              />
              {filters.startDate && (
                <button
                  className="filter-group__clear"
                  onClick={() => handleClearFilter('startDate')}
                  aria-label="Xóa bộ lọc từ ngày"
                >
                  <FaTimes />
                </button>
              )}
            </div>

            <div className="filter-group">
              <label htmlFor="end-date">Đến ngày</label>
              <input
                type="date"
                id="end-date"
                name="endDate"
                defaultValue={filters.endDate}
                onChange={handleFilterChange}
              />
              {filters.endDate && (
                <button
                  className="filter-group__clear"
                  onClick={() => handleClearFilter('endDate')}
                  aria-label="Xóa bộ lọc đến ngày"
                >
                  <FaTimes />
                </button>
              )}
            </div>

            <div className="filter-group">
              <label htmlFor="content-type">Loại nội dung</label>
              <select
                id="content-type"
                name="contentType"
                defaultValue={filters.contentType}
                onChange={handleFilterChange}
              >
                {CONTENT_TYPE_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              {filters.contentType && (
                <button
                  className="filter-group__clear"
                  onClick={() => handleClearFilter('contentType')}
                  aria-label="Xóa bộ lọc loại nội dung"
                >
                  <FaTimes />
                </button>
              )}
            </div>

            <div className="filter-group">
              <label htmlFor="content-id">Content ID</label>
              <input
                type="number"
                id="content-id"
                name="contentId"
                defaultValue={filters.contentId}
                onChange={handleFilterChange}
                placeholder="ID phim/tập..."
              />
              {filters.contentId && (
                <button
                  className="filter-group__clear"
                  onClick={() => handleClearFilter('contentId')}
                  aria-label="Xóa bộ lọc Content ID"
                >
                  <FaTimes />
                </button>
              )}
            </div>

            <div className="filter-group">
              <label htmlFor="user-id">User ID</label>
              <input
                type="number"
                id="user-id"
                name="userId"
                defaultValue={filters.userId}
                onChange={handleFilterChange}
                placeholder="ID người dùng..."
              />
              {filters.userId && (
                <button
                  className="filter-group__clear"
                  onClick={() => handleClearFilter('userId')}
                  aria-label="Xóa bộ lọc User ID"
                >
                  <FaTimes />
                </button>
              )}
            </div>
          </div>

          {activeFiltersCount > 0 && (
            <button
              className="comment-analytics__clear-all"
              onClick={handleClearAllFilters}
            >
              <FaTimes /> Xóa tất cả bộ lọc
            </button>
          )}
        </div>
      )}

      {/* Stats Cards */}
      <div className="comment-analytics__stats">
        <StatCard
          title="Tổng bình luận"
          value={stats?.totalComments?.toLocaleString('vi-VN') || '0'}
          icon={FaCommentDots}
          color="primary"
        />
        <StatCard
          title="Đã duyệt"
          value={stats?.approvedComments?.toLocaleString('vi-VN') || '0'}
          icon={FaCheckCircle}
          color="success"
          tooltip="Số bình luận đã được duyệt và hiển thị"
        />
        <StatCard
          title="Bị ẩn"
          value={stats?.hiddenComments?.toLocaleString('vi-VN') || '0'}
          icon={FaEyeSlash}
          color="warning"
          tooltip="Số bình luận bị ẩn bởi admin"
        />
        <StatCard
          title="Bị báo cáo"
          value={stats?.reportedCommentsCount?.toLocaleString('vi-VN') || '0'}
          icon={FaExclamationTriangle}
          color="danger"
          tooltip="Số bình luận có ít nhất 1 báo cáo"
        />
      </div>

      {/* Charts */}
      <div className="comment-analytics__charts">
        <ChartCard
          title="Bình luận theo thời gian"
          loading={isLoading}
          error={isError ? { message: error.message } : null}
          empty={!stats?.commentsByDate || stats.commentsByDate.length === 0}
          actions={[{ label: 'Refresh', icon: <FaSync />, onClick: refetch }]}
          chartData={stats?.commentsByDate}
          renderChart={() => (
            <Line data={commentsByDateData} options={chartOptions.line} />
          )}
        />
        <ChartCard
          title="Phân tích cảm xúc (AI)"
          loading={isLoading}
          error={isError ? { message: error.message } : null}
          empty={!stats?.sentimentStats}
          actions={[{ label: 'Refresh', icon: <FaSync />, onClick: refetch }]}
          chartData={stats?.sentimentStats ? Object.entries(stats.sentimentStats).map(([key, value]) => ({ sentiment: key, count: value })) : []}
          renderChart={() => (
            <Doughnut data={sentimentData} options={chartOptions.doughnut} />
          )}
          metrics={SENTIMENT_CONFIG.map(config => ({
            label: config.label,
            value: (stats?.sentimentStats?.[config.key] || 0).toLocaleString('vi-VN'),
            hint: `Tổng số bình luận ${config.label.toLowerCase()}`
          }))}
        />
      </div>

      {/* Top Lists */}
      <div className="comment-analytics__lists">
        {/* Top Users */}
        <ListCard
          title={
            <>
              <FaUsers className="list-card__icon" />
              Top người dùng bình luận
            </>
          }
          items={stats?.topUsers}
          emptyMessage="Chưa có dữ liệu"
          renderItem={renderUserRankedItem}
          loading={isLoading}
          error={isError ? { message: error.message } : null}
          skeletonType="ranked"
        />

        {/* Top Content */}
        <ListCard
          title={
            <>
              <FaFileAlt className="list-card__icon" />
              Top nội dung được bình luận
            </>
          }
          items={stats?.topContent}
          emptyMessage="Chưa có dữ liệu"
          renderItem={renderContentRankedItem}
          loading={isLoading}
          error={isError ? { message: error.message } : null}
          skeletonType="ranked"
        />
      </div>
    </div>
  );
};

export default CommentAnalytics;
