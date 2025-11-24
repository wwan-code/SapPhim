import { createSlice } from '@reduxjs/toolkit';

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

      state.friendStatuses[userId] = {
        online: effectiveOnline,
        lastOnline: effectiveLastOnline,
        hidden,
      };
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
