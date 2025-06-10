'use client';

import { SavedCalculation, dbToAppCalculation, appToDbCalculation, Stock } from './types';

// In-memory storage for local development with localStorage persistence
let localDBStorage = {
  calculations: [] as any[],
  warehouseStock: [] as any[]
};

// Initialize the local database from localStorage
function initLocalDB() {
  if (typeof window !== 'undefined') {
    try {
      const storedData = localStorage.getItem('wooder_local_db');
      if (storedData) {
        localDBStorage = JSON.parse(storedData);
        // Initialize warehouseStock if it doesn't exist (for backward compatibility)
        if (!localDBStorage.warehouseStock) {
          localDBStorage.warehouseStock = [];
        }
        console.log('[Local DB] Initialized from localStorage');
      } else {
        // Initialize localStorage with empty data
        saveLocalDB();
        console.log('[Local DB] Created new local database');
      }
    } catch (error) {
      console.error('[Local DB] Error accessing localStorage:', error);
    }
  }
}

// Save the local database to localStorage
function saveLocalDB() {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('wooder_local_db', JSON.stringify(localDBStorage));
    } catch (error) {
      console.error('[Local DB] Error saving to localStorage:', error);
    }
  }
}

// Initialize on module load for client side
if (typeof window !== 'undefined') {
  initLocalDB();
}

// Local database API that mirrors D1 API
export const localDB = {
  // Fetch all calculations
  getAllCalculations: async (): Promise<SavedCalculation[]> => {
    initLocalDB(); // Make sure we have the latest data
    return localDBStorage.calculations.sort((a, b) => 
      b.date_modified - a.date_modified
    ).map(calc => dbToAppCalculation(calc));
  },
  
  // Fetch a calculation by ID
  getCalculation: async (id: string): Promise<SavedCalculation | null> => {
    initLocalDB(); // Make sure we have the latest data
    const found = localDBStorage.calculations.find(calc => calc.id === id);
    return found ? dbToAppCalculation(found) : null;
  },
  
  // Create a new calculation
  createCalculation: async (calculation: SavedCalculation): Promise<boolean> => {
    initLocalDB(); // Make sure we have the latest data
    
    const dbCalc = appToDbCalculation(calculation);
    localDBStorage.calculations.push(dbCalc);
    
    saveLocalDB();
    return true;
  },
  
  // Update an existing calculation
  updateCalculation: async (calculation: SavedCalculation): Promise<boolean> => {
    initLocalDB(); // Make sure we have the latest data
    
    const index = localDBStorage.calculations.findIndex(calc => calc.id === calculation.id);
    if (index === -1) return false;
    
    const dbCalc = appToDbCalculation(calculation);
    localDBStorage.calculations[index] = dbCalc;
    
    saveLocalDB();
    return true;
  },
  
  // Delete a calculation
  deleteCalculation: async (id: string): Promise<boolean> => {
    initLocalDB(); // Make sure we have the latest data
    
    const initialLength = localDBStorage.calculations.length;
    localDBStorage.calculations = localDBStorage.calculations.filter(calc => calc.id !== id);
    
    saveLocalDB();
    return initialLength !== localDBStorage.calculations.length;
  },
  
  // Delete all calculations
  deleteAllCalculations: async (): Promise<boolean> => {
    initLocalDB(); // Make sure we have the latest data
    
    localDBStorage.calculations = [];
    
    saveLocalDB();
    return true;
  },
  
  // WAREHOUSE STOCK METHODS
  
  // Fetch all warehouse stock
  getAllWarehouseStock: async (): Promise<Stock[]> => {
    initLocalDB(); // Make sure we have the latest data
    return localDBStorage.warehouseStock.sort((a, b) => 
      b.date_modified - a.date_modified
    ).map(stock => ({
      id: stock.id,
      length: stock.length,
      width: stock.width,
      thickness: stock.thickness,
      quantity: stock.quantity,
      material: stock.material,
      location: stock.location,
      dateAdded: stock.date_added,
      dateModified: stock.date_modified
    }));
  },
  
  // Fetch warehouse stock by ID
  getWarehouseStock: async (id: string): Promise<Stock | null> => {
    initLocalDB(); // Make sure we have the latest data
    const found = localDBStorage.warehouseStock.find(stock => stock.id === id);
    if (!found) return null;
    
    return {
      id: found.id,
      length: found.length,
      width: found.width,
      thickness: found.thickness,
      quantity: found.quantity,
      material: found.material,
      location: found.location,
      dateAdded: found.date_added,
      dateModified: found.date_modified
    } as Stock;
  },
  
  // Create a new warehouse stock item
  createWarehouseStock: async (stockItem: Stock): Promise<boolean> => {
    initLocalDB(); // Make sure we have the latest data
    
    const dbStock = {
      id: stockItem.id,
      length: stockItem.length,
      width: stockItem.width,
      thickness: stockItem.thickness,
      quantity: stockItem.quantity,
      material: stockItem.material,
      location: stockItem.location,
      date_added: stockItem.dateAdded,
      date_modified: Date.now()
    };
    
    localDBStorage.warehouseStock.push(dbStock);
    
    saveLocalDB();
    return true;
  },
  
  // Update an existing warehouse stock item
  updateWarehouseStock: async (stockItem: Stock): Promise<boolean> => {
    initLocalDB(); // Make sure we have the latest data
    
    const index = localDBStorage.warehouseStock.findIndex(stock => stock.id === stockItem.id);
    if (index === -1) return false;
    
    // Preserve dateAdded from the existing record
    const dateAdded = localDBStorage.warehouseStock[index].date_added;
    
    const dbStock = {
      id: stockItem.id,
      length: stockItem.length,
      width: stockItem.width,
      thickness: stockItem.thickness,
      quantity: stockItem.quantity,
      material: stockItem.material,
      location: stockItem.location,
      date_added: dateAdded,
      date_modified: Date.now()
    };
    
    localDBStorage.warehouseStock[index] = dbStock;
    
    saveLocalDB();
    return true;
  },
  
  // Delete a warehouse stock item
  deleteWarehouseStock: async (id: string): Promise<boolean> => {
    initLocalDB(); // Make sure we have the latest data
    
    const initialLength = localDBStorage.warehouseStock.length;
    localDBStorage.warehouseStock = localDBStorage.warehouseStock.filter(stock => stock.id !== id);
    
    saveLocalDB();
    return initialLength !== localDBStorage.warehouseStock.length;
  },
  
  // Delete all warehouse stock
  deleteAllWarehouseStock: async (): Promise<boolean> => {
    initLocalDB(); // Make sure we have the latest data
    
    localDBStorage.warehouseStock = [];
    
    saveLocalDB();
    return true;
  }
};
