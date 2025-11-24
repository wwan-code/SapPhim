import { useMutation, useQueryClient } from '@tanstack/react-query';
import commentService from '@/services/commentService';
import { toast } from 'react-toastify';
import { COMMENT_QUERY_KEYS } from './commentKeys';

/**
 * Custom hook để tạo bình luận mới.
 * Hỗ trợ optimistic update.
 * @param {object} queryKeyToInvalidate - Query key để invalidate sau khi mutation thành công.
 * @returns {object} Kết quả từ useMutation.
 */
export const useCreateComment = (queryKeyToInvalidate) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: commentService.createComment,
        onMutate: async (newCommentData) => {
            // Hủy các fetches đang chờ xử lý cho queryKeyToInvalidate
            await queryClient.cancelQueries({ queryKey: queryKeyToInvalidate });

            // Lấy snapshot của dữ liệu trước đó
            const previousComments = queryClient.getQueryData(queryKeyToInvalidate);

            // Optimistically update cache
            queryClient.setQueryData(queryKeyToInvalidate, (oldData) => {
                if (!oldData) return oldData;

                const newComment = {
                    ...newCommentData,
                    id: `temp-${Date.now()}`, // ID tạm thời
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    user: {
                        // Giả định user info có sẵn từ context hoặc props
                        id: newCommentData.userId,
                        username: 'Bạn', // Placeholder
                        avatarUrl: 'https://via.placeholder.com/40', // Placeholder
                        roles: [{ name: 'user' }]
                    },
                    likes: [],
                    isLiked: false,
                    isReported: false,
                    hasReplies: false,
                    repliesCount: 0,
                    replies: [],
                    isSpoiler: newCommentData.isSpoiler || false,
                    isEdited: false,
                    isApproved: true, // Giả định được duyệt ngay
                    isHidden: false,
                };

                // Nếu là reply, tìm và thêm vào replies của comment cha (hỗ trợ nested replies)
                if (newCommentData.parentId) {
                    const addReplyToComment = (comments, parentId, newReply) => {
                        return comments.map(comment => {
                            if (comment.id === parentId) {
                                return {
                                    ...comment,
                                    repliesCount: (comment.repliesCount || 0) + 1,
                                    replies: [newReply, ...(comment.replies || [])],
                                };
                            }
                            // Tìm trong nested replies
                            if (comment.replies && comment.replies.length > 0) {
                                return {
                                    ...comment,
                                    replies: addReplyToComment(comment.replies, parentId, newReply)
                                };
                            }
                            return comment;
                        });
                    };

                    return {
                        ...oldData,
                        pages: oldData.pages.map(page => ({
                            ...page,
                            data: addReplyToComment(page.data, newCommentData.parentId, newComment),
                        })),
                    };
                } else {
                    // Nếu là comment gốc, thêm vào đầu danh sách comments
                    return {
                        ...oldData,
                        pages: oldData.pages.map((page, index) => {
                            if (index === 0) { // Chỉ thêm vào trang đầu tiên
                                return {
                                    ...page,
                                    data: [newComment, ...page.data],
                                };
                            }
                            return page;
                        }),
                    };
                }
            });

            return { previousComments };
        },
        onSuccess: (data, variables, context) => {
            toast.success(data.message || 'Bình luận đã được tạo thành công!');
            // Invalidate query để refetch dữ liệu mới nhất từ server
            queryClient.invalidateQueries({ queryKey: queryKeyToInvalidate });
        },
        onError: (err, newCommentData, context) => {
            toast.error(err.response?.data?.message || 'Tạo bình luận thất bại.');
            // Rollback optimistic update nếu có lỗi
            if (context?.previousComments) {
                queryClient.setQueryData(queryKeyToInvalidate, context.previousComments);
            }
        },
    });
};

/**
 * Custom hook để cập nhật bình luận.
 * Hỗ trợ optimistic update.
 * @param {object} queryKeyToInvalidate - Query key để invalidate sau khi mutation thành công.
 * @returns {object} Kết quả từ useMutation.
 */
export const useUpdateComment = (queryKeyToInvalidate) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, commentData }) => commentService.updateComment(id, commentData),
        onMutate: async ({ id, commentData }) => {
            await queryClient.cancelQueries({ queryKey: queryKeyToInvalidate });
            const previousComments = queryClient.getQueryData(queryKeyToInvalidate);

            queryClient.setQueryData(queryKeyToInvalidate, (oldData) => {
                if (!oldData) return oldData;

                const updateCommentInTree = (comments, commentId, updateData) => {
                    return comments.map(comment => {
                        if (comment.id === commentId) {
                            return {
                                ...comment,
                                text: updateData.text !== undefined ? updateData.text : comment.text,
                                isSpoiler: updateData.isSpoiler !== undefined ? updateData.isSpoiler : comment.isSpoiler,
                                isEdited: true,
                                updatedAt: new Date().toISOString(),
                            };
                        }
                        // Cập nhật trong nested replies
                        if (comment.replies && comment.replies.length > 0) {
                            return {
                                ...comment,
                                replies: updateCommentInTree(comment.replies, commentId, updateData)
                            };
                        }
                        return comment;
                    });
                };

                return {
                    ...oldData,
                    pages: oldData.pages.map(page => ({
                        ...page,
                        data: updateCommentInTree(page.data, id, commentData),
                    })),
                };
            });

            return { previousComments };
        },
        onSuccess: (data, variables, context) => {
            toast.success(data.message || 'Bình luận đã được cập nhật thành công!');
            queryClient.invalidateQueries({ queryKey: queryKeyToInvalidate });
        },
        onError: (err, variables, context) => {
            toast.error(err.response?.data?.message || 'Cập nhật bình luận thất bại.');
            if (context?.previousComments) {
                queryClient.setQueryData(queryKeyToInvalidate, context.previousComments);
            }
        },
    });
};

/**
 * Custom hook để xóa bình luận.
 * Hỗ trợ optimistic update.
 * @param {object} queryKeyToInvalidate - Query key để invalidate sau khi mutation thành công.
 * @returns {object} Kết quả từ useMutation.
 */
export const useDeleteComment = (queryKeyToInvalidate) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: commentService.deleteComment,
        onMutate: async (commentId) => {
            await queryClient.cancelQueries({ queryKey: queryKeyToInvalidate });
            const previousComments = queryClient.getQueryData(queryKeyToInvalidate);

            queryClient.setQueryData(queryKeyToInvalidate, (oldData) => {
                if (!oldData) return oldData;

                const deleteCommentFromTree = (comments, commentIdToDelete) => {
                    return comments
                        .filter(comment => comment.id !== commentIdToDelete)
                        .map(comment => {
                            // Nếu comment có replies, xóa comment trong replies và cập nhật repliesCount
                            if (comment.replies && comment.replies.length > 0) {
                                const filteredReplies = deleteCommentFromTree(comment.replies, commentIdToDelete);
                                return {
                                    ...comment,
                                    replies: filteredReplies,
                                    repliesCount: filteredReplies.length
                                };
                            }
                            return comment;
                        });
                };

                return {
                    ...oldData,
                    pages: oldData.pages.map(page => ({
                        ...page,
                        data: deleteCommentFromTree(page.data, commentId),
                    })),
                };
            });

            return { previousComments };
        },
        onSuccess: (data, variables, context) => {
            toast.success(data.message || 'Bình luận đã được xóa thành công!');
            queryClient.invalidateQueries({ queryKey: queryKeyToInvalidate });
        },
        onError: (err, variables, context) => {
            toast.error(err.response?.data?.message || 'Xóa bình luận thất bại.');
            if (context?.previousComments) {
                queryClient.setQueryData(queryKeyToInvalidate, context.previousComments);
            }
        },
    });
};

/**
 * Custom hook để like/unlike bình luận.
 * Hỗ trợ optimistic update cho cả comment gốc và replies.
 * @param {object} queryKeyToInvalidate - Query key để invalidate sau khi mutation thành công.
 * @returns {object} Kết quả từ useMutation.
 */
export const useToggleLike = (queryKeyToInvalidate, currentUserId) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: commentService.toggleLike,
        onMutate: async (commentId) => {
            // Cancel tất cả queries liên quan đến comments và replies
            await queryClient.cancelQueries({ queryKey: ['comments'] });
            await queryClient.cancelQueries({ queryKey: ['replies'] });

            const previousComments = queryClient.getQueryData(queryKeyToInvalidate);

            // Cập nhật optimistic cho tất cả queries có thể chứa comment này
            const updateLikeStatus = (comments) =>
                comments.map(comment => {
                    if (comment.id === commentId) {
                        const isLiked = !comment.isLiked;
                        const newLikesCount = isLiked
                            ? (comment.likesCount || 0) + 1
                            : (comment.likesCount || 0) - 1;
                        return {
                            ...comment,
                            isLiked,
                            likesCount: newLikesCount < 0 ? 0 : newLikesCount, // Ensure likes don't go below 0
                        };
                    }
                    // Cập nhật trong nested replies
                    if (comment.replies && comment.replies.length > 0) {
                        return {
                            ...comment,
                            replies: updateLikeStatus(comment.replies)
                        };
                    }
                    return comment;
                });

            // Cập nhật cho query hiện tại
            queryClient.setQueryData(queryKeyToInvalidate, (oldData) => {
                if (!oldData) return oldData;
                console.log("oldData", oldData)

                return {
                    ...oldData,
                    pages: oldData.pages.map(page => ({
                        ...page,
                        data: updateLikeStatus(page.data),
                    })),
                };
            });

            // Cập nhật cho tất cả replies queries có thể chứa comment này
            queryClient.setQueriesData(
                { queryKey: ['replies'] },
                (oldData) => {
                    if (!oldData) return oldData;
                    return {
                        ...oldData,
                        pages: oldData.pages.map(page => ({
                            ...page,
                            data: updateLikeStatus(page.data),
                        })),
                    };
                }
            );

            return { previousComments };
        },
        onSuccess: (data, variables, context) => {
            // Invalidate tất cả comment và reply queries
            queryClient.invalidateQueries({ queryKey: ['comments'] });
            queryClient.invalidateQueries({ queryKey: ['replies'] });
        },
        onError: (err, variables, context) => {
            toast.error(err.response?.data?.message || 'Thao tác like/unlike thất bại.');
            if (context?.previousComments) {
                queryClient.setQueryData(queryKeyToInvalidate, context.previousComments);
            }
        },
    });
};

/**
 * Custom hook để report bình luận.
 * Hỗ trợ optimistic update.
 * @param {object} queryKeyToInvalidate - Query key để invalidate sau khi mutation thành công.
 * @returns {object} Kết quả từ useMutation.
 */
export const useReportComment = (queryKeyToInvalidate, currentUserId) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: commentService.reportComment,
        onMutate: async (commentId) => {
            await queryClient.cancelQueries({ queryKey: queryKeyToInvalidate });
            const previousComments = queryClient.getQueryData(queryKeyToInvalidate);

            queryClient.setQueryData(queryKeyToInvalidate, (oldData) => {
                if (!oldData) return oldData;

                const updateReportStatus = (comments) =>
                    comments.map(comment => {
                        if (comment.id === commentId) {
                            const isReported = !comment.isReported;
                            const reports = isReported
                                ? [...(comment.reports || []), currentUserId]
                                : (comment.reports || []).filter(id => id !== currentUserId);
                            return {
                                ...comment,
                                isReported,
                                reports,
                            };
                        }
                        // Cập nhật trong nested replies
                        if (comment.replies && comment.replies.length > 0) {
                            return {
                                ...comment,
                                replies: updateReportStatus(comment.replies)
                            };
                        }
                        return comment;
                    });

                return {
                    ...oldData,
                    pages: oldData.pages.map(page => ({
                        ...page,
                        data: updateReportStatus(page.data),
                    })),
                };
            });

            return { previousComments };
        },
        onSuccess: (data, variables, context) => {
            toast.success(data.message || 'Báo cáo bình luận thành công.');
            queryClient.invalidateQueries({ queryKey: queryKeyToInvalidate });
            // Invalidate reported comments list as well
            queryClient.invalidateQueries({ queryKey: COMMENT_QUERY_KEYS.reportedComments({}) });
        },
        onError: (err, variables, context) => {
            toast.error(err.response?.data?.message || 'Báo cáo bình luận thất bại.');
            if (context?.previousComments) {
                queryClient.setQueryData(queryKeyToInvalidate, context.previousComments);
            }
        },
    });
};
