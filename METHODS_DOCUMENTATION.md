# 777 Weight & Balance Application - Methods Documentation

## Overview
This document provides a comprehensive list of all methods, functions, and their purposes within the 777 Weight & Balance application.

---

## Core Calculation Functions

### `src/lib/calculations.ts`

#### `convertMomentArmToCG(momentArm: number): number`
- **Purpose**: Converts moment arm to center of gravity percentage
- **Parameters**: `momentArm` - The moment arm value in inches
- **Returns**: CG percentage of Mean Aerodynamic Chord (%MAC)
- **Formula**: `((momentArm - CG_CONSTANTS.MOMENT_ARM_REFERENCE) * 100) / CG_CONSTANTS.MAC_REFERENCE`

#### `getFuelArm(fuelWeight: number): number`
- **Purpose**: Calculates fuel arm based on weight using interpolation from fuel CG data
- **Parameters**: `fuelWeight` - Fuel weight in pounds
- **Returns**: Interpolated fuel arm position
- **Logic**: Uses linear interpolation between data points in `FUEL_CG_DATA` table

#### `calculateCumulativeWeights(weights: WeightData[], variant: AircraftVariant)`
- **Purpose**: Calculates cumulative weights, moments, and CG for a loading sequence
- **Parameters**: 
  - `weights` - Array of weight data with position and weight
  - `variant` - Aircraft variant ('300ER' or '200LR')
- **Returns**: Object containing `results` (calculation steps) and `loadingPoints` (CG progression)
- **Process**: Iterates through weights, calculating running totals and CG at each step

#### `addFuelToCalculation(lastResult: CalculationResult, fuelWeight: number)`
- **Purpose**: Adds fuel loading to existing calculation results
- **Parameters**: 
  - `lastResult` - Last calculation result from cargo loading
  - `fuelWeight` - Fuel weight to add
- **Returns**: Updated calculation result and loading point with fuel included

---

## Main Application Component

### `src/components/weight-calc.tsx`

#### State Management Methods

##### `handleCompute(weights: WeightData[])`
- **Purpose**: Main computation handler for weight and balance calculations
- **Parameters**: `weights` - Array of cargo weights and positions
- **Process**: 
  1. Resets fuel state
  2. Calculates cumulative weights and CG progression
  3. Updates loading points and table data
  4. Calculates opportunity window if multiple weights exist

##### `handleFuelLoad(weight: number)`
- **Purpose**: Handles fuel loading after cargo is loaded
- **Parameters**: `weight` - Fuel weight in pounds
- **Process**: 
  1. Validates fuel weight > 0
  2. Calculates fuel addition to last cargo result
  3. Updates loading progression with fuel point
  4. Sets fuel loaded state

#### Test and Fill Methods

##### `handleTestFill()`
- **Purpose**: Automatically generates random test weights for all cargo positions
- **Process**:
  1. Gets current loading pattern positions
  2. Generates random weights (5000-8000 lbs) for each position
  3. Sets test weights and triggers computation

#### Optimization Methods

##### `isPointInEnvelope(cg: number, weight: number): boolean`
- **Purpose**: Checks if a CG/weight point falls within aircraft operating envelope
- **Parameters**: 
  - `cg` - Center of gravity (%MAC)
  - `weight` - Aircraft weight (lbs)
- **Returns**: Boolean indicating if point is within safe envelope
- **Logic**: Uses envelope boundary data for each aircraft variant

##### `getMaxWeightForCG(targetCG: number, envelope: Array<{cg: number, weight: number}>): number`
- **Purpose**: Finds maximum allowable weight for a given CG position
- **Parameters**: 
  - `targetCG` - Target center of gravity position
  - `envelope` - Envelope boundary points
- **Returns**: Maximum weight allowed at that CG
- **Method**: Linear interpolation between envelope boundary points

##### `getMinWeightForCG(targetCG: number, envelope: Array<{cg: number, weight: number}>): number`
- **Purpose**: Finds minimum allowable weight for a given CG position
- **Parameters**: Similar to `getMaxWeightForCG`
- **Returns**: Minimum weight allowed at that CG

##### `handleOptimize()`
- **Purpose**: Optimizes cargo arrangement to stay within envelope limits
- **Process**:
  1. Tests 50 different cargo arrangements
  2. Scores each based on envelope violations
  3. Selects arrangement with fewest/smallest violations
  4. Applies best arrangement found

#### Opportunity Window Methods

##### `calculateOpportunityWindow(weights: WeightData[]): LoadingPoint[]`
- **Purpose**: Calculates range of possible CG positions with current weights
- **Parameters**: `weights` - Current cargo weight distribution
- **Returns**: Array of points showing min/max CG possibilities
- **Process**:
  1. Generates up to 100 different loading arrangements
  2. Uses strategic and random cargo positioning
  3. Calculates CG progression for each arrangement
  4. Identifies min/max CG at each weight level

##### `handleOpportunitySelect(direction: 'forward' | 'aft')`
- **Purpose**: Finds arrangement for maximum forward or aft CG
- **Parameters**: `direction` - Target CG direction ('forward' for max CG, 'aft' for min CG)
- **Process**:
  1. Tests up to 200 arrangements
  2. Uses strategic sorting (heavy first for forward, light first for aft)
  3. Finds arrangement achieving extreme CG in desired direction
  4. Applies optimal arrangement

---

## UI Components

### `src/components/loading-grid.tsx`

#### `handleWeightChange(index: number, value: string)`
- **Purpose**: Updates individual pallet weight in the loading sequence
- **Parameters**: 
  - `index` - Position index in weights array
  - `value` - New weight value as string
- **Process**: Updates weight array and triggers parent computation

#### `addWeight()`
- **Purpose**: Adds new pallet position to loading sequence
- **Logic**: Adds next position from sequence with default 6000 lb weight

#### `removeWeight(index: number)`
- **Purpose**: Removes pallet from loading sequence
- **Parameters**: `index` - Position to remove
- **Logic**: Prevents removal if only one weight remains

#### `handleFuelChange(value: string)` & `handleLoadFuel()`
- **Purpose**: Manages fuel weight input and loading
- **Process**: Validates and triggers fuel loading through parent callback

### `src/components/weight-chart.tsx`

#### `WeightChart({variant, loadingPoints, opportunityWindow})`
- **Purpose**: Renders interactive CG envelope chart
- **Parameters**:
  - `variant` - Aircraft variant ('300ER' or '200LR')
  - `loadingPoints` - Loading progression points
  - `opportunityWindow` - CG opportunity range points
- **Features**:
  - Displays aircraft envelope boundaries
  - Shows loading progression line
  - Displays opportunity window as scattered points
  - Interactive tooltips with weight/CG data

### `src/components/loading-table.tsx`

#### `LoadingTable({data})`
- **Purpose**: Displays detailed loading progression data in tabular format
- **Parameters**: `data` - Array of calculation results
- **Features**: Shows position, weight, moment, cumulative totals, and CG progression

---

## Custom UI Components

### `src/components/ui/tabs.tsx`

#### `Tabs` Component
- **Purpose**: Main tab container with state management
- **Features**: Supports controlled/uncontrolled modes, context-based state

#### `TabsList`, `TabsTrigger`, `TabsContent`
- **Purpose**: Individual tab interface components
- **Features**: Clean styling, active/inactive states, accessibility support

### `src/components/ui/button.tsx`

#### `Button` Component
- **Purpose**: Reusable button component with multiple variants
- **Variants**: default, destructive, outline, secondary, ghost, link
- **Sizes**: default, sm, lg, icon

---

## Constants and Data

### `src/lib/constants.ts`

#### `POSITION_MAP`
- **Purpose**: Maps cargo position codes to moment arm values
- **Data**: Position codes (AL, AR, BL, etc.) to moment arms in inches

#### `OEW_DATA`
- **Purpose**: Operating Empty Weight data for aircraft variants
- **Data**: Weight, moment arm, moment, and CG for each variant

#### `LOADING_PATTERNS`
- **Purpose**: Predefined cargo loading sequences
- **Patterns**: default, forward, aft, balanced loading strategies

#### `FUEL_CG_DATA`
- **Purpose**: Fuel center of gravity interpolation table
- **Data**: Weight/CG pairs for fuel arm calculations (100-27,290 lbs)

#### `CG_CONSTANTS`
- **Purpose**: Reference values for CG calculations
- **Values**: Moment arm reference (1174.5) and MAC reference (278.5)

---

## Type Definitions

### Interface Definitions

#### `WeightData`
```typescript
{
  weight: number;    // Weight in pounds
  position: string;  // Position code (AL, AR, etc.)
}
```

#### `LoadingPoint`
```typescript
{
  cg: number;       // Center of gravity (%MAC)
  weight: number;   // Total weight (lbs)
}
```

#### `CalculationResult`
```typescript
{
  position: string;    // Position code or 'OEW'/'FUEL'
  momentArm: number;   // Moment arm (inches)
  weight: number;      // Individual weight (lbs)
  moment: number;      // Weight × moment arm
  sumWeight: number;   // Cumulative weight
  sumMoment: number;   // Cumulative moment
  sumBA: number;       // Cumulative balance arm
  mac: number;         // Center of gravity (%MAC)
}
```

---

## Usage Workflow

1. **Initialization**: Load aircraft variant and OEW data
2. **Weight Input**: Use LoadingGrid to input cargo weights
3. **Computation**: handleCompute calculates progression and opportunity window
4. **Optimization**: Use optimize/opportunity buttons for arrangement improvements
5. **Fuel Loading**: Add fuel using dedicated fuel input section
6. **Visualization**: View results in resizable chart with envelope boundaries
7. **Analysis**: Review detailed data in Loading Data tab and summary metrics

---

## Key Features

- **Real-time CG calculation** with envelope boundary checking
- **Opportunity window analysis** showing CG flexibility range
- **Automated optimization** for envelope compliance
- **Interactive resizable chart** as main focal point
- **Collapsible sidebar** for efficient space utilization
- **Tabbed interface** for organized data presentation
- **Responsive design** for various screen sizes