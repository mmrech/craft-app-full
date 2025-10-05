# Monorepo Workspace Guide

## Overview

This project uses **pnpm workspaces** to manage multiple packages in a single repository. This guide explains how to work with the monorepo structure.

## Workspace Structure

```
@medextract/root
├── packages/
│   ├── @medextract/shared     # Shared types, schemas, utilities
│   ├── @medextract/web        # React web application
│   ├── @medextract/electron   # Electron desktop app
│   └── @medextract/functions  # Supabase edge functions
└── apps/
    └── @medextract/e2e        # End-to-end tests
```

## Common Commands

### Development

```bash
# Start web app development server
pnpm dev

# Start Electron app
pnpm dev:electron

# Run specific package script
pnpm --filter @medextract/web dev
pnpm --filter @medextract/electron build
```

### Building

```bash
# Build web app (with shared dependency)
pnpm build

# Build Electron app
pnpm build:electron

# Build all packages
pnpm build:all
```

### Testing

```bash
# Run E2E tests
pnpm test

# Run unit tests in all packages
pnpm test:unit

# Type check all packages
pnpm type-check
```

### Dependency Management

```bash
# Add dependency to specific package
pnpm --filter @medextract/web add react-query

# Add dev dependency to root
pnpm add -Dw prettier

# Remove dependency
pnpm --filter @medextract/web remove lodash

# Update all dependencies
pnpm update -r
```

## Working with Packages

### Adding New Shared Code

1. **Add to `packages/shared/src/`**
   ```typescript
   // packages/shared/src/utils/myUtil.ts
   export function myUtil() {
     // implementation
   }
   ```

2. **Export from index file**
   ```typescript
   // packages/shared/src/utils/index.ts
   export * from './myUtil';
   ```

3. **Use in other packages**
   ```typescript
   // packages/web/src/MyComponent.tsx
   import { myUtil } from '@medextract/shared/utils';
   ```

### Creating New Package

1. **Create directory structure**
   ```bash
   mkdir -p packages/my-package/src
   ```

2. **Add package.json**
   ```json
   {
     "name": "@medextract/my-package",
     "version": "1.0.0",
     "private": true,
     "main": "./src/index.ts"
   }
   ```

3. **Add to workspace** (already configured in `pnpm-workspace.yaml`)

4. **Install dependencies**
   ```bash
   pnpm install
   ```

### Linking Between Packages

Packages can depend on each other using workspace protocol:

```json
{
  "dependencies": {
    "@medextract/shared": "workspace:*"
  }
}
```

This automatically links to the local package during development.

## TypeScript Configuration

### Project References

The monorepo uses TypeScript project references for better build performance:

```json
{
  "references": [
    { "path": "../shared" }
  ]
}
```

### Path Mapping

Import from workspace packages using aliases:

```typescript
// packages/web/src/App.tsx
import { validationSchemas } from '@medextract/shared/schemas';
import { ExtractionData } from '@medextract/shared/types';
```

### Building with References

```bash
# Build with project references
pnpm --filter @medextract/shared build
pnpm --filter @medextract/web build
```

## Troubleshooting

### Issue: "Cannot find module '@medextract/shared'"

**Solution:**
```bash
# Rebuild shared package
pnpm --filter @medextract/shared build

# Clear cache
rm -rf node_modules/.cache
rm -rf packages/*/node_modules/.cache

# Reinstall
pnpm install
```

### Issue: Circular dependencies detected

**Solution:**
- Check for imports between packages that create cycles
- Move shared code to `@medextract/shared`
- Use dynamic imports for circular dependencies if necessary

### Issue: Changes in shared package not reflected

**Solution:**
```bash
# Rebuild shared package
pnpm --filter @medextract/shared build

# Or set up watch mode
pnpm --filter @medextract/shared build --watch
```

### Issue: Vite HMR not working across packages

**Solution:** Update `vite.config.ts`:
```typescript
export default defineConfig({
  server: {
    watch: {
      // Watch workspace packages
      ignored: ['!**/node_modules/@medextract/**']
    }
  },
  optimizeDeps: {
    include: ['@medextract/shared']
  }
});
```

## Best Practices

### 1. Shared Package Organization

```
packages/shared/src/
├── types/           # TypeScript types and interfaces
│   ├── extraction.ts
│   └── supabase.ts
├── schemas/         # Zod validation schemas
│   └── validation.ts
└── utils/           # Utility functions
    ├── date.ts
    ├── export.ts
    └── index.ts
```

### 2. Dependency Management

- **Root dependencies**: Only dev tools (TypeScript, Prettier, etc.)
- **Package dependencies**: Specific to each package's needs
- **Shared dependencies**: Minimal, only truly shared packages

### 3. Versioning

- Use `workspace:*` protocol for internal dependencies
- Keep external dependency versions synchronized
- Use `pnpm update -r` to update all packages together

### 4. Scripts Naming

Use consistent script names across packages:
- `dev` - Start development server
- `build` - Production build
- `test` - Run tests
- `type-check` - TypeScript validation
- `lint` - Lint code

### 5. Import Conventions

```typescript
// ✅ Good - Use package exports
import { myUtil } from '@medextract/shared/utils';

// ❌ Bad - Direct file imports
import { myUtil } from '@medextract/shared/src/utils/myUtil';
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: CI
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      
      - uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: 'pnpm'
      
      - run: pnpm install --frozen-lockfile
      - run: pnpm type-check
      - run: pnpm test
      - run: pnpm build
```

## Performance Tips

### 1. Parallel Builds

```bash
# Run commands in parallel across packages
pnpm -r --parallel build
```

### 2. Filtered Builds

```bash
# Only build changed packages
pnpm --filter=[HEAD^1] build
```

### 3. Caching

pnpm automatically caches dependencies. For CI:

```yaml
- uses: actions/cache@v3
  with:
    path: ~/.pnpm-store
    key: ${{ runner.os }}-pnpm-${{ hashFiles('**/pnpm-lock.yaml') }}
```

## Migration from Monolith

See [MONOREPO_MIGRATION.md](./MONOREPO_MIGRATION.md) for complete migration guide.

## Resources

- [pnpm Workspaces Documentation](https://pnpm.io/workspaces)
- [TypeScript Project References](https://www.typescriptlang.org/docs/handbook/project-references.html)
- [Monorepo Best Practices](https://monorepo.tools/)

## Support

For questions or issues:
1. Check this guide first
2. Review the migration documentation
3. Search existing issues
4. Create a new issue with reproduction steps
