import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ikon Pass 25/26 Resort Map",
  description:
    "Interactive map of all 97 Ikon Pass ski resorts for the 2025/26 season",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased">{children}</body>
    </html>
  );
}
