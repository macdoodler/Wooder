'use client';

import { useState } from 'react';

function TestMainCalculationPage() {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const addResult = (step: string, success: boolean, data?: any, error?: any) => {
    setResults(prev => [...prev, { 
      step, 
      success, 
      data, 
      error: error instanceof Error ? error.message : error, 
      timestamp: new Date().toISOString() 
    }]);
  };

  const runMainCalculationTest = async () => {
    console.log('🧪 Testing main calculateOptimalCuts function...');
    setLoading(true);
    setResults([]);

    try {
      // Import MaterialType first
      const { MaterialType } = await import('../lib/types');
      
      // Test data
      const testParts = [
        {
          name: "Simple Part",
          length: 200,
          width: 100,
          thickness: 18,
          quantity: 1,
          material: "Plywood",
          grainDirection: "horizontal" as const
        }
      ];

      const testStock = [
        {
          id: "test-stock",
          length: 1200,
          width: 800,
          thickness: 18,
          quantity: 1,
          material: "Plywood",
          materialType: MaterialType.Sheet,
          grainDirection: "horizontal" as const
        }
      ];

      addResult('Test data created', true, 'Parts and stock ready');

      // Step 1: Import calculateOptimalCuts
      addResult('Import main function', true, 'Starting import...');
      const { calculateOptimalCuts } = await import('../lib/calculateOptimalCuts');
      addResult('Import main function', true, 'Import successful');

      // Step 2: Test the main calculation with error catching
      addResult('Run main calculation', true, 'Starting main calculation...');
      
      console.log('About to call calculateOptimalCuts with:', { testParts, testStock });
      
      const result = calculateOptimalCuts(testStock, testParts, 3.2);
      
      addResult('Run main calculation', true, { 
        hasResult: !!result,
        stockUsage: result?.stockUsage?.length || 0,
        success: result?.success,
        totalWaste: result?.totalWaste,
        type: typeof result
      });

      // Step 3: Validate result structure
      if (result) {
        addResult('Validate result', true, {
          hasStockUsage: !!result.stockUsage,
          hasSuccess: typeof result.success === 'boolean',
          hasTotalWaste: typeof result.totalWaste === 'number',
          stockUsageCount: result.stockUsage?.length || 0
        });
      } else {
        addResult('Validate result', false, null, 'Result is null or undefined');
      }

    } catch (err) {
      console.error('❌ Error in main calculation test:', err);
      addResult('Error occurred', false, null, err);
      
      // Try to get more details about the error
      if (err instanceof Error) {
        addResult('Error details', false, {
          name: err.name,
          message: err.message,
          stack: err.stack?.split('\n')[0] // Just the first line of stack
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Test Main Calculation Function</h1>
      
      <div className="mb-4 p-4 bg-blue-100 border border-blue-400 text-blue-800 rounded">
        <p><strong>Purpose:</strong> Test the main calculateOptimalCuts function with proper parameters.</p>
      </div>

      <button 
        onClick={runMainCalculationTest}
        disabled={loading}
        className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50 mb-6"
      >
        {loading ? 'Testing Main Calculation...' : 'Run Main Calculation Test'}
      </button>

      <div className="space-y-2">
        {results.map((result, index) => (
          <div 
            key={index} 
            className={`p-3 rounded border ${
              result.success 
                ? 'bg-green-50 border-green-200 text-green-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}
          >
            <div className="font-semibold">
              {result.success ? '✅' : '❌'} {result.step}
            </div>
            {result.data && (
              <div className="text-sm mt-1 break-words">
                <strong>Data:</strong> {typeof result.data === 'string' ? result.data : JSON.stringify(result.data, null, 2)}
              </div>
            )}
            {result.error && (
              <div className="text-sm mt-1 break-words">
                <strong>Error:</strong> {result.error}
              </div>
            )}
            <div className="text-xs text-gray-500 mt-1">
              {result.timestamp}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 text-sm text-gray-600">
        <p>This test directly calls calculateOptimalCuts with the correct parameters.</p>
      </div>
    </div>
  );
}

export default TestMainCalculationPage;
