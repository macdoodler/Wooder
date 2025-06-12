# CUTTING OPTIMIZATION SYSTEM - ALL LIMITS AND CONDITIONS

## 🚨 URGENT: OVERLAPPING PARTS ISSUE

You're experiencing overlapping parts again. This could be due to:
1. **Additional rotation logic bugs** - I just found and fixed another instance in `validateNoOverlaps()`
2. **Spatial grid collision detection** not being properly updated
3. **Multiple collision detection systems** conflicting with each other

## 📋 COMPREHENSIVE SYSTEM LIMITS AND CONDITIONS

### 1. **PLACEMENT ATTEMPT LIMITS**
```typescript
// File: cut-helpers.ts
const maxAttemptsPerSheet = 500; // Recently increased from 100
```
- **Purpose**: Prevents infinite loops when placing parts
- **Impact**: Limits how many placement attempts per sheet
- **Current Setting**: 500 attempts per sheet

### 2. **MAXIMUM SHEETS LIMIT**
```typescript
// File: optimized-cutting-engine.ts
const maxSheets = 50; // Hard limit in MultiSheetOptimizer
const maxNewSheets = 100; // In cut-helpers.ts
```
- **Purpose**: Prevents excessive sheet usage
- **Impact**: Algorithm stops after processing 50-100 sheets
- **Risk**: May cause "partial placement" if hit

### 3. **STRATEGIC DISTRIBUTION EFFICIENCY TARGETS**
```typescript
// File: optimized-cutting-engine.ts - calculateStrategicPartDistribution()
let targetSheetEfficiency = 0.85; // Base target
// Can increase to 0.95 for small parts
// Can increase to 0.98 for abundant sheets
```
- **Purpose**: Controls how much of a sheet should be filled before moving to next sheet
- **Impact**: Parts may be rejected if efficiency target exceeded
- **Risk**: Overly conservative targets can prevent placement

### 4. **COLLISION DETECTION TOLERANCE**
```typescript
const TOLERANCE = 0.01; // 0.01mm tolerance in multiple places
```
- **Purpose**: Accounts for floating-point precision errors
- **Impact**: Parts must be at least 0.01mm apart
- **Risk**: Could cause false collisions if tolerance too small

### 5. **MINIMUM PART SIZE FILTERS**
```typescript
// Waste regions only considered if > 50×50mm
if (freeSpace.width > 50 && freeSpace.height > 50)
```
- **Purpose**: Ignore tiny unusable spaces
- **Impact**: Small parts might not fit in small spaces
- **Risk**: Could waste actually usable space

### 6. **GRAIN DIRECTION COMPATIBILITY**
```typescript
// File: optimized-cutting-engine.ts - ConstraintProcessor
// Strict grain direction matching required
```
- **Purpose**: Ensures parts follow wood grain requirements
- **Impact**: Parts rejected if grain direction incompatible
- **Risk**: May prevent valid placements

### 7. **MATERIAL TYPE MATCHING**
```typescript
// File: cut-helpers.ts
if (part.material && stockDefinitionForUsage.material && 
    part.material.toLowerCase() !== stockDefinitionForUsage.material.toLowerCase()) {
  continue; // Skip incompatible materials
}
```
- **Purpose**: Ensures material compatibility
- **Impact**: Parts only placed on matching material types
- **Risk**: Strict matching may be too restrictive

### 8. **THICKNESS COMPATIBILITY**
```typescript
if (part.thickness > stockDefinitionForUsage.thickness) {
  continue; // Part too thick for this stock
}
```
- **Purpose**: Ensures parts fit thickness-wise
- **Impact**: Parts rejected if thicker than stock
- **Risk**: No thickness flexibility

### 9. **SPATIAL GRID CELL SIZE**
```typescript
private static readonly CELL_SIZE = 200; // 200mm cells for spatial indexing
```
- **Purpose**: Fast collision detection using grid
- **Impact**: Collision detection granularity
- **Risk**: Grid size might affect small part detection

### 10. **KERF THICKNESS BUFFER**
```typescript
// Added to all dimensions for safety margin
const partWithKerf = partDimension + kerfThickness;
```
- **Purpose**: Account for saw blade width
- **Impact**: Reduces effective available space
- **Risk**: May prevent tight fits that are actually valid

### 11. **FREE SPACE SPLITTING LIMITS**
```typescript
// File: optimized-cutting-engine.ts - updateFreeSpaces()
// Complex space splitting algorithms with multiple conditions
```
- **Purpose**: Manage remaining free spaces after placement
- **Impact**: Affects future placement possibilities
- **Risk**: Inefficient space splitting can waste space

### 12. **PART QUANTITY EXPANSION LIMITS**
```typescript
// File: optimized-cutting-engine.ts - expandPartsByQuantity()
// Round-robin distribution to prevent clustering
```
- **Purpose**: Distribute multiple instances of same part
- **Impact**: Controls order of part placement
- **Risk**: May not be optimal for all scenarios

### 13. **VALIDATION CHECKS**
```typescript
// Multiple validation functions:
// - validateNoOverlaps()
// - validatePlacement()
// - Material compatibility checks
// - Bounds checking
```
- **Purpose**: Safety checks to prevent invalid placements
- **Impact**: Additional rejection criteria
- **Risk**: Validation bugs can cause false rejections

## 🔧 IMMEDIATE ACTIONS NEEDED

### 1. **Fix Overlapping Parts Issue**
The rotation logic fix may have introduced new problems. You need to:
- Test with a simple scenario (just a few parts)
- Check console for collision detection logs
- Verify the spatial grid is being updated correctly

### 2. **Check Critical Conditions**
Your current scenario: 5 Cabinet Sides (800×400×18mm) + 22 test parts (190×190×18mm)
- Total area: 5×320,000 + 22×36,100 = 2,394,200 mm²
- Single sheet area: 2,440×1,220 = 2,976,800 mm²
- Theoretical efficiency: 80.4% (should easily fit on one sheet)

### 3. **Debug Steps**
1. Open browser developer console
2. Set `window.DEBUG_COLLISION = true`
3. Run the calculation
4. Look for collision detection logs
5. Check if parts are being rejected due to false collisions

### 4. **Possible Quick Fix**
The issue might be that I fixed the rotation logic in some places but not others, causing inconsistencies. Try reducing the number of parts to see if the overlap goes away.

## 📊 RECOMMENDED LIMITS FOR YOUR SCENARIO

For 27 parts total:
- ✅ maxAttemptsPerSheet = 500 (sufficient)
- ✅ maxSheets = 50 (sufficient) 
- ⚠️ targetSheetEfficiency = 0.85 (might be too restrictive for your 80.4% scenario)
- ⚠️ Collision detection (may have bugs)

The system should handle your scenario easily, so the overlapping parts suggest a bug in the collision detection or spatial grid system.
