import { io } from 'socket.io-client';
import { store } from '@/store';
import { onUserStatusUpdate } from '@/store/slices/friendSlice';
import { setCurrentUserOnlineStatus } from '@/store/slices/authSlice';
import { queryClient } from '@/utils/queryClient';
import { friendQueryKeys } from '@/hooks/useFriendQueries';
import { debounce } from '@/utils/performanceUtils';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL;

// ============================================================================
// STATE MANAGEMENT
// ============================================================================
let socket = null;
let handlersRegistered = false;
let connectionAttempt = 0;
let isInitializing = false;
let isDisconnecting = false;
let reconnectTimeout = null;
let connectionCheckInterval = null;

// ============================================================================
// CONFIGURATION
// ============================================================================
const CONFIG = {
  MAX_RECONNECT_ATTEMPTS: 5,
  RECONNECT_DELAY: 1000,
  MAX_QUEUE_SIZE: 1000,
  MAX_QUEUE_PROCESS_TIME: 2000,
  CONNECTION_CHECK_INTERVAL: 30000, // Check connection health every 30s
  INITIALIZATION_TIMEOUT: 10000, // 10s timeout for initialization
};

// ============================================================================
// EVENT QUEUE
// ============================================================================
const eventQueue = [];
let isProcessingQueue = false;
let queueProcessStartTime = 0;

// ============================================================================
// QUERY KEYS
// ============================================================================
const NOTIFICATION_QUERY_KEYS = {
  all: ['notifications'],
  lists: () => [...NOTIFICATION_QUERY_KEYS.all, 'list'],
  unreadCount: () => [...NOTIFICATION_QUERY_KEYS.all, 'unread-count'],
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
const getCurrentUserId = () => store.getState().auth.user?.id ?? null;

const createDebouncedInvalidate = (wait = 100) => {
  const pending = new Set();
  let timerId = null;

  const invalidate = () => {
    if (pending.size === 0) return;

    pending.forEach((serializedKey) => {
      try {
        const key = JSON.parse(serializedKey);
        queryClient.invalidateQueries({ queryKey: key });
      } catch (error) {
        console.error('Failed to parse query key:', serializedKey, error);
      }
    });
    pending.clear();
    timerId = null;
  };

  return (queryKey) => {
    pending.add(JSON.stringify(queryKey));
    if (timerId) return;
    timerId = setTimeout(invalidate, wait);
  };
};

const batchInvalidate = createDebouncedInvalidate(100);

// ============================================================================
// OPTIMISTIC UPDATES
// ============================================================================
const optimisticUpdate = {
  notification: (newNotification) => {
    queryClient.setQueryData(
      NOTIFICATION_QUERY_KEYS.unreadCount(),
      (oldData) => {
        const currentCount = typeof oldData === 'number' ? oldData : 0;
        return currentCount + 1;
      }
    );

    queryClient.setQueriesData(
      { queryKey: NOTIFICATION_QUERY_KEYS.lists() },
      (oldData) => {
        if (!oldData?.pages) return oldData;

        return {
          ...oldData,
          pages: oldData.pages.map((page, index) => {
            if (index === 0) {
              const existing = Array.isArray(page.data) ? page.data : [];
              return {
                ...page,
                data: [newNotification, ...existing],
              };
            }
            return page;
          }),
        };
      }
    );
  },

  comment: (() => {
    const invalidate = debounce(
      () => {
        batchInvalidate(['comments']);
        batchInvalidate(['replies']);
      },
      500
    );
    return () => invalidate();
  })(),

  userStatus: (userId, online, lastOnline, hidden) => {
    const currentUserId = getCurrentUserId();

    if (userId === currentUserId) {
      store.dispatch(setCurrentUserOnlineStatus({ online, lastOnline }));
      return;
    }

    store.dispatch(onUserStatusUpdate({ userId, online, lastOnline, hidden }));

    const effectiveOnline = hidden ? false : online;
    const effectiveLastOnline = hidden ? null : lastOnline;

    queryClient.setQueryData(friendQueryKeys.lists(), (oldData) => {
      if (!oldData?.pages) return oldData;

      return {
        ...oldData,
        pages: oldData.pages.map((page) => {
          if (!page?.data || !Array.isArray(page.data)) return page;

          return {
            ...page,
            data: page.data.map((item) =>
              item.id === userId
                ? {
                  ...item,
                  online: effectiveOnline,
                  lastOnline: effectiveLastOnline,
                  hidden,
                }
                : item
            ),
          };
        }),
      };
    });
  },
};

// ============================================================================
// EVENT QUEUE PROCESSING
// ============================================================================
const processEventQueue = () => {
  if (isProcessingQueue || eventQueue.length === 0) return;

  isProcessingQueue = true;
  queueProcessStartTime = Date.now();
  let processedCount = 0;
  let errorCount = 0;

  try {
    while (
      eventQueue.length > 0 &&
      Date.now() - queueProcessStartTime < CONFIG.MAX_QUEUE_PROCESS_TIME
    ) {
      const { event, handler, data } = eventQueue.shift();
      try {
        handler(data);
        processedCount++;
      } catch (error) {
        errorCount++;
        console.error(`Socket queue handler failed for event ${event}:`, error);
      }
    }

    if (eventQueue.length > 0) {
      console.warn(
        `Event queue still has ${eventQueue.length} items after timeout. Processed: ${processedCount}, Errors: ${errorCount}`
      );
    }
  } finally {
    isProcessingQueue = false;
  }
};

const queueEvent = (event, handler, data) => {
  if (eventQueue.length >= CONFIG.MAX_QUEUE_SIZE) {
    console.warn(
      `Event queue exceeded max size (${CONFIG.MAX_QUEUE_SIZE}). Dropping oldest events.`
    );
    const removeCount = Math.ceil(CONFIG.MAX_QUEUE_SIZE * 0.2);
    eventQueue.splice(0, removeCount);
  }

  eventQueue.push({ event, handler, data });

  if (socket?.connected) {
    processEventQueue();
  }
};

// ============================================================================
// NOTIFICATION HANDLERS
// ============================================================================
const handleNotificationPatch = (id, patch) => {
  queryClient.setQueriesData(
    { queryKey: NOTIFICATION_QUERY_KEYS.lists() },
    (oldData) => {
      if (!oldData?.pages) return oldData;

      return {
        ...oldData,
        pages: oldData.pages.map((page) => ({
          ...page,
          data: Array.isArray(page.data)
            ? page.data.map((notification) =>
              notification.id === id
                ? { ...notification, ...patch }
                : notification
            )
            : page.data,
        })),
      };
    }
  );
};

const handleNotificationDelete = (id) => {
  queryClient.setQueriesData(
    { queryKey: NOTIFICATION_QUERY_KEYS.lists() },
    (oldData) => {
      if (!oldData?.pages) return oldData;

      return {
        ...oldData,
        pages: oldData.pages.map((page) => ({
          ...page,
          data: Array.isArray(page.data)
            ? page.data.filter((notification) => notification.id !== id)
            : page.data,
        })),
      };
    }
  );
};

const markNotificationsAsRead = () => {
  queryClient.setQueriesData(
    { queryKey: NOTIFICATION_QUERY_KEYS.lists() },
    (oldData) => {
      if (!oldData?.pages) return oldData;

      return {
        ...oldData,
        pages: oldData.pages.map((page) => ({
          ...page,
          data: Array.isArray(page.data)
            ? page.data.map((notification) => ({
              ...notification,
              isRead: true,
            }))
            : page.data,
        })),
      };
    }
  );

  queryClient.setQueryData(NOTIFICATION_QUERY_KEYS.unreadCount(), 0);
};

// ============================================================================
// EVENT HANDLERS REGISTRATION
// ============================================================================
const attachEventHandlers = () => {
  if (!socket || handlersRegistered) return;

  handlersRegistered = true;
  const attachedEvents = new Set();

  const attachHandler = (eventName, handler) => {
    if (attachedEvents.has(eventName)) {
      console.warn(`Handler for ${eventName} already attached`);
      return;
    }
    socket.on(eventName, handler);
    attachedEvents.add(eventName);
  };

  // Notification events
  attachHandler('notification:new', (notification) => {
    queueEvent(
      'notification:new',
      () => optimisticUpdate.notification(notification),
      notification
    );
  });

  attachHandler('notification:patch', ({ id, patch }) => {
    queueEvent(
      'notification:patch',
      () => handleNotificationPatch(id, patch),
      { id, patch }
    );
  });

  attachHandler('notification:delete', ({ id }) => {
    queueEvent(
      'notification:delete',
      () => handleNotificationDelete(id),
      { id }
    );
    batchInvalidate(NOTIFICATION_QUERY_KEYS.lists());
    batchInvalidate(NOTIFICATION_QUERY_KEYS.unreadCount());
  });

  attachHandler('notification:unread-count', ({ unread }) => {
    queueEvent(
      'notification:unread-count',
      () =>
        queryClient.setQueryData(
          NOTIFICATION_QUERY_KEYS.unreadCount(),
          unread ?? 0
        ),
      { unread }
    );
  });

  attachHandler('notification:all-cleared', () => {
    queueEvent('notification:all-cleared', () => markNotificationsAsRead(), null);
  });

  attachHandler('notification:all-read', () => {
    queueEvent('notification:all-read', () => markNotificationsAsRead(), null);
  });

  // Friend request lifecycle events
  attachHandler('friend:request', (payload) => {
    queueEvent(
      'friend:request',
      () => {
        queryClient.invalidateQueries({ queryKey: friendQueryKeys.pending() });
      },
      payload
    );
  });

  attachHandler('friend:request:sent', (payload) => {
    queueEvent(
      'friend:request:sent',
      () => {
        queryClient.invalidateQueries({ queryKey: friendQueryKeys.sent() });
      },
      payload
    );
  });

  attachHandler('friendship:update', (payload) => {
    queueEvent(
      'friendship:update',
      () => {
        const currentUserId = getCurrentUserId();

        if (payload.type === 'cancelled' && currentUserId) {
          const friendshipId = payload.friendshipId;

          if (payload.receiverId === currentUserId) {
            queryClient.setQueryData(friendQueryKeys.pending(), (oldData) => {
              if (!oldData?.pages) return oldData;

              return {
                ...oldData,
                pages: oldData.pages.map((page) => ({
                  ...page,
                  data: Array.isArray(page.data)
                    ? page.data.filter((item) => item.id !== friendshipId)
                    : page.data,
                })),
              };
            });
          }

          if (payload.senderId === currentUserId) {
            queryClient.setQueryData(friendQueryKeys.sent(), (oldData) => {
              if (!oldData?.pages) return oldData;

              return {
                ...oldData,
                pages: oldData.pages.map((page) => ({
                  ...page,
                  data: Array.isArray(page.data)
                    ? page.data.filter((item) => item.id !== friendshipId)
                    : page.data,
                })),
              };
            });
          }
        }

        queryClient.invalidateQueries({ queryKey: friendQueryKeys.lists() });
        queryClient.invalidateQueries({ queryKey: friendQueryKeys.pending() });
        queryClient.invalidateQueries({ queryKey: friendQueryKeys.sent() });
        queryClient.invalidateQueries({ queryKey: friendQueryKeys.search('') });
      },
      payload
    );
  });

  // User status updates
  attachHandler('user_status_update', (data) => {
    queueEvent(
      'user_status_update',
      () => {
        optimisticUpdate.userStatus(
          data.userId,
          data.online,
          data.lastOnline,
          data.hidden
        );
      },
      data
    );
  });

  // Comment activity events
  const commentEvents = [
    'comment_created',
    'comment_updated',
    'comment_deleted',
    'comment_liked',
  ];
  commentEvents.forEach((event) => {
    attachHandler(event, (data) => {
      queueEvent(event, () => optimisticUpdate.comment(data, event), data);
    });
  });
};

// ============================================================================
// CONNECTION CLEANUP
// ============================================================================
const cleanupTimers = () => {
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }

  if (connectionCheckInterval) {
    clearInterval(connectionCheckInterval);
    connectionCheckInterval = null;
  }
};

const cleanupSocket = () => {
  if (!socket) return;

  try {
    // Remove all listeners before disconnect
    socket.removeAllListeners();

    // Disconnect the socket
    if (socket.connected || socket.connecting) {
      socket.disconnect();
    }

    // Clear socket reference
    socket = null;
  } catch (error) {
    console.error('Error during socket cleanup:', error);
    socket = null;
  }

  // Reset flags
  handlersRegistered = false;
  eventQueue.length = 0;
};

// ============================================================================
// CONNECTION HEALTH CHECK
// ============================================================================
const startConnectionHealthCheck = () => {
  // Clear any existing interval
  if (connectionCheckInterval) {
    clearInterval(connectionCheckInterval);
  }

  connectionCheckInterval = setInterval(() => {
    if (!socket) return;

    // Check if socket is in a bad state
    if (!socket.connected && !socket.connecting) {
      console.warn('⚠️ Socket in disconnected state, attempting reconnect...');

      const { accessToken } = store.getState().auth;
      if (accessToken) {
        cleanupSocket();
        initializeSocket();
      }
    }
  }, CONFIG.CONNECTION_CHECK_INTERVAL);
};

// ============================================================================
// SOCKET INITIALIZATION
// ============================================================================
export const initializeSocket = () => {
  // Prevent multiple simultaneous initialization attempts
  if (isInitializing) {
    console.log('Socket initialization already in progress');
    return socket;
  }

  // Prevent disconnect during initialization
  if (isDisconnecting) {
    console.log('Socket is disconnecting, waiting...');
    return null;
  }

  // Check if socket already exists and is connected/connecting
  if (socket) {
    if (socket.connected) {
      console.log('Socket already connected');
      return socket;
    }

    if (socket.connecting) {
      console.log('Socket already connecting');
      return socket;
    }

    // Socket exists but not connected/connecting, clean it up
    console.log('Cleaning up stale socket before reconnect');
    cleanupSocket();
  }

  const { accessToken } = store.getState().auth;

  if (!accessToken) {
    console.warn('Cannot initialize socket without an access token');
    return null;
  }

  isInitializing = true;
  connectionAttempt++;

  // Set initialization timeout
  const initTimeout = setTimeout(() => {
    if (isInitializing) {
      console.error('Socket initialization timeout');
      isInitializing = false;
      cleanupSocket();
    }
  }, CONFIG.INITIALIZATION_TIMEOUT);

  try {
    console.log(`🔌 Initializing socket (attempt ${connectionAttempt})...`);

    socket = io(SOCKET_URL, {
      auth: { token: accessToken },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: CONFIG.MAX_RECONNECT_ATTEMPTS,
      reconnectionDelay: CONFIG.RECONNECT_DELAY,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      forceNew: true, // ✅ Force new connection
      autoConnect: true,
      reconnection: true,
    });

    // Connection successful
    socket.on('connect', () => {
      clearTimeout(initTimeout);
      isInitializing = false;
      connectionAttempt = 0;

      console.log('✅ Socket connected successfully');

      // Subscribe to notifications
      socket.emit('notification:subscribe');

      // Process any queued events
      processEventQueue();

      // Start health check
      startConnectionHealthCheck();
    });

    // Connection error
    socket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error.message);

      // If this is a critical error (auth failure), stop trying
      if (error.message.includes('Authentication') || error.message.includes('token')) {
        console.error('Authentication error - stopping reconnection attempts');
        clearTimeout(initTimeout);
        isInitializing = false;
        cleanupSocket();
      }
    });

    // Disconnect handler
    socket.on('disconnect', (reason) => {
      console.warn('Socket disconnected:', reason);

      // If server disconnected us, try to reconnect manually
      if (reason === 'io server disconnect') {
        cleanupTimers();
        reconnectTimeout = setTimeout(() => {
          const { accessToken: currentToken } = store.getState().auth;
          if (currentToken && socket && !socket.connected) {
            console.log('🔄 Attempting manual reconnection...');
            socket.connect();
          }
        }, CONFIG.RECONNECT_DELAY);
      }
    });

    // General error handler
    socket.on('error', (error) => {
      console.error('❌ Socket error:', error);
    });

    // Reconnection handlers
    socket.io.on('reconnect', (attemptNumber) => {
      console.log(`🔄 Socket reconnected after ${attemptNumber} attempts`);
      processEventQueue();
    });

    socket.io.on('reconnect_attempt', (attemptNumber) => {
      console.log(
        `Reconnection attempt ${attemptNumber}/${CONFIG.MAX_RECONNECT_ATTEMPTS}`
      );
    });

    socket.io.on('reconnect_error', (error) => {
      console.error('Reconnection error:', error.message);
    });

    socket.io.on('reconnect_failed', () => {
      console.error('❌ Reconnection failed after max attempts');
      clearTimeout(initTimeout);
      isInitializing = false;
      cleanupSocket();
    });

    // Attach event handlers
    attachEventHandlers();

    return socket;
  } catch (error) {
    console.error('Error initializing socket:', error);
    clearTimeout(initTimeout);
    isInitializing = false;
    cleanupSocket();
    return null;
  }
};

// ============================================================================
// SOCKET DISCONNECTION
// ============================================================================
export const disconnectSocket = () => {
  if (isDisconnecting) {
    console.log('Disconnect already in progress');
    return;
  }

  if (!socket) {
    return;
  }

  isDisconnecting = true;
  console.log('🔌 Disconnecting socket...');

  // Clear all timers
  cleanupTimers();

  // Cleanup socket
  cleanupSocket();

  // Reset state
  connectionAttempt = 0;
  isInitializing = false;
  isDisconnecting = false;

  console.log('✅ Socket disconnected successfully');
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================
export const getSocket = () => {
  if (!socket) {
    const { accessToken } = store.getState().auth;
    if (accessToken) {
      console.warn('Socket not initialized. Call initializeSocket() first.');
    }
    return null;
  }
  return socket;
};

export const isSocketConnected = () => Boolean(socket?.connected);

export const emitSocketEvent = (event, data) => {
  if (socket?.connected) {
    socket.emit(event, data);
    return true;
  }

  console.warn(`Socket offline; queueing event: ${event}`);
  queueEvent(event, () => socket?.emit(event, data), data);
  return false;
};

// ============================================================================
// EXPORTS
// ============================================================================
export default {
  initializeSocket,
  getSocket,
  disconnectSocket,
  isSocketConnected,
  emitSocketEvent,
};