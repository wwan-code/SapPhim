import React, { useRef, useImperativeHandle, useMemo, useCallback } from 'react';
import { FaFilm, FaBell } from 'react-icons/fa';
import HLSPlayer from './HLSPlayer';

const PlayerContainer = React.memo(React.forwardRef((
  {
    episode,
    movieTitle,
    hasNoEpisodes = false,
    onTimeUpdate,
    onPlay,
    onPause,
    onSeeking,
    onSeeked,
    onEnded,
    onNotifyMe
  },
  ref
) => {
  const hlsPlayerRef = useRef(null);

  // Expose methods to parent via ref
  useImperativeHandle(ref, () => ({
    /**
     * Seek video to a specific time in seconds
     * @param {number} timeInSeconds - Time to seek to
     */
    seekTo: (timeInSeconds) => {
      if (hlsPlayerRef.current && hlsPlayerRef.current.seekTo) {
        hlsPlayerRef.current.seekTo(timeInSeconds);
      }
    },
  }), []);

  const isValidUrl = useCallback((url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }, []);

  // Helper to construct full URL if needed - Memoized
  const hlsUrl = useMemo(() => {
    if (!episode?.hlsUrl) return '';
    if (episode.hlsUrl.startsWith('http')) return episode.hlsUrl;
    return `${import.meta.env.VITE_SERVER_URL}${episode.hlsUrl}`;
  }, [episode?.hlsUrl]);

  const iframeUrl = useMemo(() => {
    if (!episode?.linkEpisode) return '';
    return isValidUrl(episode.linkEpisode) ? episode.linkEpisode : "https://www.example.com/placeholder";
  }, [episode?.linkEpisode, isValidUrl]);

  const posterUrl = useMemo(() => {
    return episode?.thumbnail || '';
  }, [episode?.thumbnail]);

  const handleNotifyMe = useCallback(() => {
    if (onNotifyMe) {
      onNotifyMe();
    } else {
      // Placeholder - sẽ triển khai sau
      console.log('Nhận thông báo khi có tập mới - Tính năng đang phát triển');
    }
  }, [onNotifyMe]);

  // Hiển thị UI khi không có episodes
  if (hasNoEpisodes || !episode) {
    return (
      <div className="player-container">
        <div className="video-player video-player--no-episodes">
          <div className="no-episodes-state">
            <div className="no-episodes-state__icon">
              <FaFilm />
            </div>
            <h3 className="no-episodes-state__title">
              {hasNoEpisodes ? 'Phim chưa có tập nào' : 'Không tìm thấy tập phim'}
            </h3>
            <p className="no-episodes-state__message">
              {hasNoEpisodes
                ? 'Phim này hiện chưa có tập phim nào. Vui lòng quay lại sau.'
                : 'Tập phim bạn đang tìm không tồn tại hoặc đã bị xóa.'}
            </p>
            {hasNoEpisodes && (
              <button
                className="no-episodes-state__notify-btn"
                onClick={handleNotifyMe}
                aria-label="Nhận thông báo khi có tập mới"
              >
                <FaBell />
                <span>Nhận thông báo khi có tập mới</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="player-container">
      <div className="video-player">
        {episode.hlsUrl ? (
          <HLSPlayer
            ref={hlsPlayerRef}
            src={hlsUrl}
            poster={posterUrl}
            autoPlay={false}
            title={movieTitle}
            onTimeUpdate={onTimeUpdate}
            onPlay={onPlay}
            onPause={onPause}
            onSeeking={onSeeking}
            onSeeked={onSeeked}
            onEnded={onEnded}
            thumbnailTrack={(() => {
              if (!episode?.hlsUrl) return null;
              const baseUrl = episode.hlsUrl.substring(0, episode.hlsUrl.lastIndexOf('/'));
              const vttPath = `${baseUrl}/thumbnails/thumbnails.vtt`;
              if (vttPath.startsWith('http')) return vttPath;
              return `${import.meta.env.VITE_SERVER_URL}${vttPath}`;
            })()}
          />
        ) : (
          <iframe
            src={iframeUrl}
            title={`Xem ${movieTitle} - Tập ${episode.episodeNumber}`}
            allowFullScreen
            loading="lazy"
          />
        )}
      </div>
    </div>
  );
}));

PlayerContainer.displayName = 'PlayerContainer';

export default PlayerContainer;