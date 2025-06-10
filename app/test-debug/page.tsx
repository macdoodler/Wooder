'use client';

import { useState } from 'react';

function TestStepByStepPage() {
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

  const runStepByStepTest = async () => {
    console.log('🧪 Starting unified engine test...');
    setLoading(true);
    setResults([]);

    try {
      // Step 1: Test unified engine import
      addResult('Import unified engine', true, 'Starting import...');
      const engineModule = await import('../lib/unified-packing-engine');
      addResult('Import unified engine', true, 'Import successful');

      // Step 2: Check what was exported
      addResult('Check exports', true, Object.keys(engineModule).join(', '));

      // Step 3: Check unifiedPackingEngine instance
      const { unifiedPackingEngine } = engineModule;
      addResult('Check engine instance', !!unifiedPackingEngine, {
        hasEngine: !!unifiedPackingEngine,
        type: typeof unifiedPackingEngine
      });

      if (!unifiedPackingEngine) {
        addResult('Engine missing', false, null, 'unifiedPackingEngine is undefined');
        return;
      }

      // Step 4: Check packParts method
      const hasPackParts = typeof unifiedPackingEngine.packParts === 'function';
      addResult('Check packParts method', hasPackParts, {
        hasMethod: hasPackParts,
        methods: Object.getOwnPropertyNames(Object.getPrototypeOf(unifiedPackingEngine))
      });

      if (hasPackParts) {
        // Step 5: Test minimal call
        addResult('Test minimal call', true, 'Creating test data...');
        
        // Import MaterialType
        const { MaterialType } = await import('../lib/types');
        
        const testPart = {
          name: "Test",
          length: 100,
          width: 50,
          thickness: 18,
          quantity: 1,
          material: "Test",
          grainDirection: "horizontal" as const
        };

        const testStock = {
          id: "test",
          length: 1000,
          width: 500,
          thickness: 18,
          quantity: 1,
          material: "Test",
          materialType: MaterialType.Sheet,
          grainDirection: "horizontal" as const
        };

        const testInstances = [{
          part: testPart,
          partIndex: 0,
          instanceId: "test-1"
        }];

        addResult('Call packParts', true, 'Calling packParts...');
        const result = unifiedPackingEngine.packParts(testInstances, testStock, 3.2);
        addResult('Call packParts', true, {
          hasResult: !!result,
          success: result?.success,
          efficiency: result?.efficiency
        });
      }

    } catch (err) {
      console.error('❌ Error in unified engine test:', err);
      addResult('Error occurred', false, null, err);
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
        <p>Check the browser console for detailed logs.</p>
      </div>
    </div>
  );
}

export default TestStepByStepPage;
