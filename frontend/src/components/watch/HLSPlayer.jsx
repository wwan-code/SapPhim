import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import Hls from 'hls.js';
import {
    FaPlay, FaPause, FaVolumeUp, FaVolumeMute, FaExpand, FaCompress,
    FaCog, FaChevronRight, FaChevronLeft
} from 'react-icons/fa';
import { MdPictureInPictureAlt, MdSpeed } from 'react-icons/md';
import styles from './HLSPlayer.module.scss';

// ============================================================================
// CONSTANTS & CONFIGURATIONS
// ============================================================================
const formatTimeHelper = (time) => {
    if (isNaN(time)) return "00:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};

// Static HLS configuration - prevents recreation
const HLS_CONFIG = {
    enableWorker: true,
    lowLatencyMode: false,
    backBufferLength: 60,
    maxBufferLength: 60,
    maxMaxBufferLength: 120,
    maxBufferSize: 120 * 1000 * 1000,
    maxBufferHole: 0.5,
    highBufferWatchdogPeriod: 3,
    nudgeOffset: 0.1,
    nudgeMaxRetry: 3,
    maxFragLoadingTimeOut: 30000,
    fragLoadingTimeOut: 30000,
    manifestLoadingTimeOut: 15000,
    levelLoadingTimeOut: 15000,
    abrEwmaDefaultEstimate: 1000000,
    abrBandWidthFactor: 0.95,
    abrBandWidthUpFactor: 0.7,
    capLevelToPlayerSize: true,
    capLevelOnFPSDrop: true,
    fpsDroppedThresholdLevel: 0.2,
    fpsDroppedThresholdPeriod: 60000,
};

// ============================================================================
// THUMBNAIL MANAGER - Optimized caching & preloading
// ============================================================================
class ThumbnailManager {
    constructor() {
        this.cues = [];
        this.spriteCache = new Map();
        this.loadController = null;
        this.preloadQueue = [];
        this.isDestroyed = false;
    }

    async loadVTT(vttUrl) {
        if (this.isDestroyed) return;

        this.loadController = new AbortController();

        try {
            const response = await fetch(vttUrl, { signal: this.loadController.signal });
            if (!response.ok) throw new Error('VTT fetch failed');

            const text = await response.text();
            this.parseVTT(text, vttUrl);
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.warn('VTT load error:', error);
            }
        }
    }

    parseVTT(text, vttUrl) {
        const lines = text.split('\n');
        const cues = [];
        const uniqueSprites = new Set();
        let currentCue = null;
        const timePattern = /(\d{2}):(\d{2}):(\d{2})\.(\d{3}) --> (\d{2}):(\d{2}):(\d{2})\.(\d{3})/;

        lines.forEach(line => {
            const timeMatch = line.match(timePattern);
            if (timeMatch) {
                const start = parseInt(timeMatch[1]) * 3600 + parseInt(timeMatch[2]) * 60 + parseInt(timeMatch[3]) + parseInt(timeMatch[4]) / 1000;
                const end = parseInt(timeMatch[5]) * 3600 + parseInt(timeMatch[6]) * 60 + parseInt(timeMatch[7]) + parseInt(timeMatch[8]) / 1000;
                currentCue = { start, end };
            } else if (line.includes('#xywh=') && currentCue) {
                const [url, coords] = line.trim().split('#xywh=');
                const [x, y, w, h] = coords.split(',').map(Number);
                const baseUrl = vttUrl.substring(0, vttUrl.lastIndexOf('/') + 1);
                const spriteUrl = baseUrl + url;

                currentCue.spriteUrl = spriteUrl;
                currentCue.x = x;
                currentCue.y = y;
                currentCue.w = w;
                currentCue.h = h;
                cues.push(currentCue);
                uniqueSprites.add(spriteUrl);
                currentCue = null;
            }
        });

        this.cues = cues;
        console.log(`VTT parsed: ${cues.length} thumbnails from ${uniqueSprites.size} sprites`);

        // Queue sprite preloading
        this.preloadSprites(Array.from(uniqueSprites));
    }

    preloadSprites(spriteUrls) {
        this.preloadQueue = spriteUrls;
        this.preloadNext();
    }

    preloadNext() {
        if (this.isDestroyed || this.preloadQueue.length === 0) return;

        const spriteUrl = this.preloadQueue.shift();

        // Avoid duplicate preloads
        if (this.spriteCache.has(spriteUrl)) {
            this.preloadNext();
            return;
        }

        const img = new Image();
        img.onload = () => {
            this.spriteCache.set(spriteUrl, img);
            this.preloadNext();
        };
        img.onerror = () => {
            this.preloadNext();
        };
        img.src = spriteUrl;
    }

    getCueAtTime(time) {
        return this.cues.find(c => time >= c.start && time < c.end);
    }

    destroy() {
        this.isDestroyed = true;
        if (this.loadController) this.loadController.abort();
        this.cues = [];
        this.spriteCache.clear();
        this.preloadQueue = [];
    }
}

// ============================================================================
// HLS INSTANCE MANAGER - Proper cleanup & error handling
// ============================================================================
class HLSInstanceManager {
    constructor(src) {
        this.src = src;
        this.instance = null;
        this.eventHandlers = new Map();
    }

    init(video) {
        if (this.instance) return this.instance;
        if (!Hls.isSupported()) return null;

        this.instance = new Hls(HLS_CONFIG);
        this.instance.loadSource(this.src);
        this.instance.attachMedia(video);

        return this.instance;
    }

    on(eventName, handler) {
        if (!this.instance) return;
        this.instance.on(eventName, handler);
        if (!this.eventHandlers.has(eventName)) {
            this.eventHandlers.set(eventName, []);
        }
        this.eventHandlers.get(eventName).push(handler);
    }

    destroy() {
        if (!this.instance) return;

        // Remove all registered event listeners
        for (const [eventName, handlers] of this.eventHandlers) {
            handlers.forEach(handler => {
                try {
                    this.instance.off(eventName, handler);
                } catch (e) {
                    console.warn(`Error removing HLS listener for ${eventName}:`, e);
                }
            });
        }

        try {
            this.instance.destroy();
        } catch (e) {
            console.warn('Error destroying HLS instance:', e);
        }

        this.instance = null;
        this.eventHandlers.clear();
    }
}

// ============================================================================
// MAIN PLAYER COMPONENT
// ============================================================================
const HLSPlayer = React.memo(React.forwardRef(({
    src,
    poster,
    onEnded,
    autoPlay = false,
    title,
    onTimeUpdate,
    onPlay,
    onPause,
    onSeeking,
    onSeeked,
    thumbnailTrack
}, ref) => {
    const videoRef = useRef(null);
    const playerRef = useRef(null);
    const hlsManagerRef = useRef(null);
    const thumbnailManagerRef = useRef(null);
    const rafIdRef = useRef(null);
    const intersectionObserverRef = useRef(null);
    const isVisibleRef = useRef(true);
    const progressBarRef = useRef(null);

    // Preview Tooltip Refs
    const previewTooltipRef = useRef(null);
    const previewTimeRef = useRef(null);
    const previewImageRef = useRef(null);

    // Video state refs - for refs that don't need re-renders
    const currentTimeRef = useRef(0);
    const durationRef = useRef(0);
    const volumeRef = useRef(1);
    const isMutedRef = useRef(false);
    const isPlayingRef = useRef(false);

    // Cleanup tracking
    const eventListenersRef = useRef([]);
    const timeoutIdsRef = useRef([]);

    // UI States
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const [isBuffering, setIsBuffering] = useState(false);
    const [isPiP, setIsPiP] = useState(false);

    // Quality & Settings States
    const [qualities, setQualities] = useState([]);
    const [currentQuality, setCurrentQuality] = useState(-1);
    const [showSettings, setShowSettings] = useState(false);
    const [activeMenu, setActiveMenu] = useState('main');
    const [playbackSpeed, setPlaybackSpeed] = useState(1);
    const [showSpeedMenu, setShowSpeedMenu] = useState(false);

    const controlsTimeoutRef = useRef(null);
    const qualitySwitchStateRef = useRef(null);

    // ========================================================================
    // THUMBNAIL LOADING - Optimized
    // ========================================================================
    useEffect(() => {
        if (!thumbnailTrack) return;

        if (!thumbnailManagerRef.current) {
            thumbnailManagerRef.current = new ThumbnailManager();
        }

        thumbnailManagerRef.current.loadVTT(thumbnailTrack);

        return () => {
            // Don't destroy yet, keep for hover
        };
    }, [thumbnailTrack]);

    // ========================================================================
    // PREVIEW HOVER - Optimized with RAF throttling
    // ========================================================================
    const handlePreviewHover = useCallback((e) => {
        const bar = progressBarRef.current;
        const tooltip = previewTooltipRef.current;
        const timeText = previewTimeRef.current;
        const thumbImg = previewImageRef.current;

        if (!bar || !tooltip || !videoRef.current) return;

        const rect = bar.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        let hoverX = Math.max(0, Math.min(clientX - rect.left, rect.width));

        const percent = hoverX / rect.width;
        const previewTime = percent * durationRef.current;

        // Position tooltip
        const tooltipWidth = tooltip.offsetWidth || 160;
        let tooltipLeft = hoverX - (tooltipWidth / 2);
        tooltipLeft = Math.max(0, Math.min(tooltipLeft, rect.width - tooltipWidth));

        tooltip.style.left = `${tooltipLeft}px`;
        tooltip.style.opacity = '1';

        // Update time text
        if (timeText) {
            timeText.textContent = formatTimeHelper(previewTime);
        }

        // Update thumbnail
        if (thumbImg && thumbnailManagerRef.current?.cues.length > 0) {
            const cue = thumbnailManagerRef.current.getCueAtTime(previewTime);
            if (cue) {
                thumbImg.style.display = 'block';
                thumbImg.style.backgroundImage = `url(${cue.spriteUrl})`;
                thumbImg.style.backgroundPosition = `-${cue.x}px -${cue.y}px`;
                thumbImg.style.width = `${cue.w}px`;
                thumbImg.style.height = `${cue.h}px`;
            } else {
                thumbImg.style.display = 'none';
            }
        }
    }, []);

    const handlePreviewLeave = useCallback(() => {
        if (previewTooltipRef.current) {
            previewTooltipRef.current.style.opacity = '0';
        }
    }, []);

    // ========================================================================
    // TIME UPDATE - RAF Throttled, no setState spam
    // ========================================================================
    const handleTimeUpdateThrottled = useCallback(() => {
        if (rafIdRef.current) return;

        rafIdRef.current = requestAnimationFrame(() => {
            const video = videoRef.current;
            if (!video) {
                rafIdRef.current = null;
                return;
            }

            const time = video.currentTime;
            const dur = video.duration || 0;

            if (Math.abs(currentTimeRef.current - time) > 0.1 || Math.abs(durationRef.current - dur) > 0.1) {
                currentTimeRef.current = time;
                durationRef.current = dur;
                setCurrentTime(time);
                setDuration(dur);

                if (onTimeUpdate) {
                    onTimeUpdate(time, dur);
                }
            }

            rafIdRef.current = null;
        });
    }, [onTimeUpdate]);

    // ========================================================================
    // REF METHODS - seekTo
    // ========================================================================
    React.useImperativeHandle(ref, () => ({
        seekTo: (timeInSeconds) => {
            const video = videoRef.current;
            if (video && !isNaN(timeInSeconds) && timeInSeconds >= 0) {
                video.currentTime = timeInSeconds;
            }
        },
    }), []);

    // ========================================================================
    // HLS INITIALIZATION & CLEANUP - CRITICAL FIX
    // ========================================================================
    useEffect(() => {
        const video = videoRef.current;
        if (!video || !src) return;

        // Destroy previous HLS instance
        if (hlsManagerRef.current) {
            hlsManagerRef.current.destroy();
            hlsManagerRef.current = null;
        }

        let hlsManager;

        const cleanup = () => {
            if (hlsManager) {
                hlsManager.destroy();
                hlsManager = null;
                hlsManagerRef.current = null;
            }
            if (video.src) {
                video.src = '';
                video.load();
            }
        };

        if (Hls.isSupported()) {
            hlsManager = new HLSInstanceManager(src);
            hlsManagerRef.current = hlsManager;
            const hls = hlsManager.init(video);

            if (hls) {
                hlsManager.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
                    const levels = data.levels.map((level, index) => ({
                        index,
                        height: level.height,
                        bitrate: level.bitrate,
                        name: `${level.height}p`
                    })).sort((a, b) => b.height - a.height);

                    setQualities(levels);
                    setCurrentQuality(-1);

                    if (autoPlay && isVisibleRef.current) {
                        video.play().catch(e => console.log("Autoplay prevented:", e));
                    }
                });

                hlsManager.on(Hls.Events.LEVEL_SWITCHED, (event, data) => {
                    console.log('Level switched:', data.level);
                });

                hlsManager.on(Hls.Events.ERROR, (event, data) => {
                    if (data.fatal) {
                        console.error('HLS fatal error:', data);
                        switch (data.type) {
                            case Hls.ErrorTypes.NETWORK_ERROR:
                                try {
                                    hls.startLoad();
                                } catch (e) {
                                    console.error('Network error recovery failed:', e);
                                }
                                break;
                            case Hls.ErrorTypes.MEDIA_ERROR:
                                try {
                                    hls.recoverMediaError();
                                } catch (e) {
                                    console.error('Media error recovery failed:', e);
                                }
                                break;
                            default:
                                cleanup();
                                break;
                        }
                    }
                });
            }
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = src;
            const handleLoadedMetadata = () => {
                if (autoPlay && isVisibleRef.current) video.play();
            };
            video.addEventListener('loadedmetadata', handleLoadedMetadata);
            eventListenersRef.current.push({ el: video, event: 'loadedmetadata', handler: handleLoadedMetadata });
        }

        return cleanup;
    }, [src, autoPlay]);

    // ========================================================================
    // INTERSECTION OBSERVER - pause when hidden
    // ========================================================================
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    isVisibleRef.current = entry.isIntersecting;
                    if (!entry.isIntersecting && !video.paused) {
                        video.pause();
                    }
                });
            },
            { threshold: 0.1 }
        );

        observer.observe(video);
        intersectionObserverRef.current = observer;

        return () => {
            if (intersectionObserverRef.current) {
                intersectionObserverRef.current.disconnect();
                intersectionObserverRef.current = null;
            }
        };
    }, []);

    // ========================================================================
    // VIDEO EVENT LISTENERS - Comprehensive & Cleanup
    // ========================================================================
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const handlePlay = () => {
            isPlayingRef.current = true;
            setIsPlaying(true);
            if (onPlay) onPlay();
        };

        const handlePause = () => {
            isPlayingRef.current = false;
            setIsPlaying(false);
            if (onPause) onPause();
        };

        const handleLoadedMetadata = () => {
            durationRef.current = video.duration || 0;
            setDuration(durationRef.current);
        };

        const handleWaiting = () => setIsBuffering(true);
        const handlePlaying = () => setIsBuffering(false);

        const handleSeeking = () => {
            if (onSeeking) onSeeking(video.currentTime);
        };

        const handleSeeked = () => {
            const time = video.currentTime;
            currentTimeRef.current = time;
            setCurrentTime(time);
            if (onSeeked) onSeeked(time);
        };

        const handleEnded = () => {
            isPlayingRef.current = false;
            setIsPlaying(false);
            if (onEnded) onEnded();
        };

        const handleVolumeChange = () => {
            volumeRef.current = video.volume;
            isMutedRef.current = video.muted;
            setVolume(video.volume);
            setIsMuted(video.muted);
        };

        // Register listeners
        const listeners = [
            ['play', handlePlay],
            ['pause', handlePause],
            ['timeupdate', handleTimeUpdateThrottled],
            ['loadedmetadata', handleLoadedMetadata],
            ['waiting', handleWaiting],
            ['playing', handlePlaying],
            ['seeking', handleSeeking],
            ['seeked', handleSeeked],
            ['ended', handleEnded],
            ['volumechange', handleVolumeChange],
        ];

        listeners.forEach(([event, handler]) => {
            video.addEventListener(event, handler);
        });

        return () => {
            listeners.forEach(([event, handler]) => {
                video.removeEventListener(event, handler);
            });

            if (rafIdRef.current) {
                cancelAnimationFrame(rafIdRef.current);
                rafIdRef.current = null;
            }
        };
    }, [onEnded, onTimeUpdate, onPlay, onPause, onSeeking, onSeeked, handleTimeUpdateThrottled]);

    // ========================================================================
    // PLAYBACK CONTROLS
    // ========================================================================
    const togglePlay = useCallback(() => {
        const video = videoRef.current;
        if (!video) return;
        video.paused ? video.play().catch(e => console.log("Play error:", e)) : video.pause();
    }, []);

    const handleSeek = useCallback((e) => {
        const bar = progressBarRef.current;
        if (!bar || !videoRef.current) return;

        const rect = bar.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const pos = Math.max(0, Math.min((clientX - rect.left) / rect.width, 1));

        const time = pos * videoRef.current.duration;
        videoRef.current.currentTime = time;
        currentTimeRef.current = time;
        setCurrentTime(time);
    }, []);

    const skip = useCallback((seconds) => {
        const video = videoRef.current;
        if (video) {
            video.currentTime = Math.max(0, Math.min(video.duration, video.currentTime + seconds));
        }
    }, []);

    const handleVolumeChange = useCallback((e) => {
        const vol = parseFloat(e.target.value);
        const video = videoRef.current;
        if (video) {
            video.volume = vol;
            video.muted = vol === 0;
            volumeRef.current = vol;
            isMutedRef.current = vol === 0;
            setVolume(vol);
            setIsMuted(vol === 0);
        }
    }, []);

    const toggleMute = useCallback(() => {
        const video = videoRef.current;
        if (video) {
            video.muted = !video.muted;
            isMutedRef.current = video.muted;
            setIsMuted(video.muted);
            if (video.muted) {
                volumeRef.current = 0;
                setVolume(0);
            } else {
                const newVol = volumeRef.current === 0 ? 1 : volumeRef.current;
                video.volume = newVol;
                volumeRef.current = newVol;
                setVolume(newVol);
            }
        }
    }, []);

    const toggleFullscreen = useCallback(() => {
        const player = playerRef.current;
        if (!player) return;

        if (!document.fullscreenElement) {
            player.requestFullscreen().catch(err => console.error(err));
        } else {
            document.exitFullscreen();
        }
    }, []);

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    const togglePictureInPicture = useCallback(async () => {
        const video = videoRef.current;
        if (!video) return;

        try {
            if (!document.pictureInPictureElement) {
                await video.requestPictureInPicture();
            } else {
                await document.exitPictureInPicture();
            }
        } catch (error) {
            console.error('PiP error:', error);
        }
    }, []);

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

    // ========================================================================
    // QUALITY SWITCHING - Fixed timeline preservation
    // ========================================================================
    const handleQualityChange = useCallback((index) => {
        const hls = hlsManagerRef.current?.instance;
        const video = videoRef.current;

        if (!hls || !video) return;

        const savedTime = video.currentTime;
        const wasPlaying = !video.paused;

        console.log(`Switching quality to ${index} at ${savedTime}s`);

        hls.currentLevel = index;
        setCurrentQuality(index);

        // Store state for recovery
        qualitySwitchStateRef.current = {
            savedTime,
            wasPlaying,
            recovered: false
        };

        // Use FRAG_LOADED event with timeout fallback
        const handleFragLoaded = () => {
            if (qualitySwitchStateRef.current?.recovered) return;
            qualitySwitchStateRef.current.recovered = true;

            console.log(`Quality switch completed, restoring to ${savedTime}s`);
            video.currentTime = savedTime;

            if (wasPlaying) {
                video.play().catch(e => console.log('Resume error:', e));
            }

            // Cleanup
            hls.off(Hls.Events.FRAG_LOADED, handleFragLoaded);
            if (timeoutId) clearTimeout(timeoutId);
        };

        let timeoutId = setTimeout(() => {
            if (!qualitySwitchStateRef.current?.recovered) {
                console.warn('Quality switch timeout, forcing restore');
                handleFragLoaded();
            }
        }, 2000);

        hls.on(Hls.Events.FRAG_LOADED, handleFragLoaded);

        setActiveMenu('main');
        setShowSettings(false);
    }, []);

    const handleSpeedChange = useCallback((speed) => {
        const video = videoRef.current;
        if (video) {
            video.playbackRate = speed;
            setPlaybackSpeed(speed);
        }
        setShowSpeedMenu(false);
    }, []);

    // ========================================================================
    // KEYBOARD SHORTCUTS - Stable & Cleanup
    // ========================================================================
    useEffect(() => {
        const handleKeyPress = (e) => {
            const video = videoRef.current;
            if (!video) return;
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            const key = e.key.toLowerCase();

            switch (key) {
                case ' ':
                case 'k':
                    e.preventDefault();
                    togglePlay();
                    break;
                case 'arrowleft':
                    e.preventDefault();
                    skip(-5);
                    break;
                case 'arrowright':
                    e.preventDefault();
                    skip(5);
                    break;
                case 'j':
                    skip(-10);
                    break;
                case 'l':
                    skip(10);
                    break;
                case 'arrowup': {
                    e.preventDefault();
                    const newVol = Math.min(1, volumeRef.current + 0.1);
                    video.volume = newVol;
                    volumeRef.current = newVol;
                    setVolume(newVol);
                    setIsMuted(false);
                    break;
                }
                case 'arrowdown': {
                    e.preventDefault();
                    const newVol = Math.max(0, volumeRef.current - 0.1);
                    video.volume = newVol;
                    volumeRef.current = newVol;
                    setVolume(newVol);
                    break;
                }
                case 'm':
                    toggleMute();
                    break;
                case 'f':
                    toggleFullscreen();
                    break;
                case 'p':
                    togglePictureInPicture();
                    break;
                case '>':
                case '.':
                    handleSpeedChange(Math.min(2, playbackSpeed + 0.25));
                    break;
                case '<':
                case ',':
                    handleSpeedChange(Math.max(0.25, playbackSpeed - 0.25));
                    break;
                default:
                    if (key >= '0' && key <= '9') {
                        const percent = parseInt(key) * 10;
                        video.currentTime = (durationRef.current * percent) / 100;
                    }
                    break;
            }
        };

        document.addEventListener('keydown', handleKeyPress);
        return () => document.removeEventListener('keydown', handleKeyPress);
    }, [togglePlay, skip, toggleMute, toggleFullscreen, togglePictureInPicture, handleSpeedChange, playbackSpeed]);

    // ========================================================================
    // CONTROLS VISIBILITY - Optimized
    // ========================================================================
    const handleMouseMove = useCallback(() => {
        setShowControls(true);
        if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);

        controlsTimeoutRef.current = setTimeout(() => {
            if (isPlayingRef.current && !showSettings && !showSpeedMenu) {
                setShowControls(false);
            }
        }, 3000);
    }, [showSettings, showSpeedMenu]);

    const handleMouseLeave = useCallback(() => {
        if (isPlayingRef.current && !showSettings && !showSpeedMenu) {
            if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
            controlsTimeoutRef.current = setTimeout(() => {
                setShowControls(false);
            }, 500);
        }
    }, [showSettings, showSpeedMenu]);

    // ========================================================================
    // CLEANUP ON UNMOUNT - CRITICAL
    // ========================================================================
    useEffect(() => {
        return () => {
            // Clear all timeouts
            if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
            timeoutIdsRef.current.forEach(id => clearTimeout(id));
            timeoutIdsRef.current = [];

            // Cancel RAF
            if (rafIdRef.current) {
                cancelAnimationFrame(rafIdRef.current);
                rafIdRef.current = null;
            }

            // Cleanup HLS
            if (hlsManagerRef.current) {
                hlsManagerRef.current.destroy();
                hlsManagerRef.current = null;
            }

            // Cleanup thumbnails
            if (thumbnailManagerRef.current) {
                thumbnailManagerRef.current.destroy();
                thumbnailManagerRef.current = null;
            }

            // Cleanup video element
            const video = videoRef.current;
            if (video) {
                video.src = '';
                video.load();
            }

            // Remove event listeners
            eventListenersRef.current.forEach(({ el, event, handler }) => {
                el.removeEventListener(event, handler);
            });
            eventListenersRef.current = [];
        };
    }, []);

    // ========================================================================
    // SETTINGS MENU - Memoized
    // ========================================================================
    const renderSettingsMenu = useMemo(() => {
        if (activeMenu === 'main') {
            return (
                <>
                    <div className={styles.settingsHeader}>Settings</div>
                    <div className={styles.settingsItem} onClick={() => setActiveMenu('quality')}>
                        <div className={styles.settingsLabel}>Quality</div>
                        <div className={styles.settingsValue}>
                            {currentQuality === -1 ? 'Auto' : qualities.find(q => q.index === currentQuality)?.name || 'Auto'}
                            <FaChevronRight size={12} />
                        </div>
                    </div>
                </>
            );
        } else if (activeMenu === 'quality') {
            return (
                <>
                    <div className={styles.settingsHeader} onClick={() => setActiveMenu('main')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FaChevronLeft size={12} /> Quality
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
        }
        return null;
    }, [activeMenu, currentQuality, qualities, handleQualityChange]);

    const formatTime = formatTimeHelper;

    // ========================================================================
    // RENDER
    // ========================================================================
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
                preload="metadata"
                playsInline
                crossOrigin="anonymous"
            />

            <div className={`${styles.topOverlay} ${showControls ? styles.visible : ''}`}>
                <h3 className={styles.videoTitle}>{title}</h3>
            </div>

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

            <div className={`${styles.controlsOverlay} ${showControls ? styles.visible : ''}`} onClick={(e) => e.stopPropagation()}>
                <div
                    ref={progressBarRef}
                    className={styles.progressBarContainer}
                    onClick={handleSeek}
                    onMouseMove={handlePreviewHover}
                    onMouseLeave={handlePreviewLeave}
                    onTouchMove={handlePreviewHover}
                    onTouchEnd={handlePreviewLeave}
                >
                    <div ref={previewTooltipRef} className={styles.previewTooltip}>
                        <div ref={previewImageRef} className={styles.previewImage} style={{ display: 'none' }} />
                        <span ref={previewTimeRef} className={styles.previewTime}>00:00</span>
                    </div>
                    <div
                        className={styles.progressBar}
                        style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                    >
                        <div className={styles.progressThumb}></div>
                    </div>
                </div>

                <div className={styles.controlsRow}>
                    <div className={styles.leftControls}>
                        <button onClick={togglePlay} className={styles.playPauseBtn} title={isPlaying ? 'Pause' : 'Play'}>
                            {isPlaying ? <FaPause /> : <FaPlay />}
                        </button>

                        <div className={styles.volumeContainer}>
                            <button onClick={toggleMute} className={styles.iconBtn} title="Mute">
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
                            />
                        </div>

                        <span className={styles.timeDisplay}>
                            {formatTime(currentTime)} / {formatTime(duration)}
                        </span>
                    </div>

                    <div className={styles.rightControls}>
                        <div className={styles.speedContainer}>
                            <button
                                className={`${styles.iconBtn} ${styles.speedBtn} ${showSpeedMenu ? styles.active : ''}`}
                                onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                                title="Playback Speed"
                            >
                                <MdSpeed />
                                <span className={styles.speedLabel}>{playbackSpeed}x</span>
                            </button>

                            {showSpeedMenu && (
                                <div className={styles.speedMenu}>
                                    {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map((speed) => (
                                        <div
                                            key={speed}
                                            className={`${styles.speedItem} ${playbackSpeed === speed ? styles.selected : ''}`}
                                            onClick={() => handleSpeedChange(speed)}
                                        >
                                            {speed}x
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className={styles.settingsContainer}>
                            <button
                                className={`${styles.iconBtn} ${showSettings ? styles.active : ''}`}
                                onClick={() => setShowSettings(!showSettings)}
                                title="Settings"
                            >
                                <FaCog />
                            </button>

                            {showSettings && (
                                <div className={styles.settingsMenu}>
                                    {renderSettingsMenu}
                                </div>
                            )}
                        </div>

                        <button
                            className={`${styles.iconBtn} ${isPiP ? styles.active : ''}`}
                            onClick={togglePictureInPicture}
                            title="Picture in Picture"
                        >
                            <MdPictureInPictureAlt />
                        </button>

                        <button onClick={toggleFullscreen} className={styles.iconBtn} title="Fullscreen">
                            {isFullscreen ? <FaCompress /> : <FaExpand />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}), (prevProps, nextProps) => {
    return (
        prevProps.src === nextProps.src &&
        prevProps.autoPlay === nextProps.autoPlay &&
        prevProps.thumbnailTrack === nextProps.thumbnailTrack
    );
});

HLSPlayer.displayName = 'HLSPlayer';

export default HLSPlayer;