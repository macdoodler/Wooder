import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { Stock } from "../../lib/types";
import { setupD1Binding } from "../../lib/db-setup";

// Add a type declaration for globalThis.DB
declare global {
  // Replace 'any' with the actual type if available
  var DB: {
    prepare: (query: string) => any;
  };
}

// GET handler to fetch all warehouse stock
export async function GET(request: NextRequest) {
  try {
    // Set up D1 database binding (if in development)
    await setupD1Binding();
    
    // Query the database for all warehouse stock
    const { results } = await globalThis.DB.prepare(
      "SELECT * FROM warehouse_stock ORDER BY date_modified DESC"
    ).all();
    
    // Convert DB objects to application objects
    const warehouseStock = results.map((item: any) => ({
      id: item.id,
      length: item.length,
      width: item.width,
      thickness: item.thickness,
      quantity: item.quantity,
      material: item.material,
      location: item.location,
      dateAdded: item.date_added,
      dateModified: item.date_modified
    }));
    
    return NextResponse.json(warehouseStock);
  } catch (error) {
    console.error("Error fetching warehouse stock:", error);
    return NextResponse.json(
      { error: "Failed to fetch warehouse stock" },
      { status: 500 }
    );
  }
}

// POST handler to create a new warehouse stock item
export async function POST(request: NextRequest) {
  try {
    // Set up D1 database binding (if in development)
    await setupD1Binding();
    
    // Get the request body
    const stockItem: Stock = await request.json();
    
    // Generate a new ID and timestamp
    const id = stockItem.id || uuidv4();
    const now = Date.now();
    
    // Insert the new stock item into the database
    const result = await globalThis.DB.prepare(
      `INSERT INTO warehouse_stock 
       (id, length, width, thickness, quantity, material, location, date_added, date_modified, user_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      id,
      stockItem.length,
      stockItem.width,
      stockItem.thickness,
      stockItem.quantity,
      stockItem.material || null,
      stockItem.location || null,
      stockItem.dateAdded || now,
      now,
      null // No user system yet
    ).run();
    
    if (result.success) {
      return NextResponse.json({
        id,
        ...stockItem,
        dateAdded: stockItem.dateAdded || now,
        dateModified: now
      });
    } else {
      throw new Error("Failed to insert stock item");
    }
  } catch (error) {
    console.error("Error creating warehouse stock item:", error);
    return NextResponse.json(
      { error: "Failed to create warehouse stock item" },
      { status: 500 }
    );
  }
}

// DELETE handler to delete all warehouse stock (for testing/admin)
export async function DELETE(request: NextRequest) {
  try {
    // Set up D1 database binding (if in development)
    await setupD1Binding();
    
    // Delete all warehouse stock
    const result = await globalThis.DB.prepare(
      "DELETE FROM warehouse_stock"
    ).run();
    
    return NextResponse.json({ success: result.success });
  } catch (error) {
    console.error("Error deleting all warehouse stock:", error);
    return NextResponse.json(
      { error: "Failed to delete all warehouse stock" },
      { status: 500 }
    );
  }
}
