'use client';

import { useState } from 'react';
import { MaterialType } from '../lib/types';

export default function TestStepByStepPage() {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const addResult = (step: string, success: boolean, data?: any, error?: any) => {
    setResults(prev => [...prev, { step, success, data, error, timestamp: new Date().toISOString() }]);
  };

  const runStepByStepTest = async () => {
    console.log('🧪 Starting step-by-step test...');
    setLoading(true);
    setResults([]);

    try {
      // Step 1: Test imports
      addResult('Import unified-packing-engine', true, 'Starting import...');
      const { unifiedPackingEngine } = await import('../lib/unified-packing-engine');
      addResult('Import unified-packing-engine', true, 'Imported successfully');

      addResult('Import algorithm-integration', true, 'Starting import...');
      const { consolidatedPackParts } = await import('../lib/algorithm-integration');
      addResult('Import algorithm-integration', true, 'Imported successfully');

      addResult('Import calculateOptimalCuts', true, 'Starting import...');
      const { calculateOptimalCuts } = await import('../lib/calculateOptimalCuts');
      addResult('Import calculateOptimalCuts', true, 'Imported successfully');

      // Step 2: Test data creation
      addResult('Create test data', true, 'Creating test parts and stock...');
      
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

      addResult('Create test data', true, { 
        parts: testParts.length, 
        stock: testStock.length 
      });

      // Step 3: Test the cutting calculation
      addResult('Run calculateOptimalCuts', true, 'Starting calculation...');
      
      const result = calculateOptimalCuts(testStock, testParts, 3.2);
      
      addResult('Run calculateOptimalCuts', true, {
        success: !!result,
        stockUsage: result?.stockUsage?.length || 0,
        totalUsedSheets: result?.totalUsedSheets || 0
      });

    } catch (err) {
      console.error('❌ Error in step-by-step test:', err);
      addResult('Error occurred', false, null, err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Step-by-Step Debugging Test</h1>
      
      <button 
        onClick={runStepByStepTest}
        disabled={loading}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50 mb-6"
      >
        {loading ? 'Running Tests...' : 'Run Step-by-Step Test'}
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
              <div className="text-sm mt-1">
                <strong>Data:</strong> {typeof result.data === 'string' ? result.data : JSON.stringify(result.data)}
              </div>
            )}
            {result.error && (
              <div className="text-sm mt-1">
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
        <p>Check the browser console for detailed logs. This test will help identify exactly where the error occurs.</p>
      </div>
    </div>
  );
}
