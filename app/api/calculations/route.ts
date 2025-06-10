import { NextRequest, NextResponse } from 'next/server';
import { Env, SavedCalculation, dbToAppCalculation, appToDbCalculation } from '../../lib/types';

// Helper function to get DB binding in different environments
function getDB() {
  // Check for global mock DB (set by middleware in development)
  if (typeof globalThis !== 'undefined' && (globalThis as any).DB) {
    return (globalThis as any).DB;
  }
  
  // For production Cloudflare environment
  if (typeof process !== 'undefined' && (process.env as any).DB) {
    return (process.env as any).DB;
  }
  
  console.error('D1 database binding not available');
  return null;
}

// Get all calculations
export async function GET(request: NextRequest) {
  try {
    const DB = getDB();
    
    if (!DB) {
      return NextResponse.json(
        { error: 'Database not available', calculations: [] }, 
        { status: 500 }
      );
    }

    const { results } = await DB.prepare(
      'SELECT * FROM calculations ORDER BY date_modified DESC'
    ).all();

    if (!results || !Array.isArray(results)) {
      return NextResponse.json({ calculations: [] }, { status: 200 });
    }

    const calculations = results.map(result => dbToAppCalculation(result as any));
    
    return NextResponse.json({ calculations }, { status: 200 });
  } catch (error) {
    console.error('Error fetching calculations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch calculations', calculations: [] },
      { status: 500 }
    );
  }
}

// Create a new calculation
export async function POST(request: NextRequest) {
  try {
    const DB = getDB();
    
    if (!DB) {
      return NextResponse.json(
        { error: 'Database not available' }, 
        { status: 500 }
      );
    }
    
    const calculation: SavedCalculation = await request.json();
    
    const dbCalc = appToDbCalculation(calculation);
    
    const result = await DB.prepare(`
      INSERT INTO calculations (
        id, name, description, kerf_thickness, available_stocks, 
        required_parts, results, date_created, date_modified, user_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      dbCalc.id,
      dbCalc.name,
      dbCalc.description,
      dbCalc.kerf_thickness,
      dbCalc.available_stocks,
      dbCalc.required_parts,
      dbCalc.results,
      dbCalc.date_created,
      dbCalc.date_modified,
      dbCalc.user_id
    ).run();
    
        return NextResponse.json({ success: true, id: calculation.id }, { status: 201 });
  } catch (error) {
    console.error('Error creating calculation:', error);
    return NextResponse.json(
      { error: 'Failed to create calculation' },
      { status: 500 }
    );
  }
}
