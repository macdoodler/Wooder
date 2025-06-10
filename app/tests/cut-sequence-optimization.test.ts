import { calculateOptimalCuts } from '../lib/calculateOptimalCuts';
import { Stock, Part, MaterialType } from '../lib/types';

// Mock window for browser-specific code
(global as any).window = { DEBUG_CUTTING: false };

describe('Cut Sequence Optimization', () => {
  
  test('simple test check', () => {
    expect(true).toBe(true);
  });
  beforeEach(() => {
    // Mock console methods to reduce noise during tests
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'clear').mockImplementation();
    jest.spyOn(console, 'time').mockImplementation();
    jest.spyOn(console, 'timeEnd').mockImplementation();
    jest.spyOn(console, 'table').mockImplementation();
    jest.spyOn(console, 'group').mockImplementation();
    jest.spyOn(console, 'groupEnd').mockImplementation();
    jest.spyOn(console, 'warn').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('should generate cut sequences for sheet material', () => {
    const stocks: Stock[] = [
      {
        length: 2400,
        width: 1200,
        thickness: 18,
        quantity: 1,
        material: 'Plywood',
        materialType: MaterialType.Sheet,
        grainDirection: 'horizontal'
      }
    ];

    const parts: Part[] = [
      {
        length: 600,
        width: 400,
        thickness: 18,
        quantity: 2,
        material: 'Plywood',
        materialType: MaterialType.Sheet,
        grainDirection: 'horizontal'
      },
      {
        length: 300,
        width: 200,
        thickness: 18,
        quantity: 3,
        material: 'Plywood',
        materialType: MaterialType.Sheet,
        grainDirection: 'horizontal'
      }
    ];

    const result = calculateOptimalCuts(stocks, parts, 3);

    expect(result.success).toBe(true);
    expect(result.cutSequences).toBeDefined();
    expect(result.cutSequences!.length).toBeGreaterThan(0);

    const sequence = result.cutSequences![0];
    
    // Verify sequence structure
    expect(sequence.sheetId).toBeDefined();
    expect(sequence.stockUsageIndex).toBeDefined();
    expect(sequence.steps).toBeDefined();
    expect(sequence.steps.length).toBeGreaterThan(0);
    expect(sequence.safetyScore).toBeGreaterThan(0);
    expect(sequence.efficiencyScore).toBeGreaterThan(0);
    expect(sequence.estimatedTime).toBeGreaterThan(0);
    expect(sequence.totalSteps).toBe(sequence.steps.length);

    // Verify step structure
    const firstStep = sequence.steps[0];
    expect(firstStep.id).toBeDefined();
    expect(firstStep.stepNumber).toBeDefined();
    expect(firstStep.cutType).toBeDefined();
    expect(firstStep.description).toBeDefined();
    expect(firstStep.priority).toMatch(/^(high|medium|low)$/);

    console.log('✅ Cut sequence optimization working correctly for sheet material');
  });

  test('should generate cut sequences for dimensional lumber', () => {
    const stocks: Stock[] = [
      {
        length: 2400,
        width: 90,
        thickness: 45,
        quantity: 1,
        material: 'Pine',
        materialType: MaterialType.Dimensional
      }
    ];

    const parts: Part[] = [
      {
        length: 600,
        width: 90,
        thickness: 45,
        quantity: 2,
        material: 'Pine',
        materialType: MaterialType.Dimensional
      },
      {
        length: 400,
        width: 90,
        thickness: 45,
        quantity: 1,
        material: 'Pine',
        materialType: MaterialType.Dimensional
      }
    ];

    const result = calculateOptimalCuts(stocks, parts, 3);

    expect(result.success).toBe(true);
    expect(result.cutSequences).toBeDefined();
    expect(result.cutSequences!.length).toBeGreaterThan(0);

    const sequence = result.cutSequences![0];
    
    // Verify sequence structure for dimensional lumber
    expect(sequence.sheetId).toBeDefined();
    expect(sequence.stockUsageIndex).toBeDefined();
    expect(sequence.steps).toBeDefined();
    expect(sequence.steps.length).toBeGreaterThan(0);
    expect(sequence.safetyScore).toBeGreaterThan(0);
    expect(sequence.efficiencyScore).toBeGreaterThan(0);

    console.log('✅ Cut sequence optimization working correctly for dimensional lumber');
  });

  test('should include safety notes and tool suggestions', () => {
    const stocks: Stock[] = [
      {
        length: 2400,
        width: 1200,
        thickness: 18,
        quantity: 1,
        material: 'Plywood',
        materialType: MaterialType.Sheet
      }
    ];

    const parts: Part[] = [
      {
        length: 800,
        width: 600,
        thickness: 18,
        quantity: 3,
        material: 'Plywood',
        materialType: MaterialType.Sheet
      }
    ];

    const result = calculateOptimalCuts(stocks, parts, 3);

    expect(result.success).toBe(true);
    expect(result.cutSequences).toBeDefined();

    const sequence = result.cutSequences![0];
    
    // Check for safety notes and tool suggestions
    const hasDetailedSteps = sequence.steps.some(step => 
      step.safetyNotes && step.safetyNotes.length > 0
    );
    
    const hasToolSuggestions = sequence.steps.some(step => 
      step.toolSuggestion && step.toolSuggestion.length > 0
    );

    expect(hasDetailedSteps || hasToolSuggestions).toBe(true);

    console.log('✅ Cut sequence includes safety and tool information');
  });

  test('should provide recommendations', () => {
    const stocks: Stock[] = [
      {
        length: 2400,
        width: 1200,
        thickness: 18,
        quantity: 1,
        material: 'Plywood',
        materialType: MaterialType.Sheet
      }
    ];

    const parts: Part[] = [
      {
        length: 500,
        width: 300,
        thickness: 18,
        quantity: 4,
        material: 'Plywood',
        materialType: MaterialType.Sheet
      }
    ];

    const result = calculateOptimalCuts(stocks, parts, 3);

    expect(result.success).toBe(true);
    expect(result.cutSequences).toBeDefined();

    const sequence = result.cutSequences![0];
    
    // Should have recommendations for most cutting scenarios
    expect(sequence.recommendations).toBeDefined();

    console.log('✅ Cut sequence provides recommendations when applicable');
  });
});
