# API Reference

This document provides detailed API documentation for all functions and classes in the Boeing 777 Weight & Balance application.

## Table of Contents

- [Calculations Module](#calculations-module)
- [Units Module](#units-module) 
- [Optimization Module](#optimization-module)
- [Database Module](#database-module)
- [Constants](#constants)
- [Type Definitions](#type-definitions)

---

## Calculations Module

**File**: `src/lib/calculations.ts`

Core functions for weight and balance calculations.

### `convertMomentArmToCG(momentArm: number): number`

Converts a moment arm value to center of gravity percentage of Mean Aerodynamic Chord (%MAC).

**Parameters:**
- `momentArm` (number): Moment arm in inches

**Returns:** 
- `number`: Center of gravity as percentage of MAC

**Formula:**
```typescript
((momentArm - CG_CONSTANTS.MOMENT_ARM_REFERENCE) * 100) / CG_CONSTANTS.MAC_REFERENCE
```

**Example:**
```typescript
const cg = convertMomentArmToCG(1230);
// Returns: 19.9
```

---

### `getFuelArm(fuelWeight: number): number`

Calculates fuel moment arm using linear interpolation from the fuel CG data table.

**Parameters:**
- `fuelWeight` (number): Fuel weight in pounds

**Returns:**
- `number`: Interpolated fuel moment arm in inches

**Behavior:**
- Returns 0 for zero or negative fuel weight
- Uses linear interpolation between table entries
- Returns maximum table value for weights beyond table range

**Example:**
```typescript
const fuelArm = getFuelArm(15000);
// Returns: ~1148.3 (interpolated value)
```

---

### `calculateCumulativeWeights(weights: WeightData[], variant: AircraftVariant)`

Calculates cumulative weight progression and center of gravity for a loading sequence.

**Parameters:**
- `weights` (WeightData[]): Array of weight and position data
- `variant` (AircraftVariant): Aircraft variant ('300ER' or '200LR')

**Returns:**
```typescript
{
  results: CalculationResult[];    // Step-by-step calculation data
  loadingPoints: LoadingPoint[];   // CG progression points for charting
}
```

**Process:**
1. Starts with Operating Empty Weight (OEW) for specified variant
2. Iterates through weights in sequence
3. Calculates running totals of weight and moments
4. Computes center of gravity at each step
5. Skips zero weights and unknown position codes

**Example:**
```typescript
const weights = [
  { position: 'AL', weight: 5000 },
  { position: 'BL', weight: 6000 }
];

const result = calculateCumulativeWeights(weights, '300ER');
// Returns calculation steps and loading points
```

---

### `addFuelToCalculation(lastResult: CalculationResult, fuelWeight: number)`

Adds fuel loading to existing weight and balance calculation.

**Parameters:**
- `lastResult` (CalculationResult): Last calculation result from cargo loading
- `fuelWeight` (number): Fuel weight to add in pounds

**Returns:**
```typescript
{
  result: CalculationResult;    // Updated calculation with fuel
  loadingPoint: LoadingPoint;   // Final loading point with fuel
}
```

**Process:**
1. Calculates fuel moment arm using `getFuelArm()`
2. Computes fuel moment (weight × arm)
3. Updates total weight and moment
4. Recalculates center of gravity

**Example:**
```typescript
const fuelResult = addFuelToCalculation(lastCargoResult, 150000);
// Returns updated calculation with fuel added
```

---

## Units Module

**File**: `src/lib/units.ts`

Utility functions for weight unit conversions and formatting.

### `convertWeight(weight: number, units: Units): number`

Converts weight based on specified units.

**Parameters:**
- `weight` (number): Weight value in pounds
- `units` (Units): Target units ('LB' or 'KG')

**Returns:**
- `number`: Weight in specified units (rounded to nearest integer for KG)

**Conversion Factor:** 1 lb = 0.453592 kg

**Example:**
```typescript
convertWeight(1000, 'LB');  // Returns: 1000
convertWeight(1000, 'KG');  // Returns: 454
```

---

### `formatWeight(weight: number, units: Units): string`

Formats weight with appropriate units and thousands separators.

**Parameters:**
- `weight` (number): Weight value in pounds
- `units` (Units): Display units ('LB' or 'KG')

**Returns:**
- `string`: Formatted weight string with units

**Example:**
```typescript
formatWeight(123456, 'LB');  // Returns: "123,456 LB"
formatWeight(123456, 'KG');  // Returns: "55,984 KG"
```

---

### `getWeightUnit(units: Units): string`

Returns lowercase unit abbreviation.

**Parameters:**
- `units` (Units): Unit type ('LB' or 'KG')

**Returns:**
- `string`: Lowercase unit ("lbs" or "kg")

---

### `getWeightUnitShort(units: Units): string`

Returns uppercase unit abbreviation.

**Parameters:**
- `units` (Units): Unit type ('LB' or 'KG')

**Returns:**
- `string`: Uppercase unit ("LB" or "KG")

---

## Optimization Module

**File**: `src/lib/optimization.ts`

Advanced optimization algorithms for cargo arrangement.

### `optimizeCargoWithPSO(weights: WeightData[], config: PSO_Config, fitnessFunction: Function): PSO_Result`

Optimizes cargo arrangement using Particle Swarm Optimization.

**Parameters:**
- `weights` (WeightData[]): Initial cargo weights
- `config` (PSO_Config): Algorithm configuration
- `fitnessFunction` (Function): Fitness evaluation function

**PSO_Config:**
```typescript
{
  numParticles: number;      // Number of particles in swarm
  maxIterations: number;     // Maximum optimization iterations
  inertiaWeight: number;     // Particle inertia (0.4-0.9)
  cognitiveWeight: number;   // Cognitive learning rate (1.4-2.0)
  socialWeight: number;      // Social learning rate (1.4-2.0)
  targetCG?: number;         // Optional target CG percentage
  variant: '300ER' | '200LR'; // Aircraft variant
}
```

**Returns:**
```typescript
{
  bestArrangement: WeightData[];  // Optimal cargo arrangement
  bestFitness: number;           // Best fitness score achieved
  iterations: number;            // Actual iterations performed
  convergenceHistory: number[];  // Fitness progression history
}
```

**Example:**
```typescript
const psoConfig = {
  numParticles: 20,
  maxIterations: 100,
  inertiaWeight: 0.7,
  cognitiveWeight: 1.5,
  socialWeight: 1.5,
  variant: '300ER'
};

const result = optimizeCargoWithPSO(weights, psoConfig, fitnessFunc);
```

---

### `optimizeCargoWithILP(weights: WeightData[], config: ILP_Config, objectiveFunction: Function, constraintFunction: Function): ILP_Result`

Optimizes cargo arrangement using Integer Linear Programming approach.

**Parameters:**
- `weights` (WeightData[]): Initial cargo weights  
- `config` (ILP_Config): Algorithm configuration
- `objectiveFunction` (Function): Objective function to minimize
- `constraintFunction` (Function): Constraint validation function

**Returns:**
```typescript
{
  optimalArrangement: WeightData[];  // Optimal arrangement found
  optimalValue: number;              // Best objective value
  feasible: boolean;                 // Whether solution satisfies constraints
  iterations: number;                // Iterations performed
}
```

---

### `createCGFitnessFunction(variant: AircraftVariant, targetCG?: number, calculateFunction?: Function, envelopeFunction?: Function): Function`

Creates a fitness function for PSO optimization focused on CG objectives.

**Parameters:**
- `variant` (AircraftVariant): Aircraft variant
- `targetCG` (number, optional): Target CG percentage
- `calculateFunction` (Function, optional): Weight calculation function
- `envelopeFunction` (Function, optional): Envelope validation function

**Returns:**
- `Function`: Fitness function that evaluates arrangements

**Scoring:**
- Heavy penalties for envelope violations (1,000,000+ points)
- Medium penalties for intermediate violations (10,000 points)  
- CG deviation penalty (100 × |actual - target|)

---

### `createConstraintFunction(variant: AircraftVariant, calculateFunction?: Function, envelopeFunction?: Function): Function`

Creates a constraint validation function for ILP optimization.

**Returns:**
- `Function`: Boolean function that validates arrangement feasibility

---

### `createObjectiveFunction(variant: AircraftVariant, targetCG?: number, calculateFunction?: Function): Function`

Creates an objective function that minimizes CG deviation from target.

**Default Targets:**
- 300ER: 28.0% MAC
- 200LR: 26.0% MAC

---

## Database Module

**File**: `src/lib/database.ts`

IndexedDB integration for persistent storage.

### `class WeightBalanceDatabase`

Main database class providing CRUD operations for all data types.

#### Database Schema

**Object Stores:**
- `loading_patterns`: Saved cargo loading patterns
- `optimization_history`: Historical optimization results
- `pattern_rankings`: Performance rankings for patterns
- `custom_positions`: User-defined cargo positions
- `custom_pallet_styles`: Custom pallet specifications

#### Key Methods

##### `async init(): Promise<void>`
Initializes database connection and creates object stores if needed.

##### `async saveLoadingPattern(pattern: Omit<LoadingPattern, 'id'>): Promise<number>`
Saves a new loading pattern to database.

**Returns:** Generated pattern ID

##### `async getLoadingPatterns(): Promise<LoadingPattern[]>`
Retrieves all saved loading patterns.

##### `async saveOptimizationHistory(history: Omit<OptimizationHistory, 'id'>): Promise<number>`
Records optimization attempt with results and performance data.

##### `async getOptimizationStats(patternId: number): Promise<OptimizationStats>`
Calculates performance statistics for a specific loading pattern.

**Returns:**
```typescript
{
  totalUses: number;
  successRate: number;
  avgCGImprovement: number;
  avgOptimizationTime: number;
  methodDistribution: Record<string, number>;
}
```

##### `async updatePatternRanking(patternId: number): Promise<void>`
Updates performance ranking for a loading pattern based on usage statistics.

**Ranking Factors:**
- Success rate (30% weight)
- Usage count (20% weight)  
- CG optimization (20% weight)
- Speed (15% weight)
- User rating (15% weight)

##### `async getAnalytics(): Promise<AnalyticsData>`
Generates comprehensive analytics across all patterns and optimizations.

---

## Constants

**File**: `src/lib/constants.ts`

Aircraft data and configuration constants.

### `POSITION_MAP`
Maps cargo position codes to moment arm values (inches).

```typescript
{
  AL: 460,   AR: 460,   // Forward positions
  BL: 586,   BR: 586,
  CL: 712,   CR: 712,
  // ... additional positions
  R: 2095    // Bulk position
}
```

### `OEW_DATA` 
Operating Empty Weight data for aircraft variants.

```typescript
{
  '300ER': {
    weight: 321000,      // Operating empty weight (lbs)
    momentArm: 1230,     // Moment arm (inches)  
    moment: 394830000,   // Moment (lb-in)
    cg: 19.928          // Center of gravity (%MAC)
  },
  '200LR': { /* ... */ }
}
```

### `FUEL_CG_DATA`
Fuel center of gravity interpolation table.

Array of [weight, momentArm] pairs from 100 to 27,290 lbs.

### `LOADING_PATTERNS`
Predefined cargo loading sequences.

```typescript
{
  default: ['R', 'PL', 'PR', 'AL', 'AR', ...],
  forward: ['R', 'AL', 'AR', 'BL', 'BR', ...],
  aft: ['ML', 'MR', 'LL', 'LR', 'KL', ...],
  balanced: ['FL', 'FR', 'EL', 'ER', ...]
}
```

### `CG_CONSTANTS`
Reference values for CG calculations.

```typescript
{
  MOMENT_ARM_REFERENCE: 1174.5,  // Reference moment arm
  MAC_REFERENCE: 278.5           // Mean Aerodynamic Chord length
}
```

---

## Type Definitions

### `WeightData`
```typescript
interface WeightData {
  weight: number;    // Weight in pounds
  position: string;  // Position code (AL, AR, etc.)
}
```

### `LoadingPoint` 
```typescript
interface LoadingPoint {
  cg: number;       // Center of gravity (%MAC)
  weight: number;   // Total aircraft weight (lbs)
}
```

### `CalculationResult`
```typescript
interface CalculationResult {
  position: string;    // Position code or 'OEW'/'FUEL'
  momentArm: number;   // Moment arm (inches)
  weight: number;      // Individual weight (lbs)
  moment: number;      // Weight × moment arm (lb-in)
  sumWeight: number;   // Cumulative weight (lbs)
  sumMoment: number;   // Cumulative moment (lb-in)
  sumBA: number;       // Balance arm (inches)
  mac: number;         // Center of gravity (%MAC)
}
```

### `LoadingPattern`
```typescript
interface LoadingPattern {
  id?: number;
  name: string;
  sequence: string[];        // Position codes in loading order
  created_at: Date;
  used_count: number;       // Usage frequency
  success_rate: number;     // Success percentage
  avg_final_cg: number;     // Average final CG achieved
  avg_optimization_time: number;
  rating: number;           // 1-5 star user rating
  tags: string[];
  notes: string;
}
```

### `Units`
```typescript
type Units = 'LB' | 'KG';
```

### `AircraftVariant` 
```typescript
type AircraftVariant = '300ER' | '200LR';
```

### `PositionCode`
```typescript
type PositionCode = 'AL' | 'AR' | 'BL' | 'BR' | 'CL' | 'CR' | 
                   'DL' | 'DR' | 'EL' | 'ER' | 'FL' | 'FR' |
                   'GL' | 'GR' | 'HL' | 'HR' | 'JL' | 'JR' |
                   'KL' | 'KR' | 'LL' | 'LR' | 'ML' | 'MR' |
                   'PL' | 'PR' | 'R';
```

---

## Usage Examples

### Basic Weight Calculation

```typescript
import { calculateCumulativeWeights, addFuelToCalculation } from '@/lib/calculations';
import { formatWeight } from '@/lib/units';

// Define cargo weights
const weights = [
  { position: 'AL', weight: 6000 },
  { position: 'BL', weight: 7000 },
  { position: 'CL', weight: 5500 }
];

// Calculate loading progression
const { results, loadingPoints } = calculateCumulativeWeights(weights, '300ER');

// Add fuel
const lastCargoResult = results[results.length - 1];
const { result: fuelResult } = addFuelToCalculation(lastCargoResult, 180000);

// Display final result
console.log(`Final CG: ${fuelResult.mac.toFixed(1)}% MAC`);
console.log(`Final Weight: ${formatWeight(fuelResult.sumWeight, 'LB')}`);
```

### PSO Optimization

```typescript
import { optimizeCargoWithPSO, createCGFitnessFunction } from '@/lib/optimization';

// Create fitness function
const fitnessFunc = createCGFitnessFunction(
  '300ER', 
  25.0,  // Target 25% MAC
  calculateCumulativeWeights,
  isPointInEnvelope
);

// Configure PSO
const config = {
  numParticles: 30,
  maxIterations: 150,
  inertiaWeight: 0.7,
  cognitiveWeight: 1.5,
  socialWeight: 1.5,
  variant: '300ER'
};

// Optimize arrangement
const result = optimizeCargoWithPSO(weights, config, fitnessFunc);

console.log('Optimized arrangement:', result.bestArrangement);
console.log('Fitness score:', result.bestFitness);
```

### Database Operations

```typescript
import { weightBalanceDB } from '@/lib/database';

// Save loading pattern
const patternId = await weightBalanceDB.saveLoadingPattern({
  name: 'Heavy Forward Loading',
  sequence: ['R', 'AL', 'AR', 'BL', 'BR', 'CL', 'CR'],
  created_at: new Date(),
  used_count: 0,
  success_rate: 0,
  avg_final_cg: 0,
  avg_optimization_time: 0,
  rating: 5,
  tags: ['forward', 'heavy'],
  notes: 'Optimized for forward CG'
});

// Record optimization attempt
await weightBalanceDB.saveOptimizationHistory({
  pattern_id: patternId,
  aircraft_variant: '300ER',
  method: 'PSO',
  initial_weights: weights,
  final_weights: result.bestArrangement,
  initial_cg: 22.5,
  final_cg: 25.0,
  optimization_time: 1250,
  envelope_violations: 0,
  success: true,
  created_at: new Date(),
  fuel_weight: 180000,
  total_weight: 650000,
  cg_improvement: 2.5
});
```

---

This API reference provides comprehensive documentation for all public functions and interfaces in the Boeing 777 Weight & Balance application. For implementation details and usage examples, refer to the respective source files and test cases.