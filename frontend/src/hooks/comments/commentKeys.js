/**
 * Key cho React Query cache
 */
export const COMMENT_QUERY_KEYS = {
    comments: (contentType, contentId, sort) => ['comments', contentType, contentId, sort],
    movieCommentsWithEpisodes: (movieId, sort) => ['movieCommentsWithEpisodes', movieId, sort],
    replies: (parentId, sort) => ['replies', parentId, sort],
    reportedComments: (filters) => ['reportedComments', filters],
    commentStatsAdmin: (filters) => ['commentStatsAdmin', filters],
};
