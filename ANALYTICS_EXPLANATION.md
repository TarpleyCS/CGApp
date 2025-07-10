# Analytics Data Sources & Calculations

## 🔢 **How Analytics Values Are Generated**

### **Pattern Names**
Pattern names in analytics come from multiple sources:

1. **Built-in Patterns**: `default`, `forward`, `aft`, `balanced` (from `LOADING_PATTERNS`)
2. **Custom Patterns**: User-created patterns from the Pattern Creator tab
3. **Auto-generated Names**: When optimizations run, they create patterns like:
   - `${selectedPattern}-basic` (e.g., "default-basic")
   - `${selectedPattern}-PSO` (e.g., "forward-PSO") 
   - `${selectedPattern}-ILP` (e.g., "aft-ILP")

**Example Pattern Names You'll See:**
- `default-basic` - Basic optimization on default pattern
- `forward-PSO` - PSO optimization on forward loading pattern
- `My Custom Pattern` - User-created pattern name
- `balanced-ILP` - ILP optimization on balanced pattern

### **Success Rate Calculation**
Success is determined differently for each optimization method:

#### **Basic Optimization**
```javascript
const success = bestScore < 1000000; // Success if no major envelope violations
```

#### **PSO (Particle Swarm Optimization)**
```javascript
const success = result.bestFitness < 1000; // Success based on fitness threshold
```

#### **ILP (Integer Linear Programming)**
```javascript
const success = result.converged && result.objectiveValue < 1000;
```

**Success Rate Formula:**
```javascript
successRate = successfulOptimizations / totalOptimizations
```

### **Pattern Score Calculation**
The comprehensive score (0-100) is calculated using weighted factors:

```javascript
const weights = {
  successRate: 0.3,    // 30% - How often optimizations succeed
  usageCount: 0.2,     // 20% - How frequently pattern is used
  cgOptimization: 0.2, // 20% - How well it optimizes CG
  speed: 0.15,         // 15% - How fast optimizations complete
  userRating: 0.15     // 15% - User's 1-5 star rating
};

score = (successRate * 100 * 0.3) +
        (Math.min(usageCount, 100) * 0.2) +
        (Math.max(0, 100 - Math.abs(avgCGImprovement)) * 0.2) +
        (Math.max(0, 100 - (avgOptimizationTime / 1000)) * 0.15) +
        (userRating * 20 * 0.15);
```

### **Performance Metrics**

#### **Envelope Compliance**
```javascript
envelope_compliance = successRate * 100
```
Shows what percentage of optimizations stay within flight envelope.

#### **Fuel Efficiency** 
```javascript
fuel_efficiency = Math.max(0, 100 - Math.abs(avgCGImprovement - 25))
```
Closer to 25% MAC is considered optimal for fuel efficiency.

#### **Loading Speed**
```javascript
loading_speed = Math.max(0, 100 - (avgOptimizationTime / 1000))
```
Faster optimization times score higher.

#### **Versatility**
```javascript
versatility = Math.min(100, Object.keys(methodDistribution).length * 25)
```
Patterns used with more optimization methods score higher.

---

## 📊 **Where Each Value Comes From**

### **In the Analytics Dashboard:**

#### **Overview Cards**
- **Total Patterns**: `dbPatterns.length` (database patterns)
- **Total Optimizations**: `history.length` (all optimization attempts)
- **Success Rate**: `successCount / history.length`
- **Preferred Method**: Most frequent method in optimization history

#### **Top Performing Patterns**
- **Rank**: Calculated by sorting all patterns by score
- **Score**: Weighted calculation shown above
- **Success Rate**: Pattern-specific success percentage
- **Usage Count**: `pattern.used_count` (incremented each use)
- **Average CG**: `stats.avgCGImprovement`
- **Average Time**: `stats.avgOptimizationTime`

#### **Recent Activity**
- **Method**: `optimization.method` (basic, PSO, ILP, manual)
- **Success/Failure**: `optimization.success` boolean
- **CG Change**: `initial_cg` → `final_cg`
- **Date**: `optimization.created_at`

---

## 🎯 **How to Interpret the Data**

### **High-Scoring Patterns (80-100)**
- **High success rate** (>80% optimizations succeed)
- **Frequently used** (pattern used often)
- **Good CG optimization** (achieves balanced center of gravity)
- **Fast optimization** (completes quickly)
- **High user rating** (4-5 stars)

### **Medium-Scoring Patterns (60-79)**
- **Moderate success rate** (60-80% success)
- **Occasional use** (used sometimes)
- **Decent CG results** (reasonable center of gravity)
- **Average speed** (normal optimization times)
- **Good user rating** (3-4 stars)

### **Low-Scoring Patterns (<60)**
- **Poor success rate** (<60% success)
- **Rarely used** (pattern avoided)
- **Poor CG optimization** (unbalanced results)
- **Slow optimization** (takes long time)
- **Low user rating** (1-2 stars)

---

## 🔧 **How Data Gets Updated**

### **When You Run Optimizations:**
1. **Optimization tracking** records attempt in database
2. **Pattern usage** counter increments
3. **Success/failure** status recorded
4. **Performance metrics** calculated
5. **Pattern ranking** updated automatically

### **When You Rate Patterns:**
1. **User rating** stored in database
2. **Pattern score** recalculated with new rating
3. **Rankings** updated across all patterns

### **When You Create Custom Patterns:**
1. **New pattern** added to database
2. **Initial rating** set to 3 stars
3. **Usage stats** start at 0
4. **Available** for selection and optimization

---

## 📈 **Data Flow Example**

Let's trace what happens when you run a PSO optimization:

1. **User clicks "PSO" button**
2. **Pattern name** created: `"${selectedPattern}-PSO"`
3. **Optimization runs** and completes
4. **Success determined**: `result.bestFitness < 1000`
5. **Data recorded**:
   - Initial weights and CG
   - Final weights and CG
   - Optimization time
   - Success status
   - Method used (PSO)
6. **Pattern stats updated**:
   - Usage count +1
   - Success rate recalculated
   - Average CG updated
   - Average time updated
7. **Score recalculated** using weighted formula
8. **Ranking updated** among all patterns
9. **Analytics dashboard** shows updated data

This creates a complete feedback loop where the system learns from your usage patterns and provides insights into what works best for your specific scenarios.

---

## 🛠️ **Testing the System**

To see how values are calculated:

```javascript
// Open browser console and run:
const patterns = await weightBalanceDB.getLoadingPatterns();
const history = await weightBalanceDB.getOptimizationHistory();
const rankings = await weightBalanceDB.getTopPatterns(10);

console.log('Patterns:', patterns);
console.log('History:', history);
console.log('Rankings:', rankings);

// Check specific pattern stats
const stats = await weightBalanceDB.getOptimizationStats(1); // Pattern ID 1
console.log('Pattern 1 stats:', stats);
```

This will show you exactly how each value is calculated and stored in the database.