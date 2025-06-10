import { describe, test, expect } from '@jest/globals';
import { calculateOptimalCuts } from '../lib/calculateOptimalCuts';
import { Stock, Part, MaterialType } from '../lib/types';

describe('Quantity 6 Bug Fix - Final Verification', () => {
  test('CRITICAL: 6x 800x400mm + 4x 200x200mm should place all 10 parts', () => {
    console.log('\n🔧 === QUANTITY 6 BUG FIX VERIFICATION ===');
    console.log('Issue: Floating point precision errors in collision detection');
    console.log('Fix: Added 0.01mm tolerance to prevent microscopic overlap detection\n');
    
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
        quantity: 6, // This quantity was causing the failure
        name: "Large Panel"
      },
      {
        length: 200,
        width: 200,
        thickness: 18,
        material: "Plywood",
        materialType: MaterialType.Sheet,
        quantity: 4, // These small parts were failing to place
        name: "Small Panel"
      }
    ];

    console.log('📋 Test Input:');
    console.log(`- Stock: ${stocks[0].length}x${stocks[0].width}mm, Qty: ${stocks[0].quantity}`);
    console.log(`- Large parts: ${parts[0].length}x${parts[0].width}mm, Qty: ${parts[0].quantity}`);
    console.log(`- Small parts: ${parts[1].length}x${parts[1].width}mm, Qty: ${parts[1].quantity}`);
    console.log(`- Total parts expected: ${parts[0].quantity + parts[1].quantity}\n`);

    const results = calculateOptimalCuts(stocks, parts, 3.2);

    // Primary assertion - algorithm should succeed
    expect(results.success).toBe(true);
    
    if (results.success) {
      // Count total placements
      let totalPlacements = 0;
      let largePanelPlacements = 0;
      let smallPanelPlacements = 0;
      
      results.stockUsage.forEach((usage, sheetIndex) => {
        console.log(`Sheet ${sheetIndex + 1}: ${usage.placements.length} parts`);
        
        usage.placements.forEach(placement => {
          totalPlacements++;
          if (placement.name?.includes('Large')) {
            largePanelPlacements++;
          } else if (placement.name?.includes('Small')) {
            smallPanelPlacements++;
          }
        });
      });
      
      console.log(`\n📊 Results:`);
      console.log(`- Total placements: ${totalPlacements}`);
      console.log(`- Large panels placed: ${largePanelPlacements}/6`);
      console.log(`- Small panels placed: ${smallPanelPlacements}/4`);
      
      // Critical assertions
      expect(totalPlacements).toBe(10);
      expect(largePanelPlacements).toBe(6);
      expect(smallPanelPlacements).toBe(4);
      
      console.log('\n✅ SUCCESS: All parts placed correctly!');
      console.log('🎉 FLOATING POINT PRECISION BUG FIXED!');
      
      // Verify no overlaps
      results.stockUsage.forEach((usage, sheetIndex) => {
        for (let i = 0; i < usage.placements.length; i++) {
          for (let j = i + 1; j < usage.placements.length; j++) {
            const p1 = usage.placements[i];
            const p2 = usage.placements[j];
            
            // Approximate dimensions for overlap check
            const p1Width = p1.name?.includes('Large') ? 800 : 200;
            const p1Height = p1.name?.includes('Large') ? 400 : 200;
            const p2Width = p2.name?.includes('Large') ? 800 : 200;
            const p2Height = p2.name?.includes('Large') ? 400 : 200;
            
            const p1Right = p1.x + p1Width + 3.2;
            const p1Bottom = p1.y + p1Height + 3.2;
            const p2Right = p2.x + p2Width + 3.2;
            const p2Bottom = p2.y + p2Height + 3.2;
            
            const overlap = !(p1Right <= p2.x || p2Right <= p1.x || p1Bottom <= p2.y || p2Bottom <= p1.y);
            
            if (overlap) {
              console.error(`❌ OVERLAP on sheet ${sheetIndex + 1}: ${p1.name} at (${p1.x}, ${p1.y}) overlaps ${p2.name} at (${p2.x}, ${p2.y})`);
            }
            expect(overlap).toBe(false);
          }
        }
      });
      
      console.log('✅ No overlaps detected - collision detection working correctly\n');
      
    } else {
      console.error(`❌ ALGORITHM FAILED: ${results.message}`);
      console.error('The floating point precision fix may not be working correctly\n');
      throw new Error(`Algorithm failed: ${results.message}`);
    }
  });

  test('should handle various quantity combinations without floating point issues', () => {
    console.log('🔬 Testing various quantity combinations...\n');
    
    const stocks: Stock[] = [
      {
        length: 2440,
        width: 1220,
        thickness: 18,
        material: "Plywood",
        materialType: MaterialType.Sheet,
        quantity: 2
      }
    ];

    // Test different combinations that could trigger floating point issues
    const testCases = [
      { large: 3, small: 6 },
      { large: 4, small: 8 },
      { large: 5, small: 2 }
    ];

    testCases.forEach(({ large, small }, index) => {
      console.log(`Test case ${index + 1}: ${large}x large + ${small}x small`);
      
      const parts: Part[] = [
        {
          length: 800,
          width: 400,
          thickness: 18,
          material: "Plywood",
          materialType: MaterialType.Sheet,
          quantity: large,
          name: "Large Panel"
        },
        {
          length: 200,
          width: 200,
          thickness: 18,
          material: "Plywood",
          materialType: MaterialType.Sheet,
          quantity: small,
          name: "Small Panel"
        }
      ];

      const results = calculateOptimalCuts(stocks, parts, 3.2);
      
      expect(results.success).toBe(true);
      
      if (results.success) {
        const totalPlacements = results.stockUsage.reduce((sum, usage) => sum + usage.placements.length, 0);
        const expectedTotal = large + small;
        
        console.log(`  Result: ${totalPlacements}/${expectedTotal} parts placed`);
        expect(totalPlacements).toBe(expectedTotal);
      }
    });
    
    console.log('✅ All quantity combinations handled correctly\n');
  });
});
