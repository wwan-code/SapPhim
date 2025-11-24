import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import commentService from '@/services/commentService';
import { toast } from 'react-toastify';
import { COMMENT_QUERY_KEYS } from './commentKeys';

/**
 * Custom hook để lấy danh sách bình luận bị báo cáo (Admin).
 * @param {object} filters - Các bộ lọc (minReports, userId, contentId, contentType, startDate, endDate, page, limit, sort).
 * @returns {object} Kết quả từ useQuery.
 */
export const useReportedComments = (filters) => {
    return useQuery({
        queryKey: COMMENT_QUERY_KEYS.reportedComments(filters),
        queryFn: async () => {
            const res = await commentService.getReportedComments(filters);
            return res.data;
        },
        staleTime: 1 * 60 * 1000, // 1 minute
        gcTime: 5 * 60 * 1000, // 5 minutes
    });
};

/**
 * Custom hook để lấy thống kê bình luận cho Admin.
 * @param {object} filters - Các bộ lọc (startDate, endDate, contentType, contentId, userId).
 * @returns {object} Kết quả từ useQuery.
 */
export const useCommentStatsAdmin = (filters) => {
    return useQuery({
        queryKey: COMMENT_QUERY_KEYS.commentStatsAdmin(filters),
        queryFn: async () => {
            const res = await commentService.getCommentStatsAdmin(filters);
            return res.data;
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
    });
};

/**
 * Custom hook để duyệt/bỏ duyệt bình luận (Admin).
 * @param {object} queryKeyToInvalidate - Query key để invalidate sau khi mutation thành công.
 * @returns {object} Kết quả từ useMutation.
 */
export const useApproveComment = (queryKeyToInvalidate) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, isApproved }) => commentService.approveComment(id, isApproved),
        onMutate: async ({ id, isApproved }) => {
            await queryClient.cancelQueries({ queryKey: queryKeyToInvalidate });
            const previousComments = queryClient.getQueryData(queryKeyToInvalidate);

            queryClient.setQueryData(queryKeyToInvalidate, (oldData) => {
                if (!oldData) return oldData;
                const updateApprovalStatus = (comments) =>
                    comments.map(comment => {
                        if (comment.id === id) {
                            return { ...comment, isApproved };
                        }
                        if (comment.replies) {
                            return { ...comment, replies: updateApprovalStatus(comment.replies) };
                        }
                        return comment;
                    });

                if (oldData.pages) {
                    // Handle infinite query data
                    return {
                        ...oldData,
                        pages: oldData.pages.map(page => ({ ...page, data: updateApprovalStatus(page.data) }))
                    };
                } else {
                    // Handle standard query data (like from useReportedComments)
                    return {
                        ...oldData,
                        data: updateApprovalStatus(oldData.data || [])
                    };
                }
            });
            return { previousComments };
        },
        onSuccess: (data) => {
            toast.success(data.message || 'Cập nhật trạng thái duyệt thành công.');
            queryClient.invalidateQueries({ queryKey: queryKeyToInvalidate });
            queryClient.invalidateQueries({ queryKey: COMMENT_QUERY_KEYS.reportedComments({}) }); // Invalidate reported comments
            queryClient.invalidateQueries({ queryKey: COMMENT_QUERY_KEYS.commentStatsAdmin({}) }); // Invalidate admin stats
        },
        onError: (err, variables, context) => {
            toast.error(err.response?.data?.message || 'Cập nhật trạng thái duyệt thất bại.');
            if (context?.previousComments) {
                queryClient.setQueryData(queryKeyToInvalidate, context.previousComments);
            }
        },
    });
};

/**
 * Custom hook để ghim/bỏ ghim bình luận (Admin).
 * @param {object} queryKeyToInvalidate - Query key để invalidate sau khi mutation thành công.
 * @returns {object} Kết quả từ useMutation.
 */
export const usePinComment = (queryKeyToInvalidate) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, isPinned }) => commentService.pinComment(id, isPinned),
        onMutate: async ({ id, isPinned }) => {
            await queryClient.cancelQueries({ queryKey: queryKeyToInvalidate });
            const previousComments = queryClient.getQueryData(queryKeyToInvalidate);

            queryClient.setQueryData(queryKeyToInvalidate, (oldData) => {
                if (!oldData) return oldData;
                const updatePinStatus = (comments) =>
                    comments.map(comment => {
                        if (comment.id === id) {
                            return { ...comment, isPinned };
                        }
                        return comment;
                    });
                return { ...oldData, pages: oldData.pages.map(page => ({ ...page, data: updatePinStatus(page.data) })) };
            });
            return { previousComments };
        },
        onSuccess: (data) => {
            toast.success(data.message || 'Cập nhật trạng thái ghim thành công.');
            queryClient.invalidateQueries({ queryKey: queryKeyToInvalidate });
            queryClient.invalidateQueries({ queryKey: COMMENT_QUERY_KEYS.reportedComments({}) }); // Invalidate reported comments
            queryClient.invalidateQueries({ queryKey: COMMENT_QUERY_KEYS.commentStatsAdmin({}) }); // Invalidate admin stats
        },
        onError: (err, variables, context) => {
            toast.error(err.response?.data?.message || 'Cập nhật trạng thái ghim thất bại.');
            if (context?.previousComments) {
                queryClient.setQueryData(queryKeyToInvalidate, context.previousComments);
            }
        },
    });
};

/**
 * Custom hook để ẩn/hiện bình luận (Admin).
 * @param {object} queryKeyToInvalidate - Query key để invalidate sau khi mutation thành công.
 * @returns {object} Kết quả từ useMutation.
 */
export const useHideComment = (queryKeyToInvalidate) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, isHidden }) => commentService.hideComment(id, isHidden),
        onMutate: async ({ id, isHidden }) => {
            await queryClient.cancelQueries({ queryKey: queryKeyToInvalidate });
            const previousComments = queryClient.getQueryData(queryKeyToInvalidate);

            queryClient.setQueryData(queryKeyToInvalidate, (oldData) => {
                if (!oldData) return oldData;
                const updateHiddenStatus = (comments) =>
                    comments.map(comment => {
                        if (comment.id === id) {
                            return { ...comment, isHidden };
                        }
                        if (comment.replies) {
                            return { ...comment, replies: updateHiddenStatus(comment.replies) };
                        }
                        return comment;
                    });

                if (oldData.pages) {
                    // Handle infinite query data
                    return {
                        ...oldData,
                        pages: oldData.pages.map(page => ({ ...page, data: updateHiddenStatus(page.data) }))
                    };
                } else {
                    // Handle standard query data
                    return {
                        ...oldData,
                        data: updateHiddenStatus(oldData.data || [])
                    };
                }
            });
            return { previousComments };
        },
        onSuccess: (data) => {
            toast.success(data.message || 'Cập nhật trạng thái ẩn thành công.');
            queryClient.invalidateQueries({ queryKey: queryKeyToInvalidate });
            queryClient.invalidateQueries({ queryKey: COMMENT_QUERY_KEYS.reportedComments({}) }); // Invalidate reported comments
            queryClient.invalidateQueries({ queryKey: COMMENT_QUERY_KEYS.commentStatsAdmin({}) }); // Invalidate admin stats
        },
        onError: (err, variables, context) => {
            toast.error(err.response?.data?.message || 'Cập nhật trạng thái ẩn thất bại.');
            if (context?.previousComments) {
                queryClient.setQueryData(queryKeyToInvalidate, context.previousComments);
            }
        },
    });
};

/**
 * Custom hook để xóa bình luận bởi admin.
 * @param {object} queryKeyToInvalidate - Query key để invalidate sau khi mutation thành công.
 * @returns {object} Kết quả từ useMutation.
 */
export const useAdminDeleteComment = (queryKeyToInvalidate) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: commentService.deleteCommentByAdmin,
        onMutate: async (commentId) => {
            await queryClient.cancelQueries({ queryKey: queryKeyToInvalidate });
            const previousComments = queryClient.getQueryData(queryKeyToInvalidate);

            queryClient.setQueryData(queryKeyToInvalidate, (oldData) => {
                if (!oldData) return oldData;

                const filterComments = (comments) =>
                    comments.filter(comment => comment.id !== commentId)
                        .map(comment => ({
                            ...comment,
                            replies: comment.replies ? filterComments(comment.replies) : []
                        }));

                if (oldData.pages) {
                    return {
                        ...oldData,
                        pages: oldData.pages.map(page => ({
                            ...page,
                            data: filterComments(page.data),
                        })),
                    };
                } else {
                    return {
                        ...oldData,
                        data: filterComments(oldData.data || [])
                    };
                }
            });
            return { previousComments };
        },
        onSuccess: (data) => {
            toast.success(data.message || 'Bình luận đã được xóa bởi admin thành công.');
            queryClient.invalidateQueries({ queryKey: queryKeyToInvalidate });
            queryClient.invalidateQueries({ queryKey: COMMENT_QUERY_KEYS.reportedComments({}) }); // Invalidate reported comments
            queryClient.invalidateQueries({ queryKey: COMMENT_QUERY_KEYS.commentStatsAdmin({}) }); // Invalidate admin stats
        },
        onError: (err, variables, context) => {
            toast.error(err.response?.data?.message || 'Xóa bình luận bởi admin thất bại.');
            if (context?.previousComments) {
                queryClient.setQueryData(queryKeyToInvalidate, context.previousComments);
            }
        },
    });
};
