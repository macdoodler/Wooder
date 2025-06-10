// Test the fixed collision detection in advanced nesting
import { hybridPacking } from '../app/lib/advanced-nesting.js';

console.log("\n=== ADVANCED NESTING COLLISION FIX TEST ===");

// Test parts that should NOT overlap with kerf spacing
const parts = [
  { id: 'part1', width: 100, height: 50 },
  { id: 'part2', width: 100, height: 50 }
];

// Small sheet to force close placement
const sheetWidth = 250;
const sheetHeight = 100;
const kerfThickness = 3;

console.log(`Testing parts placement with ${kerfThickness}mm kerf thickness...`);
console.log(`Sheet: ${sheetWidth}x${sheetHeight}mm`);
console.log(`Parts: ${parts.length} pieces of 100x50mm each`);

const result = hybridPacking(parts, sheetWidth, sheetHeight, kerfThickness);

console.log(`\nResults:`);
console.log(`  Placed: ${result.placed.length}/${parts.length} parts`);
console.log(`  Efficiency: ${result.efficiency.toFixed(1)}%`);

if (result.placed.length >= 2) {
  const part1 = result.placed[0];
  const part2 = result.placed[1];
  
  console.log(`\nPart positions:`);
  console.log(`  Part 1: (${part1.x}, ${part1.y}) ${part1.width}x${part1.height}mm`);
  console.log(`  Part 2: (${part2.x}, ${part2.y}) ${part2.width}x${part2.height}mm`);
  
  // Calculate spacing between parts
  const horizontalGap = Math.abs(part1.x + part1.width - part2.x);
  const verticalGap = Math.abs(part1.y + part1.height - part2.y);
  const minGap = Math.min(horizontalGap, verticalGap);
  
  console.log(`\nSpacing analysis:`);
  console.log(`  Horizontal gap: ${horizontalGap}mm`);
  console.log(`  Vertical gap: ${verticalGap}mm`);
  console.log(`  Minimum gap: ${minGap}mm`);
  console.log(`  Required kerf: ${kerfThickness}mm`);
  
  const passesTest = minGap >= kerfThickness;
  console.log(`\n  COLLISION TEST: ${passesTest ? 'PASS' : 'FAIL'}`);
  
  if (passesTest) {
    console.log(`  ✅ Parts are properly spaced with ${minGap}mm >= ${kerfThickness}mm kerf`);
  } else {
    console.log(`  ❌ Parts are too close! Gap ${minGap}mm < ${kerfThickness}mm kerf`);
  }
} else {
  console.log(`\n⚠️  Only ${result.placed.length} parts placed - cannot test collision`);
}

console.log("\n=== TEST COMPLETE ===");
