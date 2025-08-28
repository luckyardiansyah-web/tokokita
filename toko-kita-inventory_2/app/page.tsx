"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, ShoppingCart, TrendingUp, AlertTriangle } from "lucide-react"
import { useEffect, useState } from "react"
import { reportsService } from "@/lib/services/reports"
import Link from "next/link"

export default function Dashboard() {
  const [dashboardData, setDashboardData] = useState({
    totalProducts: 0,
    lowStockProducts: 0,
    outOfStockProducts: 0,
    totalStockValue: 0,
    todaySales: 0,
    todayProfit: 0,
    monthlyProfit: 0,
    profitGrowth: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const data = await reportsService.getDashboardSummary()
        setDashboardData(data)
        setError(null)
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
        setError("Database belum siap. Silakan jalankan script database terlebih dahulu.")
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Memuat data...</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-2">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-muted rounded w-3/4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Selamat datang di sistem manajemen inventori Toko Kita</p>
        </div>

        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Database Belum Siap
            </CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Untuk menggunakan sistem inventori, Anda perlu menjalankan script database terlebih dahulu.
            </p>
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm font-medium mb-2">Langkah-langkah setup:</p>
              <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Pastikan integrasi Supabase sudah terhubung</li>
                <li>
                  Jalankan script:{" "}
                  <code className="bg-background px-2 py-1 rounded">scripts/002_create_inventory_schema.sql</code>
                </li>
                <li>Refresh halaman ini setelah script berhasil dijalankan</li>
              </ol>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Aksi Cepat</CardTitle>
              <CardDescription>Akses fitur yang sering digunakan (akan aktif setelah database siap)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 border border-border rounded-lg bg-muted/50 flex flex-col items-center opacity-50">
                  <Package className="h-6 w-6 mx-auto mb-2" />
                  <div className="text-sm font-medium">Tambah Pembelian</div>
                </div>
                <div className="p-4 border border-border rounded-lg bg-muted/50 flex flex-col items-center opacity-50">
                  <ShoppingCart className="h-6 w-6 mx-auto mb-2" />
                  <div className="text-sm font-medium">Catat Penjualan</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Selamat datang di sistem manajemen inventori Toko Kita</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Produk</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.totalProducts}</div>
            <p className="text-xs text-muted-foreground">Jenis produk dalam inventori</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stok Menipis</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{dashboardData.lowStockProducts}</div>
            <p className="text-xs text-muted-foreground">
              Produk perlu restok ({dashboardData.outOfStockProducts} habis)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Penjualan Hari Ini</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rp {dashboardData.todaySales.toLocaleString("id-ID")}</div>
            <p className="text-xs text-muted-foreground">
              Laba: Rp {dashboardData.todayProfit.toLocaleString("id-ID")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Laba Bulan Ini</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              Rp {dashboardData.monthlyProfit.toLocaleString("id-ID")}
            </div>
            <p className="text-xs text-muted-foreground">
              {dashboardData.profitGrowth >= 0 ? "+" : ""}
              {dashboardData.profitGrowth.toFixed(1)}% dari bulan lalu
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Aksi Cepat</CardTitle>
            <CardDescription>Akses fitur yang sering digunakan</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Link
                href="/purchases"
                className="p-4 border border-border rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors flex flex-col items-center"
              >
                <Package className="h-6 w-6 mx-auto mb-2" />
                <div className="text-sm font-medium">Tambah Pembelian</div>
              </Link>
              <Link
                href="/sales"
                className="p-4 border border-border rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors flex flex-col items-center"
              >
                <ShoppingCart className="h-6 w-6 mx-auto mb-2" />
                <div className="text-sm font-medium">Catat Penjualan</div>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Nilai Stok</CardTitle>
            <CardDescription>Total nilai inventori saat ini</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-4">Rp {dashboardData.totalStockValue.toLocaleString("id-ID")}</div>
            <div className="space-y-2">
              <Link href="/stock" className="text-sm text-primary hover:underline block">
                Lihat detail stok →
              </Link>
              <Link href="/reports" className="text-sm text-primary hover:underline block">
                Lihat laporan lengkap →
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
