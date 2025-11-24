import { useQuery } from '@tanstack/react-query';
import movieService from '@/services/movieService';

export const movieQueryKeys = {
    all: ['movies'],
    lists: () => [...movieQueryKeys.all, 'list'],
    latest: (limit) => [...movieQueryKeys.lists(), 'latest', limit],
    trending: (limit) => [...movieQueryKeys.lists(), 'trending', limit],
    theater: (limit) => [...movieQueryKeys.lists(), 'theater', limit],
    top: () => [...movieQueryKeys.lists(), 'top'],
    detail: (slug) => [...movieQueryKeys.all, 'detail', slug],
    watch: (slug, episode) => [...movieQueryKeys.all, 'watch', slug, episode],
};

export const useGetLatestMovies = (limit = 10) => {
    return useQuery({
        queryKey: movieQueryKeys.latest(limit),
        queryFn: async () => {
            const response = await movieService.getLatestMovies({ limit });
            return response.data;
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
};

export const useGetTrendingMovies = (limit = 10) => {
    return useQuery({
        queryKey: movieQueryKeys.trending(limit),
        queryFn: async () => {
            const response = await movieService.getTrendingMovies({ limit });
            return response.data;
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
};

export const useGetTheaterMovies = (limit = 12) => {
    return useQuery({
        queryKey: movieQueryKeys.theater(limit),
        queryFn: async () => {
            const response = await movieService.getTheaterMovies({ limit });
            return response.data;
        },
        staleTime: 10 * 60 * 1000, // 10 minutes (theater movies change less frequently)
    });
};

export const useGetTopMovies = () => {
    return useQuery({
        queryKey: movieQueryKeys.top(),
        queryFn: async () => {
            const response = await movieService.getTop10Movies();
            return response.data;
        },
        staleTime: 10 * 60 * 1000, // 10 minutes
    });
};

export const useGetMovieDetail = (slug) => {
    return useQuery({
        queryKey: movieQueryKeys.detail(slug),
        queryFn: async () => {
            const response = await movieService.getMovieDetailBySlug(slug);
            return response.data;
        },
        enabled: !!slug,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
};

export const useGetMovieWatchData = (slug, episodeNumber) => {
    return useQuery({
        queryKey: movieQueryKeys.watch(slug, episodeNumber),
        queryFn: async () => {
            const response = await movieService.getMovieWatchDataBySlug(slug, episodeNumber);
            // Normalize response to always return an object with data and hasNoEpisodes flag
            if (response.success) {
                return { ...response.data, hasNoEpisodes: response.hasNoEpisodes };
            }
            throw new Error(response.message || 'Failed to fetch watch data');
        },
        enabled: !!slug,
        staleTime: 1 * 60 * 1000, // 1 minute (shorter cache for watch data as progress might change)
        retry: (failureCount, error) => {
            // Don't retry if it's a 404 or specific business error
            if (error.response?.status === 404) return false;
            return failureCount < 2;
        }
    });
};

export const useGetSimilarMovies = (movieId, limit = 6) => {
    return useQuery({
        queryKey: [...movieQueryKeys.all, 'similar', movieId, limit],
        queryFn: async () => {
            const response = await movieService.getSimilarMovies(movieId, { limit });
            return response.data;
        },
        enabled: !!movieId,
        staleTime: 5 * 60 * 1000,
    });
};

export const useGetMoviesInSameSeries = (movieId, limit = 6) => {
    return useQuery({
        queryKey: [...movieQueryKeys.all, 'series', movieId, limit],
        queryFn: async () => {
            const response = await movieService.getMoviesInSameSeries(movieId, { limit });
            return response.data;
        },
        enabled: !!movieId,
        staleTime: 5 * 60 * 1000,
    });
};
