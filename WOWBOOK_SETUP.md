# WowBook Integration - Setup Instructions

## ✅ Code Changes Complete

The following files have been updated:

- ✅ `package.json` - Removed StPageFlip, added jQuery
- ✅ `src/components/WowBook.jsx` - New component with preloading
- ✅ `src/App.jsx` - Updated to use WowBook
- ✅ `src/index.css` - Updated styles for WowBook
- ✅ `index.html` - Added WowBook script/CSS references

## 📦 Required Assets

You need to download WowBook library files and add them to your project:

### 1. Download WowBook

Get WowBook from: https://github.com/yapro/wowbook

Or download directly:
- wowbook.min.js
- wowbook.css
- jquery.min.js (or use CDN)

### 2. Create Directory Structure

```
/public/wowbook/
  ├── jquery.min.js
  ├── wowbook.min.js
  └── wowbook.css
```

### 3. Add Files

Place the following files in `/public/wowbook/`:

**jquery.min.js**
- Download from: https://code.jquery.com/jquery-3.7.1.min.js
- Save as: `/public/wowbook/jquery.min.js`

**wowbook.min.js**
- Download from WowBook GitHub repo
- Save as: `/public/wowbook/wowbook.min.js`

**wowbook.css**
- Download from WowBook GitHub repo  
- Save as: `/public/wowbook/wowbook.css`

## 🚀 Install & Run

```bash
# Install new dependencies (jQuery)
npm install

# Start dev server
npm run dev
```

## 📄 Image Format

Your images should be in:
```
/public/pages/1.png
/public/pages/2.png
...
/public/pages/52.png
```

## 🎯 Features

✅ **FlipHTML5-like experience:**
- Stacked pages with realistic curl
- Hard covers
- Gutter shadows
- Smooth 900ms flip animation
- Responsive design
- Mobile optimized

✅ **Preserved features:**
- Page counter at bottom center
- QR code toggle
- Loading screen with progress
- Cover page (separate from flipbook)

## 🔧 Configuration

Edit `/src/components/WowBook.jsx` to customize:

```javascript
const PAGE_COUNT = 52; // Number of pages

// WowBook settings
height: 600,
width: 900,
flipDuration: 900,
elevation: 60,
// ... more options
```

## 📱 Mobile Support

WowBook is fully responsive and works on:
- Desktop browsers
- Mobile Safari (iOS)
- Chrome/Firefox mobile
- Tablets

## ⚠️ Important Notes

1. **WowBook requires jQuery** - Loaded via script tag in index.html
2. **Images must be preloaded** - Already implemented in WowBook.jsx
3. **Library loads async** - Component waits for WowBook to be available
4. **Remove old FlipBook component** - Can delete `/src/components/FlipBook.jsx`

## 🎨 Styling

WowBook appearance is controlled by:
- `/public/wowbook/wowbook.css` (library styles)
- `/src/index.css` (custom page styles)
- WowBook init options (shadows, elevation, etc.)

## 🐛 Troubleshooting

**WowBook not loading?**
- Check browser console for errors
- Verify files exist in `/public/wowbook/`
- Check file paths in `index.html`

**Images not showing?**
- Verify images are in `/public/pages/`
- Check PAGE_COUNT matches number of images
- Open Network tab to see failed requests

**jQuery conflicts?**
- WowBook expects global jQuery ($)
- Loaded via script tag, not NPM module
- Imported in WowBook.jsx with `import $ from 'jquery'`

---

## Alternative: Use CDN (Quick Test)

To test quickly without downloading files, update `index.html`:

```html
<!-- jQuery CDN -->
<script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>

<!-- WowBook - you'll need to host this yourself -->
<link rel="stylesheet" href="/wowbook/wowbook.css" />
<script src="/wowbook/wowbook.min.js"></script>
```

You still need to download wowbook.min.js and wowbook.css from GitHub.
