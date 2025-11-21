import React, { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { 
  FaUsers, 
  FaFilm, 
  FaCommentDots, 
  FaEye, 
  FaFire, 
  FaChartLine,
  FaClock,
  FaTrophy,
  FaSync
} from 'react-icons/fa';

import dashboardService from '@/services/dashboardService';
import { useTheme } from '@/hooks/useTheme';

import LoadingSpinner from '@/components/common/LoadingSpinner';
import ErrorMessage from '@/components/common/ErrorMessage';
import CustomOverlayTrigger from '@/components/CustomTooltip/CustomOverlayTrigger';
import StatCard from '@/components/admin/StatCard';
import ChartCard from '@/components/admin/ChartCard';
import ListCard from '@/components/admin/ListCard'; // Import ListCard mới

import classNames from '@/utils/classNames';
import { formatDate } from '@/utils/dateUtils';
import { memoize } from '@/utils/performanceUtils';
import { getAvatarUrl } from '@/utils/getAvatarUrl';

import '@/assets/scss/pages/admin/_dashboard.scss';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const TRENDING_PERIODS = [
  { value: 'day', label: '24 giờ qua', icon: <FaClock /> },
  { value: 'week', label: '7 ngày qua', icon: <FaChartLine /> },
  { value: 'month', label: '1 tháng qua', icon: <FaTrophy /> },
];

// Memoized avatar URL generator
const getMoviePoster = memoize((image) => {
  return image?.posterUrl 
    ? `${import.meta.env.VITE_SERVER_URL}${image.posterUrl}` 
    : 'https://placehold.co/400x600?text=No+Poster';
});

const Dashboard = () => {
  const { theme } = useTheme();
  const [selectedTrendingPeriod, setSelectedTrendingPeriod] = useState('week');

  // Fetch dashboard analytics
  const { 
    data, 
    isLoading, 
    isError, 
    error,
    refetch 
  } = useQuery({
    queryKey: ['dashboardAnalytics'],
    queryFn: dashboardService.getDashboardAnalytics,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch trending movies
  const {
    data: trendingMovies,
    isLoading: isTrendingLoading,
    isError: isTrendingError,
    error: trendingError,
  } = useQuery({
    queryKey: ['trendingMovies', selectedTrendingPeriod],
    queryFn: () => dashboardService.getTrendingMovies(selectedTrendingPeriod, 5),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Chart options with theme support
  const chartOptions = useMemo(() => {
    const textColor = getComputedStyle(document.documentElement)
      .getPropertyValue('--w-text-color')
      .trim();
    const secondaryColor = getComputedStyle(document.documentElement)
      .getPropertyValue('--w-secondary-color')
      .trim();
    const borderColor = getComputedStyle(document.documentElement)
      .getPropertyValue('--w-border-color')
      .trim();

    return {
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
          backgroundColor: theme === 'dark' ? 'rgba(26, 26, 26, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          titleColor: secondaryColor,
          bodyColor: textColor,
          borderColor: borderColor,
          borderWidth: 0,
          padding: 12,
          cornerRadius: 8,
          displayColors: false,
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
            color: secondaryColor,
            font: { size: 11 },
          },
          grid: {
            display: false,
          },
        },
        y: {
          ticks: {
            color: secondaryColor,
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
    };
  }, [theme]);

  // Prepare chart datasets
  const chartDatasets = useMemo(() => {
    if (!data?.chartData) return null;

    const createDataset = (chartData, label, color) => ({
      labels: chartData.map((item) => 
        formatDate(item.date, 'vi-VN', { month: 'short', day: 'numeric' })
      ),
      datasets: [{
        label,
        data: chartData.map((item) => item.count),
        borderColor: color,
        backgroundColor: `${color}33`,
        tension: 0.4,
        fill: true,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: color,
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
      }],
    });

    return {
      userRegistrations: createDataset(
        data.chartData.userRegistrations,
        'Người dùng mới',
        'rgb(75, 192, 192)'
      ),
      movieUploads: createDataset(
        data.chartData.movieUploads,
        'Phim mới',
        'rgb(255, 99, 132)'
      ),
      commentActivity: createDataset(
        data.chartData.commentActivity,
        'Bình luận mới',
        'rgb(53, 162, 235)'
      ),
    };
  }, [data]);

  const handlePeriodChange = useCallback((period) => {
    setSelectedTrendingPeriod(period);
  }, []);

  // Render functions
  const renderUserItem = useCallback((user) => (
    <li key={user.id} className="list-card__item">
      <Link to={`/admin/users/${user.id}`} className="item-link">
        <img 
          src={getAvatarUrl(user)} 
          alt={user.username}
          className="item-link__avatar"
          loading="lazy"
        />
        <div className="item-link__content">
          <span className="item-link__title">{user.username}</span>
          <span className="item-link__subtitle">
            {formatDate(user.createdAt)}
          </span>
        </div>
      </Link>
    </li>
  ), []);

  const renderMovieItem = useCallback((movie, showStat = null) => (
    <li key={movie.id} className="list-card__item">
      <Link to={`/admin/movies/${movie.slug}`} className="item-link">
        <img 
          src={getMoviePoster(movie.image)} 
          alt={movie.titles[0]?.title}
          className="item-link__poster"
          loading="lazy"
        />
        <div className="item-link__content">
          <span className="item-link__title">{movie.titles[0]?.title}</span>
          <span className="item-link__subtitle">
            {showStat === 'views' && (
              <>
                <FaEye /> {movie.views.toLocaleString('vi-VN')} lượt xem
              </>
            )}
            {showStat === 'trending' && (
              <>
                <FaFire /> Score: {movie.trendingScore}
              </>
            )}
            {showStat === 'comments' && (
              <>
                <FaCommentDots /> Nhiều bình luận
              </>
            )}
          </span>
        </div>
      </Link>
    </li>
  ), []);

  if (isLoading) {
    return <LoadingSpinner fullscreen label="Đang tải dashboard..." />;
  }

  if (isError) {
    return (
      <ErrorMessage
        title="Lỗi tải dữ liệu"
        message={error?.message || 'Không thể tải dữ liệu dashboard.'}
        onRetry={refetch}
        variant="card"
      />
    );
  }

  const { overallStats, chartData, recentLists } = data;

  return (
    <div className="dashboard-page admin-page">
      {/* Header */}
      <div className="dashboard-page__header">
        <div className="dashboard-page__header-content">
          <h1 className="dashboard-page__title">Dashboard Admin</h1>
          <p className="dashboard-page__subtitle">
            Tổng quan về các chỉ số quan trọng của hệ thống
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="dashboard-page__stats">
        <StatCard
          title="Tổng người dùng"
          value={overallStats.totalUsers.toLocaleString('vi-VN')}
          icon={FaUsers}
          color="primary"
        />
        <StatCard
          title="Tổng phim"
          value={overallStats.totalMovies.toLocaleString('vi-VN')}
          icon={FaFilm}
          color="success"
        />
        <StatCard
          title="Tổng bình luận"
          value={overallStats.totalComments.toLocaleString('vi-VN')}
          icon={FaCommentDots}
          color="info"
        />
        <StatCard
          title="Tổng lượt xem"
          value={overallStats.totalViews.toLocaleString('vi-VN')}
          icon={FaEye}
          color="warning"
        />
      </div>

      {/* Charts */}
      <div className="dashboard-page__charts">
        <ChartCard
          title="Đăng ký người dùng"
          subtitle="Số lượng người dùng mới đăng ký trong 7 ngày qua"
          loading={isLoading}
          error={isError ? { message: error.message } : null}
          empty={!data?.chartData?.userRegistrations?.length}
          actions={[{ label: 'Refresh', icon: <FaSync />, onClick: refetch }]}
          chartData={data?.chartData?.userRegistrations}
          renderChart={() => (
            <Line data={chartDatasets.userRegistrations} options={chartOptions} />
          )}
        />
        <ChartCard
          title="Phim mới được thêm"
          subtitle="Số lượng phim mới được tải lên trong 7 ngày qua"
          loading={isLoading}
          error={isError ? { message: error.message } : null}
          empty={!data?.chartData?.movieUploads?.length}
          actions={[{ label: 'Refresh', icon: <FaSync />, onClick: refetch }]}
          chartData={data?.chartData?.movieUploads}
          renderChart={() => (
            <Line data={chartDatasets.movieUploads} options={chartOptions} />
          )}
        />
        <ChartCard
          title="Hoạt động bình luận"
          subtitle="Số lượng bình luận mới trong 7 ngày qua"
          loading={isLoading}
          error={isError ? { message: error.message } : null}
          empty={!data?.chartData?.commentActivity?.length}
          actions={[{ label: 'Refresh', icon: <FaSync />, onClick: refetch }]}
          chartData={data?.chartData?.commentActivity}
          renderChart={() => (
            <Line data={chartDatasets.commentActivity} options={chartOptions} />
          )}
        />
      </div>

      {/* Lists */}
      <div className="dashboard-page__lists">
        <ListCard
          title="Người dùng mới đăng ký"
          items={recentLists.recentUsers}
          emptyMessage="Chưa có người dùng mới"
          renderItem={renderUserItem}
          loading={isLoading}
          error={isError ? { message: error.message } : null}
          skeletonType="user"
        />

        <ListCard
          title="Phim được xem nhiều nhất"
          items={recentLists.mostViewedMovies}
          emptyMessage="Chưa có dữ liệu"
          renderItem={(movie) => renderMovieItem(movie, 'views')}
          loading={isLoading}
          error={isError ? { message: error.message } : null}
          skeletonType="movie"
        />

        <ListCard
          title="Phim được bình luận nhiều nhất"
          items={recentLists.mostCommentedMovies}
          emptyMessage="Chưa có dữ liệu"
          renderItem={(movie) => renderMovieItem(movie, 'comments')}
          loading={isLoading}
          error={isError ? { message: error.message } : null}
          skeletonType="movie"
        />

        <ListCard
          title={
            <>
              <FaFire className="list-card__icon" />
              Phim Trending
            </>
          }
          items={trendingMovies}
          emptyMessage="Chưa có dữ liệu trending"
          renderItem={(movie) => renderMovieItem(movie, 'trending')}
          loading={isTrendingLoading}
          error={isTrendingError ? { message: trendingError.message } : null}
          className="list-card--trending"
          skeletonType="movie"
          filters={
            <div className="period-selector">
              {TRENDING_PERIODS.map((period) => (
                <CustomOverlayTrigger
                  key={period.value}
                  tooltip={period.label}
                  tooltipId={`period-${period.value}`}
                  placement="top"
                >
                  <button
                    className={classNames('period-selector__btn', {
                      'period-selector__btn--active': selectedTrendingPeriod === period.value,
                    })}
                    onClick={() => handlePeriodChange(period.value)}
                    aria-label={period.label}
                  >
                    {period.icon}
                  </button>
                </CustomOverlayTrigger>
              ))}
            </div>
          }
        />
      </div>
    </div>
  );
};

export default Dashboard;
