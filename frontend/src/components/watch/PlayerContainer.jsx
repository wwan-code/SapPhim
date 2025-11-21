import React, { useRef, useImperativeHandle } from 'react';
import HLSPlayer from './HLSPlayer';

const PlayerContainer = React.forwardRef((
  {
    episode,
    movieTitle,
    onTimeUpdate,
    onPlay,
    onPause,
    onSeeking,
    onSeeked,
    onEnded
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
  }));

  const isValidUrl = (url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  // Helper to construct full URL if needed
  const getHlsUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${import.meta.env.VITE_SERVER_URL}${url}`;
  };

  return (
    <div className="player-container">
      <div className="video-player">
        {episode && (
          episode.hlsUrl ? (
            <HLSPlayer
              ref={hlsPlayerRef}
              src={getHlsUrl(episode.hlsUrl)}
              poster={episode.thumbnail || ''}
              autoPlay={false}
              title={movieTitle}
              onTimeUpdate={onTimeUpdate}
              onPlay={onPlay}
              onPause={onPause}
              onSeeking={onSeeking}
              onSeeked={onSeeked}
              onEnded={onEnded}
            />
          ) : (
            <iframe
              src={isValidUrl(episode.linkEpisode) ? episode.linkEpisode : "https://www.example.com/placeholder"}
              title={`Xem ${movieTitle} - Tập ${episode.episodeNumber}`}
              allowFullScreen
            ></iframe>
          )
        )}
      </div>
    </div>
  );
});

PlayerContainer.displayName = 'PlayerContainer';

export default PlayerContainer;