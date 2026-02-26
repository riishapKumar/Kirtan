import type { Metadata } from "next";

import "./globals.css";
import { SiteNav } from "@/components/site-nav";

export const metadata: Metadata = {
  title: "Kirtan",
  description: "Kirtan content workspace",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <SiteNav />
        <main className="mx-auto w-full max-w-5xl p-4">{children}</main>
      </body>
    </html>
  );
}
