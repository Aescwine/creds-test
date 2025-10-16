import type { ReactNode } from "react";
import Header from "@/components/Header";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className + " bg-gradient min-h-screen text-slate-800"}>
        <Header />
        <main className="app-container px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
