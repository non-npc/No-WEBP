# Installation Guide - No WebP Extension

## Quick Start (3 minutes)

### Step 1: Load Extension in Chrome

1. **Open Chrome Extensions Page**
   - Type `chrome://extensions/` in the address bar and press Enter
   - OR click the three dots menu (⋮) → More tools → Extensions

2. **Enable Developer Mode**
   - Look for "Developer mode" toggle in the top-right corner
   - Click to enable it

3. **Load the Extension**
   - Click the "Load unpacked" button that appears
   - Navigate to and select the extension folder (the folder containing `manifest.json`)
   - Click "Select Folder" or "Open"

4. **Verify Installation**
   - The extension should now appear in your extensions list
   - You should see "No WebP - Original Image Formats"
   - The extension is now active and ready to use!

### Step 2: Pin Extension to Toolbar (Optional)

1. Click the puzzle piece icon in Chrome toolbar
2. Find "No WebP - Original Image Formats"
3. Click the pin icon to keep it visible

### Step 3: Configure Settings

1. **Open Options Page**
   - Right-click the extension icon → Click "Options"
   - OR go to `chrome://extensions/` → Find the extension → Click "Details" → Click "Extension options"

2. **Configure Settings**
   - ✅ Enable WebP/AVIF blocking (should be on by default)
   - ✅ Enable URL parameter rewriting (optional, recommended)
   - Add any sites to allowlist if needed (see below)

## Testing the Extension

### Quick Test

1. **Go to a WebP-heavy site**:
   - Google Images: https://images.google.com
   - Search for anything and view images

2. **Open Developer Tools** (F12)
   - Click "Network" tab
   - Filter by "Img"
   - Reload the page

3. **Verify Images**
   - Click on any image request
   - Check "Headers" → "Response Headers" → "Content-Type"
   - Should see `image/jpeg`, `image/png`, or `image/gif` (NOT `image/webp`)

### Test Right-Click Save

1. Right-click any image on a webpage
2. Select "Save image as original format"
3. Check the file extension - should be `.gif`, `.png`, or `.jpg`

## Troubleshooting

### Extension Not Working

**Problem**: Images still loading as WebP

**Solutions**:
1. **Check if enabled**: Open Options page and verify "Enable WebP/AVIF blocking" is ON
2. **Check allowlist**: Make sure the current site is not in the allowlist
3. **Reload the page**: The extension modifies requests, so reload the page after installing
4. **Check console**: Press F12, go to Console tab, look for errors
5. **Some sites force WebP**: Some CDNs only serve WebP with no fallback - this is a server limitation

### Permission Errors

**Problem**: "Required permissions" error

**Solution**:
1. When loading, Chrome will ask for permissions
2. Click "Accept" or "Allow" when prompted
3. The extension needs these permissions to modify network requests

### Context Menu Not Appearing

**Problem**: Right-click menu doesn't show "Save image as original format"

**Solutions**:
1. Make sure you're right-clicking directly on an image
2. Reload the extension: Go to `chrome://extensions/` → Click the refresh icon
3. Restart Chrome browser

## Advanced Configuration

### Adding Sites to Allowlist

Some sites only serve WebP with no fallback. If a site breaks with the extension:

1. Open Options page
2. Under "Site Allowlist", enter the domain (e.g., `example.com`)
3. Click "Add Domain"
4. Reload the problematic site

**Common allowlist candidates**:
- Sites with broken images when extension is active
- Sites that explicitly require WebP for functionality
- Your own websites if you're testing

### URL Rewriting

The "URL parameter rewriting" option removes URL parameters that force WebP:
- `fm=webp`
- `format=webp`
- `auto=webp`
- Similar parameters

**When to disable**:
- If you notice broken images
- If a site's CDN requires these parameters for functionality
- If you experience unexpected redirects

## Uninstalling

If you need to remove the extension:

1. Go to `chrome://extensions/`
2. Find "No WebP - Original Image Formats"
3. Click "Remove"
4. Confirm removal

Your settings are stored in Chrome Sync and will be removed with the extension.

## Getting Help

If you encounter issues:

1. Check the Console for error messages (F12 → Console)
2. Try disabling and re-enabling the extension
3. Try reloading the page with extension active
4. Check if the site is on the allowlist

## Update the Extension

If you download a new version:

1. Go to `chrome://extensions/`
2. Find the extension
3. Click the refresh icon (⟳) on the extension card
4. OR remove and re-load the extension folder

---

**Need More Help?**

- See `README.md` for technical details
- Review console logs for specific errors

