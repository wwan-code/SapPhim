import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '@/assets/scss/pages/_movie-watch-page.scss';
import { debounce } from 'lodash';
import { toast } from 'react-toastify';
import PlayerContainer from '@/components/watch/PlayerContainer';
import MovieInfo from '@/components/watch/MovieInfo';
import Sidebar from '@/components/watch/Sidebar';
import MovieMeta from '@/components/watch/MovieMeta';
import MovieWatchSkeleton from '@/components/skeletons/MovieWatchSkeleton';
import ErrorMessage from '@/components/common/ErrorMessage';
import watchHistoryService from '@/services/watchHistoryService';
import { useSelector } from 'react-redux';
import CommentSection from '@/components/comments/CommentSection';
import ContinueWatchingModal from '@/components/watch/ContinueWatchingModal';
import EpisodeList from '../components/watch/EpisodeList';
import { useGetMovieWatchData } from '@/hooks/useMovieQueries';

const MovieWatchPage = () => {
  const { slug, episodeNumber } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useSelector((state) => state.auth);

  const currentUserRef = useRef(currentUser);
  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  // React Query for data fetching
  const {
    data: watchData,
    isLoading: loading,
    error: queryError
  } = useGetMovieWatchData(slug, episodeNumber);

  // Destructure data with defaults
  const movie = watchData?.movie || null;
  const episodes = watchData?.episodes || [];
  const currentEpisode = watchData?.currentEpisode || null;
  const recommendedMovies = watchData?.recommendedMovies || [];
  const hasNoEpisodes = watchData?.hasNoEpisodes || false;
  const initialProgress = watchData?.watchProgress || 0;

  const [isCinemaMode, setIsCinemaMode] = useState(false);
  const [autoNext, setAutoNext] = useState(true);

  const currentTimeRef = useRef(0);
  const isPlayingRef = useRef(false);
  const playerContainerRef = useRef(null);

  const [showContinueModal, setShowContinueModal] = useState(false);
  const [savedProgress, setSavedProgress] = useState(0);
  const [isSeekingToProgress, setIsSeekingToProgress] = useState(false);
  const hasCheckedProgressRef = useRef(false);

  // Initialize progress from API if available
  useEffect(() => {
    if (initialProgress > 0 && currentTimeRef.current === 0) {
      currentTimeRef.current = initialProgress;
    }
  }, [initialProgress]);

  const toggleCinemaMode = useCallback(() => {
    setIsCinemaMode(prevMode => !prevMode);
  }, []);

  useEffect(() => {
    if (isCinemaMode) {
      document.body.classList.add('cinema-mode');
    } else {
      document.body.classList.remove('cinema-mode');
    }

    return () => {
      document.body.classList.remove('cinema-mode');
    };
  }, [isCinemaMode]);

  // Fetch watch history and check if we should show Continue Watching modal
  useEffect(() => {
    const checkWatchProgress = async () => {
      if (hasCheckedProgressRef.current) return;
      if (!currentUser || !movie || !currentEpisode) return;

      try {
        const response = await watchHistoryService.getProgress({
          movieId: movie.id,
          episodeId: currentEpisode.id,
        });

        if (response.success && response.data) {
          const { progress } = response.data;

          let durationInSeconds = 0;
          if (currentEpisode.duration) {
            if (typeof currentEpisode.duration === 'number') {
              durationInSeconds = currentEpisode.duration;
            } else {
              const parts = currentEpisode.duration.split(':').map(Number);
              if (parts.length === 3) {
                durationInSeconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
              } else if (parts.length === 2) {
                durationInSeconds = parts[0] * 60 + parts[1];
              }
            }
          }

          const MIN_PROGRESS = 5;
          const COMPLETION_THRESHOLD = 0.95;

          if (progress > MIN_PROGRESS) {
            if (durationInSeconds > 0) {
              const progressRatio = progress / durationInSeconds;
              if (progressRatio < COMPLETION_THRESHOLD) {
                setSavedProgress(progress);
                setShowContinueModal(true);
              }
            } else {
              setSavedProgress(progress);
              setShowContinueModal(true);
            }
          }
        }
      } catch (error) {
        if (error.response?.status !== 404) {
          console.error('Error fetching watch progress:', error);
        }
      } finally {
        hasCheckedProgressRef.current = true;
      }
    };

    checkWatchProgress();
  }, [currentUser, movie, currentEpisode]);

  // Reset hasCheckedProgressRef when episode changes
  useEffect(() => {
    hasCheckedProgressRef.current = false;
    setShowContinueModal(false);
    setSavedProgress(0);
  }, [slug, episodeNumber]);

  // Debounced save function - saves every 10 seconds while playing
  const debouncedSaveProgress = useMemo(
    () => debounce((movieId, episodeId, progress) => {
      const user = currentUserRef.current;
      if (!user) return;
      watchHistoryService.saveProgress({
        movieId,
        episodeId,
        progress: Math.floor(progress),
        timestamp: new Date().toISOString()
      }).catch((e) => console.error("Error saving watch history:", e));
    }, 10000),
    []
  );

  const saveProgressNow = useCallback((movieId, episodeId, progress) => {
    const user = currentUserRef.current;
    if (!user) return;
    watchHistoryService.saveProgress({
      movieId,
      episodeId,
      progress: Math.floor(progress),
      timestamp: new Date().toISOString()
    }).catch((e) => console.error("Error saving watch history:", e));
  }, []);

  const handleTimeUpdate = useCallback((currentTime) => {
    currentTimeRef.current = currentTime;

    if (isPlayingRef.current && movie && currentEpisode && currentTime > 0) {
      debouncedSaveProgress(movie.id, currentEpisode.id, currentTime);
    }
  }, [movie, currentEpisode, debouncedSaveProgress]);

  const handlePlay = useCallback(() => {
    isPlayingRef.current = true;
  }, []);

  const handlePause = useCallback(() => {
    isPlayingRef.current = false;
    if (movie && currentEpisode && currentTimeRef.current > 0) {
      saveProgressNow(movie.id, currentEpisode.id, currentTimeRef.current);
    }
  }, [movie, currentEpisode, saveProgressNow]);

  const handleSeeked = useCallback((newTime) => {
    currentTimeRef.current = newTime;
    if (movie && currentEpisode && newTime > 0) {
      saveProgressNow(movie.id, currentEpisode.id, newTime);
    }
  }, [movie, currentEpisode, saveProgressNow]);

  const handleEpisodeChange = useCallback((newEpisodeNumber) => {
    navigate(`/watch/${slug}/episode/${newEpisodeNumber}`);
  }, [navigate, slug]);

  const handleNextEpisode = useCallback(() => {
    const sortedEpisodes = [...episodes].sort((a, b) => a.episodeNumber - b.episodeNumber);
    const currentEpisodeIndex = sortedEpisodes.findIndex(
      (ep) => ep.episodeNumber === currentEpisode.episodeNumber
    );

    if (currentEpisodeIndex > -1 && currentEpisodeIndex < sortedEpisodes.length - 1) {
      const nextEpisode = sortedEpisodes[currentEpisodeIndex + 1];
      handleEpisodeChange(nextEpisode.episodeNumber);
    }
  }, [episodes, currentEpisode, handleEpisodeChange]);

  const hasNextEpisode = useMemo(() => {
    if (!currentEpisode || !episodes || episodes.length === 0) return false;
    const sortedEpisodes = [...episodes].sort((a, b) => a.episodeNumber - b.episodeNumber);
    const currentEpisodeIndex = sortedEpisodes.findIndex(
      (ep) => ep.episodeNumber === currentEpisode.episodeNumber
    );
    return currentEpisodeIndex > -1 && currentEpisodeIndex < sortedEpisodes.length - 1;
  }, [currentEpisode, episodes]);

  const isAutoNextDisabled = useMemo(() => {
    return movie?.type === 'movie' && movie?.belongToCategory === 'Phim lẻ';
  }, [movie]);

  const handleVideoEnded = useCallback(() => {
    if (movie && currentEpisode) {
      saveProgressNow(movie.id, currentEpisode.id, currentTimeRef.current);

      // Auto next episode logic
      if (autoNext && !isAutoNextDisabled && hasNextEpisode) {
        // Add a small delay for better UX
        setTimeout(() => {
          handleNextEpisode();
        }, 1000);
      }
    }
  }, [movie, currentEpisode, saveProgressNow, autoNext, isAutoNextDisabled, hasNextEpisode, handleNextEpisode]);

  useEffect(() => {
    return () => {
      debouncedSaveProgress.cancel();

      if (movie && currentEpisode && currentTimeRef.current > 0) {
        watchHistoryService.saveProgress({
          movieId: movie.id,
          episodeId: currentEpisode.id,
          progress: Math.floor(currentTimeRef.current),
          timestamp: new Date().toISOString()
        }).catch((e) => console.error("Error saving final watch history:", e));
      }
    };
  }, [movie, currentEpisode, debouncedSaveProgress]);

  useEffect(() => {
    if (movie && currentEpisode) {
      currentTimeRef.current = 0;
      isPlayingRef.current = false;
    }
  }, [movie, currentEpisode]);

  const handleContinueWatching = useCallback(() => {
    if (playerContainerRef.current && savedProgress > 0) {
      setIsSeekingToProgress(true);
      playerContainerRef.current.seekTo(savedProgress);
      setTimeout(() => {
        setShowContinueModal(false);
        setIsSeekingToProgress(false);
      }, 500);
    }
  }, [savedProgress]);

  // Handle notify me when new episodes available
  const handleNotifyMe = useCallback(() => {
    // Placeholder - sẽ triển khai tính năng notification sau
    console.log('Nhận thông báo khi có tập mới - Tính năng đang phát triển');
    toast.info('Nhận thông báo khi có tập mới - Tính năng đang phát triển');
    // TODO: Implement notification subscription
  }, []);

  const handleStartOver = useCallback(async () => {
    setIsSeekingToProgress(true);

    if (currentUser && movie && currentEpisode) {
      try {
        await watchHistoryService.saveProgress({
          movieId: movie.id,
          episodeId: currentEpisode.id,
          progress: 0,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        console.error('Error resetting watch progress:', error);
      }
    }

    if (playerContainerRef.current) {
      playerContainerRef.current.seekTo(0);
    }

    setTimeout(() => {
      setShowContinueModal(false);
      setIsSeekingToProgress(false);
    }, 300);
  }, [currentUser, movie, currentEpisode]);

  // Memoize default title
  const defaultTitle = useMemo(() => {
    return movie?.titles?.find((t) => t.type === 'default')?.title || 'Untitled';
  }, [movie]);

  if (loading) {
    return <MovieWatchSkeleton />;
  }

  if (queryError) {
    return (
      <div className="container-fluid page-container">
        <ErrorMessage
          variant="card"
          title="Lỗi tải phim"
          message={queryError.message || 'Lỗi không xác định'}
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="container-fluid page-container">
        <ErrorMessage
          variant="card"
          title="Không tìm thấy dữ liệu"
          message="Không có dữ liệu phim hoặc tập phim để hiển thị."
        />
      </div>
    );
  }

  return (
    <div className="movie-watch-page">
      <div className="movie-watch-page__main-content">
        <PlayerContainer
          ref={playerContainerRef}
          episode={currentEpisode}
          movieTitle={defaultTitle}
          hasNoEpisodes={hasNoEpisodes}
          onTimeUpdate={handleTimeUpdate}
          onPlay={handlePlay}
          onPause={handlePause}
          onSeeked={handleSeeked}
          onEnded={handleVideoEnded}
          onNotifyMe={handleNotifyMe}
        />

        <MovieInfo
          movie={movie}
          currentEpisode={currentEpisode}
          onToggleCinemaMode={toggleCinemaMode}
          isCinemaMode={isCinemaMode}
          onNextEpisode={handleNextEpisode}
          hasNextEpisode={hasNextEpisode}
        />

        {/* Episode List Section */}
        {!hasNoEpisodes && episodes && episodes.length > 0 && (
          <div className="episode-list-section">
            <div className="section-header">
              <h3>Danh sách tập</h3>
              {!isAutoNextDisabled && (
                <div className="auto-next-toggle" title="Tự động chuyển tập">
                  <label htmlFor="auto-next">Tự động chuyển tập</label>
                  <label className="toggle-switch" htmlFor="auto-next">
                    <input
                      type="checkbox"
                      id="auto-next"
                      checked={autoNext}
                      onChange={(e) => setAutoNext(e.target.checked)}
                    />
                    <span className="slider round"></span>
                  </label>
                </div>
              )}
            </div>
            <EpisodeList
              episodes={episodes}
              currentEpisode={currentEpisode}
              onEpisodeChange={handleEpisodeChange}
            />
          </div>
        )}

        <MovieMeta movie={movie} />

        <CommentSection
          contentType={currentEpisode ? 'episode' : 'movie'}
          contentId={currentEpisode ? currentEpisode.id : movie.id}
          currentUser={currentUser}
          showEpisodeFilter={false}
          moderationMode={true}
        />
      </div>

      <Sidebar
        recommendedMovies={recommendedMovies}
      />

      {/* Continue Watching Modal */}
      <ContinueWatchingModal
        isOpen={showContinueModal}
        onClose={() => setShowContinueModal(false)}
        progress={savedProgress}
        onContinue={handleContinueWatching}
        onStartOver={handleStartOver}
        isLoading={isSeekingToProgress}
      />
    </div>
  );
};

export default MovieWatchPage;
