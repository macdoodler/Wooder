"use client";

import "./globals.css";
import Link from "next/link";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="font-sans">
      <body className="antialiased">
        <nav className="bg-orange-600 text-white shadow-md">
          <div className="container mx-auto px-4 py-3 flex justify-between items-center">
            <Link href="/" className="text-2xl font-bold hover:text-gray-200">
              Wooder
            </Link>
            <div className="space-x-4">
              <Link href="/" className="hover:text-gray-200 font-medium">
                Home
              </Link>
              <Link
                href="/warehouse"
                className="hover:text-gray-200 font-medium"
              >
                Warehouse
              </Link>
            </div>
          </div>
        </nav>
        <main className="container mx-auto px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
