import { NextRequest, NextResponse } from 'next/server';
import { Env } from '../../../lib/types';

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

export async function DELETE(request: NextRequest) {
  try {
    const DB = getDB();
    
    if (!DB) {
      return NextResponse.json(
        { error: 'Database not available' }, 
        { status: 500 }
      );
    }
    
    const result = await DB.prepare(
      'DELETE FROM calculations'
    ).run();
    
    return NextResponse.json({ 
      success: true, 
      deleted: result.meta.changes 
    }, { status: 200 });
  } catch (error) {
    console.error('Error deleting all calculations:', error);
    return NextResponse.json(
      { error: 'Failed to delete all calculations' },
      { status: 500 }
    );
  }
}
