import { NextRequest, NextResponse } from "next/server";
import { setupD1Binding } from "../../../lib/db-setup";

// Type for route parameters
type Params = {
  params: Promise<{
    id: string;
  }>;
};

// GET handler to fetch a specific warehouse stock item
export async function GET(request: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    // Set up D1 database binding (if in development)
    await setupD1Binding();
    
    // Query the database for the specific warehouse stock item
    const item = await globalThis.DB.prepare(
      "SELECT * FROM warehouse_stock WHERE id = ?"
    ).bind(id).first();
    
    if (!item) {
      return NextResponse.json(
        { error: "Warehouse stock item not found" },
        { status: 404 }
      );
    }
    
    // Convert DB object to application object
    const stockItem = {
      id: item.id,
      length: item.length,
      width: item.width,
      thickness: item.thickness,
      quantity: item.quantity,
      material: item.material,
      location: item.location,
      dateAdded: item.date_added,
      dateModified: item.date_modified
    };
    
    return NextResponse.json(stockItem);
  } catch (error) {
    console.error(`Error fetching warehouse stock item ${id}:`, error);
    return NextResponse.json(
      { error: "Failed to fetch warehouse stock item" },
      { status: 500 }
    );
  }
}

// PUT handler to update a specific warehouse stock item
export async function PUT(request: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    // Set up D1 database binding (if in development)
    await setupD1Binding();
    const stockItem = await request.json() as {
      length: number;
      width: number;
      thickness: number;
      quantity: number;
      material?: string | null;
      location?: string | null;
    };
    const now = Date.now();
    
    // Update the warehouse stock item
    const result = await globalThis.DB.prepare(
      `UPDATE warehouse_stock 
       SET length = ?, width = ?, thickness = ?, quantity = ?, 
           material = ?, location = ?, date_modified = ?
       WHERE id = ?`
    ).bind(
      stockItem.length,
      stockItem.width,
      stockItem.thickness,
      stockItem.quantity,
      stockItem.material || null,
      stockItem.location || null,
      now,
      id
    ).run();
    
    if (result.meta.changes === 0) {
      return NextResponse.json(
        { error: "Warehouse stock item not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      id,
      ...stockItem,
      dateModified: now
    });
  } catch (error) {
    console.error(`Error updating warehouse stock item ${id}:`, error);
    return NextResponse.json(
      { error: "Failed to update warehouse stock item" },
      { status: 500 }
    );
  }
}

// DELETE handler to delete a specific warehouse stock item
export async function DELETE(request: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    // Set up D1 database binding (if in development)
    await setupD1Binding();
    
    // Delete the warehouse stock item
    const result = await globalThis.DB.prepare(
      "DELETE FROM warehouse_stock WHERE id = ?"
    ).bind(id).run();
    
    if (result.meta.changes === 0) {
      return NextResponse.json(
        { error: "Warehouse stock item not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`Error deleting warehouse stock item ${id}:`, error);
    return NextResponse.json(
      { error: "Failed to delete warehouse stock item" },
      { status: 500 }
    );
  }
}
