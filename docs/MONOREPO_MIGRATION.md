# Monorepo Migration Guide

## Overview

This guide provides a complete plan to transform the Clinical Data Extraction System into a pnpm workspace monorepo. This structure improves code sharing, dependency management, and maintainability across web, Electron, and edge function deployments.

## Benefits

- 🔄 **Shared Code**: Reuse types, schemas, and utilities across all packages
- 📦 **Dependency Management**: Centralized version control and updates
- 🚀 **Build Optimization**: Faster builds with workspace caching
- 🛡️ **Type Safety**: Shared TypeScript types across frontend/backend
- 🧪 **Testing**: Unified testing strategy across packages

## Target Structure

```
clinical-extraction-system/
├── package.json                      # Root workspace config
├── pnpm-workspace.yaml              # Workspace definition
├── pnpm-lock.yaml                   # Lockfile
├── tsconfig.base.json               # Base TypeScript config
├── .github/
│   └── workflows/
│       ├── deploy-web.yml           # Deploy web app
│       ├── deploy-electron.yml      # Build Electron
│       └── test.yml                 # Run all tests
├── packages/
│   ├── shared/                      # @medextract/shared
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── types/               # Shared TypeScript types
│   │       │   ├── index.ts
│   │       │   ├── extraction.ts
│   │       │   └── supabase.ts
│   │       ├── schemas/             # Zod validation schemas
│   │       │   ├── index.ts
│   │       │   └── validation.ts
│   │       └── utils/               # Shared utilities
│   │           ├── index.ts
│   │           ├── date.ts
│   │           └── export.ts
│   │
│   ├── web/                         # @medextract/web
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── vite.config.ts
│   │   ├── index.html
│   │   ├── public/
│   │   └── src/
│   │       ├── components/
│   │       ├── pages/
│   │       ├── hooks/
│   │       └── main.tsx
│   │
│   ├── electron/                    # @medextract/electron
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── electron-builder.config.js
│   │   ├── vite.config.electron.ts
│   │   └── src/
│   │       ├── main.ts
│   │       ├── preload.ts
│   │       └── renderer/            # Uses @medextract/web
│   │
│   └── edge-functions/              # @medextract/functions
│       ├── package.json
│       ├── tsconfig.json
│       └── functions/
│           ├── extract-clinical-data/
│           └── validate-clinical-data/
│
└── apps/
    └── e2e-tests/                   # @medextract/e2e
        ├── package.json
        ├── playwright.config.ts
        └── tests/
```

## Migration Steps

### Phase 1: Preparation (15 minutes)

1. **Backup Current State**
   ```bash
   git add .
   git commit -m "Pre-monorepo migration checkpoint"
   git tag pre-monorepo-migration
   ```

2. **Install pnpm** (if not already installed)
   ```bash
   npm install -g pnpm
   ```

3. **Create Branch**
   ```bash
   git checkout -b feat/monorepo-migration
   ```

### Phase 2: Create Workspace Structure (30 minutes)

1. **Create Root Configuration Files**
   - Copy configurations from `docs/configs/root/` to project root
   - Files: `pnpm-workspace.yaml`, `tsconfig.base.json`, root `package.json`

2. **Create Package Directories**
   ```bash
   mkdir -p packages/{shared,web,electron,edge-functions}/src
   mkdir -p apps/e2e-tests
   ```

3. **Set Up Shared Package**
   ```bash
   # Copy shared code
   cp -r src/integrations/supabase/types.ts packages/shared/src/types/supabase.ts
   cp -r src/lib/validationSchemas.ts packages/shared/src/schemas/validation.ts
   cp -r src/lib/utils.ts packages/shared/src/utils/index.ts
   cp -r src/lib/exportService.ts packages/shared/src/utils/export.ts
   
   # Copy package config
   cp docs/configs/packages/shared/package.json packages/shared/
   cp docs/configs/packages/shared/tsconfig.json packages/shared/
   ```

4. **Move Web Application**
   ```bash
   # Move all web app files
   mv src packages/web/
   mv public packages/web/
   mv index.html packages/web/
   mv vite.config.ts packages/web/
   
   # Copy config files
   cp docs/configs/packages/web/package.json packages/web/
   cp docs/configs/packages/web/tsconfig.json packages/web/
   ```

5. **Move Electron Application**
   ```bash
   # Move Electron files
   mv electron packages/electron/src/
   mv electron-builder.config.js packages/electron/
   mv vite.config.electron.ts packages/electron/
   mv build packages/electron/
   
   # Copy config files
   cp docs/configs/packages/electron/package.json packages/electron/
   cp docs/configs/packages/electron/tsconfig.json packages/electron/
   ```

6. **Move Edge Functions**
   ```bash
   # Move Supabase functions
   mv supabase packages/edge-functions/
   
   # Copy config files
   cp docs/configs/packages/edge-functions/package.json packages/edge-functions/
   cp docs/configs/packages/edge-functions/tsconfig.json packages/edge-functions/
   ```

7. **Move E2E Tests**
   ```bash
   # Move test files
   mv tests apps/e2e-tests/
   mv playwright.config.ts apps/e2e-tests/
   
   # Copy config files
   cp docs/configs/apps/e2e-tests/package.json apps/e2e-tests/
   cp docs/configs/apps/e2e-tests/tsconfig.json apps/e2e-tests/
   ```

### Phase 3: Update Import Paths (45 minutes)

Run the automated migration script:

```bash
chmod +x scripts/migrate-imports.sh
./scripts/migrate-imports.sh
```

Or manually update imports:

**In packages/web/src/\*\*/\*.tsx files:**
```typescript
// Before
import { supabase } from '@/integrations/supabase/client';
import { validationSchemas } from '@/lib/validationSchemas';
import { cn } from '@/lib/utils';

// After
import { supabase } from '@/integrations/supabase/client'; // Local to web package
import { validationSchemas } from '@medextract/shared/schemas';
import { cn } from '@medextract/shared/utils';
```

**In packages/edge-functions/functions/\*/index.ts:**
```typescript
// Before
// Duplicated type definitions inline

// After
import type { ExtractionData } from '@medextract/shared/types';
import { studyIdSchema } from '@medextract/shared/schemas';
```

### Phase 4: Install Dependencies (10 minutes)

```bash
# Remove old node_modules and lockfiles
rm -rf node_modules package-lock.json

# Install all workspace dependencies
pnpm install
```

### Phase 5: Update Build Scripts (15 minutes)

**Root package.json scripts:**
```json
{
  "scripts": {
    "dev": "pnpm --filter @medextract/web dev",
    "dev:electron": "pnpm --filter @medextract/electron dev",
    "build": "pnpm --filter @medextract/shared build && pnpm --filter @medextract/web build",
    "build:electron": "pnpm --filter @medextract/electron build",
    "test": "pnpm --filter @medextract/e2e test",
    "test:unit": "pnpm -r test:unit",
    "type-check": "pnpm -r type-check",
    "lint": "pnpm -r lint"
  }
}
```

### Phase 6: Testing (30 minutes)

1. **Test Web Development**
   ```bash
   pnpm dev
   # Verify app runs at http://localhost:8080
   # Test PDF upload, extraction, form workflow
   ```

2. **Test Electron Build**
   ```bash
   pnpm dev:electron
   # Verify Electron app launches
   # Test file dialogs and native features
   ```

3. **Test Production Builds**
   ```bash
   pnpm build
   pnpm build:electron
   # Verify builds complete without errors
   ```

4. **Run E2E Tests**
   ```bash
   pnpm test
   # All Playwright tests should pass
   ```

### Phase 7: Update CI/CD (20 minutes)

Update `.github/workflows/deploy.yml`:

```yaml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy-web:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'pnpm'
      
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
      - run: pnpm deploy
```

### Phase 8: Documentation Updates (15 minutes)

1. Update `README.md` with new structure
2. Update all docs in `docs/` with new paths
3. Add `docs/WORKSPACE_GUIDE.md` for developers

## Rollback Strategy

If issues arise during migration:

### Option 1: Quick Rollback
```bash
git reset --hard pre-monorepo-migration
git clean -fd
npm install
```

### Option 2: Selective Rollback
```bash
# Keep monorepo structure but revert specific changes
git checkout HEAD -- packages/web/src/specific-file.tsx
pnpm install
```

### Option 3: Branch Rollback
```bash
git checkout main
# Delete migration branch if needed
git branch -D feat/monorepo-migration
```

## Common Issues & Solutions

### Issue: Import Resolution Errors

**Problem:** TypeScript can't find `@medextract/shared` imports

**Solution:**
```bash
# Rebuild shared package
pnpm --filter @medextract/shared build

# Clear TypeScript cache
rm -rf packages/*/tsconfig.tsbuildinfo
```

### Issue: Circular Dependencies

**Problem:** `@medextract/shared` imports from `@medextract/web`

**Solution:** 
- Move web-specific code back to `packages/web/src`
- Only shared, generic code belongs in `packages/shared`

### Issue: Vite Can't Resolve Workspace Packages

**Problem:** Vite dev server shows "Failed to resolve import"

**Solution:** Update `packages/web/vite.config.ts`:
```typescript
export default defineConfig({
  resolve: {
    alias: {
      '@medextract/shared': path.resolve(__dirname, '../shared/src'),
    },
  },
});
```

### Issue: Edge Functions Can't Import Workspace Packages

**Problem:** Supabase edge functions can't access `@medextract/shared`

**Solution:** 
- Edge functions need bundled imports
- Use Deno-compatible imports or bundle before deploy
- Keep edge function types locally or copy from shared

## Verification Checklist

Before merging to main:

- [ ] All packages build successfully (`pnpm build`)
- [ ] Web app runs in development (`pnpm dev`)
- [ ] Electron app launches (`pnpm dev:electron`)
- [ ] All E2E tests pass (`pnpm test`)
- [ ] Type checking passes (`pnpm type-check`)
- [ ] No duplicate dependencies in package.json files
- [ ] All imports resolve correctly
- [ ] Build outputs are in correct locations
- [ ] Documentation is updated
- [ ] CI/CD pipeline passes

## Timeline Estimate

| Phase | Duration | Can Be Done Async |
|-------|----------|-------------------|
| Preparation | 15 min | No |
| Structure Setup | 30 min | Partially |
| Import Updates | 45 min | Yes (per package) |
| Install Dependencies | 10 min | No |
| Build Scripts | 15 min | No |
| Testing | 30 min | No |
| CI/CD Updates | 20 min | Yes |
| Documentation | 15 min | Yes |
| **Total** | **~3 hours** | |

## Next Steps

1. Review this migration plan with your team
2. Schedule a maintenance window for migration
3. Run through migration steps in a test environment first
4. Execute migration following the phases above
5. Monitor production deployments closely after migration

## Support

If you encounter issues during migration:
1. Check the "Common Issues & Solutions" section above
2. Review pnpm workspace documentation: https://pnpm.io/workspaces
3. Refer to TypeScript project references: https://www.typescriptlang.org/docs/handbook/project-references.html

---

**Ready to proceed?** Start with Phase 1: Preparation
