import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Greenfield SMS | School Management System",
  description: "A comprehensive school management system",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
