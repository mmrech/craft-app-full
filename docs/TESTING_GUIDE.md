# Clinical Extraction System - Testing Guide

## Table of Contents
1. [Authentication Flow Testing](#authentication-flow-testing)
2. [Document Management Testing](#document-management-testing)
3. [8-Step Extraction Process Testing](#8-step-extraction-process-testing)
4. [PDF Viewing & Annotation Testing](#pdf-viewing--annotation-testing)
5. [Data Export Testing](#data-export-testing)
6. [Edge Cases & Error Scenarios](#edge-cases--error-scenarios)
7. [Security Testing](#security-testing)
8. [Performance Testing](#performance-testing)

---

## Authentication Flow Testing

### Test Case 1.1: User Sign Up
**Priority:** Critical  
**User Story:** As a new user, I want to create an account so I can access the system.

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Navigate to `/auth` | Auth page loads with Sign In/Sign Up tabs |
| 2 | Click "Sign Up" tab | Sign up form is displayed |
| 3 | Enter email: `test@example.com` | Email field accepts input |
| 4 | Enter password: `Test123!@#` | Password field masks input |
| 5 | Enter full name: `John Doe` | Full name field accepts input |
| 6 | Click "Create Account" | Success toast appears |
| 7 | Check email inbox | Confirmation email received (if enabled) |
| 8 | Verify redirect | User redirected to `/` (main extraction page) |
| 9 | Check Supabase | Profile created in `profiles` table with correct data |

**Error Scenarios:**
- Empty fields → Validation error messages displayed
- Invalid email format → "Invalid email" error
- Weak password → "Password must be at least 6 characters" error
- Duplicate email → "User already registered" error

### Test Case 1.2: User Sign In
**Priority:** Critical  
**User Story:** As a registered user, I want to log in to access my extractions.

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Navigate to `/auth` | Auth page loads |
| 2 | Enter registered email | Email field populated |
| 3 | Enter correct password | Password field populated |
| 4 | Click "Sign In" | Success toast appears |
| 5 | Verify redirect | Redirected to `/` (Index page) |
| 6 | Check session | User state populated in `useAuth` hook |
| 7 | Refresh page | User remains logged in (session persists) |

**Error Scenarios:**
- Wrong password → "Invalid login credentials" error
- Non-existent email → "Invalid login credentials" error
- Empty fields → Validation errors

### Test Case 1.3: User Sign Out
**Priority:** High  
**User Story:** As a logged-in user, I want to sign out securely.

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | While logged in, click User Menu (top-right) | Dropdown menu appears |
| 2 | Click "Logout" | Confirmation or immediate logout |
| 3 | Verify redirect | Redirected to `/auth` page |
| 4 | Check session | User state cleared |
| 5 | Try accessing `/` | Redirected back to `/auth` |
| 6 | Check localStorage | Session tokens removed |

### Test Case 1.4: Session Persistence
**Priority:** High  
**User Story:** As a user, I want my session to persist across browser refreshes.

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Log in successfully | Redirected to main page |
| 2 | Refresh browser (F5) | User remains logged in |
| 3 | Close browser tab | - |
| 4 | Reopen browser and navigate to app | User still logged in |
| 5 | Wait 24 hours | Session expires, redirected to auth |

---

## Document Management Testing

### Test Case 2.1: PDF Upload
**Priority:** Critical  
**User Story:** As a user, I want to upload PDF documents for extraction.

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Log in and navigate to main page | PdfPanel shows upload prompt |
| 2 | Click "Upload PDF" button | File picker opens |
| 3 | Select valid PDF (< 10MB) | File name displayed in UI |
| 4 | Wait for upload | Progress indicator shown |
| 5 | Verify upload completion | PDF renders in viewer |
| 6 | Check Supabase Storage | File exists in `pdf_documents/{user_id}/` folder |
| 7 | Check `documents` table | New row with correct metadata (name, size, pages, user_id) |
| 8 | Verify text extraction | Background text extraction begins |

**Error Scenarios:**
- Non-PDF file → "Please select a PDF file" error
- File > 10MB → "File size exceeds 10MB limit" error
- Network failure during upload → Error toast, retry option
- Corrupted PDF → "Failed to load PDF" error

### Test Case 2.2: Document Library Access
**Priority:** High  
**User Story:** As a user, I want to access previously uploaded documents.

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Click "Library" button in PdfPanel | DocumentLibrary modal opens |
| 2 | Verify document list | Shows all user's uploaded PDFs |
| 3 | Check document metadata | Name, upload date, page count displayed |
| 4 | Click on a document | Modal closes, PDF loads in viewer |
| 5 | Verify extraction data | Previous extractions visible in TracePanel |
| 6 | Switch to different document | New PDF loads, extractions update |

### Test Case 2.3: Document Text Extraction
**Priority:** Critical  
**User Story:** As a user, I want the system to extract text from my PDF automatically.

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Upload a new PDF | Upload completes successfully |
| 2 | Watch extraction progress | Progress bar shows "Extracting page X of Y" |
| 3 | Wait for completion | All pages extracted |
| 4 | Check `pdf_extractions` table | Rows created for each page with `full_text` and `text_items` |
| 5 | Test text selection | Clicking on PDF highlights text items |
| 6 | Verify coordinates | Selected text coordinates saved correctly |

---

## 8-Step Extraction Process Testing

### Test Case 3.1: Step 1 - Study Identification
**Priority:** Critical  
**User Story:** As a user, I want to extract study identification details.

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Navigate to Step 1 | Study ID form displayed |
| 2 | Click "Study ID" field | Field activates (blue border) |
| 3 | Select text from PDF | Text highlighted on PDF |
| 4 | Verify extraction | Text appears in "Study ID" field |
| 5 | Check `clinical_extractions` | Row created with `field_name: 'studyId'`, `step_number: 1` |
| 6 | Repeat for: Title, Authors, Journal, Year, DOI | All fields extractable |
| 7 | Click "Next" with incomplete fields | Validation warning shown |
| 8 | Complete all required fields | "Next" button enables |
| 9 | Click "Next" | Navigate to Step 2 |
| 10 | Check TracePanel | All 6 extractions logged |

**Required Fields:** Study ID, Title, Authors, Journal, Year  
**Optional Fields:** DOI

### Test Case 3.2: Step 2 - PICOT Elements
**Priority:** Critical  
**User Story:** As a user, I want to extract PICOT framework elements.

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Navigate to Step 2 | PICOT form displayed |
| 2 | Extract Population text | Field populates, extraction saved |
| 3 | Extract Intervention text | Field populates, extraction saved |
| 4 | Extract Comparator text | Field populates, extraction saved |
| 5 | Extract Outcome text | Field populates, extraction saved |
| 6 | Extract Timing text | Field populates, extraction saved |
| 7 | Verify all extractions | 5 rows in `clinical_extractions` with `step_number: 2` |
| 8 | Test field validation | Empty required fields prevent navigation |
| 9 | Click "Next" when complete | Navigate to Step 3 |

**Required Fields:** Population, Intervention, Comparator, Outcome, Timing

### Test Case 3.3: Step 3 - Baseline Characteristics
**Priority:** High  
**User Story:** As a user, I want to extract baseline patient characteristics.

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Navigate to Step 3 | Baseline characteristics form displayed |
| 2 | Extract Sample Size | Numeric field accepts number |
| 3 | Extract Age (mean/median) | Field populates |
| 4 | Extract Gender distribution | Field populates |
| 5 | Extract Inclusion Criteria | Multi-line text accepted |
| 6 | Extract Exclusion Criteria | Multi-line text accepted |
| 7 | Verify validations | Sample size must be > 0 |
| 8 | Complete all fields | Navigate to Step 4 |

**Required Fields:** Sample Size, Age, Gender, Inclusion Criteria, Exclusion Criteria

### Test Case 3.4: Step 4 - Imaging Methods
**Priority:** High

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Navigate to Step 4 | Imaging methods form displayed |
| 2 | Extract Imaging Modality | Field populates (e.g., "MRI", "CT") |
| 3 | Extract Imaging Protocol | Multi-line text field accepts detailed protocol |
| 4 | Extract Image Timing | Field populates |
| 5 | Complete required fields | Navigate to Step 5 |

### Test Case 3.5: Step 5 - Interventions
**Priority:** High

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Navigate to Step 5 | Interventions form displayed |
| 2 | Extract Intervention Details | Field populates |
| 3 | Extract Dosage/Frequency | Field populates |
| 4 | Extract Duration | Field populates |
| 5 | Complete required fields | Navigate to Step 6 |

### Test Case 3.6: Step 6 - Study Arms
**Priority:** High

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Navigate to Step 6 | Study arms form displayed |
| 2 | Extract Control Arm details | Field populates |
| 3 | Extract Treatment Arm details | Field populates |
| 4 | Extract N per arm | Numeric fields accept values |
| 5 | Complete required fields | Navigate to Step 7 |

### Test Case 3.7: Step 7 - Outcomes
**Priority:** Critical

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Navigate to Step 7 | Outcomes form displayed |
| 2 | Extract Primary Outcome | Field populates |
| 3 | Extract Secondary Outcomes | Multi-line field accepts list |
| 4 | Extract Measurement Method | Field populates |
| 5 | Extract Results/Statistics | Field populates |
| 6 | Complete required fields | Navigate to Step 8 |

### Test Case 3.8: Step 8 - Complications/Adverse Events
**Priority:** High

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Navigate to Step 8 | Complications form displayed |
| 2 | Extract Adverse Events | Multi-line field accepts list |
| 3 | Extract Event Frequency | Field populates |
| 4 | Extract Severity Grading | Field populates |
| 5 | Complete all fields | "Finish" button enabled |
| 6 | Click "Finish" | Completion confirmation shown |
| 7 | Check `clinical_extractions` | All 8 steps have records |
| 8 | Verify form data saved | All data persists in database |

---

## PDF Viewing & Annotation Testing

### Test Case 4.1: PDF Navigation
**Priority:** High  
**User Story:** As a user, I want to navigate through multi-page PDFs easily.

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Upload 10+ page PDF | PDF loads, page 1 displayed |
| 2 | Click "Next Page" button | Page 2 renders |
| 3 | Click "Previous Page" button | Page 1 renders |
| 4 | Use keyboard arrows (→) | Next page navigation works |
| 5 | Use keyboard arrows (←) | Previous page navigation works |
| 6 | Enter page number directly | Jump to specific page |
| 7 | Try page 0 | Error or clamp to page 1 |
| 8 | Try page > total | Error or clamp to last page |

### Test Case 4.2: PDF Zoom
**Priority:** Medium

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Click zoom "+" button | PDF scales up (e.g., 110%) |
| 2 | Click zoom "-" button | PDF scales down (e.g., 90%) |
| 3 | Select "Fit Width" | PDF fills panel width |
| 4 | Select "Fit Page" | Entire page visible |
| 5 | Verify text selection at zoom | Selection coordinates adjust correctly |

### Test Case 4.3: Text Selection & Extraction
**Priority:** Critical

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Click on a form field (e.g., "Study ID") | Field highlights blue, activeField set |
| 2 | Click on PDF text | Text selection cursor appears |
| 3 | Drag to select text | Selection rectangle visible |
| 4 | Release mouse | Selected text copied to active field |
| 5 | Check extraction coordinates | `coordinates` JSON saved with {x, y, width, height} |
| 6 | Verify `clinical_extractions` | Row created with correct page_number, method='manual' |
| 7 | Check TracePanel | New extraction appears in log |
| 8 | Hover over extraction in Trace | PDF highlights corresponding region |

### Test Case 4.4: Annotation Mode
**Priority:** Medium

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Click "Annotation Mode" toggle | Annotation toolbar appears |
| 2 | Select drawing tool | Cursor changes to crosshair |
| 3 | Draw rectangle on PDF | Annotation appears on canvas |
| 4 | Select highlighter tool | Cursor changes |
| 5 | Highlight text region | Yellow highlight appears |
| 6 | Save annotations | Annotations persist in `pdf_annotations` table |
| 7 | Reload document | Annotations reappear on correct pages |

---

## Data Export Testing

### Test Case 5.1: CSV Export
**Priority:** High  
**User Story:** As a user, I want to export my extractions as CSV.

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Complete at least 1 extraction | TracePanel shows extractions |
| 2 | Click "Export" dropdown | CSV, Excel, JSON options visible |
| 3 | Select "Export as CSV" | Download initiates |
| 4 | Open downloaded CSV | File contains all extraction data |
| 5 | Verify columns | Includes: field_name, extracted_text, page_number, step_number, method, created_at |
| 6 | Check data integrity | All rows present, no missing data |

### Test Case 5.2: Excel Export
**Priority:** High

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Click "Export as Excel" | .xlsx file downloads |
| 2 | Open in Excel/LibreOffice | File opens without errors |
| 3 | Verify formatting | Columns sized appropriately |
| 4 | Check data completeness | All extractions present |

### Test Case 5.3: JSON Export
**Priority:** Medium

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Click "Export as JSON" | .json file downloads |
| 2 | Open in text editor | Valid JSON structure |
| 3 | Validate JSON | No syntax errors |
| 4 | Check schema | Nested structure preserves relationships |

---

## Edge Cases & Error Scenarios

### Test Case 6.1: Offline Behavior
**Priority:** High

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Log in, load document | System fully loaded |
| 2 | Disconnect network | Offline indicator appears |
| 3 | Try extracting text | Warning: "You are offline. Data will sync when online." |
| 4 | Make multiple extractions | Data saved to localStorage |
| 5 | Reconnect network | Auto-sync to Supabase |
| 6 | Verify database | All offline extractions present |

### Test Case 6.2: Large PDF Handling
**Priority:** Medium

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Upload 100+ page PDF | Upload succeeds (if < 10MB) |
| 2 | Wait for text extraction | Progress bar shows incremental updates |
| 3 | Navigate to page 50 | Page renders without lag |
| 4 | Extract text from page 99 | Extraction saves with correct page_number |
| 5 | Check performance | No browser freezing |

### Test Case 6.3: Concurrent Browser Tabs
**Priority:** Medium

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Open app in Tab 1 | Load document |
| 2 | Open app in Tab 2 (same user) | Same document loads |
| 3 | Make extraction in Tab 1 | Extraction appears in TracePanel |
| 4 | Switch to Tab 2 | Refresh or auto-update shows new extraction |
| 5 | Make extraction in Tab 2 | No conflicts, saves successfully |

### Test Case 6.4: Storage Quota Exceeded
**Priority:** Low

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Fill localStorage (simulate quota) | - |
| 2 | Try auto-save draft | Error caught gracefully |
| 3 | Display user warning | "Unable to save draft locally, please export data" |
| 4 | Verify DB sync | Data still saves to Supabase |

### Test Case 6.5: Invalid User Inputs
**Priority:** High

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Enter script tag in text field: `<script>alert('xss')</script>` | Input sanitized, no script execution |
| 2 | Enter SQL-like string: `'; DROP TABLE users; --` | Input saved as plain text, no DB injection |
| 3 | Enter extremely long text (10,000+ chars) | Field validation limits or accepts gracefully |
| 4 | Enter negative number in Sample Size | Validation error: "Must be positive number" |
| 5 | Enter invalid date format in Year | Validation error or auto-correction |

---

## Security Testing

### Test Case 7.1: Row-Level Security (RLS)
**Priority:** Critical

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | User A logs in | Can see own documents |
| 2 | User A uploads document with ID `abc123` | Document appears in library |
| 3 | User B logs in (different account) | Cannot see User A's documents |
| 4 | User B tries direct DB query for `abc123` | RLS blocks access, returns empty |
| 5 | Admin user logs in | Can see all users' documents (if admin policies exist) |

### Test Case 7.2: Storage Bucket Security
**Priority:** Critical

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | User A uploads PDF | Stored at `pdf_documents/{userA_id}/file.pdf` |
| 2 | User A gets signed URL | URL valid for user A |
| 3 | User B tries accessing User A's signed URL | Access denied (403) after recent migration |
| 4 | User A deletes own document | Storage file deleted, DB record removed |
| 5 | User B tries deleting User A's document | RLS/Storage policies prevent deletion |

### Test Case 7.3: JWT Verification in Edge Functions
**Priority:** Critical

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Call `extract-clinical-data` without auth | 401 Unauthorized error |
| 2 | Call with valid JWT token | Function executes successfully |
| 3 | Call with expired token | 401 Unauthorized error |
| 4 | Call with tampered token | 401 Unauthorized error |

### Test Case 7.4: XSS Protection
**Priority:** High

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Enter `<img src=x onerror=alert('xss')>` in field | Input sanitized, no alert shown |
| 2 | Verify stored data | HTML tags escaped or removed |
| 3 | Display extracted data | No script execution on render |

### Test Case 7.5: Password Security
**Priority:** Critical

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Sign up with weak password: `123` | Error: "Password too weak" |
| 2 | Sign up with strong password | Account created successfully |
| 3 | Check Supabase Auth | Password hashed, not stored in plaintext |
| 4 | Enable "Confirm email" in Supabase | Signup requires email confirmation |

---

## Performance Testing

### Test Case 8.1: Initial Load Time
**Priority:** High

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Clear cache, navigate to app | - |
| 2 | Measure time to interactive (TTI) | < 3 seconds |
| 3 | Check Largest Contentful Paint (LCP) | < 2.5 seconds |
| 4 | Check First Input Delay (FID) | < 100ms |
| 5 | Check Cumulative Layout Shift (CLS) | < 0.1 |

### Test Case 8.2: PDF Rendering Performance
**Priority:** Medium

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Load 50-page PDF | Initial page renders in < 2 seconds |
| 2 | Navigate to page 25 | Page renders in < 500ms |
| 3 | Zoom in/out | Render updates in < 300ms |
| 4 | Switch documents | New PDF loads in < 3 seconds |

### Test Case 8.3: Mobile Responsiveness
**Priority:** High

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Open app on iPhone 12 (390×844) | Layout adapts, no horizontal scroll |
| 2 | Test on iPad (768×1024) | All panels visible and functional |
| 3 | Test on Android (360×640) | Navigation accessible, PDF readable |
| 4 | Rotate device | Layout adjusts appropriately |
| 5 | Test touch interactions | Tap targets ≥ 44×44px |

### Test Case 8.4: Browser Compatibility
**Priority:** High

| Step | Browser | Expected Result |
|------|---------|----------------|
| 1 | Chrome 120+ | Full functionality |
| 2 | Firefox 121+ | Full functionality |
| 3 | Safari 17+ | Full functionality (check PDF.js support) |
| 4 | Edge 120+ | Full functionality |

---

## Test Execution Checklist

### Pre-Testing Setup
- [ ] Clear browser cache and localStorage
- [ ] Create fresh test user accounts
- [ ] Prepare test PDFs (various sizes, page counts)
- [ ] Set up test data in staging database
- [ ] Enable browser DevTools console

### Post-Test Validation
- [ ] Check Supabase logs for errors
- [ ] Review console for warnings/errors
- [ ] Verify database integrity
- [ ] Check storage bucket file counts
- [ ] Review RLS policy effectiveness

### Bug Reporting Template
```markdown
**Bug ID:** BUG-001
**Severity:** Critical/High/Medium/Low
**Test Case:** [Reference test case number]
**Steps to Reproduce:**
1. 
2. 
3. 

**Expected Result:**
**Actual Result:**
**Screenshots/Logs:**
**Environment:** Chrome 120, Windows 11
**Date Found:** 2025-10-04
```

---

## Continuous Testing Notes

- Run authentication tests after any auth-related code changes
- Run RLS tests after database migrations
- Run performance tests weekly
- Run full regression suite before production deployments
- Monitor Supabase analytics for real-world usage patterns
