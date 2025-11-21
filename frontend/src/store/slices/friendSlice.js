import { createSlice } from '@reduxjs/toolkit';
import { queryClient } from '@/utils/queryClient';
import { friendQueryKeys } from '@/hooks/useFriendQueries';

const initialState = {
  // Trạng thái online của bạn bè sẽ được quản lý ở đây
  // Key là userId, value là { online: boolean, lastOnline: Date }
  friendStatuses: {},
};

const friendSlice = createSlice({
  name: 'friends',
  initialState,
  reducers: {
    /**
     * Cập nhật trạng thái online/offline của một người dùng (bạn bè).
     * Dữ liệu này được đẩy từ server qua socket.
     * React Query sẽ tự động cập nhật dữ liệu bạn bè, nhưng trạng thái online
     * có thể được cập nhật tức thì ở đây để UI phản ứng nhanh hơn.
     */
    onUserStatusUpdate: (state, action) => {
      const { userId, online, lastOnline, hidden = false } = action.payload;
      if (!userId) return;

      const effectiveOnline = hidden ? false : online;
      const effectiveLastOnline = hidden ? null : lastOnline;

      state.friendStatuses[userId] = {
        online: effectiveOnline,
        lastOnline: effectiveLastOnline,
        hidden,
      };

      // Cập nhật dữ liệu trong cache của React Query một cách lạc quan (optimistic)
      // để các component sử dụng useGetFriends() và useSearchUsers() có thể re-render.

      // Cập nhật danh sách bạn bè (infinite query structure)
      queryClient.setQueryData(
        friendQueryKeys.lists(),
        (oldData) => {
          if (!oldData || !oldData.pages) return oldData;

          return {
            ...oldData,
            pages: oldData.pages.map(page => {
              if (!page || !page.data || !Array.isArray(page.data)) return page;

              return {
                ...page,
                data: page.data.map(item =>
                  item.id === userId
                    ? {
                        ...item,
                        online: effectiveOnline,
                        lastOnline: effectiveLastOnline,
                        hidden,
                      }
                    : item
                )
              };
            })
          };
        }
      );
    },

    hydrateFriendStatuses: (state, action) => {
      const statuses = Array.isArray(action.payload) ? action.payload : [];
      statuses.forEach((status) => {
        if (!status?.userId) return;
        const hidden = !!status.hidden;
        state.friendStatuses[status.userId] = {
          online: hidden ? false : !!status.online,
          lastOnline: hidden ? null : status.lastOnline,
          hidden,
        };
      });
    },

    /**
     * Xóa toàn bộ trạng thái của slice này khi người dùng đăng xuất.
     */
    clearFriendState: (state) => {
      Object.assign(state, initialState);
    },
  },
});

export const {
  onUserStatusUpdate,
  hydrateFriendStatuses,
  clearFriendState
} = friendSlice.actions;

export default friendSlice.reducer;
