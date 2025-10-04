#!/bin/bash

# Hugging Face Deployment Script for MedExtract
# This script automates the deployment process to Hugging Face Spaces

set -e  # Exit on error

echo "🏥 MedExtract - Hugging Face Deployment Script"
echo "================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: package.json not found. Please run this script from the project root.${NC}"
    exit 1
fi

# Check if Space directory exists
if [ ! -d "huggingface-space" ]; then
    echo -e "${YELLOW}Hugging Face Space directory not found.${NC}"
    echo "Please clone your Space repository first:"
    echo "  git clone https://huggingface.co/spaces/YOUR_USERNAME/YOUR_SPACE_NAME huggingface-space"
    exit 1
fi

echo ""
echo "Step 1: Building application..."
echo "-------------------------------"
npm run build

if [ ! -d "dist" ]; then
    echo -e "${RED}Error: Build failed. dist/ directory not created.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Build completed successfully${NC}"

echo ""
echo "Step 2: Preparing files for deployment..."
echo "------------------------------------------"

# Navigate to Space directory
cd huggingface-space

# Backup README.md if it exists
if [ -f "README.md" ]; then
    echo "Backing up README.md..."
    cp README.md README.md.backup
fi

# Remove old files (except .git and README.md)
echo "Cleaning old files..."
find . -mindepth 1 -maxdepth 1 ! -name '.git' ! -name 'README.md' ! -name 'README.md.backup' -exec rm -rf {} +

# Copy new build files
echo "Copying new build files..."
cp -r ../dist/* .

# Ensure README.md has proper frontmatter
if [ ! -f "README.md" ] || ! grep -q "^---$" README.md; then
    echo "Creating README.md with frontmatter..."
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

## Features

- 📄 **PDF Processing**: Upload and annotate clinical research papers
- 🔍 **8-Step Extraction Workflow**: Structured data capture for:
  - Study identification
  - PICOT framework
  - Baseline characteristics
  - Imaging parameters
  - Interventions
  - Study arms
  - Outcomes
  - Complications
- 🤖 **AI-Assisted Extraction**: Optional AI extraction for faster data capture
- 📊 **Multi-Format Export**: CSV, Excel, and JSON export options
- 🎨 **Interactive Annotation**: Highlight and annotate PDF content
- ✅ **Data Validation**: Built-in validation for clinical data accuracy

## Technology Stack

- **Frontend**: React 18 + TypeScript + Vite
- **UI Components**: Radix UI + Tailwind CSS
- **PDF Processing**: PDF.js + react-pdf
- **Backend**: Supabase (Authentication, Database, Storage)
- **Deployment**: Hugging Face Spaces (Static)

## Usage

1. **Sign In**: Create an account or log in
2. **Upload PDF**: Upload a clinical research paper (PDF format)
3. **Extract Data**: Follow the 8-step workflow to extract clinical data
4. **Use AI**: Optionally use AI-assisted extraction for faster processing
5. **Validate**: Review and validate extracted data
6. **Export**: Download data in CSV, Excel, or JSON format

## Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Environment Variables

Required environment variables (set in Space Settings → Repository secrets):

- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY`: Supabase publishable anon key
- `VITE_SUPABASE_PROJECT_ID`: Supabase project ID

## Support

For issues or questions, please refer to the [documentation](docs/SETUP.md) or create an issue on GitHub.

## License

Apache 2.0

---

Built with ❤️ using Lovable and Hugging Face Spaces
EOF
fi

echo -e "${GREEN}✓ Files prepared${NC}"

echo ""
echo "Step 3: Committing changes..."
echo "-----------------------------"

# Git operations
git add .

# Check if there are changes to commit
if git diff --staged --quiet; then
    echo -e "${YELLOW}No changes to commit.${NC}"
    cd ..
    exit 0
fi

# Commit with timestamp
COMMIT_MSG="Deploy: $(date +'%Y-%m-%d %H:%M:%S')"
git commit -m "$COMMIT_MSG"

echo -e "${GREEN}✓ Changes committed${NC}"

echo ""
echo "Step 4: Pushing to Hugging Face..."
echo "-----------------------------------"

git push

echo -e "${GREEN}✓ Pushed to Hugging Face${NC}"

# Return to project root
cd ..

echo ""
echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""
echo "Your app will be available at:"
echo "https://huggingface.co/spaces/YOUR_USERNAME/YOUR_SPACE_NAME"
echo ""
echo "Note: It may take 1-2 minutes for Hugging Face to build and deploy."
echo "Check the build logs in your Space's 'Logs' tab."
echo ""
echo "Don't forget to configure environment variables in:"
echo "Settings → Repository secrets"
echo ""
