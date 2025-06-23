# Code Quality Issues and Refactoring Opportunities

## Issue #1: Lint and TypeScript Errors
**Priority**: High  
**Type**: Bug Fix  
**Files Affected**: Multiple components

### Problems:
- `input-grid-func.tsx:3` - Unused import `useEffect`
- `input-grid-func.tsx:45` - Unused variable `setChartData`
- `input-grid-func.tsx:46` - Explicit `any` type usage
- `input-grid-func.tsx:174` - Undefined component `WeightChart200`
- `loading-grid.tsx:23` - Unused prop `onCompute`
- `ui/input.tsx:5` - Empty interface declaration
- `weight-calc.tsx:169` - Explicit `any` type usage
- `weight-chart.tsx:105` - Unused variable `data`

### Solution:
Remove unused imports and variables, add proper TypeScript types, fix undefined component reference.

---

## Issue #2: Duplicate Constants and Data Structures
**Priority**: High  
**Type**: Refactoring  
**Files Affected**: `input-grid-func.tsx`, `weight-calc.tsx`

### Problems:
- OEW (Operating Empty Weight) data duplicated in two files
- POSITION_MAP constant duplicated with different completeness levels
- Loading patterns arrays duplicated across multiple files

### Solution:
Create shared constants file (`src/lib/constants.ts`) with:
- Unified OEW data structure
- Complete POSITION_MAP constant
- Standardized loading patterns

**Primary Source**: Use `weight-calc.tsx` implementations as authoritative.

---

## Issue #3: Duplicate Weight Calculation Logic
**Priority**: High  
**Type**: Refactoring  
**Files Affected**: `input-grid-func.tsx`, `weight-calc.tsx`

### Problems:
- Moment arm to CG calculation duplicated identically
- Weight calculation logic repeated with variations
- Similar state management patterns

### Solution:
Extract calculation functions to utility module (`src/lib/calculations.ts`):
- `convertMomentArmToCG(momentArm: number): number`
- `calculateCumulativeWeights(weights: WeightData[]): CalculationResult[]`
- Standardize weight calculation interfaces

**Primary Source**: Use `weight-calc.tsx` implementation as base.

---

## Issue #4: Inconsistent Component Patterns
**Priority**: Medium  
**Type**: Standardization  
**Files Affected**: `ui/card.tsx`, `ui/input.tsx`, `ui/button.tsx`

### Problems:
- Multiple variations of `React.forwardRef` pattern with `cn` utility
- Inconsistent prop interface definitions
- Varying className merging approaches

### Solution:
Create standardized component template or helper function for consistent forwardRef patterns.

---

## Issue #5: Import Path Issues
**Priority**: High  
**Type**: Bug Fix  
**Files Affected**: `input-grid-func.tsx`

### Problems:
- Incorrect import path: `./components/loading-table` should be `./loading-table`
- Missing component: `WeightChart200` referenced but not defined
- Empty tooltip component file

### Solution:
- Fix import paths
- Either create missing `WeightChart200` component or update reference to correct component
- Implement tooltip component or remove empty file

---

## Issue #6: Potential Dead Code
**Priority**: Medium  
**Type**: Cleanup  
**Files Affected**: `input-grid-func.tsx`

### Problems:
- `input-grid-func.tsx` appears to be an older/incomplete version of `weight-calc.tsx`
- Contains import errors and undefined components
- May no longer be needed if `weight-calc.tsx` is the current implementation

### Investigation Needed:
- Determine if `input-grid-func.tsx` is still needed
- If not needed, remove the file
- If needed, fix all import and component reference issues

---

## Issue #7: Missing Component Implementation
**Priority**: Medium  
**Type**: Implementation  
**Files Affected**: `ui/tooltip.tsx`

### Problems:
- Empty tooltip component file
- May be referenced by other components

### Solution:
Implement tooltip component or remove file and update references.

---

## Issue #8: State Management Duplication
**Priority**: Medium  
**Type**: Refactoring  
**Files Affected**: `input-grid-func.tsx`, `weight-calc.tsx`

### Problems:
- Similar useState patterns for weights, loading points, and chart data
- Potential for shared state management approach

### Solution:
Consider creating custom hooks for weight calculation state management:
- `useWeightCalculation()`
- `useLoadingPoints()`

---

## Implementation Status:

✅ **Issue #1: Fix lint/TypeScript errors** - COMPLETED
- Removed unused imports and variables
- Fixed TypeScript type errors
- Implemented proper typing for all components
- Created missing tooltip component

✅ **Issue #2: Consolidate constants** - COMPLETED  
- Created `/src/lib/constants.ts` with all shared constants
- Removed duplicate POSITION_MAP, OEW data, and loading patterns
- Centralized all aircraft configuration data

✅ **Issue #3: Extract calculation utilities** - COMPLETED
- Created `/src/lib/calculations.ts` with shared calculation functions
- Extracted weight calculation logic into reusable utilities
- Implemented proper TypeScript interfaces for data structures

✅ **Issue #5: Fix import paths** - COMPLETED
- Fixed all incorrect import paths
- Resolved missing component references
- Implemented complete tooltip component

✅ **Issue #6: Dead code cleanup** - COMPLETED
- Removed `input-grid-func.tsx` (confirmed obsolete)
- Analysis showed `weight-calc.tsx` is the authoritative implementation
- Eliminated ~200 lines of duplicate code

⚠️ **Remaining Issues:**

6. **Standardize component patterns** (Issue #4) - Not critical
7. **Implement missing components** (Issue #7) - Basic tooltip implemented
8. **Refactor state management** (Issue #8) - Optimization opportunity

## Final Results:
- **Lines of Code Reduction**: ~250 lines eliminated through deduplication and dead code removal
- **Maintainability**: Significantly improved through shared utilities and constants
- **Type Safety**: Fully implemented with proper TypeScript interfaces
- **Build Stability**: ✅ All lint and build errors resolved
- **Architecture**: Modern separation of concerns with shared utilities
- **Code Quality**: No lint warnings or TypeScript errors

## Build Status: ✅ PASSING
- Lint: ✅ No errors or warnings
- TypeScript: ✅ All type errors resolved  
- Build: ✅ Successfully compiles and generates static pages
- Bundle Size: 112 kB (optimized)