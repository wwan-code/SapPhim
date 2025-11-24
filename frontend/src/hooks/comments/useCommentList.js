import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import commentService from '@/services/commentService';
import { COMMENT_QUERY_KEYS } from './commentKeys';

/**
 * Custom hook để lấy danh sách bình luận gốc hoặc bình luận của phim + tập.
 * Sử dụng `useInfiniteQuery` để hỗ trợ pagination (Load More).
 * @param {'movie' | 'episode'} contentType - Loại nội dung.
 * @param {number} contentId - ID của nội dung (movieId hoặc episodeId).
 * @param {string} sort - Kiểu sắp xếp ('latest' | 'oldest' | 'popular').
 * @param {boolean} isMovieWithEpisodes - Cờ để xác định có lấy comments của phim + tập không.
 * @returns {object} Kết quả từ useInfiniteQuery.
 */
export const useComments = (contentType, contentId, sort, isMovieWithEpisodes = false) => {
    const queryClient = useQueryClient();

    return useInfiniteQuery({
        queryKey: isMovieWithEpisodes
            ? COMMENT_QUERY_KEYS.movieCommentsWithEpisodes(contentId, sort)
            : COMMENT_QUERY_KEYS.comments(contentType, contentId, sort),
        queryFn: async ({ pageParam = 1 }) => {
            const params = { page: pageParam, limit: 10, sort };
            if (isMovieWithEpisodes) {
                const res = await commentService.getMovieCommentsWithEpisodes(contentId, params);
                return res.data;
            } else {
                const res = await commentService.getComments(contentType, contentId, params);
                return res.data;
            }
        },
        getNextPageParam: (lastPage, allPages) => {
            const { meta } = lastPage;
            return meta.page < meta.totalPages ? meta.page + 1 : undefined;
        },
        initialPageParam: 1,
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
    });
};

/**
 * Custom hook để lấy danh sách replies của một bình luận cha.
 * Sử dụng `useInfiniteQuery` để hỗ trợ pagination (Load More).
 * @param {number} parentId - ID của bình luận cha.
 * @param {string} sort - Kiểu sắp xếp ('latest' | 'oldest' | 'popular').
 * @returns {object} Kết quả từ useInfiniteQuery.
 */
export const useReplies = (parentId, sort) => {
    return useInfiniteQuery({
        queryKey: COMMENT_QUERY_KEYS.replies(parentId, sort),
        queryFn: async ({ pageParam = 1 }) => {
            const res = await commentService.getReplies(parentId, { page: pageParam, limit: 5, sort });
            return res.data;
        },
        getNextPageParam: (lastPage, allPages) => {
            const { meta } = lastPage;
            return meta.page < meta.totalPages ? meta.page + 1 : undefined;
        },
        initialPageParam: 1,
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        enabled: !!parentId, // Chỉ fetch khi có parentId
    });
};

/**
 * Custom hook để lấy comment với parent chain (for navigation)
 * @param {number} commentId - ID của comment
 * @returns {object} Kết quả từ useQuery
 */
export const useCommentWithParents = (commentId) => {
    return useQuery({
        queryKey: ['comment-with-parents', commentId],
        queryFn: async () => {
            const res = await commentService.getCommentWithParents(commentId);
            return res.data;
        },
        enabled: !!commentId,
        staleTime: 10 * 60 * 1000, // Cache 10 phút
        gcTime: 30 * 60 * 1000, // Keep in cache 30 phút
    });
};
