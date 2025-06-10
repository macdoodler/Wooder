import { calculateOptimalCuts } from '../lib/calculateOptimalCuts';
import { MaterialType, Stock, Part } from '../lib/types';

describe('Quantity Tracking Bug Fix', () => {
  it('should place exactly 6 parts when 6 are requested (not 36)', () => {
    console.log('\n=== TESTING QUANTITY TRACKING BUG FIX ===');
    
    // Test case designed to trigger the optimal layout fallback
    // that caused the quantity tracking bug
    const availableStocks: Stock[] = [
      {
        length: 2400,
        width: 1200,
        thickness: 18,
        quantity: 5,
        material: 'Plywood',
        materialType: MaterialType.Sheet
      }
    ];

    const requiredParts: Part[] = [
      {
        length: 400,
        width: 300,
        thickness: 18,
        quantity: 6, // Request exactly 6 parts
        material: 'Plywood',
        materialType: MaterialType.Sheet
      }
    ];

    console.log('Test scenario: Request 6 parts of 400x300mm');
    console.log('Expected: Exactly 6 parts placed (not 36)');

    const result = calculateOptimalCuts(availableStocks, requiredParts, 3);

    expect(result.success).toBe(true);
    
    if (result.success) {
      // Count total parts placed across all sheets
      let totalPartsPlaced = 0;
      result.stockUsage.forEach((usage, index) => {
        console.log(`Sheet ${index + 1}: ${usage.placements.length} parts placed`);
        totalPartsPlaced += usage.placements.length;
      });
      
      console.log(`Total parts placed: ${totalPartsPlaced}`);
      console.log(`Parts requested: ${requiredParts[0].quantity}`);
      console.log(`Match: ${totalPartsPlaced === requiredParts[0].quantity ? 'YES ✓' : 'NO ✗'}`);
      
      // This should pass with our fix
      expect(totalPartsPlaced).toBe(6);
      
      // Verify no parts are placed outside bounds
      result.stockUsage.forEach((usage, sheetIndex) => {
        const stock = availableStocks[usage.stockIndex];
        usage.placements.forEach((placement, placementIndex) => {
          const part = requiredParts[0];
          const width = placement.rotated ? part.width : part.length;
          const height = placement.rotated ? part.length : part.width;
          
          expect(placement.x).toBeGreaterThanOrEqual(0);
          expect(placement.y).toBeGreaterThanOrEqual(0);
          expect(placement.x + width).toBeLessThanOrEqual(stock.length);
          expect(placement.y + height).toBeLessThanOrEqual(stock.width);
        });
      });
      
      console.log('✅ BUG FIX VERIFICATION: All tests passed!');
    }
  });

  it('should handle mixed quantities correctly', () => {
    console.log('\n=== TESTING MIXED QUANTITIES ===');
    
    const availableStocks: Stock[] = [
      {
        length: 2400,
        width: 1200,
        thickness: 18,
        quantity: 3,
        material: 'Plywood',
        materialType: MaterialType.Sheet
      }
    ];

    const requiredParts: Part[] = [
      {
        length: 600,
        width: 400,
        thickness: 18,
        quantity: 3,
        material: 'Plywood',
        materialType: MaterialType.Sheet
      },
      {
        length: 300,
        width: 200,
        thickness: 18,
        quantity: 5,
        material: 'Plywood',
        materialType: MaterialType.Sheet
      }
    ];

    console.log('Test scenario: 3 large parts + 5 small parts');
    console.log('Expected: Exactly 8 parts total');

    const result = calculateOptimalCuts(availableStocks, requiredParts, 3);

    expect(result.success).toBe(true);
    
    if (result.success) {
      let totalPartsPlaced = 0;
      const expectedTotal = requiredParts.reduce((sum, part) => sum + part.quantity, 0);
      
      result.stockUsage.forEach((usage) => {
        totalPartsPlaced += usage.placements.length;
      });
      
      console.log(`Total parts placed: ${totalPartsPlaced}`);
      console.log(`Total parts requested: ${expectedTotal}`);
      
      expect(totalPartsPlaced).toBe(expectedTotal);
      console.log('✅ Mixed quantities test passed!');
    }
  });

  it('should handle optimal layout with correct quantity tracking', () => {
    console.log('\n=== TESTING OPTIMAL LAYOUT QUANTITY TRACKING ===');
    
    // Create a scenario that forces optimal layout usage
    const availableStocks: Stock[] = [
      {
        length: 1200,
        width: 800,
        thickness: 18,
        quantity: 2,
        material: 'Plywood',
        materialType: MaterialType.Sheet
      }
    ];

    const requiredParts: Part[] = [
      {
        length: 350,
        width: 250,
        thickness: 18,
        quantity: 4, // 4 parts that should fit optimally
        material: 'Plywood',
        materialType: MaterialType.Sheet
      }
    ];

    console.log('Test scenario: 4 parts that require optimal layout');
    console.log('Expected: Exactly 4 parts placed');

    const result = calculateOptimalCuts(availableStocks, requiredParts, 3);

    expect(result.success).toBe(true);
    
    if (result.success) {
      let totalPartsPlaced = 0;
      
      result.stockUsage.forEach((usage) => {
        totalPartsPlaced += usage.placements.length;
      });
      
      console.log(`Total parts placed: ${totalPartsPlaced}`);
      console.log(`Parts requested: ${requiredParts[0].quantity}`);
      
      expect(totalPartsPlaced).toBe(4);
      console.log('✅ Optimal layout quantity tracking test passed!');
    }
  });
});
