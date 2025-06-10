import { NextRequest, NextResponse } from 'next/server';
import { Env, SavedCalculation, dbToAppCalculation, appToDbCalculation } from '../../../lib/types';

// Helper function to get DB binding in different environments
function getDB() {
  // For local development with wrangler
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const DB = getDB();
    
    if (!DB) {
      return NextResponse.json(
        { error: 'Database not available' }, 
        { status: 500 }
      );
    }

    const result = await DB.prepare(
      'SELECT * FROM calculations WHERE id = ?'
    ).bind(id).first();

    if (!result) {
      return NextResponse.json(
        { error: 'Calculation not found' },
        { status: 404 }
      );
    }

    const calculation = dbToAppCalculation(result);
    
    return NextResponse.json({ calculation }, { status: 200 });
  } catch (error) {
    console.error(`Error fetching calculation ${id}:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch calculation' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const DB = getDB();
    
    if (!DB) {
      return NextResponse.json(
        { error: 'Database not available' }, 
        { status: 500 }
      );
    }
    
    const calculation: SavedCalculation = await request.json();
    
    // Ensure the ID in the URL matches the calculation
    if (id !== calculation.id) {
      return NextResponse.json(
        { error: 'ID mismatch' },
        { status: 400 }
      );
    }
    
    const dbCalc = appToDbCalculation(calculation);
    
    const result = await DB.prepare(`
      UPDATE calculations
      SET name = ?, description = ?, kerf_thickness = ?, 
          available_stocks = ?, required_parts = ?, results = ?,
          date_modified = ?
      WHERE id = ?
    `).bind(
      dbCalc.name,
      dbCalc.description,
      dbCalc.kerf_thickness,
      dbCalc.available_stocks,
      dbCalc.required_parts,
      dbCalc.results,
      dbCalc.date_modified,
      id
    ).run();
    
    if (result.meta.changes === 0) {
      return NextResponse.json(
        { error: 'Calculation not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error(`Error updating calculation ${id}:`, error);
    return NextResponse.json(
      { error: 'Failed to update calculation' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const DB = getDB();
    
    if (!DB) {
      return NextResponse.json(
        { error: 'Database not available' }, 
        { status: 500 }
      );
    }
    
    const result = await DB.prepare(
      'DELETE FROM calculations WHERE id = ?'
    ).bind(id).run();
    
    if (result.meta.changes === 0) {
      return NextResponse.json(
        { error: 'Calculation not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error(`Error deleting calculation ${id}:`, error);
    return NextResponse.json(
      { error: 'Failed to delete calculation' },
      { status: 500 }
    );
  }
}
