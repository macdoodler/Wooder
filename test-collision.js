// Collision Detection Test
// This file tests the collision detection logic to identify why overlaps might occur

// Test rectanglesOverlap function
function rectanglesOverlap(rect1, rect2, kerfThickness = 0) {
  // Add kerf thickness to only the first rectangle (new part being placed)
  const r1 = {
    x: rect1.x,
    y: rect1.y,
    width: rect1.width + kerfThickness,
    height: rect1.height + kerfThickness
  };
  
  const r2 = {
    x: rect2.x,
    y: rect2.y,
    width: rect2.width,
    height: rect2.height
  };
  
  // Check if one rectangle is to the left of the other
  if (r1.x + r1.width <= r2.x || r2.x + r2.width <= r1.x) {
    return false;
  }
  
  // Check if one rectangle is above the other
  if (r1.y + r1.height <= r2.y || r2.y + r2.height <= r1.y) {
    return false;
  }
  
  // If neither of the above is true, the rectangles overlap
  return true;
}

// Test validatePlacement function
function validatePlacement(placement, part, existingPlacements, sheetLength, sheetWidth, kerfThickness = 0, requiredParts) {
  const partWidth = placement.rotated ? part.width : part.length;
  const partHeight = placement.rotated ? part.length : part.width;
  
  // Check for exact coordinate conflicts first
  for (let i = 0; i < existingPlacements.length; i++) {
    const existing = existingPlacements[i];
    if (existing.x === placement.x && existing.y === placement.y) {
      return { 
        valid: false, 
        reason: `DUPLICATE POSITION: Position (${placement.x},${placement.y}) already occupied by existing part` 
      };
    }
  }
  
  // Check boundary violations
  if (placement.x < 0 || placement.y < 0) {
    return { valid: false, reason: "Placement outside sheet boundaries (negative coordinates)" };
  }
  
  if (placement.x + partWidth + kerfThickness > sheetLength) {
    return { valid: false, reason: `Placement exceeds sheet length (${placement.x + partWidth + kerfThickness} > ${sheetLength})` };
  }
  
  if (placement.y + partHeight + kerfThickness > sheetWidth) {
    return { valid: false, reason: `Placement exceeds sheet width (${placement.y + partHeight + kerfThickness} > ${sheetWidth})` };
  }
  
  // Check for collisions with existing placements
  const newRect = {
    x: placement.x,
    y: placement.y,
    width: partWidth,
    height: partHeight
  };
  
  for (let i = 0; i < existingPlacements.length; i++) {
    const existing = existingPlacements[i];
    let existingPart = part; // Default to current part
    
    // Try to get the actual part from requiredParts if available
    if (requiredParts && existing.partId) {
      const partIndex = parseInt(existing.partId.split('-')[1]);
      if (partIndex >= 0 && partIndex < requiredParts.length) {
        existingPart = requiredParts[partIndex];
      }
    }
    
    const existingRect = {
      x: existing.x,
      y: existing.y,
      width: existing.rotated ? existingPart.width : existingPart.length,
      height: existing.rotated ? existingPart.length : existingPart.width
    };
    
    if (rectanglesOverlap(newRect, existingRect, kerfThickness)) {
      return { valid: false, reason: `Placement overlaps with existing part at (${existing.x},${existing.y})` };
    }
  }
  
  return { valid: true };
}

// Test Case 1: Basic overlap detection
console.log("\n=== COLLISION DETECTION TESTS ===");

// Test overlapping rectangles (should return true)
const rect1 = { x: 0, y: 0, width: 100, height: 100 };
const rect2 = { x: 50, y: 50, width: 100, height: 100 };
const test1 = rectanglesOverlap(rect1, rect2, 0);
console.log(`Test 1 - Overlapping rectangles: ${test1} (expected: true)`);

// Test non-overlapping rectangles (should return false)
const rect3 = { x: 0, y: 0, width: 100, height: 100 };
const rect4 = { x: 200, y: 200, width: 100, height: 100 };
const test2 = rectanglesOverlap(rect3, rect4, 0);
console.log(`Test 2 - Non-overlapping rectangles: ${test2} (expected: false)`);

// Test edge-touching rectangles (should return false)
const rect5 = { x: 0, y: 0, width: 100, height: 100 };
const rect6 = { x: 100, y: 0, width: 100, height: 100 };
const test3 = rectanglesOverlap(rect5, rect6, 0);
console.log(`Test 3 - Edge-touching rectangles: ${test3} (expected: false)`);

// Test with kerf thickness
const test4 = rectanglesOverlap(rect5, rect6, 5);
console.log(`Test 4 - Edge-touching with kerf 5mm: ${test4} (expected: true)`);

// Test Case 2: Validation function
console.log("\n=== VALIDATION TESTS ===");

const part = { length: 100, width: 50, thickness: 18 };
const sheetLength = 2440;
const sheetWidth = 1220;
const kerfThickness = 3;

// Test duplicate position detection
const existingPlacements = [
  { x: 100, y: 100, rotated: false, partId: 'Part-0-1' }
];

const duplicateTest = validatePlacement(
  { x: 100, y: 100, rotated: false },
  part,
  existingPlacements,
  sheetLength,
  sheetWidth,
  kerfThickness
);
console.log(`Test 5 - Duplicate position: ${!duplicateTest.valid} (expected: true)`);
console.log(`  Reason: ${duplicateTest.reason}`);

// Test boundary validation
const boundaryTest = validatePlacement(
  { x: 2400, y: 100, rotated: false },
  part,
  [],
  sheetLength,
  sheetWidth,
  kerfThickness
);
console.log(`Test 6 - Boundary violation: ${!boundaryTest.valid} (expected: true)`);
console.log(`  Reason: ${boundaryTest.reason}`);

// Test overlap detection
const overlapTest = validatePlacement(
  { x: 120, y: 120, rotated: false },
  part,
  existingPlacements,
  sheetLength,
  sheetWidth,
  kerfThickness,
  [part] // requiredParts
);
console.log(`Test 7 - Overlap detection: ${!overlapTest.valid} (expected: true)`);
console.log(`  Reason: ${overlapTest.reason}`);

// Test valid placement
const validTest = validatePlacement(
  { x: 300, y: 300, rotated: false },
  part,
  existingPlacements,
  sheetLength,
  sheetWidth,
  kerfThickness,
  [part]
);
console.log(`Test 8 - Valid placement: ${validTest.valid} (expected: true)`);

console.log("\n=== CRITICAL INSIGHT TESTS ===");

// Test Case 3: Real-world scenario that might fail
// Two 100x50 parts that should NOT overlap but algorithm might place them incorrectly
const realPart1 = { length: 100, width: 50, thickness: 18 };
const realPart2 = { length: 100, width: 50, thickness: 18 };

const placement1 = { x: 0, y: 0, rotated: false, partId: 'Part-0-1' };
const placement2 = { x: 50, y: 25, rotated: false, partId: 'Part-1-1' }; // This should overlap

const realTest = validatePlacement(
  placement2,
  realPart2,
  [placement1],
  sheetLength,
  sheetWidth,
  kerfThickness,
  [realPart1, realPart2]
);

console.log(`Test 9 - Real overlap scenario: ${!realTest.valid} (expected: true)`);
console.log(`  Part 1: (0,0) 100x50`);
console.log(`  Part 2: (50,25) 100x50`);
console.log(`  Should overlap: YES`);
console.log(`  Detected as overlap: ${!realTest.valid}`);
console.log(`  Reason: ${realTest.reason || 'No reason given'}`);

console.log("\n=== TEST COMPLETE ===");
