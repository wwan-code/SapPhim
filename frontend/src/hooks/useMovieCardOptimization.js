import { useState, useCallback, useRef, useEffect } from 'react';
import { debounce } from '@/utils/performanceUtils';

/**
 * Custom hook for optimizing MovieCard rendering in lists
 * @param {Object} options - Configuration options
 * @returns {Object} - Optimization utilities
 */
export const useMovieCardOptimization = (options = {}) => {
  const {
    enableVirtualization = false,
    itemHeight = 300,
    overscan = 3,
    debounceDelay = 150,
  } = options;

  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 10 });
  const containerRef = useRef(null);
  const scrollTimeoutRef = useRef(null);

  // Debounced scroll handler for virtualization
  const handleScroll = useCallback(
    debounce(() => {
      if (!containerRef.current || !enableVirtualization) return;

      const container = containerRef.current;
      const scrollTop = container.scrollTop;
      const viewportHeight = container.clientHeight;

      const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
      const end = Math.ceil((scrollTop + viewportHeight) / itemHeight) + overscan;

      setVisibleRange({ start, end });
    }, debounceDelay),
    [enableVirtualization, itemHeight, overscan, debounceDelay]
  );

  // Setup scroll listener
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !enableVirtualization) return;

    container.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial calculation

    return () => {
      container.removeEventListener('scroll', handleScroll);
      handleScroll.cancel?.();
    };
  }, [handleScroll, enableVirtualization]);

  // Determine if item should render
  const shouldRenderItem = useCallback(
    (index) => {
      if (!enableVirtualization) return true;
      return index >= visibleRange.start && index <= visibleRange.end;
    },
    [enableVirtualization, visibleRange]
  );

  // Calculate stagger delay for skeleton loading
  const getSkeletonDelay = useCallback((index, maxDelay = 300) => {
    return Math.min(index * 50, maxDelay);
  }, []);

  // Image loading priority
  const getImagePriority = useCallback((index, priorityCount = 3) => {
    return index < priorityCount;
  }, []);

  return {
    containerRef,
    visibleRange,
    shouldRenderItem,
    getSkeletonDelay,
    getImagePriority,
  };
};

/**
 * Hook for tracking image load performance
 */
export const useImageLoadTracking = () => {
  const [stats, setStats] = useState({
    totalImages: 0,
    loadedImages: 0,
    failedImages: 0,
    averageLoadTime: 0,
  });

  const loadTimesRef = useRef([]);

  const trackImageLoad = useCallback((loadTime) => {
    loadTimesRef.current.push(loadTime);
    setStats((prev) => {
      const newLoaded = prev.loadedImages + 1;
      const avgTime =
        loadTimesRef.current.reduce((a, b) => a + b, 0) / loadTimesRef.current.length;
      return {
        ...prev,
        loadedImages: newLoaded,
        averageLoadTime: avgTime,
      };
    });
  }, []);

  const trackImageError = useCallback(() => {
    setStats((prev) => ({
      ...prev,
      failedImages: prev.failedImages + 1,
    }));
  }, []);

  const reset = useCallback(() => {
    loadTimesRef.current = [];
    setStats({
      totalImages: 0,
      loadedImages: 0,
      failedImages: 0,
      averageLoadTime: 0,
    });
  }, []);

  return {
    stats,
    trackImageLoad,
    trackImageError,
    reset,
  };
};

/**
 * Hook for adaptive image quality based on network speed
 */
export const useAdaptiveImageQuality = () => {
  const [quality, setQuality] = useState('high'); // 'low' | 'medium' | 'high'
  const [connectionSpeed, setConnectionSpeed] = useState('4g');

  useEffect(() => {
    // Check Network Information API
    if ('connection' in navigator && 'effectiveType' in navigator.connection) {
      const connection = navigator.connection;
      
      const updateConnectionSpeed = () => {
        const effectiveType = connection.effectiveType;
        setConnectionSpeed(effectiveType);

        // Adaptive quality based on connection
        if (effectiveType === 'slow-2g' || effectiveType === '2g') {
          setQuality('low');
        } else if (effectiveType === '3g') {
          setQuality('medium');
        } else {
          setQuality('high');
        }
      };

      updateConnectionSpeed();
      connection.addEventListener('change', updateConnectionSpeed);

      return () => {
        connection.removeEventListener('change', updateConnectionSpeed);
      };
    }
  }, []);

  const getOptimalImageUrl = useCallback(
    (baseUrl, qualityOverride) => {
      const targetQuality = qualityOverride || quality;
      
      // Add quality suffix to URL (assumes backend supports this)
      if (baseUrl && targetQuality !== 'high') {
        const ext = baseUrl.split('.').pop();
        const baseWithoutExt = baseUrl.slice(0, -ext.length - 1);
        return `${baseWithoutExt}_${targetQuality}.${ext}`;
      }
      
      return baseUrl;
    },
    [quality]
  );

  return {
    quality,
    connectionSpeed,
    getOptimalImageUrl,
  };
};

export default {
  useMovieCardOptimization,
  useImageLoadTracking,
  useAdaptiveImageQuality,
};
