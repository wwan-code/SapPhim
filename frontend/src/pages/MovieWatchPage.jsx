import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import movieService from '@/services/movieService';
import '@/assets/scss/pages/_movie-watch-page.scss';
import { debounce } from 'lodash';

import PlayerContainer from '@/components/watch/PlayerContainer';
import MovieInfo from '@/components/watch/MovieInfo';
import Sidebar from '@/components/watch/Sidebar';
import MovieMeta from '@/components/watch/MovieMeta';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ErrorMessage from '@/components/common/ErrorMessage';
import watchHistoryService from '@/services/watchHistoryService';
import { useSelector } from 'react-redux';
import CommentSection from '@/components/comments/CommentSection';
import ContinueWatchingModal from '@/components/watch/ContinueWatchingModal';

const MovieWatchPage = () => {
  const { slug, episodeNumber } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useSelector((state) => state.auth);
  const [movie, setMovie] = useState(null);
  const [episodes, setEpisodes] = useState([]);
  const [currentEpisode, setCurrentEpisode] = useState(null);
  const [recommendedMovies, setRecommendedMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCinemaMode, setIsCinemaMode] = useState(false);
  const [autoNext, setAutoNext] = useState(true);
  const currentTimeRef = useRef(0); // Track actual video current time
  const isPlayingRef = useRef(false); // Track if video is playing
  const playerContainerRef = useRef(null); // Ref to control video player

  // Continue Watching state
  const [showContinueModal, setShowContinueModal] = useState(false);
  const [savedProgress, setSavedProgress] = useState(0);
  const [isSeekingToProgress, setIsSeekingToProgress] = useState(false);
  const hasCheckedProgressRef = useRef(false); // Prevent multiple checks

  const toggleCinemaMode = () => {
    setIsCinemaMode(prevMode => !prevMode);
  };

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

  useEffect(() => {
    const fetchWatchPageData = async () => {
      try {
        setLoading(true);
        const response = await movieService.getMovieWatchDataBySlug(slug, episodeNumber);
        if (response.success) {
          const { movie, currentEpisode, episodes, recommendedMovies, watchProgress } = response.data;
          setMovie(movie);
          setEpisodes(episodes);
          setCurrentEpisode(currentEpisode);
          setRecommendedMovies(recommendedMovies);
          // Initialize current time from watch progress if available
          if (watchProgress) {
            currentTimeRef.current = watchProgress;
          }
        } else {
          setError('Phim hoặc tập phim không được tìm thấy.');
        }
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Lỗi khi tải dữ liệu phim.');
      } finally {
        setLoading(false);
      }
    };

    fetchWatchPageData();
  }, [slug, episodeNumber, currentUser]);

  // Fetch watch history and check if we should show Continue Watching modal
  useEffect(() => {
    const checkWatchProgress = async () => {
      // Only check once per episode load
      if (hasCheckedProgressRef.current) return;

      // Must have user, movie, and episode data
      if (!currentUser || !movie || !currentEpisode) return;

      try {
        const response = await watchHistoryService.getProgress({
          movieId: movie.id,
          episodeId: currentEpisode.id,
        });

        if (response.success && response.data) {
          const { progress } = response.data;

          // Parse episode duration (format: "hh:mm:ss" or "mm:ss" or number)
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

          // Show modal if: progress > 5 seconds AND progress < 95% of duration
          const MIN_PROGRESS = 5; // 5 seconds
          const COMPLETION_THRESHOLD = 0.95; // 95%

          if (progress > MIN_PROGRESS) {
            // If we have duration, check completion threshold
            if (durationInSeconds > 0) {
              const progressRatio = progress / durationInSeconds;
              if (progressRatio < COMPLETION_THRESHOLD) {
                setSavedProgress(progress);
                setShowContinueModal(true);
              }
            } else {
              // No duration info, show modal anyway if progress > 5s
              setSavedProgress(progress);
              setShowContinueModal(true);
            }
          }
        }
      } catch (error) {
        // 404 means no watch history, which is fine - just continue normally
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
  const debouncedSaveProgress = useRef(
    debounce((movieId, episodeId, progress, user) => {
      if (!user) return;
      watchHistoryService.saveProgress({
        movieId,
        episodeId,
        progress: Math.floor(progress), // Save as integer seconds
        timestamp: new Date().toISOString()
      }).catch((e) => console.error("Error saving watch history:", e));
    }, 10000) // Save every 10 seconds
  ).current;

  // Immediate save function for pause, seek, and unmount
  const saveProgressNow = useCallback((movieId, episodeId, progress) => {
    if (!currentUser) return;
    watchHistoryService.saveProgress({
      movieId,
      episodeId,
      progress: Math.floor(progress),
      timestamp: new Date().toISOString()
    }).catch((e) => console.error("Error saving watch history:", e));
  }, [currentUser]);

  // Handle video time updates
  const handleTimeUpdate = useCallback((currentTime) => {
    currentTimeRef.current = currentTime;

    // Only save if playing and we have valid data
    if (isPlayingRef.current && movie && currentEpisode && currentTime > 0) {
      debouncedSaveProgress(movie.id, currentEpisode.id, currentTime, currentUser);
    }
  }, [movie, currentEpisode, debouncedSaveProgress, currentUser]);

  // Handle play event
  const handlePlay = useCallback(() => {
    isPlayingRef.current = true;
  }, []);

  // Handle pause event - save immediately
  const handlePause = useCallback(() => {
    isPlayingRef.current = false;
    if (movie && currentEpisode && currentTimeRef.current > 0) {
      saveProgressNow(movie.id, currentEpisode.id, currentTimeRef.current);
    }
  }, [movie, currentEpisode, saveProgressNow]);

  // Handle seek events - save immediately after seek completes
  const handleSeeked = useCallback((newTime) => {
    currentTimeRef.current = newTime;
    if (movie && currentEpisode && newTime > 0) {
      saveProgressNow(movie.id, currentEpisode.id, newTime);
    }
  }, [movie, currentEpisode, saveProgressNow]);

  // Handle video end - mark as completed or move to next episode
  const handleVideoEnded = useCallback(() => {
    if (movie && currentEpisode) {
      // Save final progress
      saveProgressNow(movie.id, currentEpisode.id, currentTimeRef.current);
    }
  }, [movie, currentEpisode, saveProgressNow]);

  // Cleanup and final save on unmount or episode change
  useEffect(() => {
    return () => {
      // Cancel any pending debounced saves
      debouncedSaveProgress.cancel();

      // Save final progress if we have valid data
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

  // Initialize progress from watch history
  useEffect(() => {
    if (movie && currentEpisode) {
      // Reset refs when episode changes
      currentTimeRef.current = 0;
      isPlayingRef.current = false;
    }
  }, [movie, currentEpisode]);

  // Handle Continue Watching actions
  const handleContinueWatching = useCallback(() => {
    if (playerContainerRef.current && savedProgress > 0) {
      setIsSeekingToProgress(true);
      playerContainerRef.current.seekTo(savedProgress);
      // Close modal after a short delay to allow seek to complete
      setTimeout(() => {
        setShowContinueModal(false);
        setIsSeekingToProgress(false);
      }, 500);
    }
  }, [savedProgress]);

  const handleStartOver = useCallback(async () => {
    setIsSeekingToProgress(true);

    // Reset progress in database
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

    // Seek to beginning
    if (playerContainerRef.current) {
      playerContainerRef.current.seekTo(0);
    }

    // Close modal
    setTimeout(() => {
      setShowContinueModal(false);
      setIsSeekingToProgress(false);
    }, 300);
  }, [currentUser, movie, currentEpisode]);

  const handleEpisodeChange = (newEpisodeNumber) => {
    navigate(`/watch/${slug}/episode/${newEpisodeNumber}`);
  };

  const handleNextEpisode = () => {
    const sortedEpisodes = episodes.sort((a, b) => a.episodeNumber - b.episodeNumber);
    const currentEpisodeIndex = sortedEpisodes.findIndex(
      (ep) => ep.episodeNumber === currentEpisode.episodeNumber
    );

    if (currentEpisodeIndex > -1 && currentEpisodeIndex < sortedEpisodes.length - 1) {
      const nextEpisode = sortedEpisodes[currentEpisodeIndex + 1];
      handleEpisodeChange(nextEpisode.episodeNumber);
    }
  };

  const hasNextEpisode = () => {
    if (!currentEpisode || !episodes || episodes.length === 0) return false;
    const sortedEpisodes = episodes.sort((a, b) => a.episodeNumber - b.episodeNumber);
    const currentEpisodeIndex = sortedEpisodes.findIndex(
      (ep) => ep.episodeNumber === currentEpisode.episodeNumber
    );
    return currentEpisodeIndex > -1 && currentEpisodeIndex < sortedEpisodes.length - 1;
  };

  if (loading) {
    return <LoadingSpinner fullscreen label="Đang tải phim..." />;
  }

  if (error) {
    return (
      <div className="container-fluid page-container">
        <ErrorMessage
          variant="card"
          title="Lỗi tải phim"
          message={error}
          onRetry={() => window.location.reload()} // Simple retry by reloading
        />
      </div>
    );
  }

  if (!movie || !currentEpisode) {
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

  const defaultTitle = movie.titles?.find((t) => t.type === 'default')?.title || 'Untitled';

  return (
    <div className="movie-watch-page">
      <div className="movie-watch-page__main-content">
        <PlayerContainer
          ref={playerContainerRef}
          episode={currentEpisode}
          movieTitle={defaultTitle}
          onTimeUpdate={handleTimeUpdate}
          onPlay={handlePlay}
          onPause={handlePause}
          onSeeked={handleSeeked}
          onEnded={handleVideoEnded}
        />
        <MovieInfo
          movie={movie}
          currentEpisode={currentEpisode}
          onToggleCinemaMode={toggleCinemaMode}
          isCinemaMode={isCinemaMode}
          onNextEpisode={handleNextEpisode}
          hasNextEpisode={hasNextEpisode()}
        />
        <MovieMeta movie={movie} />
        <CommentSection
          contentType="episode"
          contentId={currentEpisode.id}
          currentUser={currentUser}
          showEpisodeFilter={false}
          moderationMode={true}
        />
      </div>

      <Sidebar
        episodes={episodes}
        currentEpisode={currentEpisode}
        recommendedMovies={recommendedMovies}
        onEpisodeChange={handleEpisodeChange}
        autoNext={autoNext}
        onAutoNextChange={setAutoNext}
      />

      {isCinemaMode && (
        <button className="cinema-mode-exit-btn" onClick={toggleCinemaMode}>
          Thoát chế độ rạp
        </button>
      )}

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
