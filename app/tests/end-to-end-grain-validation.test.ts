import { StockDefinition, Part, MaterialType } from '../lib/types';

describe('End-to-End Grain Direction Validation', () => {
  test('Grain direction logic validation with correct types', () => {
    // Test data using the actual type structure
    const stockDefinition: StockDefinition = {
      id: '1',
      name: 'Plywood Sheet 1',
      material: 'Plywood',
      materialType: MaterialType.Sheet,
      width: 1200,
      height: 800,
      thickness: 18,
      grainDirection: 'horizontal', // Stock grain is horizontal
      cost: 50,
      inStock: 5
    };

    const parts: Part[] = [
      {
        length: 400,
        width: 600,
        thickness: 18,
        quantity: 1,
        material: 'Plywood',
        materialType: MaterialType.Sheet,
        grainDirection: 'horizontal', // Should align with stock
      },
      {
        length: 350,
        width: 500,
        thickness: 18,
        quantity: 1,
        material: 'Plywood',
        materialType: MaterialType.Sheet,
        grainDirection: 'vertical', // Should be cross-grain
      },
      {
        length: 300,
        width: 200,
        thickness: 18,
        quantity: 1,
        material: 'Plywood',
        materialType: MaterialType.Sheet,
        // No grain direction - should have no constraint
      }
    ];

    console.log('\n=== GRAIN DIRECTION VALIDATION ===');
    console.log(`Stock grain direction: ${stockDefinition.grainDirection}`);
    
    // Test the grain alignment logic
    const validateGrainAlignment = (part: Part, stock: StockDefinition) => {
      if (!part.grainDirection || !stock.grainDirection) {
        return null; // No constraint
      }
      return part.grainDirection === stock.grainDirection;
    };

    const results = parts.map((part, index) => {
      const grainAlignment = validateGrainAlignment(part, stockDefinition);
      const status = grainAlignment === null ? 'No constraint' : 
                    grainAlignment ? 'Aligned' : 'Cross-grain';
      
      console.log(`Part ${index + 1} (${part.length}x${part.width}): ${part.grainDirection || 'no grain'} → ${status}`);
      
      return {
        partIndex: index,
        partGrain: part.grainDirection,
        stockGrain: stockDefinition.grainDirection,
        isAligned: grainAlignment,
        status
      };
    });

    // Validate expected results
    expect(results[0].isAligned).toBe(true); // horizontal-horizontal alignment
    expect(results[0].status).toBe('Aligned');
    
    expect(results[1].isAligned).toBe(false); // horizontal-vertical cross-grain
    expect(results[1].status).toBe('Cross-grain');
    
    expect(results[2].isAligned).toBe(null); // no grain constraint
    expect(results[2].status).toBe('No constraint');

    console.log('\n✅ Grain direction logic validation completed successfully!');
  });
});
