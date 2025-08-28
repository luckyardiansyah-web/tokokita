"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TrendingUp, Package, DollarSign, Calendar, Download, BarChart3, PieChart, Activity } from "lucide-react"
import { ProfitChart } from "@/components/reports/profit-chart"
import { StockLevelChart } from "@/components/reports/stock-level-chart"
import { TopProductsChart } from "@/components/reports/top-products-chart"
import { reportsService } from "@/lib/services/reports"

export default function ReportsPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [dashboardSummary, setDashboardSummary] = useState({
    totalProducts: 0,
    lowStockProducts: 0,
    outOfStockProducts: 0,
    totalStockValue: 0,
    todaySales: 0,
    todayProfit: 0,
    monthlyProfit: 0,
    profitGrowth: 0,
  })
  const [profitTrend, setProfitTrend] = useState<
    {
      month: string
      monthName: string
      sales: number
      cogs: number
      profit: number
      profitMargin: number
    }[]
  >([])
  const [stockReport, setStockReport] = useState<
    {
      productId: string
      productName: string
      unit: string
      currentStock: number
      minStock: number
      status: "normal" | "low" | "out"
      stockValue: number
      averageCogs: number
    }[]
  >([])
  const [productPerformance, setProductPerformance] = useState<
    {
      productId: string
      productName: string
      quantitySold: number
      revenue: number
      profit: number
      profitMargin: number
      salesCount: number
    }[]
  >([])
  const [selectedMonth, setSelectedMonth] = useState(() => {
    return "2025-08"
  })
  const [monthlyReport, setMonthlyReport] = useState<{
    month: string
    totalSales: number
    totalCogs: number
    totalProfit: number
    salesCount: number
    topProducts: {
      productId: string
      productName: string
      quantitySold: number
      revenue: number
      profit: number
    }[]
  } | null>(null)

  useEffect(() => {
    loadReportsData()
  }, [])

  useEffect(() => {
    if (selectedMonth) {
      loadMonthlyReport()
    }
  }, [selectedMonth])

  const loadReportsData = async () => {
    try {
      setIsLoading(true)
      const [summary, trend, stock, performance] = await Promise.all([
        reportsService.getDashboardSummary(),
        reportsService.getProfitTrend(12),
        reportsService.getStockLevelReport(),
        reportsService.getProductPerformance(),
      ])

      setDashboardSummary(summary)
      setProfitTrend(trend)
      setStockReport(stock)
      setProductPerformance(performance)
    } catch (error) {
      console.error("Error loading reports data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadMonthlyReport = async () => {
    if (!selectedMonth) return

    try {
      const [year, month] = selectedMonth.split("-").map(Number)
      const report = await reportsService.generateMonthlyReport(year, month)
      setMonthlyReport(report)
    } catch (error) {
      console.error("Error loading monthly report:", error)
    }
  }

  const getStatusBadge = (status: "normal" | "low" | "out") => {
    switch (status) {
      case "out":
        return <Badge variant="destructive">Habis</Badge>
      case "low":
        return <Badge variant="secondary">Menipis</Badge>
      default:
        return <Badge variant="outline">Normal</Badge>
    }
  }

  const exportReport = () => {
    // In a real implementation, this would generate and download a PDF or Excel file
    alert("Fitur ekspor laporan akan segera tersedia")
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Laporan & Analitik</h1>
          <p className="text-muted-foreground">Dashboard analitik dan laporan bisnis</p>
        </div>
        <Button onClick={exportReport}>
          <Download className="h-4 w-4 mr-2" />
          Ekspor Laporan
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Produk</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardSummary.totalProducts}</div>
            <p className="text-xs text-muted-foreground">
              {dashboardSummary.lowStockProducts} menipis, {dashboardSummary.outOfStockProducts} habis
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nilai Stok</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rp {dashboardSummary.totalStockValue.toLocaleString("id-ID")}</div>
            <p className="text-xs text-muted-foreground">Total nilai inventori</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Penjualan Hari Ini</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rp {dashboardSummary.todaySales.toLocaleString("id-ID")}</div>
            <p className="text-xs text-muted-foreground">
              Laba: Rp {dashboardSummary.todayProfit.toLocaleString("id-ID")}
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
              Rp {dashboardSummary.monthlyProfit.toLocaleString("id-ID")}
            </div>
            <p className="text-xs text-muted-foreground">
              {dashboardSummary.profitGrowth >= 0 ? "+" : ""}
              {dashboardSummary.profitGrowth.toFixed(1)}% dari bulan lalu
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Reports Tabs */}
      <Tabs defaultValue="analytics" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analitik
          </TabsTrigger>
          <TabsTrigger value="stock" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Stok
          </TabsTrigger>
          <TabsTrigger value="products" className="flex items-center gap-2">
            <PieChart className="h-4 w-4" />
            Produk
          </TabsTrigger>
          <TabsTrigger value="monthly" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Bulanan
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="space-y-6">
          <ProfitChart data={profitTrend} />
        </TabsContent>

        <TabsContent value="stock" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <StockLevelChart
              data={stockReport.map((item) => ({
                productName: item.productName,
                currentStock: item.currentStock,
                minStock: item.minStock,
                status: item.status,
              }))}
            />

            <Card>
              <CardHeader>
                <CardTitle>Detail Level Stok</CardTitle>
                <CardDescription>Status stok semua produk</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border max-h-80 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produk</TableHead>
                        <TableHead>Stok</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Nilai</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stockReport.map((item) => (
                        <TableRow key={item.productId}>
                          <TableCell className="font-medium">{item.productName}</TableCell>
                          <TableCell>
                            {item.currentStock} {item.unit}
                          </TableCell>
                          <TableCell>{getStatusBadge(item.status)}</TableCell>
                          <TableCell className="text-right">Rp {item.stockValue.toLocaleString("id-ID")}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="products" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TopProductsChart
              data={productPerformance.map((item) => ({
                productName: item.productName,
                revenue: item.revenue,
                profit: item.profit,
                quantitySold: item.quantitySold,
              }))}
            />

            <Card>
              <CardHeader>
                <CardTitle>Performa Produk</CardTitle>
                <CardDescription>Ranking produk berdasarkan pendapatan</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border max-h-80 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produk</TableHead>
                        <TableHead>Terjual</TableHead>
                        <TableHead>Pendapatan</TableHead>
                        <TableHead className="text-right">Margin</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {productPerformance.slice(0, 10).map((item, index) => (
                        <TableRow key={item.productId}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">#{index + 1}</span>
                              <span className="font-medium">{item.productName}</span>
                            </div>
                          </TableCell>
                          <TableCell>{item.quantitySold}</TableCell>
                          <TableCell>Rp {item.revenue.toLocaleString("id-ID")}</TableCell>
                          <TableCell className="text-right">{item.profitMargin.toFixed(1)}%</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="monthly" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Laporan Bulanan</CardTitle>
              <CardDescription>Pilih bulan untuk melihat laporan detail</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <Label htmlFor="month">Pilih Bulan:</Label>
                <Input
                  id="month"
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-48"
                  min="2025-08"
                  max="2026-12"
                />
              </div>

              {monthlyReport && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-sm text-muted-foreground">Total Penjualan</div>
                        <div className="text-2xl font-bold">Rp {monthlyReport.totalSales.toLocaleString("id-ID")}</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-sm text-muted-foreground">HPP</div>
                        <div className="text-2xl font-bold">Rp {monthlyReport.totalCogs.toLocaleString("id-ID")}</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-sm text-muted-foreground">Laba Bersih</div>
                        <div className="text-2xl font-bold text-primary">
                          Rp {monthlyReport.totalProfit.toLocaleString("id-ID")}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-sm text-muted-foreground">Transaksi</div>
                        <div className="text-2xl font-bold">{monthlyReport.salesCount}</div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle>Produk Terlaris Bulan Ini</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Produk</TableHead>
                              <TableHead>Terjual</TableHead>
                              <TableHead>Pendapatan</TableHead>
                              <TableHead className="text-right">Laba</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {monthlyReport.topProducts.map((product, index) => (
                              <TableRow key={product.productId}>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-muted-foreground">#{index + 1}</span>
                                    <span className="font-medium">{product.productName}</span>
                                  </div>
                                </TableCell>
                                <TableCell>{product.quantitySold}</TableCell>
                                <TableCell>Rp {product.revenue.toLocaleString("id-ID")}</TableCell>
                                <TableCell className="text-right">
                                  Rp {product.profit.toLocaleString("id-ID")}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
