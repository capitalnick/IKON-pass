import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ikon Pass 25/26 Resort Map",
  description:
    "Interactive map of all 97 Ikon Pass ski resorts for the 2025/26 season",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
