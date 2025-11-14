# PowerWrite PWA Guide

## Overview

PowerWrite is now a fully-functional Progressive Web App (PWA) that works seamlessly across desktop, tablet, and mobile devices. This guide explains all PWA features and how to use them.

## What is a PWA?

A Progressive Web App combines the best of web and native apps. PowerWrite can now:
- ✅ Be installed on your device like a native app
- ✅ Work offline for reading cached books
- ✅ Load faster with intelligent caching
- ✅ Provide a native app-like experience
- ✅ Send notifications (future feature)
- ✅ Access from your home screen

## Installation

### Desktop (Chrome, Edge, Brave)

1. Visit PowerWrite in your browser
2. Look for the install icon (⊕) in the address bar
3. Click "Install" when prompted
4. PowerWrite will open as a standalone app
5. Find it in your applications menu

**Alternative:**
- Click the menu (⋮) → "Install PowerWrite"
- Or use the "Install App" button in the hamburger menu

### iOS (Safari)

1. Open PowerWrite in Safari
2. Tap the Share button (□↑) at the bottom
3. Scroll down and tap "Add to Home Screen"
4. Tap "Add" in the top right
5. PowerWrite appears on your home screen

### Android (Chrome, Firefox)

1. Open PowerWrite in your browser
2. Tap the menu (⋮) in the top right
3. Tap "Install app" or "Add to Home screen"
4. Tap "Install" to confirm
5. PowerWrite appears in your app drawer

## Features

### 1. Offline Reading

**What Works Offline:**
- Read your last 10 viewed books
- Browse your cached library
- View book details and chapters
- Access the app interface
- Export cached books

**What Requires Internet:**
- Generating new books
- Creating outlines
- Searching for reference books
- Generating covers
- Syncing with server

**How It Works:**
- Books are automatically cached when you view them
- The app stores up to 10 recently viewed books
- Offline indicator appears when disconnected
- Cached books have an offline badge

### 2. Mobile Navigation

**Bottom Navigation Bar (Mobile Only):**
- 🏠 Home - Browse reference books
- ✍️ Studio - Create new books
- 📚 Library - View your books
- ☰ Menu - Settings and options

**Hamburger Menu:**
- Theme toggle (Light/Dark mode)
- Install app button
- About PowerWrite
- Help & Support
- Settings
- Clear cache

### 3. Responsive Design

**Mobile Optimizations:**
- Touch-friendly buttons (44x44px minimum)
- Horizontal scrolling for tabs
- Collapsible sections
- Floating action buttons
- Optimized grids (2 columns on mobile)
- Bottom padding for navigation

**Tablet Optimizations:**
- 3-column grids
- Side-by-side layouts
- Expanded navigation
- Better use of screen space

**Desktop:**
- Full sidebar navigation
- Multi-column layouts
- All features visible
- Keyboard shortcuts ready

### 4. Install Prompts

**Auto-Prompt:**
- Shows on first visit after 3 seconds
- Explains PWA benefits
- Can be dismissed or postponed
- Won't show again if dismissed permanently

**Manual Install:**
- Available in hamburger menu
- Shows platform-specific instructions
- Works on all devices
- Includes visual guides

### 5. Caching Strategy

**Static Assets:**
- App shell cached immediately
- Icons and manifest cached
- Offline page available
- Updates in background

**Dynamic Content:**
- Books cached on view
- API responses cached
- Images cached progressively
- Old cache cleaned automatically

**Cache Management:**
- Maximum 10 books cached
- Oldest books removed first
- Manual cache clearing available
- Cache size displayed in settings

## Usage Tips

### For Best Performance

1. **Install the App:**
   - Faster loading times
   - Better offline experience
   - Native app feel

2. **Cache Important Books:**
   - View books you want offline
   - They'll be cached automatically
   - Check offline badge in library

3. **Clear Cache Periodically:**
   - Menu → Clear Cache
   - Frees up storage space
   - Removes old cached data

4. **Use on Stable Connection:**
   - Generate books on WiFi
   - Large operations use data
   - Check data usage warnings

### Keyboard Shortcuts (Desktop)

- `Ctrl/Cmd + K` - Search books (coming soon)
- `Ctrl/Cmd + N` - New book (coming soon)
- `Ctrl/Cmd + L` - Go to library (coming soon)

### Touch Gestures (Mobile)

- Swipe left/right - Navigate chapters (coming soon)
- Pull to refresh - Update library (coming soon)
- Long press - Quick actions (coming soon)

## Troubleshooting

### Installation Issues

**"Install" button not showing:**
- Ensure you're using a supported browser
- Check if already installed
- Try refreshing the page
- Clear browser cache

**iOS Safari not showing option:**
- Must use Safari (not Chrome/Firefox)
- Look for Share button (□↑)
- Scroll down in share menu
- Option is "Add to Home Screen"

**Android install fails:**
- Check storage space
- Update browser to latest version
- Try different browser
- Restart device

### Offline Issues

**Books not available offline:**
- Must view book first to cache
- Check cache limit (10 books max)
- Verify offline indicator shows
- Try clearing and re-caching

**Offline indicator stuck:**
- Check actual internet connection
- Refresh the page
- Clear service worker cache
- Restart app

**Can't generate books offline:**
- This is expected behavior
- AI generation requires internet
- Wait for connection to restore
- Requests will queue automatically

### Performance Issues

**App loading slowly:**
- Clear cache in menu
- Check internet speed
- Restart the app
- Reinstall if needed

**High data usage:**
- Use WiFi for generation
- Cache books on WiFi
- Check data saver mode
- Limit reference books

**Storage filling up:**
- Clear cache regularly
- Limit cached books
- Export and delete old books
- Check browser storage

## Technical Details

### Browser Support

**Full Support:**
- Chrome 90+ (Desktop & Mobile)
- Edge 90+
- Safari 15+ (iOS & macOS)
- Firefox 90+
- Samsung Internet 14+

**Partial Support:**
- Older browsers (basic features only)
- Some features may not work
- Install may not be available

### Storage Limits

**Cache Storage:**
- Service Worker: ~50MB
- IndexedDB: ~100MB per book
- Total: Varies by browser
- Automatic cleanup enabled

**What's Stored:**
- Recently viewed books (10 max)
- Book covers and images
- Static app assets
- User preferences
- Offline queue

### Privacy & Security

**Data Storage:**
- All data stored locally
- No tracking cookies
- Secure HTTPS only
- Cache encrypted by browser

**Permissions:**
- No location access
- No camera/microphone
- No contacts access
- Optional notifications (future)

## Updates

### Automatic Updates

- App checks for updates on load
- New version downloaded in background
- Prompt to reload when ready
- No data loss during update

### Manual Updates

1. Close all PowerWrite tabs/windows
2. Reopen PowerWrite
3. App will check for updates
4. Reload if prompted

### Version History

**v1.0.0 (Current)**
- Initial PWA release
- Offline reading support
- Mobile responsive design
- Install prompts
- Bottom navigation
- Cache management

## Support

### Getting Help

- **Documentation:** Check this guide first
- **Help Menu:** In-app help section
- **Issues:** Report bugs via GitHub
- **Email:** support@powerwrite.app (coming soon)

### Known Issues

1. iOS Safari may require manual refresh after install
2. Some Android browsers show duplicate install prompts
3. Offline mode doesn't support AI generation
4. Cache size varies by browser

### Planned Features

- 🔄 Background sync for failed requests
- 📱 Push notifications for book completion
- 🎨 Customizable themes
- ⌨️ Keyboard shortcuts
- 👆 Touch gestures
- 🔍 Advanced search
- 📊 Analytics dashboard
- 🌐 Multi-language support

## FAQ

**Q: Do I need to install the app?**
A: No, but it provides a better experience with offline support and faster loading.

**Q: How much storage does it use?**
A: Approximately 50-150MB depending on cached books.

**Q: Can I use it completely offline?**
A: You can read cached books offline, but generating new books requires internet.

**Q: Will my data sync across devices?**
A: Currently, data is stored locally. Cloud sync coming soon.

**Q: How do I uninstall?**
A: Desktop: Right-click app icon → Uninstall. Mobile: Long-press icon → Remove.

**Q: Does it work on all browsers?**
A: Works best on Chrome, Edge, Safari, and Firefox. Some features may not work on older browsers.

**Q: Can I use it on multiple devices?**
A: Yes, but data doesn't sync automatically yet.

**Q: Is my data safe?**
A: Yes, all data is stored locally on your device with browser-level encryption.

---

## Quick Reference

### Essential Commands

- **Install App:** Menu → Install App
- **Clear Cache:** Menu → Clear Cache
- **Toggle Theme:** Menu → Light/Dark Mode
- **View Offline Books:** Library → Look for offline badge
- **Check Cache Size:** Menu → Settings (coming soon)

### Support Contacts

- GitHub: github.com/powerwrite
- Email: support@powerwrite.app
- Twitter: @powerwrite
- Discord: discord.gg/powerwrite

---

**Last Updated:** November 2025
**Version:** 1.0.0
**Platform:** Web (PWA)

