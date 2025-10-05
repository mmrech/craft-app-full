# Clinical Data Extraction System - Personal Use Version

This is a **personal use version** of the Clinical Data Extraction System with **all authentication removed**.

## ✅ What's Been Modified

### Authentication Removal
- ❌ **No Login Required** - App loads directly without authentication
- ❌ **No User Management** - Removed AuthProvider, login/signup pages
- ❌ **No Database Dependencies** - All data stored locally in browser

### Core Functionality Preserved  
- ✅ **PDF Upload & Display** - Load PDFs directly from your computer
- ✅ **Manual Text Extraction** - Click fields and highlight PDF text
- ✅ **8-Step Workflow** - Complete clinical data extraction process
- ✅ **Auto-save** - Progress automatically saved to localStorage
- ✅ **PDF Annotations** - Draw, highlight, and annotate PDFs (saved locally)
- ✅ **Form Validation** - Built-in validation for required fields
- ✅ **Export Data** - Export extracted data to CSV, Excel, or JSON

### Disabled Features
- ❌ **AI Extraction** - Requires external API (shows info message)
- ❌ **PDF Library** - No cloud storage (upload each session)
- ❌ **Cross-device Sync** - Data stays on your browser
- ❌ **User Accounts** - Single-user local operation only

## 🚀 How to Use

1. **Open the App** - No login required, starts immediately
2. **Upload PDF** - Click "Upload PDF" button and select your clinical study PDF  
3. **Extract Data** - Click form fields, then highlight relevant text in the PDF
4. **Navigate Steps** - Complete all 8 steps of the extraction workflow
5. **Export Results** - Use export buttons to save your extracted data

## 💾 Data Storage

- **Local Only** - All data stored in your browser's localStorage
- **No Cloud Sync** - Data doesn't leave your computer
- **Session Persistence** - Work continues between browser sessions  
- **Draft Recovery** - Automatic draft recovery if you close the browser

## 🔧 Technical Changes Made

- Replaced Supabase authentication with direct app loading
- Mock Supabase client prevents any network requests
- ExtractionContext uses localStorage instead of database
- PDF handling works with local file objects (no upload to cloud)
- Annotations saved to localStorage instead of database
- Removed UserMenu, DocumentLibrary, and auth-related components

## ⚠️ Limitations

- **Single Computer** - Data only available on this browser/computer
- **No Backup** - Clear browser data = lose all work
- **No AI Features** - Advanced AI extraction disabled
- **File Size Limits** - Subject to browser memory limits for large PDFs

## 📝 Perfect For

- Personal research projects
- Individual clinical data extraction tasks  
- Offline work environments
- Privacy-focused workflows (no data leaves your computer)
- Quick PDF analysis without account setup

---

**Status**: ✅ Ready for personal use - No authentication required!
