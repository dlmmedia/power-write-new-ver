# PWA Install Banner Testing Guide

## Testing in Incognito Mode

### Chrome/Edge Incognito

1. **Open Incognito Window:**
   - Chrome: `Ctrl+Shift+N` (Windows) or `Cmd+Shift+N` (Mac)
   - Edge: Same shortcuts

2. **Navigate to App:**
   ```
   http://localhost:3000
   ```

3. **Open DevTools Console:**
   - Press `F12` or `Cmd+Option+I`
   - Go to Console tab

4. **Watch for Logs:**
   You should see these console messages:
   ```
   [InstallBanner] Should show banner: true
   [InstallBanner] Is installed: false
   [InstallBanner] localStorage dismissed: null
   [InstallBanner] localStorage dont-show: null
   [PWA] Showing banner: All checks passed
   [InstallBanner] Banner will show in 3 seconds...
   ```

5. **Wait 3 Seconds:**
   - After 3 seconds, you should see:
   ```
   [InstallBanner] Showing banner now!
   ```
   - The yellow banner should appear at the top

### Expected Behavior

**✅ Banner SHOULD Show When:**
- First visit (no localStorage data)
- Incognito mode (fresh session)
- App not installed
- Not dismissed in last 7 days

**❌ Banner SHOULD NOT Show When:**
- App already installed (standalone mode)
- User clicked "Don't show again"
- User dismissed in last 7 days
- Running as installed PWA

## Troubleshooting

### Banner Not Showing in Incognito

**Check Console Logs:**

1. If you see `[PWA] Not showing banner: App already installed`:
   - You're running the installed PWA, not the browser version
   - Close the PWA and open in regular browser

2. If you see `[PWA] localStorage access error`:
   - This is normal in some incognito modes
   - Banner should still show (we handle this error)

3. If you see nothing in console:
   - Component might not be mounting
   - Check if PWALayout is included in Providers
   - Verify no JavaScript errors

### Manual Testing

**Force Show Banner (in Console):**
```javascript
// Clear all localStorage
localStorage.clear();

// Reload page
window.location.reload();
```

**Check if Banner Component is Mounted:**
```javascript
// In console
document.querySelector('.animate-slide-down');
// Should return the banner element or null
```

**Check Install State:**
```javascript
// In console
window.matchMedia('(display-mode: standalone)').matches;
// Should return false if in browser, true if installed
```

## Testing Different Scenarios

### Scenario 1: First Visit (Incognito)
```bash
1. Open incognito window
2. Visit http://localhost:3000
3. Wait 3 seconds
4. ✅ Banner should appear
```

### Scenario 2: After Dismissing "Maybe Later"
```bash
1. Click "Maybe Later" on banner
2. Reload page
3. Wait 3 seconds
4. ❌ Banner should NOT appear (dismissed for 7 days)
```

### Scenario 3: After "Don't Show Again"
```bash
1. Click "Don't show again" on banner
2. Reload page
3. ❌ Banner should NEVER appear again
4. To reset: localStorage.clear() in console
```

### Scenario 4: Installed PWA
```bash
1. Install the app
2. Open installed app
3. ❌ Banner should NOT appear
4. Open in browser again
5. ✅ Banner should appear in browser
```

## Quick Reset (For Testing)

**In Browser Console:**
```javascript
// Reset all PWA preferences
localStorage.removeItem('pwa-install-dismissed');
localStorage.removeItem('pwa-install-dont-show');
localStorage.removeItem('pwa-install-last-shown');

// Reload
window.location.reload();
```

## Debug Mode

**Enable Verbose Logging:**
All console logs are already enabled. Look for:
- `[PWA]` - PWA utility functions
- `[InstallBanner]` - Banner component

**Check localStorage:**
```javascript
// In console
console.log('Dismissed:', localStorage.getItem('pwa-install-dismissed'));
console.log('Dont Show:', localStorage.getItem('pwa-install-dont-show'));
console.log('Last Shown:', localStorage.getItem('pwa-install-last-shown'));
```

## Expected Console Output (Incognito)

```
[InstallBanner] Should show banner: true
[InstallBanner] Is installed: false
[InstallBanner] localStorage dismissed: null
[InstallBanner] localStorage dont-show: null
[PWA] Showing banner: All checks passed
[InstallBanner] Banner will show in 3 seconds...
(wait 3 seconds)
[InstallBanner] Showing banner now!
```

## Common Issues

### Issue: "Banner shows but disappears immediately"
**Fix:** Check if there's a CSS z-index conflict

### Issue: "Console shows 'should show' but banner doesn't appear"
**Fix:** Check React state in DevTools, verify component is rendering

### Issue: "localStorage errors in incognito"
**Fix:** This is normal, we handle it with try-catch

### Issue: "Banner shows in regular mode but not incognito"
**Fix:** Some browsers restrict features in incognito, but banner should still work

## Verification Checklist

- [ ] Banner appears in incognito mode
- [ ] Banner appears after 3 seconds
- [ ] "Install Now" button is visible and clickable
- [ ] "Maybe Later" button is visible and clickable
- [ ] "Don't show again" link is visible and clickable
- [ ] Close (X) button works
- [ ] All text is readable (good contrast)
- [ ] Icons are visible
- [ ] Responsive on mobile (resize browser)
- [ ] Console logs show correct flow
- [ ] localStorage preferences work
- [ ] Banner doesn't show when installed

## Success Criteria

✅ **All checks pass when:**
1. Opening in incognito shows banner after 3s
2. Console logs show correct decision flow
3. All buttons work and are visible
4. Banner respects user preferences
5. Banner doesn't show when app is installed

---

**Need Help?**
- Check browser console for errors
- Verify service worker is registered
- Clear localStorage and try again
- Test in different browser

