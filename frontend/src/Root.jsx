import React, { useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useTheme } from './hooks/useTheme';
import { initializeSocket, disconnectSocket } from './socket/socketManager';
import { clearFriendState } from './store/slices/friendSlice';
import { useNotificationQueries } from './hooks/useNotificationQueries';

const Root = ({ children }) => {
  useTheme();
  const dispatch = useDispatch();
  const { accessToken } = useSelector((state) => state.auth);
  const { clearNotificationCache } = useNotificationQueries();

  // Track previous token to detect changes
  const prevTokenRef = useRef(accessToken);
  const isInitializedRef = useRef(false);
  const cleanupTimeoutRef = useRef(null);

  useEffect(() => {
    const prevToken = prevTokenRef.current;
    const hasTokenChanged = prevToken !== accessToken;

    // Clear any pending cleanup
    if (cleanupTimeoutRef.current) {
      clearTimeout(cleanupTimeoutRef.current);
      cleanupTimeoutRef.current = null;
    }

    // Case 1: User just logged in (no token -> has token)
    if (!prevToken && accessToken) {
      console.log('🔐 User logged in, initializing socket...');

      // Small delay to ensure auth state is fully updated
      cleanupTimeoutRef.current = setTimeout(() => {
        initializeSocket();
        isInitializedRef.current = true;
      }, 100);
    }

    // Case 2: User logged out (has token -> no token)
    else if (prevToken && !accessToken) {
      console.log('🔓 User logged out, disconnecting socket...');

      disconnectSocket();
      dispatch(clearFriendState());
      clearNotificationCache();
      isInitializedRef.current = false;
    }

    // Case 3: Token changed (refresh or different user)
    else if (hasTokenChanged && accessToken) {
      console.log('🔄 Token changed, reinitializing socket...');

      // Disconnect old connection first
      disconnectSocket();

      // Wait a bit before reconnecting with new token
      cleanupTimeoutRef.current = setTimeout(() => {
        initializeSocket();
        isInitializedRef.current = true;
      }, 300);
    }

    // Case 4: Component mounted with existing token
    else if (accessToken && !isInitializedRef.current) {
      console.log('⚡ Component mounted with token, initializing socket...');

      cleanupTimeoutRef.current = setTimeout(() => {
        initializeSocket();
        isInitializedRef.current = true;
      }, 100);
    }

    // Update previous token reference
    prevTokenRef.current = accessToken;

    // Cleanup function - only runs when component unmounts
    return () => {
      if (cleanupTimeoutRef.current) {
        clearTimeout(cleanupTimeoutRef.current);
        cleanupTimeoutRef.current = null;
      }

      // Only disconnect on unmount, not on re-renders
      console.log('🧹 Root component unmounting, cleaning up socket...');
      disconnectSocket();
      isInitializedRef.current = false;
    };
  }, [accessToken]); // Only depend on accessToken

  // Separate effect for dispatches to avoid dependency issues
  useEffect(() => {
    if (!accessToken) {
      dispatch(clearFriendState());
      clearNotificationCache();
    }
  }, [accessToken, dispatch, clearNotificationCache]);

  return <>{children}</>;
};

export default Root;