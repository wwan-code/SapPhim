# 🚀 Genres Page - Quick Start Guide

## Development Setup

### 1. Check Prerequisites
Đảm bảo backend đã chạy và có data:
```powershell
# Backend terminal
cd backend
npm run dev

# Verify genres exist
curl http://localhost:5000/api/genres/all
```

### 2. Start Frontend
```powershell
# Frontend terminal
cd frontend
npm run dev
```

### 3. Access Page
Navigate to: http://localhost:5173/the-loai

---

## Testing Flow

### Quick Test Scenario
1. **Load Page**: Xem sidebar hiển thị list genres
2. **Select Genre**: Click 1 genre chip (e.g., "Hành động")
3. **Verify URL**: Check URL có `?genre=hanh-dong`
4. **Check Movies**: Grid hiển thị phim thể loại đã chọn
5. **Multi-Select**: Click thêm genre khác
6. **Verify Filter**: URL và movies cập nhật
7. **Search**: Type "phiêu" trong search box → filter genres
8. **Sort**: Thay đổi sort dropdown → movies re-fetch
9. **Clear**: Click "Xóa tất cả" → reset filter
10. **Mobile**: Resize window < 768px → test offcanvas

---

## Common Development Tasks

### Add New Genre Filter Feature
```javascript
// 1. Add state
const [minRating, setMinRating] = useState(0);

// 2. Update API call
const response = await movieService.getMovies({
  genre: selectedGenreSlugs.join(','),
  minRating,  // New param
  page: pageNum,
  limit: 18,
  sort: sortBy,
});

// 3. Add UI control
<input 
  type="range" 
  min="0" 
  max="10" 
  value={minRating}
  onChange={(e) => setMinRating(e.target.value)}
/>
```

### Customize Styles
```scss
// frontend/src/assets/scss/pages/_genres-page.scss

// Change chip active color
.genres-page__chip--active {
  background: linear-gradient(
    135deg,
    rgba(var(--w-accent-color-rgb), 0.2),  // Change color
    rgba(var(--w-accent-color-rgb), 0.1)
  );
}

// Adjust sidebar width
.genres-page__sidebar {
  width: 350px;  // Default: 300px
}
```

### Add Animation
```scss
// Stagger animation for chips
.genres-page__chip {
  animation: fadeInUp 0.3s ease-out backwards;
  animation-delay: calc(var(--chip-index) * 50ms);
}
```

---

## Debugging Tips

### Issue: Movies not loading
```javascript
// Add debug logging
useEffect(() => {
  console.log('Selected genres:', selectedGenreSlugs);
  console.log('Movies:', movies);
  fetchMovies(1);
}, [fetchMovies]);
```

### Issue: Sidebar not sticky
```scss
// Check parent container
.genres-page__layout {
  overflow: visible;  // Must not be hidden
}
```

### Issue: Performance lag
```javascript
// Throttle genre selection
import { debounce } from 'lodash';

const debouncedFetchMovies = useMemo(
  () => debounce(fetchMovies, 300),
  [fetchMovies]
);
```

---

## Browser DevTools Shortcuts

### React DevTools
- Components tab → Search "GenresPage"
- View current state/props
- Track re-renders

### Network Tab
- Filter by XHR
- Check `/api/genres/all` response
- Check `/api/movies?genre=...` params

### Performance Tab
- Record interaction
- Check animation frame rate
- Identify bottlenecks

---

## Git Workflow

```bash
# Create feature branch
git checkout -b feature/genres-page-enhancement

# Make changes
# ...

# Test thoroughly
npm run dev

# Commit with descriptive message
git add .
git commit -m "feat(genres): Add country filter to genres page"

# Push and create PR
git push origin feature/genres-page-enhancement
```

---

## Need Help?

- **Backend API**: Check `backend/routes/genre.routes.js`
- **Design System**: See `docs/Yêu Cầu Thiết Kế Liquid Glass UI.md`
- **Full Docs**: See `docs/GENRES_PAGE_DOCUMENTATION.md`
- **Architecture**: See `.github/copilot-instructions.md`
