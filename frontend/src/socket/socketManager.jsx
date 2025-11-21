import { io } from 'socket.io-client';
import { store } from '@/store';
import { onUserStatusUpdate } from '@/store/slices/friendSlice';
import { setCurrentUserOnlineStatus } from '@/store/slices/authSlice';
import { queryClient } from '@/utils/queryClient';
import { friendQueryKeys } from '@/hooks/useFriendQueries';
import { debounce } from '@/utils/performanceUtils';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL;

let socket = null;
let handlersRegistered = false;

const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 1000;
const MAX_QUEUE_SIZE = 1000;
const MAX_QUEUE_PROCESS_TIME = 5000;

const eventQueue = [];
let isProcessingQueue = false;
let queueProcessStartTime = 0;

const NOTIFICATION_QUERY_KEYS = {
  all: ['notifications'],
  lists: () => [...NOTIFICATION_QUERY_KEYS.all, 'list'],
  unreadCount: () => [...NOTIFICATION_QUERY_KEYS.all, 'unread-count'],
};

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

    if (timerId) {
      return;
    }

    timerId = setTimeout(invalidate, wait);
  };
};

const batchInvalidate = createDebouncedInvalidate(100);

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
        if (!oldData?.pages) {
          return oldData;
        }

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

  userStatus: (userId, online, lastOnline) => {
    const currentUserId = getCurrentUserId();

    if (userId === currentUserId) {
      store.dispatch(setCurrentUserOnlineStatus({ online, lastOnline }));
      return;
    }

    store.dispatch(onUserStatusUpdate({ userId, online, lastOnline }));
  },
};

const processEventQueue = () => {
  if (isProcessingQueue || eventQueue.length === 0) {
    return;
  }

  isProcessingQueue = true;
  queueProcessStartTime = Date.now();
  let processedCount = 0;
  let errorCount = 0;

  try {
    while (
      eventQueue.length > 0 &&
      Date.now() - queueProcessStartTime < MAX_QUEUE_PROCESS_TIME
    ) {
      const { event, handler, data } = eventQueue.shift();
      try {
        handler(data);
        processedCount++;
      } catch (error) {
        errorCount++;
        console.error(
          `Socket queue handler failed for event ${event}:`,
          error
        );
        // Don't re-queue failed events to prevent infinite loops
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
  // Prevent queue from growing unbounded
  if (eventQueue.length >= MAX_QUEUE_SIZE) {
    console.warn(
      `Event queue exceeded max size (${MAX_QUEUE_SIZE}). Dropping oldest events.`
    );
    // Remove oldest 20% of events
    const removeCount = Math.ceil(MAX_QUEUE_SIZE * 0.2);
    eventQueue.splice(0, removeCount);
  }

  eventQueue.push({ event, handler, data });
  if (socket?.connected) {
    processEventQueue();
  }
};

const handleNotificationPatch = (id, patch) => {
  queryClient.setQueriesData(
    { queryKey: NOTIFICATION_QUERY_KEYS.lists() },
    (oldData) => {
      if (!oldData?.pages) {
        return oldData;
      }

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
      if (!oldData?.pages) {
        return oldData;
      }

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
      if (!oldData?.pages) {
        return oldData;
      }

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

const attachEventHandlers = () => {
  if (!socket || handlersRegistered) {
    return;
  }

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
        optimisticUpdate.userStatus(data.userId, data.online, data.lastOnline);
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

export const initializeSocket = () => {
  if (socket) {
    return socket;
  }

  const { accessToken } = store.getState().auth;

  if (!accessToken) {
    console.warn('Cannot initialise socket without an access token.');
    return null;
  }

  socket = io(SOCKET_URL, {
    auth: { token: accessToken },
    transports: ['websocket', 'polling'],
    reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
    reconnectionDelay: RECONNECT_DELAY,
    reconnectionDelayMax: 5000,
    timeout: 20000,
  });

  socket.on('connect', () => {
    console.log('Socket connected');
    socket.emit('notification:subscribe');
    processEventQueue();
  });

  socket.on('disconnect', (reason) => {
    console.warn('Socket disconnected:', reason);
    if (reason === 'io server disconnect') {
      socket.connect();
    }
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error.message);
  });

  socket.io.on('reconnect', () => {
    console.log('Socket reconnected');
    processEventQueue();
  });

  attachEventHandlers();

  return socket;
};

export const getSocket = () => {
  if (!socket) {
    if (store.getState().auth.accessToken) {
      console.warn('Socket has not been initialised. Call initializeSocket() first.');
    }
    return null;
  }
  return socket;
};

export const disconnectSocket = () => {
  if (!socket) {
    return;
  }

  socket.removeAllListeners();
  socket.disconnect();
  socket = null;
  handlersRegistered = false;
  eventQueue.length = 0;
};

export const isSocketConnected = () => Boolean(socket?.connected);

export const emitSocketEvent = (event, data) => {
  if (socket?.connected) {
    socket.emit(event, data);
    return;
  }

  console.warn(`Socket offline; queueing event: ${event}`);
  queueEvent(event, () => socket?.emit(event, data), data);
};

export default {
  initializeSocket,
  getSocket,
  disconnectSocket,
  isSocketConnected,
  emitSocketEvent,
};