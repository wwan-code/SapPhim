/**
 * Navigation Configuration - Shared between Header and Sidebar
 * Centralized nav items with role-based access control
 */

export const NAV_ITEMS = {
  primary: [
    { 
      path: '/', 
      label: 'Trang chủ', 
      icon: null,
      exact: true
    },
    { 
      path: '/phim-moi-cap-nhat', 
      label: 'Phim mới',
      icon: null
    },
    { 
      path: '/phim-chieu-rap', 
      label: 'Chiếu rạp',
      icon: null
    },
    { 
      path: '/the-loai', 
      label: 'Thể loại',
      icon: null
    },
  ],

  user: [
    { 
      path: '/friends', 
      label: 'Bạn bè',
      icon: 'fas fa-users',
      requiresAuth: true
    },
    { 
      path: '/watchlist', 
      label: 'Danh sách xem',
      icon: 'fas fa-bookmark',
      requiresAuth: true
    },
  ],

  admin: [
    { 
      path: '/admin/dashboard', 
      label: 'Admin Dashboard',
      icon: 'fas fa-tachometer-alt',
      requiresRoles: ['admin', 'editor']
    },
  ],

  social: [
    {
      href: 'https://facebook.com',
      label: 'Facebook',
      icon: 'fab fa-facebook-f'
    },
    {
      href: 'https://discord.com',
      label: 'Discord',
      icon: 'fab fa-discord'
    },
    {
      href: 'https://youtube.com',
      label: 'YouTube',
      icon: 'fab fa-youtube'
    },
  ]
};

/**
 * Filter nav items based on user authentication and roles
 */
export const getVisibleNavItems = (user) => {
  const allItems = [...NAV_ITEMS.primary];

  // Add user items if authenticated
  if (user) {
    allItems.push(...NAV_ITEMS.user);

    // Add admin items if user has required roles
    if (user.roles?.some(role => ['admin', 'editor'].includes(role.name))) {
      allItems.push(...NAV_ITEMS.admin);
    }
  }

  return allItems;
};

/**
 * Check if route is active
 */
export const isRouteActive = (itemPath, currentPath, exact = false) => {
  if (exact) {
    return currentPath === itemPath;
  }
  return currentPath.startsWith(itemPath);
};