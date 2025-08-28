import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import "./globals.css"
import { Sidebar } from "@/components/layout/sidebar"

export const metadata: Metadata = {
  title: "Toko Kita - Sistem Manajemen Inventori",
  description: "Sistem manajemen inventori dengan metode FIFO untuk Toko Kita",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="id">
      <body
        className={`font-sans ${GeistSans.variable} ${GeistMono.variable} flex flex-col min-h-screen`}
      >
        {/* Wrapper utama dengan sidebar + konten */}
        <div className="flex flex-1 bg-background">
          <Sidebar />
          <main className="flex-1 md:ml-64 overflow-auto p-4">
            {children}
          </main>
        </div>

        {/* Footer sticky di bawah */}
        <footer className="bg-gray-100 text-center py-4 text-sm text-gray-600 border-t">
          © {new Date().getFullYear()} by Lucky Ardiansyah
        </footer>
      </body>
    </html>
  )
}
