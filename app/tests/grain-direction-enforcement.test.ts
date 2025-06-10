import { calculateOptimalCuts } from '../lib/calculateOptimalCuts';
import { Stock, Part, MaterialType } from '../lib/types';

describe('Grain Direction Enforcement', () => {
  // Test that parts with grain directions are NEVER rotated inappropriately
  
  test('should NEVER rotate parts with horizontal grain onto horizontal grain stock', () => {
    const stocks: Stock[] = [{
      id: 'test-stock-h',
      material: 'Plywood',
      thickness: 18,
      length: 1200,
      width: 800,
      cost: 50,
      description: 'Horizontal grain plywood',
      materialType: MaterialType.Sheet,
      quantity: 1,
      grainDirection: 'horizontal'
    }];

    const parts: Part[] = [{
      partName: 'Horizontal Grain Part',
      material: 'Plywood',
      thickness: 18,
      length: 300,  // Length 300 > Width 200, should be placed horizontally
      width: 200,
      quantity: 1,
      grainDirection: 'horizontal'
    }];

    console.log('🧪 Testing: Horizontal grain part on horizontal grain stock');
    console.log('Expected: Part should NOT be rotated (grain alignment maintained)');

    const result = calculateOptimalCuts(stocks, parts, 3);

    expect(result.success).toBe(true);
    expect(result.stockUsage).toHaveLength(1);
    expect(result.stockUsage[0].placements).toHaveLength(1);
    
    const placement = result.stockUsage[0].placements[0];
    
    // Part should NOT be rotated since both stock and part have horizontal grain
    expect(placement.rotated).toBe(false);
    
    console.log(`✅ Result: Part placed with rotation=${placement.rotated} (CORRECT - maintains grain alignment)`);
  });

  test('should NEVER place vertical grain part on horizontal grain stock without rotation', () => {
    const stocks: Stock[] = [{
      id: 'test-stock-h2',
      material: 'Plywood',
      thickness: 18,
      length: 1200,
      width: 800,
      cost: 50,
      description: 'Horizontal grain plywood',
      materialType: MaterialType.Sheet,
      quantity: 1,
      grainDirection: 'horizontal'
    }];

    const parts: Part[] = [{
      partName: 'Vertical Grain Part',
      material: 'Plywood',
      thickness: 18,
      length: 300,  // Length 300 > Width 200
      width: 200,
      quantity: 1,
      grainDirection: 'vertical'  // Different from stock grain
    }];

    console.log('🧪 Testing: Vertical grain part on horizontal grain stock');
    console.log('Expected: Part MUST be rotated to achieve grain alignment');

    const result = calculateOptimalCuts(stocks, parts, 3);

    expect(result.success).toBe(true);
    expect(result.stockUsage).toHaveLength(1);
    expect(result.stockUsage[0].placements).toHaveLength(1);
    
    const placement = result.stockUsage[0].placements[0];
    
    // Part MUST be rotated since stock has horizontal grain but part has vertical grain
    expect(placement.rotated).toBe(true);
    
    console.log(`✅ Result: Part placed with rotation=${placement.rotated} (CORRECT - achieves grain alignment through rotation)`);
  });

  test('should handle parts that cannot fit due to grain constraints', () => {
    // Small stock that would normally fit the part, but grain constraints prevent it
    const stocks: Stock[] = [{
      id: 'small-stock',
      material: 'Plywood',
      thickness: 18,
      length: 300,  // Only 300mm wide 
      width: 450,   // 450mm long
      cost: 25,
      description: 'Small horizontal grain plywood',
      materialType: MaterialType.Sheet,
      quantity: 1,
      grainDirection: 'horizontal'
    }];

    const parts: Part[] = [{
      partName: 'Large Vertical Part',
      material: 'Plywood',
      thickness: 18,
      length: 500,  // 500mm length - too big for 300mm stock width even when rotated
      width: 200,   // 200mm width - would fit in 450mm length normally
      quantity: 1,
      grainDirection: 'vertical'  // Must be placed vertically (along stock length)
    }];

    console.log('🧪 Testing: Part that cannot fit due to grain constraints');
    console.log('Stock: 300×450mm with horizontal grain');
    console.log('Part: 500×200mm with vertical grain');
    console.log('Expected: Cannot place part (500mm > 450mm stock length when placed for grain alignment)');

    const result = calculateOptimalCuts(stocks, parts, 3);

    // Should fail to place the part due to grain constraints
    expect(result.success).toBe(false);
    expect(result.message).toContain('Not enough suitable sheet material');
    
    console.log(`✅ Result: ${result.message} (CORRECT - respects grain constraints even when it prevents placement)`);
  });

  test('should allow free rotation for parts without grain direction', () => {
    const stocks: Stock[] = [{
      id: 'test-stock-h3',
      material: 'MDF',
      thickness: 18,
      length: 1200,
      width: 800,
      cost: 40,
      description: 'MDF (no grain)',
      materialType: MaterialType.Sheet,
      quantity: 1,
      // No grain direction specified
    }];

    const parts: Part[] = [{
      partName: 'No Grain Part',
      material: 'MDF',
      thickness: 18,
      length: 300,
      width: 200,
      quantity: 1,
      // No grain direction specified
    }];

    console.log('🧪 Testing: Part without grain direction');
    console.log('Expected: Part can be rotated freely for optimal space utilization');

    const result = calculateOptimalCuts(stocks, parts, 3);

    expect(result.success).toBe(true);
    expect(result.stockUsage).toHaveLength(1);
    expect(result.stockUsage[0].placements).toHaveLength(1);
    
    // Part should be placed successfully (rotation doesn't matter for non-grain parts)
    const placement = result.stockUsage[0].placements[0];
    
    console.log(`✅ Result: Part placed with rotation=${placement.rotated} (CORRECT - no grain constraints)`);
  });

  test('should respect grain direction when multiple orientations are possible', () => {
    // Large stock where part could fit in either orientation
    const stocks: Stock[] = [{
      id: 'large-stock',
      material: 'Plywood',
      thickness: 18,
      length: 1200,
      width: 1000,
      cost: 100,
      description: 'Large vertical grain plywood',
      materialType: MaterialType.Sheet,
      quantity: 1,
      grainDirection: 'vertical'
    }];

    const parts: Part[] = [{
      partName: 'Small Part',
      material: 'Plywood',
      thickness: 18,
      length: 200,  // Small part that could fit either way
      width: 150,
      quantity: 1,
      grainDirection: 'vertical'  // Same as stock
    }];

    console.log('🧪 Testing: Part that could fit in either orientation');
    console.log('Expected: Should choose orientation that maintains grain alignment');

    const result = calculateOptimalCuts(stocks, parts, 3);

    expect(result.success).toBe(true);
    expect(result.stockUsage).toHaveLength(1);
    expect(result.stockUsage[0].placements).toHaveLength(1);
    
    const placement = result.stockUsage[0].placements[0];
    
    // Since both stock and part have vertical grain, should NOT be rotated
    expect(placement.rotated).toBe(false);
    
    console.log(`✅ Result: Part placed with rotation=${placement.rotated} (CORRECT - prioritizes grain alignment over space optimization)`);
  });
});
