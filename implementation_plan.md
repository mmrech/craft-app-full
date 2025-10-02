# Implementation Plan

## [Overview]
Stabilize and complete the Clinical Data Extraction System to ensure all features function correctly without adding unnecessary complexity.

This implementation focuses on fixing the existing foundation rather than rebuilding. The app is a sophisticated clinical research data extraction tool that processes PDF documents through an 8-step workflow (Study ID, PICOT, Baseline, Imaging, Interventions, Study Arms, Outcomes, Complications). The core architecture is solid, but requires dependency installation, environment configuration, bug fixes, and edge case handling to be production-ready.

The approach prioritizes:
1. Installing dependencies and setting up the development environment
2. Configuring Supabase backend connection
3. Fixing critical bugs and edge cases
4. Testing core workflows
5. Improving user experience with better error handling
6. Documenting setup and usage

## [Types]
No new types need to be created - existing TypeScript interfaces are comprehensive.

The existing types in `src/integrations/supabase/types.ts` and component interfaces cover:
- `Extraction` interface for extraction tracking
- `ExtractionContextType` for state management
- `DocumentExportData` and `ExtractionData` for exports
- Database table types auto-generated from Supabase

All required types are properly defined and don't need modification. The type system is well-structured with proper generics and utility types.

## [Files]
Files requiring modifications to fix and stabilize the application.

**New Files to Create:**
- `.env.local` - Local environment variables for Supabase connection
- `.env.example` - Template showing required environment variables
- `docs/SETUP.md` - Setup and deployment documentation
- `docs/TROUBLESHOOTING.md` - Common issues and solutions

**Existing Files to Modify:**

1. **package.json** - Already complete, no changes needed

2. **src/integrations/supabase/client.ts** - Add connection error handling
   - Add try-catch for client initialization
   - Add connection status logging
   - Improve error messages for missing credentials

3. **src/components/extraction/PdfPanel.tsx** - Fix edge cases
   - Improve file validation error messages
   - Add retry logic for failed PDF loads
   - Better handling of corrupted PDFs
   - Fix coordinate calculation edge cases

4. **src/components/extraction/FormPanel.tsx** - Improve UX
   - Add unsaved changes warning
   - Improve validation feedback
   - Add keyboard shortcut documentation

5. **src/contexts/ExtractionContext.tsx** - Add error boundaries
   - Wrap localStorage operations in try-catch
   - Add context error recovery
   - Improve auto-save reliability

6. **src/components/extraction/AIExtractionButton.tsx** - Better error handling
   - Add more specific error messages
   - Improve retry logic
   - Add loading states feedback

7. **src/lib/apiRetry.ts** - Enhance retry mechanism
   - Add exponential backoff
   - Improve error categorization
   - Add circuit breaker pattern

8. **supabase/config.toml** - Verify configuration
   - Check port settings
   - Verify JWT settings
   - Ensure proper CORS configuration

**Configuration Files:**
- `.env` needs to be created with Supabase credentials
- `vite.config.ts` already properly configured
- `tailwind.config.ts` already properly configured

## [Functions]
Functions requiring creation or modification for stability and reliability.

**New Functions to Create:**

1. `src/lib/connectionHealth.ts` - New file
   - `checkSupabaseConnection()`: Verify Supabase connectivity
   - `testStorageAccess()`: Verify storage bucket access
   - `testDatabaseAccess()`: Verify database query access
   - `getConnectionStatus()`: Return overall connection health

2. `src/hooks/useConnectionHealth.ts` - New custom hook
   - Monitor Supabase connection status
   - Provide real-time connection feedback
   - Auto-retry on connection loss

**Functions to Modify:**

1. `src/components/extraction/PdfPanel.tsx`
   - `validateFile()`: Add more comprehensive validation
   - `onDocumentLoadError()`: Improve error categorization
   - `extractAllPagesText()`: Add progress callbacks and better error recovery
   - `loadPDF()`: Add connection pre-check

2. `src/integrations/supabase/client.ts`
   - Add initialization error handling wrapper
   - Add connection test function

3. `src/lib/apiRetry.ts`
   - `retryWithBackoff()`: Improve backoff algorithm
   - Add `shouldRetry()`: Determine if error is retryable
   - Add `CircuitBreaker` class for protecting against cascading failures

4. `src/contexts/ExtractionContext.tsx`
   - `updateFormData()`: Add debouncing for auto-save
   - Improve localStorage error handling
   - Add data recovery mechanism

## [Classes]
No new classes need to be created - existing class structure is appropriate.

**Existing Classes (No Modifications):**
- `ExportService` in `src/lib/exportService.ts` - Already well-implemented
- React component classes are functional components (no class components)

The functional programming approach used throughout the codebase is appropriate and doesn't need refactoring to class-based patterns.

## [Dependencies]
Package installations and environment setup required.

**Installation Required:**
```bash
npm install
```

This will install all dependencies already defined in package.json including:
- React 18.3.1 and React DOM
- Vite 5.4.19 (build tool)
- TypeScript 5.8.3
- Supabase JS client 2.58.0
- TanStack React Query 5.83.0
- All UI dependencies (@radix-ui components, shadcn-ui)
- PDF processing (pdfjs-dist 3.11.174, react-pdf 7.7.1, pdf-lib 1.17.1)
- Export utilities (xlsx 0.18.5)
- Form libraries (react-hook-form 7.61.1, zod 3.25.76)

**Environment Variables Required:**
Create `.env.local` with:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
LOVABLE_API_KEY=your-lovable-key (for AI extraction)
```

**No Version Changes Needed:**
All dependency versions in package.json are appropriate and up-to-date.

**Optional Development Dependencies:**
Consider adding for future enhancement:
- `vitest` for unit testing
- `@testing-library/react` for component testing
- `playwright` for E2E testing

## [Testing]
Testing strategy to ensure application reliability and feature completeness.

**Manual Testing Checklist:**

1. **Setup & Configuration**
   - Verify `npm install` completes without errors
   - Verify `.env.local` is properly configured
   - Verify app starts with `npm run dev`
   - Verify Supabase connection established

2. **Authentication Flow**
   - Test user registration
   - Test login/logout
   - Test session persistence
   - Test RLS policy enforcement

3. **PDF Upload & Processing**
   - Test valid PDF upload
   - Test invalid file rejection (wrong type, too large, corrupted)
   - Test text extraction from multi-page PDFs
   - Test PDF viewing and navigation
   - Test zoom controls

4. **Manual Extraction**
   - Test text selection and extraction
   - Test coordinate capture
   - Test extraction traceability
   - Test extraction display in TracePanel

5. **AI Extraction**
   - Test AI extraction for each step type
   - Test error handling when API fails
   - Test retry mechanism
   - Test extracted data population

6. **Form Workflow**
   - Test navigation between steps
   - Test field validation
   - Test required field enforcement
   - Test auto-save functionality
   - Test draft recovery

7. **Data Export**
   - Test CSV export
   - Test Excel export
   - Test JSON export
   - Verify exported data integrity

8. **Edge Cases**
   - Test offline behavior
   - Test with very large PDFs
   - Test with corrupted PDFs
   - Test rapid form updates
   - Test browser refresh during extraction

**Automated Testing (Future Enhancement):**
- Unit tests for utility functions (apiRetry, exportService, validationSchemas)
- Integration tests for Supabase operations
- Component tests for critical UI components
- E2E tests for complete extraction workflow

## [Implementation Order]
Step-by-step implementation sequence to minimize conflicts and ensure successful integration.

1. **Environment Setup & Dependencies**
   - Run `npm install` to install all dependencies
   - Create `.env.local` file with Supabase credentials
   - Create `.env.example` template file
   - Verify Vite server starts successfully

2. **Supabase Configuration**
   - Verify Supabase project is created and accessible
   - Run database migrations: `npx supabase db push`
   - Verify storage bucket `pdf_documents` exists
   - Test database connection with a simple query
   - Configure RLS policies if not already applied

3. **Core Bug Fixes**
   - Fix PDF coordinate calculation in PdfPanel.tsx
   - Improve error handling in supabase/client.ts
   - Add connection health checks
   - Fix localStorage edge cases in ExtractionContext.tsx
   - Improve retry logic in apiRetry.ts

4. **UX Improvements**
   - Add unsaved changes warning in FormPanel.tsx
   - Improve validation feedback messages
   - Add better loading states throughout app
   - Improve error message clarity
   - Add connection status indicator

5. **Testing & Validation**
   - Manual test authentication flow
   - Manual test PDF upload and processing
   - Manual test extraction workflows (manual + AI)
   - Manual test export functionality
   - Test edge cases and error scenarios

6. **Documentation**
   - Create docs/SETUP.md with setup instructions
   - Create docs/TROUBLESHOOTING.md with common issues
   - Document environment variables in .env.example
   - Add inline code comments for complex logic

7. **Final Polish**
   - Review all console errors and warnings
   - Optimize performance (lazy loading, memoization)
   - Add accessibility improvements (ARIA labels)
   - Final code cleanup and formatting
   - Update README.md with current state

8. **Deployment Preparation**
   - Test production build: `npm run build`
   - Verify environment variables for production
   - Test production bundle locally: `npm run preview`
   - Document deployment process
