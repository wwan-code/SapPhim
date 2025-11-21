import React, { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';
import {
    FaPlay, FaPause, FaVolumeUp, FaVolumeMute, FaExpand, FaCompress,
    FaCog, FaClosedCaptioning, FaMicrophone, FaChevronRight, FaChevronLeft
} from 'react-icons/fa';
import { MdReplay10, MdForward10, MdPictureInPictureAlt, MdSpeed } from 'react-icons/md';
import styles from './HLSPlayer.module.scss';

const HLSPlayer = React.forwardRef(({
    src,
    poster,
    onEnded,
    autoPlay = false,
    title,
    onTimeUpdate,
    onPlay,
    onPause,
    onSeeking,
    onSeeked
}, ref) => {
    const videoRef = useRef(null);
    const playerRef = useRef(null);
    const [hls, setHls] = useState(null);

    // Player State
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const [isBuffering, setIsBuffering] = useState(false);
    const [isPiP, setIsPiP] = useState(false);

    // Settings State
    const [qualities, setQualities] = useState([]);
    const [currentQuality, setCurrentQuality] = useState(-1); // -1 is Auto
    const [showSettings, setShowSettings] = useState(false);
    const [activeMenu, setActiveMenu] = useState('main'); // main, quality, speed, subtitle
    const [playbackSpeed, setPlaybackSpeed] = useState(1);

    const controlsTimeoutRef = useRef(null);

    // Expose seekTo method to parent
    React.useImperativeHandle(ref, () => ({
        /**
         * Seek video to specific time
         * @param {number} timeInSeconds - Time in seconds to seek to
         */
        seekTo: (timeInSeconds) => {
            const video = videoRef.current;
            if (video && !isNaN(timeInSeconds) && timeInSeconds >= 0) {
                video.currentTime = timeInSeconds;
            }
        },
    }));

    // Initialize HLS
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        let hlsInstance;

        if (Hls.isSupported()) {
            hlsInstance = new Hls({
                enableWorker: true,
                lowLatencyMode: true,
            });

            hlsInstance.loadSource(src);
            hlsInstance.attachMedia(video);

            hlsInstance.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
                const levels = data.levels.map((level, index) => ({
                    index,
                    height: level.height,
                    bitrate: level.bitrate,
                    name: `${level.height}p`
                }));
                setQualities(levels);
                if (autoPlay) {
                    video.play().catch(e => console.log("Autoplay prevented", e));
                }
            });

            hlsInstance.on(Hls.Events.ERROR, (event, data) => {
                if (data.fatal) {
                    switch (data.type) {
                        case Hls.ErrorTypes.NETWORK_ERROR:
                            hlsInstance.startLoad();
                            break;
                        case Hls.ErrorTypes.MEDIA_ERROR:
                            hlsInstance.recoverMediaError();
                            break;
                        default:
                            hlsInstance.destroy();
                            break;
                    }
                }
            });

            setHls(hlsInstance);
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = src;
            video.addEventListener('loadedmetadata', () => {
                if (autoPlay) video.play();
            });
        }

        return () => {
            if (hlsInstance) hlsInstance.destroy();
        };
    }, [src, autoPlay]);

    // Event Listeners
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const handlePlay = () => {
            setIsPlaying(true);
            if (onPlay) onPlay();
        };

        const handlePause = () => {
            setIsPlaying(false);
            if (onPause) onPause();
        };

        const handleTimeUpdate = () => {
            const time = video.currentTime;
            setCurrentTime(time);
            if (onTimeUpdate) onTimeUpdate(time, video.duration);
        };

        const handleLoadedMetadata = () => setDuration(video.duration);
        const handleWaiting = () => setIsBuffering(true);
        const handlePlaying = () => setIsBuffering(false);

        const handleSeeking = () => {
            if (onSeeking) onSeeking(video.currentTime);
        };

        const handleSeeked = () => {
            if (onSeeked) onSeeked(video.currentTime);
        };

        const handleEndedEvent = () => {
            setIsPlaying(false);
            if (onEnded) onEnded();
        };

        video.addEventListener('play', handlePlay);
        video.addEventListener('pause', handlePause);
        video.addEventListener('timeupdate', handleTimeUpdate);
        video.addEventListener('loadedmetadata', handleLoadedMetadata);
        video.addEventListener('waiting', handleWaiting);
        video.addEventListener('playing', handlePlaying);
        video.addEventListener('seeking', handleSeeking);
        video.addEventListener('seeked', handleSeeked);
        video.addEventListener('ended', handleEndedEvent);

        return () => {
            video.removeEventListener('play', handlePlay);
            video.removeEventListener('pause', handlePause);
            video.removeEventListener('timeupdate', handleTimeUpdate);
            video.removeEventListener('loadedmetadata', handleLoadedMetadata);
            video.removeEventListener('waiting', handleWaiting);
            video.removeEventListener('playing', handlePlaying);
            video.removeEventListener('seeking', handleSeeking);
            video.removeEventListener('seeked', handleSeeked);
            video.removeEventListener('ended', handleEndedEvent);
        };
    }, [onEnded, onTimeUpdate, onPlay, onPause, onSeeking, onSeeked]);

    // Controls Logic
    const togglePlay = useCallback(() => {
        const video = videoRef.current;
        if (!video) return;
        if (video.paused) video.play();
        else video.pause();
    }, []);

    const handleSeek = useCallback((e) => {
        const time = parseFloat(e.target.value);
        const video = videoRef.current;
        if (video) {
            video.currentTime = time;
            setCurrentTime(time);
        }
    }, []);

    const skip = useCallback((seconds) => {
        const video = videoRef.current;
        if (video) {
            video.currentTime += seconds;
        }
    }, []);

    const handleVolumeChange = useCallback((e) => {
        const vol = parseFloat(e.target.value);
        const video = videoRef.current;
        if (video) {
            video.volume = vol;
            setVolume(vol);
            setIsMuted(vol === 0);
        }
    }, []);

    const toggleMute = useCallback(() => {
        const video = videoRef.current;
        if (video) {
            const newMuted = !isMuted;
            video.muted = newMuted;
            setIsMuted(newMuted);
            if (newMuted) setVolume(0);
            else setVolume(1);
        }
    }, [isMuted]);

    const toggleFullscreen = useCallback(() => {
        const player = playerRef.current;
        if (!document.fullscreenElement) {
            player.requestFullscreen().catch(err => console.error(err));
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    }, []);

    const togglePictureInPicture = useCallback(async () => {
        const video = videoRef.current;
        if (!video) return;

        try {
            if (!document.pictureInPictureElement) {
                await video.requestPictureInPicture();
                setIsPiP(true);
            } else {
                await document.exitPictureInPicture();
                setIsPiP(false);
            }
        } catch (error) {
            console.error('PiP error:', error);
        }
    }, []);

    // Listen to PiP events
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const handleEnterPiP = () => setIsPiP(true);
        const handleLeavePiP = () => setIsPiP(false);

        video.addEventListener('enterpictureinpicture', handleEnterPiP);
        video.addEventListener('leavepictureinpicture', handleLeavePiP);

        return () => {
            video.removeEventListener('enterpictureinpicture', handleEnterPiP);
            video.removeEventListener('leavepictureinpicture', handleLeavePiP);
        };
    }, []);

    const handleQualityChange = useCallback((index) => {
        setCurrentQuality(index);
        if (hls) {
            hls.currentLevel = index;
        }
        setActiveMenu('main');
        setShowSettings(false);
    }, [hls]);

    const handleSpeedChange = useCallback((speed) => {
        const video = videoRef.current;
        if (video) {
            video.playbackRate = speed;
            setPlaybackSpeed(speed);
        }
        setActiveMenu('main');
    }, []);

    // Format Time
    const formatTime = (time) => {
        if (isNaN(time)) return "00:00";
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    };

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyPress = (e) => {
            const video = videoRef.current;
            if (!video) return;

            // Ignore if typing in input field
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            switch (e.key.toLowerCase()) {
                case ' ': // Space - Play/Pause
                case 'k':
                    e.preventDefault();
                    togglePlay();
                    break;
                case 'arrowleft': // Left Arrow - Rewind 5s
                    e.preventDefault();
                    skip(-5);
                    break;
                case 'arrowright': // Right Arrow - Forward 5s
                    e.preventDefault();
                    skip(5);
                    break;
                case 'j': // J - Rewind 10s
                    skip(-10);
                    break;
                case 'l': // L - Forward 10s
                    skip(10);
                    break;
                case 'arrowup': { // Up Arrow - Volume Up
                    e.preventDefault();
                    const newVolumeUp = Math.min(1, volume + 0.1);
                    video.volume = newVolumeUp;
                    setVolume(newVolumeUp);
                    setIsMuted(false);
                    break;
                }
                case 'arrowdown': { // Down Arrow - Volume Down
                    e.preventDefault();
                    const newVolumeDown = Math.max(0, volume - 0.1);
                    video.volume = newVolumeDown;
                    setVolume(newVolumeDown);
                    break;
                }
                case 'm': // M - Mute/Unmute
                    toggleMute();
                    break;
                case 'f': // F - Fullscreen
                    toggleFullscreen();
                    break;
                case 'p': // P - Picture in Picture
                    togglePictureInPicture();
                    break;
                case 'c': // C - Captions (placeholder)
                    console.log('Captions toggled');
                    break;
                case '>': // > - Speed up
                case '.':
                    handleSpeedChange(Math.min(2, playbackSpeed + 0.25));
                    break;
                case '<': // < - Speed down
                case ',':
                    handleSpeedChange(Math.max(0.25, playbackSpeed - 0.25));
                    break;
                default:
                    // Number keys - Jump to percentage
                    if (e.key >= '0' && e.key <= '9') {
                        const percent = parseInt(e.key) * 10;
                        video.currentTime = (duration * percent) / 100;
                    }
                    break;
            }
        };

        document.addEventListener('keydown', handleKeyPress);
        return () => document.removeEventListener('keydown', handleKeyPress);
    }, [isPlaying, volume, isMuted, duration, playbackSpeed, togglePlay, skip, toggleMute, toggleFullscreen, togglePictureInPicture, handleSpeedChange]);

    // Hover Controls with improved auto-hide
    const handleMouseMove = () => {
        setShowControls(true);
        if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
        controlsTimeoutRef.current = setTimeout(() => {
            if (isPlaying && !showSettings) setShowControls(false);
        }, 3000);
    };

    const handleMouseLeave = () => {
        if (isPlaying && !showSettings) {
            if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
            controlsTimeoutRef.current = setTimeout(() => {
                setShowControls(false);
            }, 500);
        }
    };

    // Settings Menu Content
    const renderSettingsMenu = () => {
        if (activeMenu === 'main') {
            return (
                <>
                    <div className={styles.settingsHeader}>Cài đặt</div>
                    <div className={styles.settingsItem} onClick={() => setActiveMenu('quality')}>
                        <div className={styles.settingsLabel}>Chất lượng</div>
                        <div className={styles.settingsValue}>
                            {currentQuality === -1 ? 'Auto' : qualities.find(q => q.index === currentQuality)?.name}
                            <FaChevronRight size={12} />
                        </div>
                    </div>
                    <div className={styles.settingsItem} onClick={() => setActiveMenu('speed')}>
                        <div className={styles.settingsLabel}>Tốc độ</div>
                        <div className={styles.settingsValue}>
                            {playbackSpeed}x
                            <FaChevronRight size={12} />
                        </div>
                    </div>
                    <div className={styles.settingsItem}>
                        <div className={styles.settingsLabel}>Phụ đề</div>
                        <div className={styles.settingsValue}>
                            Tắt
                            <FaChevronRight size={12} />
                        </div>
                    </div>
                </>
            );
        } else if (activeMenu === 'quality') {
            return (
                <>
                    <div className={styles.settingsHeader} onClick={() => setActiveMenu('main')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FaChevronLeft size={12} /> Chất lượng
                    </div>
                    <div
                        className={`${styles.settingsItem} ${currentQuality === -1 ? styles.selected : ''}`}
                        onClick={() => handleQualityChange(-1)}
                    >
                        Auto
                    </div>
                    {qualities.map((q) => (
                        <div
                            key={q.index}
                            className={`${styles.settingsItem} ${currentQuality === q.index ? styles.selected : ''}`}
                            onClick={() => handleQualityChange(q.index)}
                        >
                            {q.name}
                        </div>
                    ))}
                </>
            );
        } else if (activeMenu === 'speed') {
            const speeds = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
            return (
                <>
                    <div className={styles.settingsHeader} onClick={() => setActiveMenu('main')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FaChevronLeft size={12} /> Tốc độ
                    </div>
                    {speeds.map((speed) => (
                        <div
                            key={speed}
                            className={`${styles.settingsItem} ${playbackSpeed === speed ? styles.selected : ''}`}
                            onClick={() => handleSpeedChange(speed)}
                        >
                            {speed}x
                        </div>
                    ))}
                </>
            );
        }
    };

    return (
        <div
            ref={playerRef}
            className={styles.playerWrapper}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
        >
            <video
                ref={videoRef}
                poster={poster}
                className={styles.videoElement}
                onClick={togglePlay}
            />

            {/* Top Overlay - Title */}
            <div className={`${styles.topOverlay} ${showControls ? styles.visible : ''}`}>
                <h3 className={styles.videoTitle}>{title}</h3>
            </div>

            {/* Center Play/Pause Animation or Buffering */}
            {isBuffering && (
                <div className={styles.centerOverlay}>
                    <div className={styles.spinner}></div>
                </div>
            )}

            {!isBuffering && !isPlaying && (
                <div className={styles.centerOverlay} onClick={togglePlay}>
                    <div className={styles.playButtonBig}>
                        <FaPlay />
                    </div>
                </div>
            )}

            {/* Bottom Controls */}
            <div className={`${styles.controlsOverlay} ${showControls ? styles.visible : ''}`}>
                {/* Progress Bar */}
                <div className={styles.progressBarContainer}>
                    <input
                        type="range"
                        min="0"
                        max={duration || 100}
                        value={currentTime}
                        onChange={handleSeek}
                        className={styles.progressBar}
                        style={{ backgroundSize: `${(currentTime / duration) * 100}% 100%` }}
                    />
                </div>

                <div className={styles.controlsRow}>
                    {/* Left Controls */}
                    <div className={styles.leftControls}>
                        <button onClick={togglePlay} className={styles.playPauseBtn}>
                            {isPlaying ? <FaPause /> : <FaPlay />}
                        </button>

                        <button onClick={() => skip(-10)} className={styles.iconBtn}>
                            <MdReplay10 />
                        </button>
                        <button onClick={() => skip(10)} className={styles.iconBtn}>
                            <MdForward10 />
                        </button>

                        <span className={styles.timeDisplay}>
                            {formatTime(currentTime)} / {formatTime(duration)}
                        </span>
                        <div className={styles.volumeContainer}>
                            <button onClick={toggleMute} className={styles.iconBtn}>
                                {isMuted || volume === 0 ? <FaVolumeMute /> : <FaVolumeUp />}
                            </button>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.05"
                                value={isMuted ? 0 : volume}
                                onChange={handleVolumeChange}
                                className={styles.volumeSlider}
                                style={{ backgroundSize: `${(isMuted ? 0 : volume) * 100}% 100%` }}
                            />
                        </div>

                    </div>

                    {/* Right Controls */}
                    <div className={styles.rightControls}>
                        <button className={styles.iconBtn} title="Subtitles">
                            <FaClosedCaptioning />
                        </button>
                        <button
                            className={`${styles.iconBtn} ${isPiP ? styles.active : ''}`}
                            onClick={togglePictureInPicture}
                            title="Picture in Picture (P)"
                        >
                            <MdPictureInPictureAlt />
                        </button>

                        {/* Settings / Quality */}
                        <div className={styles.settingsContainer}>
                            <button
                                className={`${styles.iconBtn} ${showSettings ? styles.active : ''}`}
                                onClick={() => setShowSettings(!showSettings)}
                            >
                                <FaCog />
                            </button>

                            {showSettings && (
                                <div className={styles.settingsMenu}>
                                    {renderSettingsMenu()}
                                </div>
                            )}
                        </div>

                        <button onClick={toggleFullscreen} className={styles.iconBtn}>
                            {isFullscreen ? <FaCompress /> : <FaExpand />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
});

HLSPlayer.displayName = 'HLSPlayer';

export default HLSPlayer;
