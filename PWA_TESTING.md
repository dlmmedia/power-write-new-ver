# PWA Testing Guide

## Quick Test Checklist

Use this guide to verify all PWA features are working correctly.

## Pre-Testing Setup

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Open in browser:**
   - Desktop: http://localhost:3000
   - Mobile: Use your local IP (e.g., http://192.168.1.x:3000)

3. **Open DevTools (Desktop):**
   - Chrome: F12 or Cmd+Option+I
   - Check Application tab → Service Workers
   - Check Application tab → Manifest

## Test 1: Service Worker Registration

**Steps:**
1. Load the app
2. Open DevTools → Application → Service Workers
3. Verify service worker is registered and activated

**Expected:**
- ✅ Service worker status: "activated and running"
- ✅ Console shows: "Service Worker registered"
- ✅ No errors in console

## Test 2: PWA Manifest

**Steps:**
1. Open DevTools → Application → Manifest
2. Check all fields are populated

**Expected:**
- ✅ Name: "PowerWrite - AI Book Generator"
- ✅ Short name: "PowerWrite"
- ✅ Icons: 10 icons listed
- ✅ Theme color: #fbbf24
- ✅ Display: standalone

## Test 3: Install Prompt (Desktop)

**Steps:**
1. Visit app in Chrome/Edge
2. Wait 3 seconds
3. Look for install banner at top

**Expected:**
- ✅ Yellow banner appears
- ✅ Shows "Install PowerWrite" message
- ✅ Lists 3 benefits
- ✅ Has "Install Now" and "Maybe Later" buttons

**Test Actions:**
- Click "Maybe Later" → Banner dismisses
- Refresh page → Banner doesn't show immediately
- Click "Don't show again" → Banner won't show again

## Test 4: Manual Install

**Steps:**
1. Click hamburger menu (☰) on mobile or menu button
2. Look for "Install App" option
3. Click it

**Expected:**
- ✅ Modal opens with instructions
- ✅ Shows platform-specific steps
- ✅ Has "Got It" button
- ✅ Modal closes on button click

## Test 5: Mobile Navigation

**Mobile Only - Steps:**
1. Open app on mobile device or resize browser to < 768px
2. Check bottom of screen

**Expected:**
- ✅ Bottom navigation bar visible
- ✅ 4 tabs: Home, Studio, Library, Menu
- ✅ Active tab highlighted in yellow
- ✅ Clicking tabs navigates correctly
- ✅ Icons and labels visible

## Test 6: Hamburger Menu

**Steps:**
1. Click Menu tab (bottom nav) or hamburger icon
2. Menu slides in from right

**Expected:**
- ✅ Menu opens with backdrop
- ✅ Shows PowerWrite logo and version
- ✅ Lists menu items:
  - Theme toggle
  - Install App (if not installed)
  - About PowerWrite
  - Help & Support
  - Settings
  - Clear Cache
- ✅ Clicking backdrop closes menu
- ✅ X button closes menu

## Test 7: Theme Toggle

**Steps:**
1. Open hamburger menu
2. Click "Light Mode" or "Dark Mode"

**Expected:**
- ✅ Theme changes immediately
- ✅ All pages respect theme
- ✅ Theme persists on refresh
- ✅ Menu item updates (Sun/Moon icon)

## Test 8: Offline Detection

**Steps:**
1. Open DevTools → Network tab
2. Set throttling to "Offline"
3. Refresh page

**Expected:**
- ✅ Red banner appears: "You're offline"
- ✅ App still loads (from cache)
- ✅ Can navigate cached pages
- ✅ Generate buttons disabled

**Test Online Restoration:**
1. Set throttling back to "Online"
2. Wait a moment

**Expected:**
- ✅ Green banner appears: "You're back online!"
- ✅ Banner auto-dismisses after 3 seconds
- ✅ Generate buttons re-enabled

## Test 9: Book Caching

**Steps:**
1. Go to Library
2. Click on a book to view it
3. Open DevTools → Application → IndexedDB
4. Check "powerwrite-offline" database

**Expected:**
- ✅ Database created
- ✅ "books" store contains book data
- ✅ Book includes full content
- ✅ Cover image cached

**Test Offline Access:**
1. Go offline (Network tab → Offline)
2. Navigate to Library
3. Click the same book

**Expected:**
- ✅ Book loads from cache
- ✅ All content visible
- ✅ Cover image displays
- ✅ Offline badge visible

## Test 10: Responsive Design

### Mobile (< 768px)

**Home Page:**
- ✅ Logo smaller
- ✅ Search bar full width
- ✅ Category dropdown full width
- ✅ 2-column book grid
- ✅ Bottom navigation visible

**Studio Page:**
- ✅ Horizontal tab scroll
- ✅ Full-width forms
- ✅ Floating action buttons
- ✅ Mobile header compact

**Library Page:**
- ✅ Filters stack vertically
- ✅ 2-column stats grid
- ✅ 1-2 column book grid
- ✅ Touch-friendly cards

### Tablet (768px - 1024px)

- ✅ 3-column grids
- ✅ Side-by-side layouts
- ✅ No bottom navigation
- ✅ Regular header

### Desktop (> 1024px)

- ✅ Full sidebar navigation
- ✅ Multi-column layouts
- ✅ All features visible
- ✅ Hover effects work

## Test 11: Touch Targets (Mobile)

**Steps:**
1. Open app on mobile
2. Try tapping all interactive elements

**Expected:**
- ✅ All buttons at least 44x44px
- ✅ Easy to tap without mistakes
- ✅ No accidental taps
- ✅ Proper spacing between elements

## Test 12: Cache Management

**Steps:**
1. Open hamburger menu
2. Click "Clear Cache"
3. Confirm action

**Expected:**
- ✅ Confirmation dialog appears
- ✅ Clicking "OK" clears cache
- ✅ Success message shows
- ✅ IndexedDB cleared
- ✅ Service worker cache cleared

## Test 13: Install Flow (Full)

### Desktop Chrome

**Steps:**
1. Visit app (not installed)
2. Wait for install banner
3. Click "Install Now"
4. Browser shows install prompt
5. Click "Install"

**Expected:**
- ✅ App opens in new window
- ✅ No browser UI (address bar, etc.)
- ✅ App icon in taskbar/dock
- ✅ Can find in applications

### iOS Safari

**Steps:**
1. Visit app in Safari
2. Tap Share button
3. Tap "Add to Home Screen"
4. Tap "Add"

**Expected:**
- ✅ Icon appears on home screen
- ✅ Tapping opens app fullscreen
- ✅ No Safari UI visible
- ✅ Status bar matches theme

### Android Chrome

**Steps:**
1. Visit app in Chrome
2. Tap menu (⋮)
3. Tap "Install app"
4. Tap "Install"

**Expected:**
- ✅ App appears in app drawer
- ✅ Opens fullscreen
- ✅ No browser UI
- ✅ Can add to home screen

## Test 14: Performance

**Steps:**
1. Open DevTools → Lighthouse
2. Run audit (Mobile)
3. Check PWA category

**Expected:**
- ✅ PWA score > 90
- ✅ All PWA checks pass:
  - Installable
  - Service worker registered
  - Works offline
  - Themed
  - Viewport configured
  - Icons provided

## Test 15: Network Resilience

**Steps:**
1. Start browsing app
2. Toggle offline/online repeatedly
3. Try various actions

**Expected:**
- ✅ App handles transitions gracefully
- ✅ No crashes or errors
- ✅ Appropriate messages shown
- ✅ Queued requests retry when online

## Common Issues & Fixes

### Service Worker Not Registering

**Issue:** Console shows registration error
**Fix:**
- Check sw.js exists in /public
- Verify HTTPS (or localhost)
- Clear browser cache
- Hard refresh (Cmd+Shift+R)

### Install Prompt Not Showing

**Issue:** No install banner appears
**Fix:**
- Wait 3 seconds after page load
- Check localStorage for dismissal
- Verify manifest.json is valid
- Check browser support

### Offline Mode Not Working

**Issue:** App doesn't work offline
**Fix:**
- Verify service worker is active
- Check cache storage in DevTools
- Ensure assets are cached
- Try clearing and re-caching

### Mobile Navigation Missing

**Issue:** Bottom nav not visible
**Fix:**
- Check screen width < 768px
- Verify CSS is loading
- Check z-index conflicts
- Inspect element in DevTools

### Theme Not Persisting

**Issue:** Theme resets on refresh
**Fix:**
- Check localStorage access
- Verify theme script in <head>
- Check for console errors
- Clear browser data

## Browser-Specific Tests

### Chrome/Edge
- ✅ Install from address bar
- ✅ Install from menu
- ✅ Install from banner
- ✅ Offline works perfectly

### Firefox
- ✅ Service worker works
- ✅ Offline caching works
- ✅ Install may not be available
- ✅ Can add to home screen (mobile)

### Safari (iOS)
- ✅ Add to Home Screen works
- ✅ Fullscreen mode works
- ✅ Service worker supported
- ✅ May need manual refresh

### Samsung Internet
- ✅ Install works
- ✅ Offline works
- ✅ All features supported
- ✅ Good performance

## Automated Testing (Future)

```bash
# Run PWA tests
npm run test:pwa

# Check manifest
npm run validate:manifest

# Test service worker
npm run test:sw

# Lighthouse CI
npm run lighthouse
```

## Deployment Testing

### Before Deploying

- [ ] All tests pass locally
- [ ] No console errors
- [ ] Service worker updates properly
- [ ] Manifest is valid
- [ ] Icons are optimized
- [ ] HTTPS enabled

### After Deploying

- [ ] Visit production URL
- [ ] Test install on real devices
- [ ] Verify offline works
- [ ] Check Lighthouse score
- [ ] Test on multiple browsers
- [ ] Verify analytics (if enabled)

## Success Criteria

All tests should pass with these results:

- ✅ Service worker registered and active
- ✅ Manifest valid and complete
- ✅ Install prompts work on all platforms
- ✅ Offline mode functional
- ✅ Mobile navigation works
- ✅ Responsive on all screen sizes
- ✅ Touch targets adequate
- ✅ Theme persists
- ✅ Cache management works
- ✅ Lighthouse PWA score > 90

---

**Testing Date:** _____________
**Tester:** _____________
**Browser/Device:** _____________
**Results:** Pass / Fail
**Notes:** _____________

