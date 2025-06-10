'use client';

export default function WarehouseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // Use Tailwind classes for basic layout consistency
    <div className="min-h-screen bg-gray-100">
      {/* Navigation or header specific to warehouse section could go here if needed */}
      {/* For now, it inherits the global navigation from app/layout.tsx */}
      <main className="container mx-auto p-4">{children}</main>
    </div>
  );
}
