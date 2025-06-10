'use client';

import { useState } from 'react';
import { MaterialType } from '../lib/types';

function TestUnifiedEnginePage() {
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

  const runEngineTest = async () => {
    console.log('🧪 Testing unified packing engine directly...');
    setLoading(true);
    setResults([]);

    try {
      // Step 1: Test import
      addResult('Import unified engine', true, 'Starting import...');
      const engineModule = await import('../lib/unified-packing-engine');
      addResult('Import unified engine', true, 'Import successful');

      // Step 2: Check exports
      addResult('Check exports', true, 'Checking what was exported...');
      const exports = Object.keys(engineModule);
      addResult('Check exports', true, { exports });

      // Step 3: Check if unifiedPackingEngine exists
      addResult('Check engine instance', true, 'Checking engine instance...');
      const { unifiedPackingEngine } = engineModule;
      addResult('Check engine instance', !!unifiedPackingEngine, {
        hasEngine: !!unifiedPackingEngine,
        type: typeof unifiedPackingEngine
      });

      if (!unifiedPackingEngine) {
        addResult('Engine missing', false, null, 'unifiedPackingEngine is undefined');
        return;
      }

      // Step 4: Check if packParts method exists
      addResult('Check packParts method', true, 'Checking method...');
      const hasPackParts = typeof unifiedPackingEngine.packParts === 'function';
      addResult('Check packParts method', hasPackParts, {
        hasMethod: hasPackParts,
        methods: Object.getOwnPropertyNames(Object.getPrototypeOf(unifiedPackingEngine))
      });

      // Step 5: Try a minimal packParts call
      if (hasPackParts) {
        addResult('Test minimal packParts', true, 'Creating test data...');
        
        const testPart = {
          name: "Test",
          length: 100,
          width: 50,
          thickness: 18,
          quantity: 1,
          material: "Test",
          materialType: MaterialType.Sheet,
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

        addResult('Test minimal packParts', true, 'Calling packParts...');
        const result = unifiedPackingEngine.packParts(testInstances, testStock, 3.2);
        addResult('Test minimal packParts', true, {
          hasResult: !!result,
          success: result?.success,
          efficiency: result?.efficiency
        });
      }

    } catch (err) {
      console.error('❌ Error in engine test:', err);
      addResult('Error occurred', false, null, err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Test Unified Packing Engine</h1>
      
      <div className="mb-4 p-4 bg-orange-100 border border-orange-400 text-orange-800 rounded">
        <p><strong>Purpose:</strong> Test the unified packing engine directly to isolate import/instantiation issues.</p>
      </div>

      <button 
        onClick={runEngineTest}
        disabled={loading}
        className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 disabled:opacity-50 mb-6"
      >
        {loading ? 'Testing Engine...' : 'Run Engine Test'}
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
          </div>
        ))}
      </div>
    </div>
  );
}

export default TestUnifiedEnginePage;
