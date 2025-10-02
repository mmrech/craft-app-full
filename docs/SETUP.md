# Clinical Data Extraction System - Setup Guide

## Prerequisites

Before setting up the application, ensure you have:

- **Node.js** (v18 or higher)
- **npm** (v9 or higher)
- **A Supabase account** (free tier works)
- **Git** (for version control)

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

This will install all required dependencies including React, TypeScript, Vite, Supabase client, PDF libraries, and UI components.

### 2. Configure Environment Variables

Create a `.env` file in the project root by copying `.env.example`:

```bash
cp .env.example .env
```

Edit `.env` and add your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key-here
VITE_SUPABASE_PROJECT_ID=your-project-id
```

#### Where to Find Supabase Credentials

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Settings > API**
4. Copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **Project API keys > anon/public** → `VITE_SUPABASE_PUBLISHABLE_KEY`
   - **Project ID** (from URL or General settings) → `VITE_SUPABASE_PROJECT_ID`

### 3. Set Up Supabase Database

The database migrations are already included. To apply them:

```bash
# If you have Supabase CLI installed
npx supabase db push

# Or manually run migrations from supabase/migrations/ folder
# in the Supabase SQL Editor
```

#### Required Tables

The following tables will be created:
- `profiles` - User profiles
- `documents` - PDF document metadata
- `pdf_extractions` - Extracted text from PDFs
- `clinical_extractions` - Clinical data extractions
- `user_roles` - User role management

#### Required Storage Bucket

Create a storage bucket named `pdf_documents`:

1. Go to **Storage** in Supabase Dashboard
2. Click **New Bucket**
3. Name: `pdf_documents`
4. Make it **Private** (recommended for security)
5. Set file size limit: **50MB**

### 4. Configure Row Level Security (RLS)

RLS policies should be automatically applied via migrations. Verify in Supabase:

1. Go to **Authentication > Policies**
2. Ensure policies exist for all tables
3. Users should only access their own data

### 5. Start Development Server

```bash
npm run dev
```

The app will be available at http://localhost:8080/

### 6. Build for Production

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## Project Structure

```
craft-app-full-main/
├── src/
│   ├── components/          # React components
│   │   ├── extraction/     # PDF extraction UI
│   │   ├── ui/             # shadcn-ui components
│   │   └── ...
│   ├── contexts/           # React contexts (state)
│   ├── hooks/              # Custom React hooks
│   ├── integrations/       # External service integrations
│   │   └── supabase/       # Supabase client & types
│   ├── lib/                # Utility functions
│   ├── pages/              # Page components
│   └── main.tsx            # App entry point
├── supabase/
│   ├── functions/          # Edge functions
│   └── migrations/         # Database migrations
├── docs/                   # Documentation
├── .env                    # Environment variables (create this)
├── .env.example            # Environment template
└── package.json            # Dependencies
```

## Key Features

### 8-Step Extraction Workflow

1. **Study ID** - Citation and identifiers
2. **PICOT** - Population, Intervention, Comparison, Outcome, Timing
3. **Baseline** - Patient demographics and characteristics
4. **Imaging** - Imaging protocols and parameters
5. **Interventions** - Treatment details
6. **Study Arms** - Study groups and randomization
7. **Outcomes** - Primary and secondary outcomes
8. **Complications** - Adverse events

### PDF Processing

- Upload PDFs up to 50MB
- Text extraction from all pages
- Manual text selection and highlighting
- Coordinate tracking for traceability

### AI Extraction (Optional)

To enable AI-powered extraction:

1. Get an API key from [Lovable AI](https://lovable.dev)
2. Add to `.env`:
   ```env
   LOVABLE_API_KEY=your-lovable-key
   ```

### Data Export

Export extracted data in multiple formats:
- **CSV** - For spreadsheet analysis
- **Excel** - Formatted workbook
- **JSON** - For API integration

## Troubleshooting

See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for common issues and solutions.

## Security Best Practices

1. **Never commit `.env` files** to version control
2. **Use Row Level Security (RLS)** in Supabase for data isolation
3. **Rotate API keys** regularly
4. **Enable 2FA** on your Supabase account
5. **Use signed URLs** for PDF access (already implemented)

## Next Steps

- Review [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
- Check the main [README.md](../README.md)
- Explore the implementation plan in [implementation_plan.md](../implementation_plan.md)

## Support

For issues or questions:
1. Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
2. Review the implementation plan
3. Check Supabase logs for backend errors
4. Review browser console for frontend errors
