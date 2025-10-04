# Electron Desktop App Setup Guide

This guide explains how to package MedExtract as a native desktop application for Windows, macOS, and Linux.

## Why Electron?

✅ **Works offline** - No internet required after installation  
✅ **Better security** - Medical data stays local  
✅ **Native performance** - Faster PDF processing  
✅ **Professional** - Installable .exe, .dmg, .AppImage files  
✅ **Desktop integration** - File associations, system tray, notifications  

## Prerequisites

- Node.js 18+ and npm installed
- Git installed
- For macOS builds: macOS computer with Xcode
- For Windows builds: Windows computer (or Wine on Linux/Mac)

## Installation

### 1. Install Electron Dependencies

```bash
npm install --save-dev electron electron-builder
npm install --save-dev @types/electron electron-is-dev
```

The configuration files are already created in the project:
- `electron/main.ts` - Main Electron process
- `electron/preload.ts` - Secure preload script
- `electron-builder.config.js` - Build configuration
- `vite.config.electron.ts` - Electron-specific Vite config

### 2. Add Build Scripts

Add these to your `package.json` scripts:

```json
{
  "scripts": {
    "electron:dev": "vite --config vite.config.electron.ts & electron .",
    "electron:build": "vite build --config vite.config.electron.ts && electron-builder",
    "electron:build:win": "vite build --config vite.config.electron.ts && electron-builder --win",
    "electron:build:mac": "vite build --config vite.config.electron.ts && electron-builder --mac",
    "electron:build:linux": "vite build --config vite.config.electron.ts && electron-builder --linux",
    "electron:build:all": "vite build --config vite.config.electron.ts && electron-builder -mwl"
  }
}
```

Also add to `package.json`:

```json
{
  "main": "electron/main.ts",
  "author": "Your Name",
  "description": "Clinical Data Extraction System"
}
```

## Development

### Run in Development Mode

```bash
npm run electron:dev
```

This will:
1. Start Vite dev server with HMR
2. Launch Electron window
3. Auto-reload on code changes

### Development Tips

- Electron DevTools are available (Cmd/Ctrl + Shift + I)
- Console logs appear in the terminal (main process) and DevTools (renderer)
- Changes to React code hot-reload automatically
- Changes to `electron/main.ts` require app restart

## Building for Production

### Build for Current Platform

```bash
npm run electron:build
```

This creates:
- **Windows**: `.exe` installer in `dist/`
- **macOS**: `.dmg` installer in `dist/`
- **Linux**: `.AppImage` in `dist/`

### Build for Specific Platform

```bash
# Windows only
npm run electron:build:win

# macOS only
npm run electron:build:mac

# Linux only
npm run electron:build:linux

# All platforms (requires additional setup)
npm run electron:build:all
```

### Build Artifacts

After building, find installers in the `dist/` folder:

```
dist/
├── MedExtract-1.0.0.exe          # Windows installer
├── MedExtract-1.0.0.dmg          # macOS installer
├── MedExtract-1.0.0.AppImage     # Linux executable
└── win-unpacked/                 # Unpacked Windows files
```

## Configuration

### App Icon

Replace the default icons:

```
build/
├── icon.ico          # Windows icon (256x256)
├── icon.png          # Linux icon (512x512)
└── icon.icns         # macOS icon
```

Use a tool like https://www.icoconverter.com/ to create icons from a PNG.

### App Metadata

Edit `electron-builder.config.js`:

```javascript
module.exports = {
  appId: 'com.yourcompany.medextract',
  productName: 'MedExtract',
  copyright: 'Copyright © 2025 Your Company',
  // ... other settings
}
```

### Environment Variables

For Electron, configure Supabase in `electron/main.ts`:

```typescript
// Option 1: Hardcode (for local deployment only)
process.env.VITE_SUPABASE_URL = 'https://your-project.supabase.co'
process.env.VITE_SUPABASE_PUBLISHABLE_KEY = 'your_key'

// Option 2: Load from external config file
const config = require('./config.json')
process.env.VITE_SUPABASE_URL = config.supabaseUrl
```

Create `config.json` (gitignored):
```json
{
  "supabaseUrl": "https://your-project.supabase.co",
  "supabaseKey": "your_publishable_key"
}
```

## Advanced Features

### Auto-Updates

Enable automatic updates for production:

```bash
npm install electron-updater
```

Add to `electron/main.ts`:

```typescript
import { autoUpdater } from 'electron-updater'

app.on('ready', () => {
  autoUpdater.checkForUpdatesAndNotify()
})
```

Configure in `electron-builder.config.js`:

```javascript
module.exports = {
  publish: [{
    provider: 'github',
    owner: 'your-username',
    repo: 'medextract'
  }]
}
```

### Native Menus

Add custom application menu in `electron/main.ts`:

```typescript
import { Menu } from 'electron'

const menu = Menu.buildFromTemplate([
  {
    label: 'File',
    submenu: [
      { label: 'Open PDF', click: () => { /* ... */ } },
      { label: 'Export Data', click: () => { /* ... */ } },
      { type: 'separator' },
      { role: 'quit' }
    ]
  },
  {
    label: 'Edit',
    submenu: [
      { role: 'undo' },
      { role: 'redo' },
      { type: 'separator' },
      { role: 'cut' },
      { role: 'copy' },
      { role: 'paste' }
    ]
  }
])

Menu.setApplicationMenu(menu)
```

### File Dialog Integration

Open files using native dialogs:

```typescript
import { dialog } from 'electron'

ipcMain.handle('open-pdf', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'PDF', extensions: ['pdf'] }]
  })
  return result.filePaths[0]
})
```

### System Tray

Add system tray icon:

```typescript
import { Tray } from 'electron'

let tray: Tray | null = null

app.on('ready', () => {
  tray = new Tray('path/to/icon.png')
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Show App', click: () => mainWindow?.show() },
    { label: 'Quit', click: () => app.quit() }
  ])
  tray.setContextMenu(contextMenu)
})
```

## Distribution

### Code Signing (Recommended)

For production distribution, sign your app:

**Windows:**
```bash
# Get a code signing certificate
# Set environment variables
set CSC_LINK=path/to/certificate.pfx
set CSC_KEY_PASSWORD=your_password
npm run electron:build:win
```

**macOS:**
```bash
# Join Apple Developer Program ($99/year)
# Set environment variables
export APPLE_ID=your@email.com
export APPLE_ID_PASSWORD=app-specific-password
npm run electron:build:mac
```

### Distributing to Users

1. **Direct Download**
   - Host `.exe`, `.dmg`, `.AppImage` on your website
   - Users download and install manually

2. **GitHub Releases**
   - Upload installers to GitHub Releases
   - Users download from GitHub
   - Supports auto-updates

3. **Microsoft Store / Mac App Store**
   - Requires developer accounts
   - More complex submission process
   - Better discoverability

4. **Snapcraft (Linux)**
   ```bash
   npm install --save-dev electron-builder-snapcraft
   ```

## Troubleshooting

### Build Errors

**"Cannot find module 'electron'"**
```bash
npm install --save-dev electron
```

**"electron-builder: command not found"**
```bash
npm install --save-dev electron-builder
```

**"Code signing failed"**
- Ensure certificates are properly configured
- Try building without signing first (unsigned apps work but show warnings)

### Runtime Issues

**Blank window**
- Check Developer Tools console (Cmd/Ctrl + Shift + I)
- Verify Vite build succeeded (`dist-electron/` folder exists)
- Check `electron/main.ts` loadURL path

**PDF not loading**
- Ensure PDF.js workers are bundled
- Check Content Security Policy in index.html
- Verify file paths are correct

**Supabase connection fails**
- Verify environment variables are set
- Check network connectivity
- Ensure Supabase URL/keys are correct

### Performance Issues

**Slow startup**
- Optimize bundle size (check `vite.config.electron.ts`)
- Use lazy loading for heavy components
- Enable `asar` compression in electron-builder

**High memory usage**
- Limit PDF cache size
- Close unused windows
- Profile with Chrome DevTools

## Security Best Practices

✅ **Enable context isolation** (already set in `electron/main.ts`)  
✅ **Use preload script** for secure IPC (already configured)  
✅ **Disable Node.js in renderer** unless absolutely needed  
✅ **Validate all IPC messages** in main process  
✅ **Keep Electron updated** for security patches  
✅ **Sign your app** before distribution  
✅ **Use HTTPS only** for external requests  

## File Structure

```
medextract/
├── electron/
│   ├── main.ts              # Main process entry
│   └── preload.ts           # Secure preload script
├── dist-electron/           # Built Electron files
├── build/                   # Icons and resources
│   ├── icon.ico
│   ├── icon.png
│   └── icon.icns
├── electron-builder.config.js
├── vite.config.electron.ts
└── package.json
```

## Testing

### Manual Testing

1. Test all extraction workflows
2. Verify PDF upload/viewing
3. Test data export (CSV, Excel, JSON)
4. Check offline functionality
5. Test file dialogs and native features

### Automated Testing

Use Spectron or Playwright for Electron:

```bash
npm install --save-dev spectron
```

## CI/CD Pipeline

### GitHub Actions

Create `.github/workflows/electron-build.yml`:

```yaml
name: Build Electron App

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [windows-latest, macos-latest, ubuntu-latest]
    
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      
      - run: npm install
      - run: npm run electron:build
      
      - uses: actions/upload-artifact@v3
        with:
          name: ${{ matrix.os }}-installer
          path: dist/*.{exe,dmg,AppImage}
```

## Resources

- [Electron Documentation](https://www.electronjs.org/docs)
- [Electron Builder](https://www.electron.build/)
- [Vite Electron Plugin](https://github.com/electron-vite/vite-plugin-electron)
- [Electron Security Checklist](https://www.electronjs.org/docs/tutorial/security)

## Support

For issues:
1. Check console logs (main + renderer)
2. Review Electron Builder logs
3. Search GitHub issues
4. Ask on Electron Discord

## Next Steps

1. ✅ Install Electron dependencies
2. ✅ Test in development mode
3. ✅ Configure app metadata and icons
4. ✅ Build for your platform
5. ✅ Test the installer
6. ✅ Set up code signing
7. ✅ Distribute to users
