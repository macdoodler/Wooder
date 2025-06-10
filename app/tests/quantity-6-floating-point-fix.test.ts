import { describe, test, expect } from '@jest/globals';
import { calculateOptimalCuts } from '../lib/calculateOptimalCuts';
import { Stock, Part, MaterialType } from '../lib/types';

describe('Quantity 6 Issue - Floating Point Precision Fix', () => {
  test('should successfully place 6x 800x400mm + 4x 200x200mm parts (was failing due to floating point precision)', () => {
    console.log('=== QUANTITY 6 ISSUE FIX VERIFICATION ===');
    
    const stocks: Stock[] = [
      {
        length: 2440,
        width: 1220,
        thickness: 18,
        material: "Plywood",
        materialType: MaterialType.Sheet,
        quantity: 3
      }
    ];

    const parts: Part[] = [
      {
        length: 800,
        width: 400, 
        thickness: 18,
        material: "Plywood",
        materialType: MaterialType.Sheet,
        quantity: 6, // This was causing the failure
        name: "Large Panel"
      },
      {
        length: 200,
        width: 200,
        thickness: 18,
        material: "Plywood", 
        materialType: MaterialType.Sheet,
        quantity: 4,
        name: "Small Panel"
      }
    ];

    const results = calculateOptimalCuts(stocks, parts, 3.2);

    expect(results.success).toBe(true);
    
    if (results.success) {
      console.log('\n=== RESULTS ANALYSIS ===');
      
      // Count total placements
      let totalPlacements = 0;
      let largePanels = 0;
      let smallPanels = 0;
      
      results.stockUsage.forEach((usage, index) => {
        console.log(`\nSheet ${index + 1}:`);
        console.log(`  Placements: ${usage.placements.length}`);
        console.log(`  Efficiency: ${usage.efficiency?.toFixed(1)}%`);
        
        usage.placements.forEach(placement => {
          totalPlacements++;
          if (placement.name?.includes('Large')) {
            largePanels++;
          } else if (placement.name?.includes('Small')) {
            smallPanels++;
          }
          console.log(`    ${placement.name || placement.partId} at (${placement.x}, ${placement.y})`);
        });
      });
      
      console.log('\n=== PLACEMENT VERIFICATION ===');
      console.log(`Total placements: ${totalPlacements}`);
      console.log(`Large panels placed: ${largePanels} (expected: 6)`);
      console.log(`Small panels placed: ${smallPanels} (expected: 4)`);
      console.log(`Total expected: 10`);
      
      // Verify all parts were placed
      expect(totalPlacements).toBe(10);
      expect(largePanels).toBe(6);
      expect(smallPanels).toBe(4);
      
      console.log('\n✅ SUCCESS: All parts successfully placed!');
      console.log('🔧 FLOATING POINT PRECISION FIX WORKING CORRECTLY');
      
      // Additional validation - check for overlaps
      results.stockUsage.forEach((usage, sheetIndex) => {
        const placements = usage.placements;
        for (let i = 0; i < placements.length; i++) {
          for (let j = i + 1; j < placements.length; j++) {
            const p1 = placements[i];
            const p2 = placements[j];
            
            // Get part dimensions (simplified for test)
            const p1Width = p1.name?.includes('Large') ? 800 : 200;
            const p1Height = p1.name?.includes('Large') ? 400 : 200;
            const p2Width = p2.name?.includes('Large') ? 800 : 200;
            const p2Height = p2.name?.includes('Large') ? 400 : 200;
            
            // Check for overlap
            const p1Right = p1.x + p1Width + 3.2;
            const p1Bottom = p1.y + p1Height + 3.2;
            const p2Right = p2.x + p2Width + 3.2;
            const p2Bottom = p2.y + p2Height + 3.2;
            
            const overlap = !(p1Right <= p2.x || p2Right <= p1.x || p1Bottom <= p2.y || p2Bottom <= p1.y);
            
            expect(overlap).toBe(false);
          }
        }
      });
      
      console.log('✅ NO OVERLAPS DETECTED - Collision detection working correctly');
      
    } else {
      console.error('❌ ALGORITHM FAILED:', results.message);
      throw new Error(`Algorithm failed: ${results.message}`);
    }
  });

  test('should handle floating point precision in collision detection', () => {
    console.log('\n=== FLOATING POINT PRECISION TEST ===');
    
    // Test case specifically designed to trigger floating point precision issues
    const stocks: Stock[] = [
      {
        length: 2440,
        width: 1220,
        thickness: 18,
        material: "Plywood",
        materialType: MaterialType.Sheet,
        quantity: 1
      }
    ];

    const parts: Part[] = [
      {
        length: 800,
        width: 400,
        thickness: 18,
        material: "Plywood",
        materialType: MaterialType.Sheet,
        quantity: 3, // Creates 3 parts that will have precise boundaries
        name: "Precision Test"
      },
      {
        length: 200,
        width: 200,
        thickness: 18,
        material: "Plywood",
        materialType: MaterialType.Sheet,
        quantity: 2, // These should fit in the remaining space
        name: "Small Test"
      }
    ];

    const results = calculateOptimalCuts(stocks, parts, 3.2);

    expect(results.success).toBe(true);
    
    if (results.success) {
      const totalPlacements = results.stockUsage.reduce((sum, usage) => sum + usage.placements.length, 0);
      console.log(`Total placements: ${totalPlacements} (expected: 5)`);
      expect(totalPlacements).toBe(5);
      
      console.log('✅ Floating point precision test passed');
    }
  });
});
