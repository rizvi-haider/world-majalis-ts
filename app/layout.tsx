import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next"
import Navbar from "@/components/Navbar";
import "./globals.css";

export const metadata: Metadata = {
  title: "World Majalis",
  description: "Global Dashboard for Majalis Channels",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Navbar />
        {children}
      </body>
    </html>
  );
}