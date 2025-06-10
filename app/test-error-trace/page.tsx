'use client';

import { useState } from 'react';

export default function TestErrorTracePage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const addLog = (message: string) => {
    console.log(message);
    setLogs(prev => [...prev, message]);
  };

  const runErrorTrace = async () => {
    setLogs([]);
    setError(null);
    
    try {
      addLog('🔍 Starting error trace...');
      
      // Step 1: Import calculateOptimalCuts
      addLog('Importing calculateOptimalCuts...');
      const { calculateOptimalCuts } = await import('../lib/calculateOptimalCuts');
      addLog('✅ calculateOptimalCuts imported successfully');
      
      // Step 2: Import types
      addLog('Importing types...');
      const { MaterialType } = await import('../lib/types');
      addLog('✅ Types imported successfully');
      
      // Step 3: Create minimal test data
      addLog('Creating test data...');
      const parts = [{
        name: "Test Part",
        length: 100,
        width: 50,
        thickness: 18,
        quantity: 1,
        material: "Plywood",
        grainDirection: "horizontal" as const
      }];
      
      const stocks = [{
        id: "test-stock",
        length: 1000,
        width: 500,
        thickness: 18,
        quantity: 1,
        material: "Plywood",
        materialType: MaterialType.Sheet,
        grainDirection: "horizontal" as const
      }];
      
      addLog('✅ Test data created');
      
      // Step 4: Call calculateOptimalCuts with detailed error handling
      addLog('Calling calculateOptimalCuts...');
      
      // Override console.error to catch the actual error
      const originalError = console.error;
      let caughtError: any = null;
      console.error = (...args: any[]) => {
        caughtError = args;
        originalError(...args);
      };
      
      try {
        const result = calculateOptimalCuts(parts, stocks, 3.2);
        addLog(`✅ calculateOptimalCuts completed: ${JSON.stringify(result?.stockUsage?.length || 0)} stocks used`);
      } catch (innerError) {
        addLog(`❌ Error in calculateOptimalCuts: ${innerError}`);
        throw innerError;
      } finally {
        console.error = originalError;
        if (caughtError) {
          addLog(`🚨 Console error captured: ${JSON.stringify(caughtError)}`);
        }
      }
      
    } catch (err: any) {
      const errorMsg = err?.message || String(err);
      addLog(`❌ Error: ${errorMsg}`);
      addLog(`📍 Stack: ${err?.stack || 'No stack trace'}`);
      setError(errorMsg);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Error Trace Test</h1>
      
      <button
        onClick={runErrorTrace}
        className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 mb-4"
      >
        Run Error Trace
      </button>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <strong>Error:</strong> {error}
        </div>
      )}
      
      <div className="bg-gray-100 p-4 rounded">
        <h2 className="font-bold mb-2">Execution Log:</h2>
        <div className="font-mono text-sm space-y-1">
          {logs.map((log, index) => (
            <div key={index} className={log.includes('❌') ? 'text-red-600' : log.includes('✅') ? 'text-green-600' : 'text-gray-700'}>
              {log}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
