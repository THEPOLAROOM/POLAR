import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "POLAR",
  description: "POLAR — barber booking system (V1 private trial)",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-polar-bg text-polar-text antialiased">
        {children}
      </body>
    </html>
  );
}
