# Hugging Face Spaces Deployment Guide

This guide explains how to deploy the MedExtract Clinical Data Extraction System to Hugging Face Spaces.

## Prerequisites

- Hugging Face account (free at https://huggingface.co)
- Node.js 18+ and npm installed locally
- Git installed
- Supabase project credentials

## Deployment Steps

### 1. Build the Application

```bash
# Install dependencies
npm install

# Build for production
npm run build
```

This creates a `dist/` folder with optimized static files.

### 2. Create a Hugging Face Space

1. Go to https://huggingface.co/spaces
2. Click **"Create new Space"**
3. Configure your Space:
   - **Space name**: `medextract-clinical-system` (or your choice)
   - **License**: Apache 2.0
   - **Space SDK**: Select **"Static HTML"**
   - **Visibility**: Choose Public or Private

4. Click **"Create Space"**

### 3. Configure Environment Variables

Your app needs Supabase credentials. In your Space settings:

1. Go to **Settings** → **Repository secrets**
2. Add these variables:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=your_publishable_anon_key
   VITE_SUPABASE_PROJECT_ID=your_project_id
   ```

> ⚠️ **Important**: Use the PUBLISHABLE key, not the secret service key!

### 4. Upload Files

#### Option A: Manual Upload (Easiest)

1. In your Space, click **"Files"** → **"Add file"** → **"Upload files"**
2. Upload ALL contents from the `dist/` folder:
   - `index.html`
   - All files in `assets/` folder
   - `robots.txt`
   - `_headers` (if exists)
3. Create a `README.md` file in the Space root:

```markdown
---
title: MedExtract Clinical Data Extraction
emoji: 🏥
colorFrom: blue
colorTo: green
sdk: static
pinned: false
---

# MedExtract Clinical Data Extraction System

AI-powered clinical data extraction from medical literature PDFs.

## Features
- 8-step extraction workflow
- PDF annotation and highlighting
- AI-assisted data extraction
- Export to CSV, Excel, JSON
```

4. Commit changes

#### Option B: Git Push (Recommended for updates)

```bash
# Clone your Space repository
git clone https://huggingface.co/spaces/YOUR_USERNAME/YOUR_SPACE_NAME
cd YOUR_SPACE_NAME

# Copy built files
cp -r ../dist/* .

# Create README.md with metadata (see Option A)
cat > README.md << 'EOF'
---
title: MedExtract Clinical Data Extraction
emoji: 🏥
colorFrom: blue
colorTo: green
sdk: static
pinned: false
---

# MedExtract Clinical Data Extraction System

AI-powered clinical data extraction from medical literature PDFs.
EOF

# Commit and push
git add .
git commit -m "Deploy MedExtract v1.0"
git push
```

### 5. Verify Deployment

1. Your Space URL will be: `https://huggingface.co/spaces/YOUR_USERNAME/YOUR_SPACE_NAME`
2. Wait 1-2 minutes for build to complete
3. Click **"App"** tab to see your live application

### 6. Configure Custom Domain (Optional)

Hugging Face doesn't natively support custom domains for Spaces, but you can:

1. Use a reverse proxy (Cloudflare, Nginx)
2. Set up DNS CNAME pointing to your Space URL
3. Configure SSL certificates

## Updating Your Deployment

### Quick Update Script

Save this as `deploy-to-huggingface.sh`:

```bash
#!/bin/bash

# Build the app
echo "Building application..."
npm run build

# Navigate to Space directory
cd huggingface-space

# Copy new build files
echo "Copying files..."
rm -rf assets index.html robots.txt
cp -r ../dist/* .

# Commit and push
echo "Deploying to Hugging Face..."
git add .
git commit -m "Update: $(date +'%Y-%m-%d %H:%M')"
git push

echo "✅ Deployment complete!"
```

Make it executable:
```bash
chmod +x deploy-to-huggingface.sh
```

Then deploy with:
```bash
./deploy-to-huggingface.sh
```

## Troubleshooting

### Blank Page or Loading Issues

1. **Check browser console** for errors
2. **Verify environment variables** are set correctly
3. **Check _headers file** for CORS configuration:
   ```
   /*
     Access-Control-Allow-Origin: *
     X-Frame-Options: DENY
     X-Content-Type-Options: nosniff
   ```

### Supabase Connection Errors

1. Verify your Supabase URL and keys
2. Check that your Supabase project allows requests from Hugging Face domain
3. Add `https://huggingface.co` to Supabase Auth allowed URLs

### Assets Not Loading

1. Ensure all files in `dist/assets/` were uploaded
2. Check that paths are relative (no leading `/`)
3. Verify `index.html` references correct asset paths

### PDF Viewer Not Working

1. PDF.js workers may need explicit path configuration
2. Check browser console for worker loading errors
3. Ensure `pdf.worker.min.js` is included in assets

## Production Considerations

### Security

- ✅ Only use publishable Supabase keys (never service keys)
- ✅ Enable Row Level Security (RLS) on all Supabase tables
- ✅ Configure CORS properly in `_headers`
- ✅ Use HTTPS only (Hugging Face provides this automatically)

### Performance

- Files are automatically cached by Hugging Face CDN
- Consider reducing PDF file size limits for faster uploads
- Optimize images before deployment

### Monitoring

- Check Space logs in Settings → Logs
- Monitor Supabase dashboard for usage metrics
- Set up error tracking (Sentry, LogRocket) if needed

## Cost

- ✅ Hugging Face Spaces: **Free** for public spaces
- ✅ Private spaces: Free tier available
- ⚠️ Supabase: Free tier includes 500MB database, 1GB storage

## Alternative: Docker Space (Advanced)

For more control, you can use a Docker Space:

1. Create `Dockerfile`:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
RUN npm install -g serve
CMD ["serve", "-s", "dist", "-l", "7860"]
EXPOSE 7860
```

2. Select **"Docker"** SDK when creating Space
3. Push code including Dockerfile

## Support

- Hugging Face Docs: https://huggingface.co/docs/hub/spaces
- Supabase Docs: https://supabase.com/docs
- Project Issues: [Your GitHub Repository]

## Next Steps

After deployment:
1. Test all features (upload, extraction, export)
2. Share your Space URL with users
3. Consider enabling authentication
4. Monitor usage and performance
5. Set up automated deployments via GitHub Actions
