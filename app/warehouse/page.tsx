'use client';

import React, { useState, useEffect } from "react";
import { Stock, MaterialType, formatDimensions } from "../lib/types";
import {
  fetchWarehouseStock,
  createWarehouseStockItem,
  updateWarehouseStockItem,
  deleteWarehouseStockItem,
  deleteAllWarehouseStock,
} from "../lib/api";
// import Link from "next/link"; // Link component is not used
import { v4 as uuidv4 } from "uuid";

export default function WarehousePage() {
  const [stockItems, setStockItems] = useState<Stock[]>([]);
  const [currentItem, setCurrentItem] = useState<Stock>({
    length: 0,
    width: 0,
    thickness: 0,
    quantity: 1,
    material: "",
    materialType: MaterialType.Sheet, // Default to sheet material
    location: "",
    grainDirection: "", // New field for grain direction
  });
  const [isEditing, setIsEditing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [thicknessFilter, setThicknessFilter] = useState<number | null>(null);
  const [materialFilter, setMaterialFilter] = useState<string | null>(null);
  const [materialTypeFilter, setMaterialTypeFilter] = useState<MaterialType | null>(null);

  // Load stock items from database on component mount
  useEffect(() => {
    loadStockItems();
  }, []);

  async function loadStockItems() {
    setIsLoading(true);
    try {
      const items = await fetchWarehouseStock();
      setStockItems(items);
    } catch (error) {
      console.error("Error loading warehouse stock:", error);
      setErrorMessage("Failed to load warehouse stock items.");
    } finally {
      setIsLoading(false);
    }
  }

  const resetForm = () => {
    setCurrentItem({
      length: 0,
      width: 0,
      thickness: 0,
      quantity: 1,
      material: "",
      materialType: MaterialType.Sheet, // Default to sheet material
      location: "",
      grainDirection: "", // Reset grain direction
    });
    setIsEditing(false);
    setErrorMessage(null);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    if (name === "length" || name === "width" || name === "thickness" || name === "quantity") {
      setCurrentItem({
        ...currentItem,
        [name]: parseFloat(value) || 0,
      });
    } else {
      setCurrentItem({
        ...currentItem,
        [name]: value,
      });
    }
  };

  const validateInputs = (): boolean => {
    setErrorMessage(null);
    if (currentItem.length <= 0) {
      setErrorMessage("Length must be greater than 0.");
      return false;
    }
    if (currentItem.width <= 0) {
      setErrorMessage("Width must be greater than 0.");
      return false;
    }
    if (currentItem.thickness <= 0) {
      setErrorMessage("Thickness must be greater than 0.");
      return false;
    }
    if (currentItem.quantity <= 0) {
      setErrorMessage("Quantity must be greater than 0.");
      return false;
    }
    if (!currentItem.materialType) {
      setErrorMessage("Material type must be selected.");
      return false;
    }
    // Grain direction is only required for sheet materials
    if (currentItem.materialType === MaterialType.Sheet && !currentItem.grainDirection) {
      setErrorMessage("Grain direction must be selected for sheet materials.");
      return false;
    }
    return true;
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateInputs()) {
      return;
    }
    setIsLoading(true);
    try {
      if (isEditing && currentItem.id) {
        const updatedItem = await updateWarehouseStockItem(currentItem);
        if (updatedItem) {
          setStockItems(
            stockItems.map((item) =>
              item.id === updatedItem.id ? updatedItem : item
            )
          );
          resetForm();
        } else {
          setErrorMessage("Failed to update stock item.");
        }
      } else {
        const newItem = {
          ...currentItem,
          id: uuidv4(),
          dateAdded: Date.now(),
          dateModified: Date.now(),
        };
        const createdItem = await createWarehouseStockItem(newItem);
        if (createdItem) {
          setStockItems([createdItem, ...stockItems]);
          resetForm();
        } else {
          setErrorMessage("Failed to create stock item.");
        }
      }
    } catch (error) {
      console.error("Error saving stock item:", error);
      setErrorMessage("An error occurred while saving the stock item.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditItem = (item: Stock) => {
    setCurrentItem(item);
    setIsEditing(true);
    window.scrollTo(0, 0);
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm("Are you sure you want to delete this stock item?")) {
      return;
    }
    setIsLoading(true);
    try {
      const success = await deleteWarehouseStockItem(id);
      if (success) {
        setStockItems(stockItems.filter((item) => item.id !== id));
      } else {
        setErrorMessage("Failed to delete stock item.");
      }
    } catch (error) {
      console.error("Error deleting stock item:", error);
      setErrorMessage("An error occurred while deleting the stock item.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAllItems = async () => {
    if (!confirm("Are you sure you want to delete ALL stock items? This cannot be undone!")) {
      return;
    }
    setIsLoading(true);
    try {
      const success = await deleteAllWarehouseStock();
      if (success) {
        setStockItems([]);
      } else {
        setErrorMessage("Failed to delete all stock items.");
      }
    } catch (error) {
      console.error("Error deleting all stock items:", error);
      setErrorMessage("An error occurred while deleting all stock items.");
    } finally {
      setIsLoading(false);
    }
  };

  const uniqueThicknesses = Array.from(
    new Set(stockItems.map((item) => item.thickness))
  ).sort((a, b) => a - b);
  
  const uniqueMaterials = Array.from(
    new Set(stockItems.map((item) => item.material).filter(Boolean))
  ).sort();

  const filteredStockItems = stockItems.filter((item) => {
    const matchesSearch = 
      !searchQuery || 
      item.material?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.location?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesThickness = 
      thicknessFilter === null || 
      item.thickness === thicknessFilter;
    const matchesMaterial = 
      materialFilter === null || 
      item.material === materialFilter;
    const matchesMaterialType =
      materialTypeFilter === null ||
      item.materialType === materialTypeFilter;
    return matchesSearch && matchesThickness && matchesMaterial && matchesMaterialType;
  });

  return (
    // Use Tailwind classes for main layout
    <div className="container mx-auto p-4 font-sans text-gray-800">
      {/* Removed header as it\'s now global in app/layout.tsx */}

      {errorMessage && (
        // Tailwind classes for error alert
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6 shadow-md" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{errorMessage}</span>
        </div>
      )}

      {/* Stock Item Form */}
      {/* Tailwind classes for card */}
      <div className="bg-white shadow-lg rounded-lg p-6 mb-6 border border-gray-200">
        <h2 className="text-2xl font-semibold mb-6 text-gray-700">
          {isEditing ? "Edit Stock Item" : "Add New Stock Item"}
        </h2>

        <form onSubmit={handleSaveItem}>
          {/* Tailwind grid classes */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
            <div>
              {/* Tailwind label styles */}
              <label htmlFor="length" className="block text-sm font-medium text-gray-700 mb-1">
                Length (mm)
              </label>
              <input
                id="length"
                type="number"
                name="length"
                value={currentItem.length}
                onChange={handleInputChange}
                // Tailwind input styles
                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-orange focus:border-brand-orange sm:text-sm text-gray-700"
                step="0.1"
                min="0"
                required
              />
            </div>

            <div>
              <label htmlFor="width" className="block text-sm font-medium text-gray-700 mb-1">
                Width (mm)
              </label>
              <input
                id="width"
                type="number"
                name="width"
                value={currentItem.width}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-orange focus:border-brand-orange sm:text-sm text-gray-700"
                step="0.1"
                min="0"
                required
              />
            </div>

            <div>
              <label htmlFor="thickness" className="block text-sm font-medium text-gray-700 mb-1">
                Thickness (mm)
              </label>
              <input
                id="thickness"
                type="number"
                name="thickness"
                value={currentItem.thickness}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-orange focus:border-brand-orange sm:text-sm text-gray-700"
                step="0.1"
                min="0"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div>
              <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
                Quantity
              </label>
              <input
                id="quantity"
                type="number"
                name="quantity"
                value={currentItem.quantity}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-orange focus:border-brand-orange sm:text-sm text-gray-700"
                min="1"
                required
              />
            </div>

            <div>
              <label htmlFor="materialType" className="block text-sm font-medium text-gray-700 mb-1">
                Material Type
              </label>
              <select
                id="materialType"
                name="materialType"
                value={currentItem.materialType}
                onChange={handleInputChange}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base bg-white border border-gray-300 focus:outline-none focus:ring-brand-orange focus:border-brand-orange sm:text-sm rounded-md shadow-sm"
                required
              >
                <option value={MaterialType.Sheet}>Sheet Material</option>
                <option value={MaterialType.Dimensional}>Dimensional Lumber</option>
              </select>
            </div>

            <div>
              <label htmlFor="material" className="block text-sm font-medium text-gray-700 mb-1">
                Material
              </label>
              <input
                id="material"
                type="text"
                name="material"
                value={currentItem.material}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-orange focus:border-brand-orange sm:text-sm text-gray-700"
                placeholder={currentItem.materialType === MaterialType.Sheet ? 
                  "e.g., Plywood, MDF, Melamine" : 
                  "e.g., Oak, Pine, Spruce"}
              />
            </div>

            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                Storage Location
              </label>
              <input
                id="location"
                type="text"
                name="location"
                value={currentItem.location}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-orange focus:border-brand-orange sm:text-sm text-gray-700"
                placeholder="e.g., Rack A, Shelf 2"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Grain direction is only relevant for sheet materials */}
            {currentItem.materialType === MaterialType.Sheet && (
              <div>
                <label htmlFor="grainDirection" className="block text-sm font-medium text-gray-700 mb-1">
                  Grain Direction
                </label>
                <select
                  id="grainDirection"
                  name="grainDirection"
                  value={currentItem.grainDirection}
                  onChange={handleInputChange}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base bg-white border border-gray-300 focus:outline-none focus:ring-brand-orange focus:border-brand-orange sm:text-sm rounded-md shadow-sm"
                  required
                >
                  <option value="">Select Direction</option>
                  <option value="horizontal">Horizontal</option>
                  <option value="vertical">Vertical</option>
                </select>
              </div>
            )}
          </div>

          {/* Tailwind flex classes */}
          <div className="flex flex-col sm:flex-row justify-between items-center mt-6 pt-4 border-t border-gray-200">
            <div className="flex space-x-2 mb-4 sm:mb-0">
              <button
                type="submit"
                // Tailwind button styles (success)
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded shadow-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 disabled:opacity-50 transition-colors duration-150"
                disabled={isLoading}
              >
                {isLoading
                  ? "Saving..."
                  : isEditing
                  ? "Update Stock Item"
                  : "Add Stock Item"}
              </button>
              {isEditing && (
                <button
                  type="button"
                  onClick={resetForm}
                  // Tailwind button styles (neutral)
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded shadow-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50 transition-colors duration-150"
                >
                  Cancel
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={handleDeleteAllItems}
              // Tailwind button styles (danger)
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded shadow-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 disabled:opacity-50 transition-colors duration-150"
              disabled={isLoading || stockItems.length === 0}
            >
              Delete All Items
            </button>
          </div>
        </form>
      </div>

      {/* Stock Items List */}
      <div className="bg-white shadow-lg rounded-lg p-6 border border-gray-200">
        <h2 className="text-2xl font-semibold mb-6 text-gray-700">Stock Inventory</h2>

        {/* Search and Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6 pb-6 border-b border-gray-200">
          <div>
            <label htmlFor="searchQuery" className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <input
              id="searchQuery"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              // Tailwind input styles
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-orange focus:border-brand-orange sm:text-sm text-gray-700"
              placeholder="Search material or location"
            />
          </div>
          
          <div>
            <label htmlFor="materialTypeFilter" className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Material Type
            </label>
            <select
              id="materialTypeFilter"
              value={materialTypeFilter === null ? "" : materialTypeFilter}
              onChange={(e) => setMaterialTypeFilter(e.target.value === "" ? null : e.target.value as MaterialType)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base bg-white border border-gray-300 focus:outline-none focus:ring-brand-orange focus:border-brand-orange sm:text-sm rounded-md shadow-sm"
            >
              <option value="">All Types</option>
              <option value={MaterialType.Sheet}>Sheet Material</option>
              <option value={MaterialType.Dimensional}>Dimensional Lumber</option>
            </select>
          </div>

          <div>
            <label htmlFor="thicknessFilter" className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Thickness
            </label>
            <select
              id="thicknessFilter"
              value={thicknessFilter === null ? "" : thicknessFilter}
              onChange={(e) =>
                setThicknessFilter(
                  e.target.value === "" ? null : parseFloat(e.target.value)
                )
              }
              // Tailwind select styles
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base bg-white border border-gray-300 focus:outline-none focus:ring-brand-orange focus:border-brand-orange sm:text-sm rounded-md shadow-sm"
            >
              <option value="">All Thicknesses</option>
              {uniqueThicknesses.map((thickness) => (
                <option key={thickness} value={thickness}>
                  {thickness} mm
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="materialFilter" className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Material
            </label>
            <select
              id="materialFilter"
              value={materialFilter || ""}
              onChange={(e) =>
                setMaterialFilter(e.target.value === "" ? null : e.target.value)
              }
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base bg-white border border-gray-300 focus:outline-none focus:ring-brand-orange focus:border-brand-orange sm:text-sm rounded-md shadow-sm"
            >
              <option value="">All Materials</option>
              {uniqueMaterials.map((material) => (
                <option key={material} value={material}>
                  {material}
                </option>
              ))}
            </select>
          </div>
        </div>

        {isLoading ? (
          // Tailwind text styles
          <p className="text-center text-gray-500 py-8">Loading stock items...</p>
        ) : filteredStockItems.length === 0 ? (
          <p className="text-center text-gray-500 py-8">
            No stock items found. Add some above or adjust filters.
          </p>
        ) : (
          // Tailwind overflow utility
          <div className="overflow-x-auto">
            {/* Tailwind table styles */}
            <table className="min-w-full divide-y divide-gray-200 border border-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  {/* Tailwind th styles */}
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-300">Dimensions (L×W×T)</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-300">Material</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-300">Material Type</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-300">Quantity</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-300">Location</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-300">Date Added</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredStockItems.map((item) => (
                  // Tailwind hover utility
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors duration-150">
                    {/* Tailwind td styles */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 border-b border-gray-300">
                      {formatDimensions(item)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 border-b border-gray-300">{item.material || "—"}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 border-b border-gray-300">
                      {item.materialType === MaterialType.Sheet ? "Sheet" : 
                       item.materialType === MaterialType.Dimensional ? "Dimensional" : "—"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 border-b border-gray-300">{item.quantity}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 border-b border-gray-300">{item.location || "—"}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 border-b border-gray-300">
                      {item.dateAdded
                        ? new Date(item.dateAdded).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium border-b border-gray-300">
                      <button
                        onClick={() => handleEditItem(item)}
                        // Tailwind button styles (info, small)
                        className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-1 px-3 rounded text-sm shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50 mr-2 transition-colors duration-150"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item.id!)}
                        // Tailwind button styles (danger, small)
                        className="bg-red-500 hover:bg-red-600 text-white font-semibold py-1 px-3 rounded text-sm shadow-md focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-50 transition-colors duration-150"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
