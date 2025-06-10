'use client';

import { useState } from 'react';

export default function TestPropertyAccessPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const addLog = (message: string) => {
    console.log(message);
    setLogs(prev => [...prev, message]);
  };

  // Function to safely access properties and log what's undefined
  const safeAccess = (obj: any, property: any, context: string) => {
    if (obj === undefined) {
      addLog(`🚨 ${context}: Object is undefined when accessing property '${property}'`);
      return undefined;
    }
    if (property === undefined) {
      addLog(`🚨 ${context}: Property is undefined when accessing object ${JSON.stringify(obj).substring(0, 100)}`);
      return undefined;
    }
    
    const result = obj[property];
    addLog(`✅ ${context}: ${JSON.stringify(obj).substring(0, 50)}[${property}] = ${JSON.stringify(result)?.substring(0, 50) || 'undefined'}`);
    return result;
  };

  const runPropertyAccessTest = async () => {
    setLogs([]);
    setError(null);
    
    try {
      addLog('🔍 Starting property access debugging...');
      
      // Test 1: Import and basic module structure
      addLog('1. Testing imports...');
      const calcModule = await import('../lib/calculateOptimalCuts');
      addLog(`✅ calculateOptimalCuts module imported: ${Object.keys(calcModule)}`);
      
      const typesModule = await import('../lib/types');
      addLog(`✅ Types module imported: ${Object.keys(typesModule)}`);
      
      // Test 2: Create test data with property access logging
      addLog('2. Creating test data with safe property access...');
      
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
      
      addLog('✅ Test data created successfully');
      
      // Test 3: Override Object property access to catch undefined access
      addLog('3. Setting up property access monitoring...');
      
      const originalGetOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;
      const originalDefineProperty = Object.defineProperty;
      
      // Track property accesses
      let propertyAccessCount = 0;
      
      // Test 4: Call calculateOptimalCuts with monitoring
      addLog('4. Calling calculateOptimalCuts with monitoring...');
      
      // Wrap console methods to catch more detailed errors
      const originalConsoleError = console.error;
      const originalConsoleWarn = console.warn;
      
      console.error = (...args: any[]) => {
        addLog(`🚨 CONSOLE ERROR: ${args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')}`);
        originalConsoleError(...args);
      };
      
      console.warn = (...args: any[]) => {
        addLog(`⚠️ CONSOLE WARN: ${args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')}`);
        originalConsoleWarn(...args);
      };
      
      try {
        const result = calcModule.calculateOptimalCuts([testPart], [testStock], 3.2);
        addLog(`✅ calculateOptimalCuts completed successfully`);
        addLog(`📊 Result summary: ${result ? 'Has result' : 'No result'}`);
        
        if (result) {
          addLog(`📊 Stock usage length: ${result.stockUsage?.length || 'undefined'}`);
          addLog(`📊 Total used sheets: ${result.totalUsedSheets || 'undefined'}`);
        }
        
      } catch (calcError: any) {
        addLog(`❌ Error in calculateOptimalCuts: ${calcError.message}`);
        addLog(`📍 Stack trace: ${calcError.stack?.substring(0, 500) || 'No stack'}`);
        throw calcError;
      } finally {
        console.error = originalConsoleError;
        console.warn = originalConsoleWarn;
      }
      
    } catch (err: any) {
      const errorMsg = err?.message || String(err);
      addLog(`❌ Test failed: ${errorMsg}`);
      
      // Try to extract more details about undefined access
      if (errorMsg.includes('undefined')) {
        addLog(`🔍 Analyzing undefined error...`);
        const stackLines = err?.stack?.split('\n') || [];
        stackLines.forEach((line: string, index: number) => {
          if (line.includes('at ') && index < 10) {
            addLog(`📍 Stack ${index}: ${line.trim()}`);
          }
        });
      }
      
      setError(errorMsg);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Property Access Debugging</h1>
      
      <div className="mb-4">
        <button
          onClick={runPropertyAccessTest}
          className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 mr-2"
        >
          Run Property Access Test
        </button>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <strong>Error:</strong> {error}
        </div>
      )}
      
      <div className="bg-gray-100 p-4 rounded">
        <h2 className="font-bold mb-2">Debug Log:</h2>
        <div className="font-mono text-xs space-y-1 max-h-96 overflow-y-auto">
          {logs.map((log, index) => (
            <div 
              key={index} 
              className={
                log.includes('🚨') ? 'text-red-600 font-bold' : 
                log.includes('❌') ? 'text-red-600' : 
                log.includes('⚠️') ? 'text-yellow-600' : 
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
