import { calculateOptimalCuts } from '../lib/calculateOptimalCuts';
import { Stock, Part, MaterialType } from '../lib/types';

// Mock window for browser-specific code
(global as any).window = { DEBUG_CUTTING: false };

describe('Collision Detection Failure Investigation', () => {
  beforeEach(() => {
    // Temporarily disable console mocking to see collision detection output
    // jest.spyOn(console, 'log').mockImplementation();
    // jest.spyOn(console, 'clear').mockImplementation();
    // jest.spyOn(console, 'time').mockImplementation();
    // jest.spyOn(console, 'timeEnd').mockImplementation();
    // jest.spyOn(console, 'table').mockImplementation();
    // jest.spyOn(console, 'group').mockImplementation();
    // jest.spyOn(console, 'groupEnd').mockImplementation();
    // jest.spyOn(console, 'warn').mockImplementation();
    // jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('should detect overlapping parts with high-stress placement scenario', () => {
    console.log('\n=== HIGH-STRESS COLLISION DETECTION TEST ===');
    
    const stocks: Stock[] = [
      {
        length: 1200,
        width: 800,
        thickness: 18,
        quantity: 1,
        material: 'Plywood',
        materialType: MaterialType.Sheet
      }
    ];

    // Create parts that will require tight packing and might reveal collision failures
    const parts: Part[] = [
      {
        length: 300,
        width: 200,
        thickness: 18,
        quantity: 8, // This should fit with careful placement, but might cause overlaps if collision detection fails
        material: 'Plywood',
        materialType: MaterialType.Sheet
      }
    ];

    console.log('Testing: 8 parts of 300×200mm on 1200×800mm sheet');
    console.log('Expected: Should fit with careful placement, no overlaps');

    const result = calculateOptimalCuts(stocks, parts, 3); // 3mm kerf

    expect(result.success).toBe(true);

    if (result.success) {
      // Detailed collision detection analysis
      let allPlacements: Array<{
        x: number,
        y: number,
        width: number,
        height: number,
        sheetId: string,
        placementIndex: number
      }> = [];

      result.stockUsage.forEach((usage, sheetIndex) => {
        const stock = stocks[usage.stockIndex];
        console.log(`\nSheet ${sheetIndex + 1} Analysis:`);
        console.log(`  Stock: ${stock.length}×${stock.width}mm`);
        console.log(`  Placements: ${usage.placements.length}`);

        usage.placements.forEach((placement, pIndex) => {
          const partIndex = parseInt(placement.partId.split('-')[1]);
          const part = parts[partIndex];
          const width = placement.rotated ? part.width : part.length;
          const height = placement.rotated ? part.length : part.width;

          console.log(`    ${pIndex + 1}. Position: (${placement.x}, ${placement.y}), Size: ${width}×${height}mm, Rotated: ${placement.rotated}`);

          // Check boundary violations
          if (placement.x < 0 || placement.y < 0) {
            console.log(`      ❌ BOUNDARY VIOLATION: Negative coordinates`);
          }
          if (placement.x + width > stock.length) {
            console.log(`      ❌ BOUNDARY VIOLATION: Exceeds sheet length (${placement.x + width} > ${stock.length})`);
          }
          if (placement.y + height > stock.width) {
            console.log(`      ❌ BOUNDARY VIOLATION: Exceeds sheet width (${placement.y + height} > ${stock.width})`);
          }

          allPlacements.push({
            x: placement.x,
            y: placement.y,
            width: width,
            height: height,
            sheetId: usage.sheetId,
            placementIndex: pIndex
          });
        });
      });

      // Check for overlaps with kerf consideration
      console.log('\n=== COMPREHENSIVE OVERLAP DETECTION ===');
      let overlapCount = 0;
      const kerfThickness = 3;

      for (let i = 0; i < allPlacements.length; i++) {
        for (let j = i + 1; j < allPlacements.length; j++) {
          const p1 = allPlacements[i];
          const p2 = allPlacements[j];

          // Only check parts on the same sheet
          if (p1.sheetId !== p2.sheetId) continue;

          // Check overlap with kerf
          const p1Right = p1.x + p1.width + kerfThickness;
          const p1Bottom = p1.y + p1.height + kerfThickness;
          const p2Right = p2.x + p2.width + kerfThickness;
          const p2Bottom = p2.y + p2.height + kerfThickness;

          const noOverlapX = p1Right <= p2.x || p2Right <= p1.x;
          const noOverlapY = p1Bottom <= p2.y || p2Bottom <= p1.y;

          if (!noOverlapX && !noOverlapY) {
            console.log(`❌ OVERLAP DETECTED!`);
            console.log(`  Part ${i + 1}: (${p1.x}, ${p1.y}) ${p1.width}×${p1.height}mm`);
            console.log(`  Part ${j + 1}: (${p2.x}, ${p2.y}) ${p2.width}×${p2.height}mm`);
            console.log(`  Overlap area: X(${Math.max(p1.x, p2.x)}-${Math.min(p1Right - kerfThickness, p2Right - kerfThickness)}), Y(${Math.max(p1.y, p2.y)}-${Math.min(p1Bottom - kerfThickness, p2Bottom - kerfThickness)})`);
            overlapCount++;
          }
        }
      }

      console.log(`\nOverlap detection result: ${overlapCount} overlaps found`);
      expect(overlapCount).toBe(0);
    }
  });

  test('should handle edge case with minimal kerf spacing', () => {
    console.log('\n=== MINIMAL KERF SPACING TEST ===');
    
    const stocks: Stock[] = [
      {
        length: 100,
        width: 100,
        thickness: 18,
        quantity: 1,
        material: 'Plywood',
        materialType: MaterialType.Sheet
      }
    ];

    const parts: Part[] = [
      {
        length: 49,
        width: 49,
        thickness: 18,
        quantity: 4, // Should fit exactly 2×2 with 1mm kerf, but might fail with collision detection issues
        material: 'Plywood',
        materialType: MaterialType.Sheet
      }
    ];

    console.log('Testing: 4 parts of 49×49mm on 100×100mm sheet with 1mm kerf');
    console.log('Expected: Should fit exactly in 2×2 grid with minimal spacing');

    const result = calculateOptimalCuts(stocks, parts, 1); // 1mm kerf - very tight

    if (result.success) {
      let totalPlaced = 0;
      result.stockUsage.forEach(usage => {
        totalPlaced += usage.placements.length;
        
        // Check exact spacing
        usage.placements.forEach((placement, pIndex) => {
          const part = parts[0];
          const width = placement.rotated ? part.width : part.length;
          const height = placement.rotated ? part.length : part.width;
          
          console.log(`  Part ${pIndex + 1}: (${placement.x}, ${placement.y}) ${width}×${height}mm`);
          
          // With 1mm kerf, the parts should be at positions like (0,0), (50,0), (0,50), (50,50)
          const expectedX = (pIndex % 2) * 50;
          const expectedY = Math.floor(pIndex / 2) * 50;
          
          if (Math.abs(placement.x - expectedX) > 1 || Math.abs(placement.y - expectedY) > 1) {
            console.log(`    ⚠️  Unexpected position: expected around (${expectedX}, ${expectedY})`);
          }
        });
      });

      expect(totalPlaced).toBe(4);
    } else {
      console.log(`Failed to place parts: ${result.message}`);
      // If it fails, it should be due to legitimate space constraints, not collision detection bugs
    }
  });

  test('should detect floating point precision issues in collision detection', () => {
    console.log('\n=== FLOATING POINT PRECISION TEST ===');
    
    const stocks: Stock[] = [
      {
        length: 1000.1, // Non-integer dimensions that might cause precision issues
        width: 500.05,
        thickness: 18,
        quantity: 1,
        material: 'Plywood',
        materialType: MaterialType.Sheet
      }
    ];

    const parts: Part[] = [
      {
        length: 333.333, // Repeating decimal that might cause precision issues
        width: 166.666,
        thickness: 18,
        quantity: 6, // This should fit but might cause precision-related collision failures
        material: 'Plywood',
        materialType: MaterialType.Sheet
      }
    ];

    console.log('Testing: 6 parts with floating point dimensions');
    console.log('Expected: Should handle floating point precision correctly');

    const result = calculateOptimalCuts(stocks, parts, 2.5); // Also non-integer kerf

    if (result.success) {
      console.log('\n=== PRECISION ANALYSIS ===');
      
      result.stockUsage.forEach((usage, sheetIndex) => {
        console.log(`\nSheet ${sheetIndex + 1}:`);
        
        usage.placements.forEach((placement, pIndex) => {
          const part = parts[0];
          const width = placement.rotated ? part.width : part.length;
          const height = placement.rotated ? part.length : part.width;
          
          console.log(`  Part ${pIndex + 1}: Position (${placement.x.toFixed(3)}, ${placement.y.toFixed(3)}), Size ${width.toFixed(3)}×${height.toFixed(3)}mm`);
          
          // Check for floating point boundary violations
          const stock = stocks[usage.stockIndex];
          if (placement.x + width > stock.length + 0.001) { // Small tolerance for floating point
            console.log(`    ❌ PRECISION ISSUE: Width boundary violation by ${(placement.x + width - stock.length).toFixed(6)}mm`);
          }
          if (placement.y + height > stock.width + 0.001) {
            console.log(`    ❌ PRECISION ISSUE: Height boundary violation by ${(placement.y + height - stock.width).toFixed(6)}mm`);
          }
        });
      });
    } else {
      console.log(`Floating point test failed: ${result.message}`);
    }
  });

  test('should handle rapid successive placements without collision failures', () => {
    console.log('\n=== RAPID PLACEMENT STRESS TEST ===');
    
    const stocks: Stock[] = [
      {
        length: 2000,
        width: 1000,
        thickness: 18,
        quantity: 1,
        material: 'Plywood',
        materialType: MaterialType.Sheet
      }
    ];

    // Many small parts that will require rapid successive placement decisions
    const parts: Part[] = [
      {
        length: 100,
        width: 50,
        thickness: 18,
        quantity: 30, // Many parts that should fit but stress the collision detection system
        material: 'Plywood',
        materialType: MaterialType.Sheet
      }
    ];

    console.log('Testing: 30 small parts requiring rapid successive placements');
    console.log('Expected: All parts placed without overlaps despite high placement frequency');

    const result = calculateOptimalCuts(stocks, parts, 3);

    if (result.success) {
      let totalPlaced = 0;
      let allPositions = new Set<string>();
      let duplicatePositions = 0;

      result.stockUsage.forEach(usage => {
        totalPlaced += usage.placements.length;
        
        usage.placements.forEach((placement, pIndex) => {
          const positionKey = `${placement.x},${placement.y}`;
          
          if (allPositions.has(positionKey)) {
            console.log(`❌ DUPLICATE POSITION: Multiple parts at (${placement.x}, ${placement.y})`);
            duplicatePositions++;
          }
          
          allPositions.add(positionKey);
        });
      });

      console.log(`\nRapid placement results:`);
      console.log(`  Total parts placed: ${totalPlaced}`);
      console.log(`  Duplicate positions: ${duplicatePositions}`);
      console.log(`  Unique positions: ${allPositions.size}`);

      expect(duplicatePositions).toBe(0);
      expect(totalPlaced).toBe(allPositions.size);
    }
  });

  test('should handle mixed orientation collision scenarios', () => {
    console.log('\n=== MIXED ORIENTATION COLLISION TEST ===');
    
    const stocks: Stock[] = [
      {
        length: 800,
        width: 600,
        thickness: 18,
        quantity: 1,
        material: 'Plywood',
        materialType: MaterialType.Sheet
      }
    ];

    // Asymmetric parts that will create different collision scenarios when rotated
    const parts: Part[] = [
      {
        length: 300,
        width: 150,
        thickness: 18,
        quantity: 8, // Should fit with mixed orientations, test collision detection with rotated parts
        material: 'Plywood',
        materialType: MaterialType.Sheet
      }
    ];

    console.log('Testing: 8 asymmetric parts requiring mixed rotations');
    console.log('Expected: Collision detection works correctly with both rotated and non-rotated parts');

    const result = calculateOptimalCuts(stocks, parts, 3);

    if (result.success) {
      console.log('\n=== ORIENTATION ANALYSIS ===');
      
      let rotatedCount = 0;
      let nonRotatedCount = 0;
      
      result.stockUsage.forEach((usage, sheetIndex) => {
        console.log(`\nSheet ${sheetIndex + 1}:`);
        
        const placementData: Array<{
          x: number,
          y: number,
          width: number,
          height: number,
          rotated: boolean,
          index: number
        }> = [];
        
        usage.placements.forEach((placement, pIndex) => {
          const part = parts[0];
          const width = placement.rotated ? part.width : part.length;
          const height = placement.rotated ? part.length : part.width;
          
          if (placement.rotated) {
            rotatedCount++;
            console.log(`  Part ${pIndex + 1}: (${placement.x}, ${placement.y}) ${width}×${height}mm [ROTATED]`);
          } else {
            nonRotatedCount++;
            console.log(`  Part ${pIndex + 1}: (${placement.x}, ${placement.y}) ${width}×${height}mm [NORMAL]`);
          }
          
          placementData.push({
            x: placement.x,
            y: placement.y,
            width: width,
            height: height,
            rotated: placement.rotated,
            index: pIndex
          });
        });
        
        // Check collisions between rotated and non-rotated parts
        for (let i = 0; i < placementData.length; i++) {
          for (let j = i + 1; j < placementData.length; j++) {
            const p1 = placementData[i];
            const p2 = placementData[j];
            
            // Check overlap
            const p1Right = p1.x + p1.width + 3; // Include kerf
            const p1Bottom = p1.y + p1.height + 3;
            const p2Right = p2.x + p2.width + 3;
            const p2Bottom = p2.y + p2.height + 3;
            
            const overlap = !(p1Right <= p2.x || p2Right <= p1.x || p1Bottom <= p2.y || p2Bottom <= p1.y);
            
            if (overlap) {
              console.log(`❌ ROTATION COLLISION: Part ${p1.index + 1} (${p1.rotated ? 'rotated' : 'normal'}) overlaps with Part ${p2.index + 1} (${p2.rotated ? 'rotated' : 'normal'})`);
            }
          }
        }
      });
      
      console.log(`\nOrientation summary:`);
      console.log(`  Rotated parts: ${rotatedCount}`);
      console.log(`  Normal parts: ${nonRotatedCount}`);
      console.log(`  Mixed orientations: ${rotatedCount > 0 && nonRotatedCount > 0 ? 'YES' : 'NO'}`);
    }
  });
});
