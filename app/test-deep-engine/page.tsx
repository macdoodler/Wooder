'use client';

import { useState } from 'react';

export default function TestUnifiedEngineDeepPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const addLog = (message: string) => {
    console.log(message);
    setLogs(prev => [...prev, message]);
  };

  const runDeepEngineTest = async () => {
    setLogs([]);
    setError(null);
    
    try {
      addLog('🔍 Deep testing unified packing engine...');
      
      // Step 1: Import and inspect the unified engine
      addLog('1. Importing unified packing engine...');
      const engineModule = await import('../lib/unified-packing-engine');
      addLog(`✅ Engine module keys: ${Object.keys(engineModule)}`);
      
      const { unifiedPackingEngine } = engineModule;
      if (!unifiedPackingEngine) {
        addLog('❌ unifiedPackingEngine is undefined');
        return;
      }
      
      addLog('✅ unifiedPackingEngine exists');
      addLog(`🔍 Engine methods: ${Object.getOwnPropertyNames(Object.getPrototypeOf(unifiedPackingEngine))}`);
      
      // Step 2: Import types and create test data
      addLog('2. Creating test data...');
      const typesModule = await import('../lib/types');
      const { MaterialType } = typesModule;
      
      const testPart = {
        name: "Test Part",
        length: 100,
        width: 50,
        thickness: 18,
        quantity: 1,
        material: "Plywood",
        grainDirection: "horizontal" as const
      };
      
      const testStock = {
        id: "test-stock",
        length: 1000,
        width: 500,
        thickness: 18,
        quantity: 1,
        material: "Plywood",
        materialType: MaterialType.Sheet,
        grainDirection: "horizontal" as const
      };
      
      const testInstances = [{
        part: testPart,
        partIndex: 0,
        instanceId: "test-1"
      }];
      
      addLog('✅ Test data created');
      
      // Step 3: Test each parameter to packParts
      addLog('3. Testing packParts parameters...');
      addLog(`🔍 testInstances: ${JSON.stringify(testInstances)}`);
      addLog(`🔍 testStock: ${JSON.stringify(testStock)}`);
      addLog(`🔍 kerfThickness: 3.2`);
      
      // Step 4: Test packParts with detailed error capture
      addLog('4. Calling packParts with error monitoring...');
      
      // Override console to capture internal logs
      const originalLog = console.log;
      const originalError = console.error;
      const originalWarn = console.warn;
      
      console.log = (...args: any[]) => {
        const msg = args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
        addLog(`📝 ENGINE LOG: ${msg}`);
        originalLog(...args);
      };
      
      console.error = (...args: any[]) => {
        const msg = args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
        addLog(`🚨 ENGINE ERROR: ${msg}`);
        originalError(...args);
      };
      
      console.warn = (...args: any[]) => {
        const msg = args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
        addLog(`⚠️ ENGINE WARN: ${msg}`);
        originalWarn(...args);
      };
      
      try {
        addLog('🎯 Calling unifiedPackingEngine.packParts...');
        const result = unifiedPackingEngine.packParts(testInstances, testStock, 3.2);
        
        addLog('✅ packParts call completed');
        addLog(`📊 Result: ${result ? 'Has result' : 'No result'}`);
        
        if (result) {
          addLog(`📊 Success: ${result.success}`);
          addLog(`📊 Strategy: ${result.strategy}`);
          addLog(`📊 Efficiency: ${result.efficiency}`);
          addLog(`📊 Placements: ${result.placements?.length || 0}`);
          addLog(`📊 Used Area: ${result.usedArea}`);
          addLog(`📊 Free Spaces: ${result.freeSpaces?.length || 0}`);
        }
        
      } catch (packError: any) {
        addLog(`❌ Error in packParts: ${packError.message}`);
        addLog(`📍 Pack error stack: ${packError.stack?.substring(0, 800) || 'No stack'}`);
        throw packError;
      } finally {
        console.log = originalLog;
        console.error = originalError;
        console.warn = originalWarn;
      }
      
      // Step 5: Test algorithm integration
      addLog('5. Testing algorithm integration...');
      const integrationModule = await import('../lib/algorithm-integration');
      addLog(`✅ Integration module keys: ${Object.keys(integrationModule)}`);
      
      try {
        addLog('🎯 Calling consolidatedPackParts...');
        const integrationResult = integrationModule.consolidatedPackParts(testInstances, testStock, 3.2);
        addLog('✅ consolidatedPackParts completed');
        addLog(`📊 Integration result: ${integrationResult ? 'Has result' : 'No result'}`);
      } catch (integrationError: any) {
        addLog(`❌ Error in algorithm integration: ${integrationError.message}`);
        addLog(`📍 Integration error stack: ${integrationError.stack?.substring(0, 800) || 'No stack'}`);
        throw integrationError;
      }
      
    } catch (err: any) {
      const errorMsg = err?.message || String(err);
      addLog(`❌ Deep test failed: ${errorMsg}`);
      
      // Detailed error analysis
      if (errorMsg.includes('undefined')) {
        addLog(`🔍 Undefined error analysis:`);
        addLog(`🔍 Error message: "${errorMsg}"`);
        
        const stackLines = err?.stack?.split('\n') || [];
        addLog(`🔍 Stack trace (first 15 lines):`);
        stackLines.slice(0, 15).forEach((line: string, index: number) => {
          addLog(`📍 ${index}: ${line.trim()}`);
        });
      }
      
      setError(errorMsg);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Deep Unified Engine Test</h1>
      
      <div className="mb-4">
        <button
          onClick={runDeepEngineTest}
          className="bg-indigo-500 text-white px-4 py-2 rounded hover:bg-indigo-600"
        >
          Run Deep Engine Test
        </button>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <strong>Critical Error:</strong> {error}
        </div>
      )}
      
      <div className="bg-gray-100 p-4 rounded">
        <h2 className="font-bold mb-2">Deep Debug Log:</h2>
        <div className="font-mono text-xs space-y-1 max-h-96 overflow-y-auto">
          {logs.map((log, index) => (
            <div 
              key={index} 
              className={
                log.includes('🚨') ? 'text-red-600 font-bold' : 
                log.includes('❌') ? 'text-red-600' : 
                log.includes('⚠️') ? 'text-yellow-600' : 
                log.includes('📝') ? 'text-blue-600' : 
                log.includes('🎯') ? 'text-purple-600 font-bold' : 
                log.includes('✅') ? 'text-green-600' : 
                'text-gray-700'
              }
            >
              {log}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
