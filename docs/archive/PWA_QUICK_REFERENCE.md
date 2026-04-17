# PWA Quick Reference Card

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open in browser
http://localhost:3000
```

## 📱 Mobile Testing

```bash
# Find your local IP
# Mac/Linux:
ifconfig | grep "inet "

# Windows:
ipconfig

# Then open on mobile:
http://YOUR_IP:3000
```

## ✅ All Features Checklist

### PWA Core
- [x] Service worker registered
- [x] Manifest configured
- [x] Icons generated (10 sizes)
- [x] Offline page created
- [x] HTTPS ready

### Mobile UI
- [x] Bottom navigation (< 768px)
- [x] Hamburger menu
- [x] Responsive grids
- [x] Touch targets (44px+)
- [x] Floating action buttons

### Install System
- [x] Auto-prompt (3s delay)
- [x] Manual install button
- [x] Platform instructions
- [x] Preference storage
- [x] Native prompt trigger

### Offline Features
- [x] Book caching (last 10)
- [x] IndexedDB storage
- [x] Network detection
- [x] Offline indicators
- [x] Request queuing

### Responsive Pages
- [x] Home page
- [x] Studio page
- [x] Library page
- [x] Book detail page
- [x] Landing page

## 🎯 Key Components

### Navigation
```typescript
<BottomNav onMenuClick={() => {}} />
<HamburgerMenu isOpen={true} onClose={() => {}} />
```

### Install Prompts
```typescript
<InstallBanner onInstallClick={() => {}} />
<InstallButton onInstallClick={() => {}} />
<InstallModal isOpen={true} onClose={() => {}} />
```

### Offline
```typescript
<NetworkStatusBanner />
const isOnline = useOnlineStatus();
```

## 🔧 Utilities

### PWA Utils
```typescript
import { 
  registerServiceWorker,
  canInstallPWA,
  isInstalled,
  getPlatform,
  cacheBookForOffline
} from '@/lib/utils/pwa-utils';
```

### Offline Utils
```typescript
import { 
  useOnlineStatus,
  isOnline,
  requiresInternet,
  fetchWithOfflineSupport
} from '@/lib/utils/offline-utils';
```

### Cache Service
```typescript
import { offlineCache } from '@/lib/services/offline-cache';

await offlineCache.cacheBook(bookData);
const book = await offlineCache.getCachedBook(id);
const books = await offlineCache.getCachedBooks();
```

## 📐 Breakpoints

```css
/* Mobile */
@media (max-width: 768px) { }

/* Tablet */
@media (min-width: 768px) and (max-width: 1024px) { }

/* Desktop */
@media (min-width: 1024px) { }
```

## 🎨 Tailwind Classes

### Responsive Visibility
```tsx
className="hidden md:block"        // Hide on mobile
className="md:hidden"              // Show on mobile only
className="block md:flex"          // Block mobile, flex desktop
```

### Grid Layouts
```tsx
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6"
```

### Spacing
```tsx
className="px-4 py-4 md:px-6 md:py-8"  // Responsive padding
className="gap-3 md:gap-6"              // Responsive gap
className="mb-4 md:mb-8"                // Responsive margin
```

## 🧪 Testing Commands

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

## 🔍 DevTools Checks

### Service Worker
1. Open DevTools (F12)
2. Application tab
3. Service Workers section
4. Check status: "activated and running"

### Manifest
1. Open DevTools
2. Application tab
3. Manifest section
4. Verify all fields

### Cache Storage
1. Open DevTools
2. Application tab
3. Cache Storage section
4. Check powerwrite-v1 cache

### IndexedDB
1. Open DevTools
2. Application tab
3. IndexedDB section
4. Check powerwrite-offline database

## 📊 Performance Targets

| Metric | Target | Current |
|--------|--------|---------|
| PWA Score | > 90 | ✅ |
| Performance | > 85 | ✅ |
| Accessibility | > 90 | ✅ |
| First Load | < 3s | ✅ |
| Repeat Load | < 1s | ✅ |
| Offline Load | < 0.5s | ✅ |

## 🐛 Quick Fixes

### Service Worker Issues
```bash
# Clear and re-register
# In DevTools Console:
navigator.serviceWorker.getRegistrations().then(regs => {
  regs.forEach(reg => reg.unregister());
});
# Then refresh page
```

### Cache Issues
```bash
# Clear all caches
# In DevTools Console:
caches.keys().then(names => {
  names.forEach(name => caches.delete(name));
});
```

### LocalStorage Issues
```bash
# Clear PWA preferences
localStorage.removeItem('pwa-install-dismissed');
localStorage.removeItem('pwa-install-dont-show');
localStorage.removeItem('pwa-install-last-shown');
```

## 📱 Platform-Specific

### iOS Safari
- No beforeinstallprompt event
- Manual "Add to Home Screen" only
- Share button → Add to Home Screen

### Android Chrome
- Full PWA support
- Install prompt works
- Menu → Install app

### Desktop Chrome/Edge
- Full PWA support
- Install icon in address bar
- Menu → Install PowerWrite

### Firefox
- Service worker works
- No install prompt
- Add to home screen (mobile)

## 🎯 Common Tasks

### Add New Page
1. Create page component
2. Add to routing
3. Add responsive styles
4. Test on mobile
5. Update navigation

### Add to Cache
```typescript
// In service worker (sw.js)
const STATIC_ASSETS = [
  '/',
  '/new-page',
  // ... other assets
];
```

### Update Service Worker
1. Edit `public/sw.js`
2. Increment `CACHE_VERSION`
3. Test locally
4. Deploy
5. Users get update prompt

### Add Install Prompt
```typescript
import { InstallButton } from '@/components/pwa/InstallButton';

<InstallButton 
  variant="primary"
  size="md"
  onInstallClick={() => setShowModal(true)}
/>
```

## 📚 Documentation

- **PWA_GUIDE.md** - User guide
- **PWA_TESTING.md** - Testing checklist
- **PWA_IMPLEMENTATION_SUMMARY.md** - Technical details
- **PWA_READY.md** - Quick start guide

## 🎊 Status

✅ **All Features Implemented**
✅ **All Tests Passing**
✅ **Documentation Complete**
✅ **Ready for Production**

---

**Quick Help:**
- Issue? Check PWA_GUIDE.md
- Testing? See PWA_TESTING.md
- Details? Read PWA_IMPLEMENTATION_SUMMARY.md
- Starting? Open PWA_READY.md



