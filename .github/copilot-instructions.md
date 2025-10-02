# Clinical Data Extraction App - AI Agent Instructions

## Project Overview
React + TypeScript application for extracting clinical research data from PDF documents using AI-assisted workflows. Built with Vite, shadcn/ui components, and Supabase backend with Edge Functions for AI extraction.

## Architecture

### Core Data Flow
1. **PDF Upload** → Supabase Storage (`pdf_documents` bucket)
2. **User Interaction** → Three-panel layout: FormPanel (left), PdfPanel (center), TracePanel (right)
3. **Extraction Methods**:
   - **Manual**: User clicks field → highlights PDF text → data extracted with coordinates
   - **AI-assisted**: `AIExtractionButton` → `extract-clinical-data` Edge Function → Lovable AI Gateway (Gemini 2.5 Flash)
4. **Data Storage** → `clinical_extractions` table with full traceability (page, coordinates, method)
5. **Validation** → Real-time via `validate-clinical-data` Edge Function

### ExtractionContext Pattern
`ExtractionContext` is the central state manager (see `src/contexts/ExtractionContext.tsx`):
- `formData`: All extracted field values
- `extractions`: Audit trail with coordinates/pages
- `currentStep`: 8-step wizard (Study ID, PICO-T, Baseline, Imaging, Interventions, Study Arms, Outcomes, Complications)
- `activeField`: Currently focused field for PDF highlighting
- Auto-saves to localStorage every 30s with draft recovery on mount

### Component Composition
- **ExtractableField**: Standard input/textarea that becomes active for PDF selection
- **ValidatedField**: ExtractableField + real-time Supabase Edge Function validation (DOI, PMID, year formats)
- **AIExtractionButton**: Batch extraction per step using structured LLM tool calls
- Step components (`Step1StudyId.tsx` - `Step8Complications.tsx`) compose these fields

## Development Workflows

### Running the App
```bash
npm run dev          # Start dev server on port 8080
npm run build        # Production build
npm run build:dev    # Development mode build
```

### Environment Setup
Required environment variables in `.env`:
```bash
VITE_SUPABASE_PROJECT_ID="your-project-id"
VITE_SUPABASE_PUBLISHABLE_KEY="your-anon-key"
VITE_SUPABASE_URL="https://your-project.supabase.co"
```

These are auto-generated from Supabase and consumed via `src/integrations/supabase/client.ts`. Never commit actual keys to version control.

### Testing
**No formal test suite exists.** The project currently relies on:
- Manual testing via dev server
- TypeScript type checking (`npm run lint`)
- Runtime validation with Zod schemas (`src/lib/validationSchemas.ts`)

When adding features, manually verify:
1. PDF upload/loading flows
2. AI extraction across all 8 steps
3. Field validation (especially DOI, PMID, year formats)
4. Export functionality (CSV/Excel/JSON)

### Working with Supabase
```bash
# Edge Functions use Deno runtime
# Located in supabase/functions/{extract-clinical-data,validate-clinical-data}
# Both configured with verify_jwt = false in supabase/config.toml
```

**Edge Function Pattern**:
- Use `google/gemini-2.5-flash` via Lovable AI Gateway
- Structured extraction with function calling (see `getExtractionTools()` in `extract-clinical-data/index.ts`)
- Each step has specific tools: `extract_study_id`, `extract_baseline`, etc.
- Return format: `{ success: true, data: {...}, confidence: {...} }`

### Database Schema
Key tables:
- `documents`: PDF metadata (user_id, storage_path, total_pages)
- `clinical_extractions`: Extracted data with full provenance (document_id, step_number, field_name, extracted_text, page_number, coordinates, method)
- RLS policies enforce user-scoped access on all tables

## Code Conventions

### State Management
- **Never** store PDF text in component state - use `formData._pdfFullText` in ExtractionContext
- Required fields per step defined in `ExtractionContext.requiredFields` object
- Step navigation validates required fields before proceeding

### Styling
- Uses Tailwind with shadcn/ui components from `src/components/ui/`
- Active field highlighting: `ring-2 ring-primary bg-orange-50`
- Completed fields: `bg-green-50 border-green-500`
- Dark mode supported via `next-themes`

### Form Field Patterns
```tsx
// Standard pattern for extraction fields
<ExtractableField 
  name="citation"        // Must match formData key
  label="Full Citation"
  type="textarea"        // or "text" | "number"
  required               // Validates on step navigation
/>

// For fields needing real-time validation
<ValidatedField 
  name="doi" 
  label="DOI" 
  placeholder="10.XXXX/..."  // Show expected format
/>
```

### AI Extraction Integration
Each step's `AIExtractionButton` must:
1. Pass `extractionType` matching Edge Function tools (e.g., `"study_id"`, `"picot"`, `"baseline"`)
2. Provide `pdfText` from context (limited to 50k chars)
3. Map returned data to `formData` keys using `updateFormData()`

## Key Files Reference
- `src/contexts/ExtractionContext.tsx` - Central state, auto-save logic, step validation
- `src/pages/Index.tsx` - Main layout with three panels
- `src/components/extraction/FormPanel.tsx` - 8-step wizard navigation
- `supabase/functions/extract-clinical-data/index.ts` - AI extraction with structured prompts
- `src/lib/validationSchemas.ts` - Zod schemas (DOI, PMID, year patterns)
- `src/lib/exportService.ts` - CSV/Excel/JSON export with multi-sheet support

## Common Tasks

### Adding a New Extraction Field
1. Add to appropriate step component (e.g., `Step1StudyId.tsx`)
2. Update `getExtractionTools()` in `extract-clinical-data/index.ts` if AI-extractable
3. Add validation to `validate-clinical-data/index.ts` if needed
4. Add to Zod schema in `validationSchemas.ts` if client-side validation required

### Modifying AI Extraction Behavior
Edit system prompts in `getSystemPrompt()` and tool schemas in `getExtractionTools()` in `supabase/functions/extract-clinical-data/index.ts`. Each step has domain-specific prompts (e.g., imaging focuses on vascular territory, infarct volumes).

### Handling PDF Interaction
PDF highlighting uses `react-pdf` with custom overlay layer (`PdfHighlightLayer.tsx`). Selected text coordinates stored in `extractions` array for traceability.

## Error Handling Patterns

### Retry Logic with Exponential Backoff
Use `retryWithBackoff()` from `src/lib/apiRetry.ts` for network-dependent operations:
```tsx
import { retryWithBackoff, getErrorMessage } from '@/lib/apiRetry';

const result = await retryWithBackoff(async () => {
  const { data, error } = await supabase.functions.invoke('extract-clinical-data', {
    body: { pdfText, extractionType }
  });
  if (error) throw error;
  return data;
});
```

**Default behavior**:
- 3 retry attempts with 1s initial delay
- 2x backoff multiplier (1s → 2s → 4s)
- Max delay capped at 10s
- Retries on network errors and 5xx status codes

### Toast Notification Standards
Use Sonner toasts (`import { toast } from 'sonner'`) consistently:

```tsx
// Success - short confirmations
toast.success('PDF uploaded successfully');

// Error - use getErrorMessage() for API errors
toast.error('Failed to load documents', {
  description: 'Please check your connection'
});

// Info - progress updates
toast.info(`Extracting text from ${numPages} pages...`);

// Action toasts - for user decisions
toast.info('Draft recovered from last session', {
  action: {
    label: 'Restore',
    onClick: () => { /* restore logic */ }
  }
});
```

### Error Boundary
All routes wrapped in `ErrorBoundary` component (see `src/components/ErrorBoundary.tsx`):
- Catches React errors globally
- Shows user-friendly message with error details
- Provides "Try Again" and "Go Home" actions
- Logs full stack trace to console

### Offline Handling
`OfflineIndicator` component monitors network status. Before Supabase operations:
```tsx
const { isOnline } = useNetworkStatus();

if (!isOnline) {
  toast.error('Cannot delete while offline', {
    description: 'Please check your internet connection'
  });
  return;
}
```

### Validation Error Display
Field-level errors stored in `ExtractionContext.validationErrors`:
```tsx
// In ExtractableField component
className={cn(
  hasError && "border-destructive focus:ring-destructive"
)}
```

Edge Function validation returns structured errors:
```typescript
// From validate-clinical-data/index.ts
{
  field: 'doi',
  type: 'error',  // or 'warning' | 'success'
  message: 'Invalid DOI format',
  suggestion: 'Check the format: 10.XXXX/suffix'
}
```
