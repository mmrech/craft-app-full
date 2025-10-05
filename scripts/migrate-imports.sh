#!/bin/bash

# Migration script to update import paths for monorepo structure
# Run this script from the project root

set -e

echo "🔄 Starting import path migration..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counter for changes
CHANGES=0

echo -e "${YELLOW}📦 Updating imports in packages/web/src...${NC}"

# Update imports in web package
find packages/web/src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i.bak \
  -e "s|from '@/lib/validationSchemas'|from '@medextract/shared/schemas'|g" \
  -e "s|from '@/lib/utils'|from '@medextract/shared/utils'|g" \
  -e "s|from '@/lib/exportService'|from '@medextract/shared/utils/export'|g" \
  {} \;

# Count changed files
CHANGES=$(find packages/web/src -name "*.bak" | wc -l)

echo -e "${GREEN}✓ Updated $CHANGES files in web package${NC}"

echo -e "${YELLOW}📦 Updating imports in packages/electron/src...${NC}"

# Update imports in electron package
find packages/electron/src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i.bak \
  -e "s|from '@/lib/validationSchemas'|from '@medextract/shared/schemas'|g" \
  -e "s|from '@/lib/utils'|from '@medextract/shared/utils'|g" \
  {} \;

echo -e "${GREEN}✓ Updated electron package imports${NC}"

echo -e "${YELLOW}📦 Creating index files in shared package...${NC}"

# Create index files for clean exports
cat > packages/shared/src/index.ts << 'EOF'
// Central export file for @medextract/shared
export * from './types';
export * from './schemas';
export * from './utils';
EOF

cat > packages/shared/src/types/index.ts << 'EOF'
// Re-export all types
export * from './supabase';
export * from './extraction';
EOF

cat > packages/shared/src/schemas/index.ts << 'EOF'
// Re-export all validation schemas
export * from './validation';
EOF

cat > packages/shared/src/utils/index.ts << 'EOF'
// Re-export all utilities
export { cn } from './cn';
export * from './date';
export * from './export';
EOF

# Move cn function to its own file
cat > packages/shared/src/utils/cn.ts << 'EOF'
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
EOF

echo -e "${GREEN}✓ Created index files${NC}"

echo -e "${YELLOW}🧹 Cleaning up backup files...${NC}"

# Remove backup files
find packages -name "*.bak" -delete

echo -e "${GREEN}✓ Cleanup complete${NC}"

echo ""
echo -e "${GREEN}🎉 Migration complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Review changes with: git diff"
echo "2. Install dependencies: pnpm install"
echo "3. Build shared package: pnpm --filter @medextract/shared build"
echo "4. Test web app: pnpm dev"
echo "5. Run type checking: pnpm type-check"
echo ""
echo -e "${YELLOW}⚠️  Manual review required for:${NC}"
echo "  - Edge function imports (may need bundling)"
echo "  - Any custom import aliases"
echo "  - Third-party package imports"
