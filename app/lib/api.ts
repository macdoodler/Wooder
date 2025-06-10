'use client';

import { SavedCalculation } from '../lib/types';
import { localDB } from './local-db';

// Determine if we're in development mode
const isDevelopment = process.env.NODE_ENV === 'development';

// Function to fetch all calculations from the database
export async function fetchCalculations(): Promise<SavedCalculation[]> {
  try {
    // Use the local database in development mode
    if (isDevelopment) {
      console.log('[API] Using local database for fetchCalculations');
      return localDB.getAllCalculations();
    }
    
    const response = await fetch('/api/calculations');
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    const data = await response.json() as { calculations: SavedCalculation[] };
    return data.calculations;
  } catch (error) {
    console.error('Error fetching calculations:', error);
    return [];
  }
}

// Function to fetch a single calculation by ID
export async function fetchCalculation(id: string): Promise<SavedCalculation | null> {
  try {
    // Use the local database in development mode
    if (isDevelopment) {
      console.log(`[API] Using local database for fetchCalculation(${id})`);
      return localDB.getCalculation(id);
    }
    
    const response = await fetch(`/api/calculations/${id}`);
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Error: ${response.status}`);
    }
    const data = await response.json() as { calculation: SavedCalculation };
    return data.calculation;
  } catch (error) {
    console.error(`Error fetching calculation ${id}:`, error);
    return null;
  }
}

// Function to create a new calculation
export async function createCalculation(calculation: SavedCalculation): Promise<boolean> {
  try {
    // Use the local database in development mode
    if (isDevelopment) {
      console.log('[API] Using local database for createCalculation');
      return localDB.createCalculation(calculation);
    }
    
    const response = await fetch('/api/calculations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(calculation),
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    return true;
  } catch (error) {
    console.error('Error creating calculation:', error);
    return false;
  }
}

// Function to update an existing calculation
export async function updateCalculation(calculation: SavedCalculation): Promise<boolean> {
  try {
    // Use the local database in development mode
    if (isDevelopment) {
      console.log(`[API] Using local database for updateCalculation(${calculation.id})`);
      return localDB.updateCalculation(calculation);
    }
    
    const response = await fetch(`/api/calculations/${calculation.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(calculation),
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    return true;
  } catch (error) {
    console.error(`Error updating calculation ${calculation.id}:`, error);
    return false;
  }
}

// Function to delete a calculation
export async function deleteCalculation(id: string): Promise<boolean> {
  try {
    // Use the local database in development mode
    if (isDevelopment) {
      console.log(`[API] Using local database for deleteCalculation(${id})`);
      return localDB.deleteCalculation(id);
    }
    
    const response = await fetch(`/api/calculations/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    return true;
  } catch (error) {
    console.error(`Error deleting calculation ${id}:`, error);
    return false;
  }
}

// Function to delete all calculations
export async function deleteAllCalculations(): Promise<boolean> {
  try {
    // Use the local database in development mode
    if (isDevelopment) {
      console.log('[API] Using local database for deleteAllCalculations');
      return localDB.deleteAllCalculations();
    }
    
    const response = await fetch('/api/calculations/all', {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting all calculations:', error);
    return false;
  }
}

// WAREHOUSE API FUNCTIONS

import { Stock } from '../lib/types';

// Function to fetch all warehouse stock
export async function fetchWarehouseStock(): Promise<Stock[]> {
  try {
    // Use the local database in development mode
    if (isDevelopment) {
      console.log('[API] Using local database for fetchWarehouseStock');
      return localDB.getAllWarehouseStock();
    }
    
    const response = await fetch('/api/warehouse');
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    return await response.json() as Stock[];
  } catch (error) {
    console.error('Error fetching warehouse stock:', error);
    return [];
  }
}

// Function to fetch a single warehouse stock item by ID
export async function fetchWarehouseStockItem(id: string): Promise<Stock | null> {
  try {
    // Use the local database in development mode
    if (isDevelopment) {
      console.log(`[API] Using local database for fetchWarehouseStockItem(${id})`);
      return localDB.getWarehouseStock(id);
    }
    
    const response = await fetch(`/api/warehouse/${id}`);
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Error: ${response.status}`);
    }
    return await response.json() as Stock;
  } catch (error) {
    console.error(`Error fetching warehouse stock item ${id}:`, error);
    return null;
  }
}

// Function to create a new warehouse stock item
export async function createWarehouseStockItem(stockItem: Stock): Promise<Stock | null> {
  try {
    // Use the local database in development mode
    if (isDevelopment) {
      console.log('[API] Using local database for createWarehouseStockItem');
      const success = await localDB.createWarehouseStock(stockItem);
      return success ? stockItem : null;
    }
    
    const response = await fetch('/api/warehouse', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(stockItem),
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    return await response.json() as Stock;
  } catch (error) {
    console.error('Error creating warehouse stock item:', error);
    return null;
  }
}

// Function to update an existing warehouse stock item
export async function updateWarehouseStockItem(stockItem: Stock): Promise<Stock | null> {
  try {
    // Use the local database in development mode
    if (isDevelopment) {
      console.log(`[API] Using local database for updateWarehouseStockItem(${stockItem.id})`);
      const success = await localDB.updateWarehouseStock(stockItem);
      return success ? stockItem : null;
    }
    
    const response = await fetch(`/api/warehouse/${stockItem.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(stockItem),
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    return await response.json() as Stock;
  } catch (error) {
    console.error(`Error updating warehouse stock item ${stockItem.id}:`, error);
    return null;
  }
}

// Function to delete a warehouse stock item
export async function deleteWarehouseStockItem(id: string): Promise<boolean> {
  try {
    // Use the local database in development mode
    if (isDevelopment) {
      console.log(`[API] Using local database for deleteWarehouseStockItem(${id})`);
      return localDB.deleteWarehouseStock(id);
    }
    
    const response = await fetch(`/api/warehouse/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    return true;
  } catch (error) {
    console.error(`Error deleting warehouse stock item ${id}:`, error);
    return false;
  }
}

// Function to delete all warehouse stock
export async function deleteAllWarehouseStock(): Promise<boolean> {
  try {
    // Use the local database in development mode
    if (isDevelopment) {
      console.log('[API] Using local database for deleteAllWarehouseStock');
      return localDB.deleteAllWarehouseStock();
    }
    
    const response = await fetch('/api/warehouse', {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting all warehouse stock:', error);
    return false;
  }
}
