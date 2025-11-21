# 🎬 Trang Thể loại (Genres Page) - Documentation

## 📋 Mục lục
1. [Tổng quan](#tổng-quan)
2. [Kiến trúc & Cấu trúc](#kiến-trúc--cấu-trúc)
3. [Features & Functionality](#features--functionality)
4. [UI/UX Design](#uiux-design)
5. [API Integration](#api-integration)
6. [Responsive Design](#responsive-design)
7. [Performance Optimization](#performance-optimization)
8. [Testing & Debugging](#testing--debugging)

---

## 🎯 Tổng quan

**Trang Thể loại** là một trang người dùng chuyên biệt cho phép khám phá phim theo thể loại với UX trực quan và hiệu ứng Liquid Glass hiện đại.

### Thông tin cơ bản
- **Route**: `/the-loai`
- **Component chính**: `GenresPage.jsx`
- **Styles**: `_genres-page.scss`
- **Dependencies**: 
  - React Router (URL state management)
  - genreService (fetch genres)
  - movieService (fetch movies by genre)
  - React Toastify (notifications)

---

## 🏗️ Kiến trúc & Cấu trúc

### Component Structure
```
GenresPage
├── Mobile Filter Toggle (Fixed FAB)
├── Backdrop (Mobile only)
└── Layout
    ├── Sidebar (Filter Area)
    │   ├── Header (Mobile only)
    │   ├── Search Input
    │   ├── Selected Info
    │   └── Genre Chips
    └── Main Content
        ├── Header (Title + Sort)
        └── Movies Grid
            ├── Movie Cards
            ├── Skeletons (Loading)
            └── Pagination (Load More)
```

### State Management
```javascript
// Core states
- allGenres: []              // All available genres
- genresLoading: boolean     // Genres fetch status
- movies: []                 // Filtered movies
- moviesLoading: boolean     // Movies fetch status
- error: string | null       // Error message
- searchQuery: string        // Genre search term
- page: number               // Current page
- totalPages: number         // Total available pages
- sortBy: string             // Sort order
- isMobileFilterOpen: bool   // Mobile filter visibility

// URL state (via searchParams)
- genre: string (CSV)        // Selected genre slugs
```

---

## ✨ Features & Functionality

### 1. **Genre Selection (Multi-select)**
- Chọn 1 hoặc nhiều thể loại cùng lúc
- Sync với URL query `?genre=hanh-dong,hai-huoc`
- Active state với visual feedback
- Clear all button

**Implementation:**
```javascript
const handleGenreToggle = (slug) => {
  const newSelected = selectedGenreSlugs.includes(slug)
    ? selectedGenreSlugs.filter(s => s !== slug)
    : [...selectedGenreSlugs, slug];
  
  if (newSelected.length > 0) {
    setSearchParams({ genre: newSelected.join(',') });
  } else {
    setSearchParams({});
  }
};
```

### 2. **Genre Search**
- Client-side filter theo tên thể loại
- Real-time filtering
- Empty state khi không tìm thấy

**Implementation:**
```javascript
const filteredGenres = useMemo(() => {
  if (!searchQuery.trim()) return allGenres;
  return allGenres.filter(genre =>
    genre.title.toLowerCase().includes(searchQuery.toLowerCase())
  );
}, [allGenres, searchQuery]);
```

### 3. **Movie Filtering**
- Fetch phim theo genre slugs đã chọn
- Sort options: views, releaseDate, updatedAt, createdAt
- Pagination with "Load More" button
- Auto-refetch khi thay đổi filter

**API Call:**
```javascript
const response = await movieService.getMovies({
  genre: selectedGenreSlugs.join(','),  // CSV genre slugs
  page: pageNum,
  limit: 18,
  sort: sortBy,  // e.g., "views:desc"
});
```

### 4. **URL State Sync**
- Shareable links với filter state
- Back/Forward navigation support
- Deep linking support

**Example URLs:**
```
/the-loai
/the-loai?genre=hanh-dong
/the-loai?genre=hanh-dong,hai-huoc
```

### 5. **Responsive Filter UI**
- Desktop: Sticky sidebar
- Tablet: Collapsible sidebar
- Mobile: Bottom sheet / offcanvas

---

## 🎨 UI/UX Design

### Design Principles
1. **Liquid Glass Aesthetic**: Frosted glass effect với backdrop-filter
2. **Smooth Animations**: Spring-based transitions
3. **Accessibility First**: ARIA labels, keyboard navigation
4. **Progressive Enhancement**: Fallbacks cho older browsers

### Key UI Components

#### Genre Chips
```scss
.genres-page__chip {
  // Liquid glass base
  background: rgba(var(--w-background-color-rgb), 0.5);
  backdrop-filter: blur(var(--w-blur-xs));
  border: 1px solid var(--w-glass-border-light);
  
  // Active state
  &--active {
    background: linear-gradient(
      135deg,
      rgba(var(--w-primary-color-rgb), 0.2),
      rgba(var(--w-primary-color-rgb), 0.1)
    );
    box-shadow: 0 4px 12px rgba(var(--w-primary-color-rgb), 0.2);
  }
  
  // Hover effect
  &:hover {
    transform: translateY(-2px);
  }
}
```

#### Sidebar (Sticky on Desktop)
```scss
.genres-page__sidebar {
  position: sticky;
  top: calc(var(--w-header-height-desktop) + var(--w-spacing-md));
  max-height: calc(100vh - var(--w-header-height-desktop) - var(--w-spacing-xl));
  overflow-y: auto;
}
```

#### Mobile Offcanvas
```scss
@include breakpoint(tablet-and-below) {
  .genres-page__sidebar {
    position: fixed;
    top: 0;
    left: 0;
    transform: translateX(-100%);
    @include sidebar-shell-animate('open');
    
    &--open {
      transform: translateX(0);
    }
  }
}
```

### Animation Choreography
1. **Chip Hover**: translateY(-2px) + scale(1.02)
2. **Sidebar Open (Mobile)**: Shell compress-first + stagger items
3. **Movies Grid Reveal**: fadeInUp with elegant easing
4. **Pagination Button**: translateY(-2px) on hover

---

## 🔌 API Integration

### Backend Routes Used

#### 1. Get All Genres
```javascript
GET /api/genres/all
Response: { success, data: Genre[], message }
```

#### 2. Get Movies by Genre
```javascript
GET /api/movies?genre={slugs}&page={n}&limit={n}&sort={field:order}
Response: { success, data: Movie[], meta: { page, limit, total, totalPages } }
```

### Frontend Services

#### genreService
```javascript
import genreService from '@/services/genreService';

// Fetch all genres
const response = await genreService.getAllGenres();
```

#### movieService
```javascript
import movieService from '@/services/movieService';

// Fetch movies with filters
const response = await movieService.getMovies({
  genre: 'hanh-dong,hai-huoc',  // CSV slugs
  page: 1,
  limit: 18,
  sort: 'views:desc',
});
```

### Error Handling
- Toast notifications cho user-facing errors
- Console logging cho debug
- Graceful fallbacks cho failed requests
- Retry button trong error state

---

## 📱 Responsive Design

### Breakpoints
- **Mobile** (`<768px`): Offcanvas filter, 2-column grid
- **Tablet** (`768px-991px`): Collapsible sidebar, 3-column grid
- **Desktop** (`≥992px`): Sticky sidebar, 4-6 column grid

### Grid Configurations
```scss
// Mobile
.section-list {
  grid-template-columns: repeat(2, 1fr);
  gap: var(--w-spacing-sm);
}

// Tablet
@include breakpoint(tablet) {
  grid-template-columns: repeat(3, 1fr);
  gap: var(--w-spacing-md);
}

// Desktop
@include breakpoint(desktop) {
  grid-template-columns: repeat(4, 1fr);
  gap: var(--w-spacing-lg);
}

// XL+
@include breakpoint(xxl) {
  grid-template-columns: repeat(6, 1fr);
  gap: var(--w-spacing-xl);
}
```

### Mobile-Specific Features
- Fixed FAB for filter toggle
- Fullscreen offcanvas sidebar
- Bottom sheet animation
- Touch-optimized tap targets (min 44x44px)

---

## ⚡ Performance Optimization

### 1. **Memoization**
```javascript
// Memoize filtered genres
const filteredGenres = useMemo(() => {
  if (!searchQuery.trim()) return allGenres;
  return allGenres.filter(genre =>
    genre.title.toLowerCase().includes(searchQuery.toLowerCase())
  );
}, [allGenres, searchQuery]);

// Memoize selected slugs
const selectedGenreSlugs = useMemo(() => {
  const genreParam = searchParams.get('genre');
  return genreParam ? genreParam.split(',').filter(Boolean) : [];
}, [searchParams]);
```

### 2. **Pagination Strategy**
- Load 18 movies per page
- Append to existing list (infinite scroll style)
- Scroll to top on filter change
- Loading skeletons for perceived performance

### 3. **Lazy Loading**
- Movie images with `loading="lazy"`
- Intersection Observer for "Load More"
- Skeleton screens during fetch

### 4. **CSS Optimizations**
- Hardware-accelerated transforms
- `will-change` for animated properties
- `@media (prefers-reduced-motion: reduce)` support
- Efficient backdrop-filter with fallbacks

---

## 🧪 Testing & Debugging

### Manual Testing Checklist

#### Functional Tests
- [ ] Chọn/bỏ chọn genre chips
- [ ] Multi-select genres
- [ ] Clear all button
- [ ] Genre search filter
- [ ] Sort dropdown changes
- [ ] Load more pagination
- [ ] URL state sync (refresh page)
- [ ] Back/Forward navigation

#### Responsive Tests
- [ ] Mobile filter toggle FAB
- [ ] Offcanvas open/close
- [ ] Backdrop dismiss
- [ ] Grid layout adaptations
- [ ] Touch interactions

#### Performance Tests
- [ ] Initial load time
- [ ] Smooth animations (60fps)
- [ ] Large genre list scroll
- [ ] Many movies loaded
- [ ] Network throttling

#### Accessibility Tests
- [ ] Keyboard navigation
- [ ] Screen reader labels
- [ ] Focus states visible
- [ ] Color contrast (WCAG AA)
- [ ] Reduced motion support

### Common Issues & Solutions

#### Issue 1: Indicator Pill Not Positioned
**Symptom**: Genre chips selection không highlight đúng  
**Solution**: Check `selectedGenreSlugs` trong URL params

#### Issue 2: Movies Not Fetching
**Symptom**: Grid trống sau khi chọn genre  
**Solution**: Kiểm tra:
- Backend genre filter (param `genre` CSV slugs)
- API response structure
- Toast notification shows error

#### Issue 3: Sidebar Not Opening (Mobile)
**Symptom**: FAB click không mở sidebar  
**Solution**: Check:
- `isMobileFilterOpen` state
- `genres-page__sidebar--open` class applied
- Backdrop z-index conflicts

#### Issue 4: Slow Animation Performance
**Symptom**: Jittery animations, dropped frames  
**Solution**: 
- Use `transform` instead of `left`/`top`
- Enable `will-change` on animated elements
- Reduce backdrop-filter blur on lower-end devices

---

## 📂 File Structure

```
frontend/src/
├── pages/
│   └── GenresPage.jsx                    // Main component
├── assets/scss/pages/
│   └── _genres-page.scss                 // Styles
├── services/
│   ├── genreService.js                   // Genre API
│   └── movieService.js                   // Movie API
├── components/
│   ├── MovieCard.jsx                     // Movie card
│   └── skeletons/
│       └── MovieCardSkeleton.jsx         // Loading skeleton
└── router/
    └── router.jsx                        // Route definition
```

---

## 🚀 Future Enhancements

### Potential Improvements
1. **Advanced Filters**:
   - Country filter
   - Year range slider
   - IMDB rating filter
   - Combined filters (genre + country + year)

2. **UX Enhancements**:
   - Animated genre chips stagger
   - Virtualized scrolling for large lists
   - Genre thumbnails/icons
   - Recently selected genres history

3. **Performance**:
   - Server-side pagination
   - Genre popularity indicators
   - Prefetch next page
   - Cache genre list

4. **Accessibility**:
   - High contrast mode
   - Screen reader announcements
   - Voice control support

---

## 📚 References

- **Design System**: `docs/Yêu Cầu Thiết Kế Liquid Glass UI.md`
- **Backend API**: `backend/routes/genre.routes.js`, `backend/routes/movie.routes.js`
- **Architecture**: `.github/copilot-instructions.md`
- **SCSS Mixins**: `frontend/src/assets/scss/_mixins.scss`

---

**Version**: 1.0.0  
**Last Updated**: November 16, 2025  
**Maintained by**: Frontend Team
