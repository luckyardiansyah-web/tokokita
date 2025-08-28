"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Plus, Search, FileText, TrendingUp, DollarSign, Calendar, CheckCircle, AlertTriangle } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SaleForm } from "@/components/sales/sale-form"
import { salesService } from "@/lib/services/sales"
import { productService } from "@/lib/services/products"
import type { Sale, Product } from "@/lib/types"

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([])
  const [filteredSales, setFilteredSales] = useState<Sale[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedProduct, setSelectedProduct] = useState<string>("all")
  const [dateFilter, setDateFilter] = useState<string>("all")
  const [showSaleForm, setShowSaleForm] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [alertMessage, setAlertMessage] = useState<{
    type: "success" | "error"
    message: string
  } | null>(null)
  const [stats, setStats] = useState({
    totalSales: 0,
    totalRevenue: 0,
    totalProfit: 0,
    todayRevenue: 0,
    profitMargin: 0,
  })

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    filterSales()
  }, [sales, searchTerm, selectedProduct, dateFilter])

  useEffect(() => {
    if (alertMessage) {
      const timer = setTimeout(() => setAlertMessage(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [alertMessage])

  const loadData = async () => {
    try {
      setIsLoading(true)
      const [salesData, productsData, salesStats] = await Promise.all([
        salesService.getSales(),
        productService.getProducts(),
        salesService.getSalesStats(),
      ])

      setSales(salesData)
      setProducts(productsData)

      // Calculate today's revenue
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const todayRevenue = salesData
        .filter((sale) => sale.saleDate >= today)
        .reduce((sum, sale) => sum + sale.totalAmount, 0)

      setStats({
        totalSales: salesStats.totalSales,
        totalRevenue: salesStats.totalRevenue,
        totalProfit: salesStats.totalProfit,
        todayRevenue,
        profitMargin: salesStats.profitMargin,
      })
    } catch (error) {
      console.error("Error loading data:", error)
      setAlertMessage({
        type: "error",
        message: "Gagal memuat data penjualan",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const filterSales = () => {
    let filtered = sales

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter((sale) => {
        const product = products.find((p) => p.id === sale.productId)
        return product?.name.toLowerCase().includes(searchTerm.toLowerCase())
      })
    }

    // Filter by product
    if (selectedProduct !== "all") {
      filtered = filtered.filter((sale) => sale.productId === selectedProduct)
    }

    // Filter by date
    if (dateFilter !== "all") {
      const now = new Date()
      let startDate: Date

      switch (dateFilter) {
        case "today":
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          break
        case "week":
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case "month":
          startDate = new Date(now.getFullYear(), now.getMonth(), 1)
          break
        default:
          startDate = new Date(0)
      }

      filtered = filtered.filter((sale) => sale.saleDate >= startDate)
    }

    setFilteredSales(filtered)
  }

  const handleAddSale = async (saleData: {
    productId: string
    quantity: number
    sellingPrice: number
    saleDate: Date
  }) => {
    try {
      setIsLoading(true)
      const result = await salesService.processSale(saleData)

      if (result.success) {
        setAlertMessage({
          type: "success",
          message: result.message,
        })
        await loadData()
        setShowSaleForm(false)
      } else {
        setAlertMessage({
          type: "error",
          message: result.message,
        })
      }
    } catch (error) {
      console.error("Error adding sale:", error)
      setAlertMessage({
        type: "error",
        message: "Terjadi kesalahan saat memproses penjualan",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getProductName = (productId: string) => {
    return products.find((p) => p.id === productId)?.name || "Unknown Product"
  }

  if (showSaleForm) {
    return (
      <div className="p-6 space-y-6">
        {alertMessage && (
          <Alert variant={alertMessage.type === "error" ? "destructive" : "default"}>
            {alertMessage.type === "success" ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertTriangle className="h-4 w-4" />
            )}
            <AlertDescription>{alertMessage.message}</AlertDescription>
          </Alert>
        )}
        <SaleForm onSubmit={handleAddSale} onCancel={() => setShowSaleForm(false)} isLoading={isLoading} />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Alert Messages */}
      {alertMessage && (
        <Alert variant={alertMessage.type === "error" ? "destructive" : "default"}>
          {alertMessage.type === "success" ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <AlertTriangle className="h-4 w-4" />
          )}
          <AlertDescription>{alertMessage.message}</AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Riwayat Penjualan</h1>
          <p className="text-muted-foreground">Kelola penjualan dengan perhitungan FIFO</p>
        </div>
        <Button onClick={() => setShowSaleForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Catat Penjualan
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Penjualan</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSales}</div>
            <p className="text-xs text-muted-foreground">Transaksi penjualan</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pendapatan</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rp {stats.totalRevenue.toLocaleString("id-ID")}</div>
            <p className="text-xs text-muted-foreground">Keseluruhan penjualan</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Laba Bersih</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">Rp {stats.totalProfit.toLocaleString("id-ID")}</div>
            <p className="text-xs text-muted-foreground">Margin: {stats.profitMargin.toFixed(1)}%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hari Ini</CardTitle>
            <Calendar className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">Rp {stats.todayRevenue.toLocaleString("id-ID")}</div>
            <p className="text-xs text-muted-foreground">Penjualan hari ini</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Penjualan</CardTitle>
          <CardDescription>Riwayat penjualan dengan perhitungan FIFO</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex items-center space-x-2 flex-1">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input placeholder="Cari produk..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>

            <Select value={selectedProduct} onValueChange={setSelectedProduct}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Semua Produk" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Produk</SelectItem>
                {products.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue placeholder="Periode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua</SelectItem>
                <SelectItem value="today">Hari Ini</SelectItem>
                <SelectItem value="week">7 Hari</SelectItem>
                <SelectItem value="month">Bulan Ini</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Produk</TableHead>
                  <TableHead>Jumlah</TableHead>
                  <TableHead>Harga Satuan</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>HPP</TableHead>
                  <TableHead className="text-right">Laba</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell>
                      {sale.saleDate ? sale.saleDate.toLocaleDateString("id-ID") : "Tanggal tidak tersedia"}
                    </TableCell>
                    <TableCell className="font-medium">{getProductName(sale.productId)}</TableCell>
                    <TableCell>{sale.quantity || 0}</TableCell>
                    <TableCell>Rp {(sale.sellingPrice || 0).toLocaleString("id-ID")}</TableCell>
                    <TableCell>Rp {(sale.totalAmount || 0).toLocaleString("id-ID")}</TableCell>
                    <TableCell>Rp {(sale.cogs || 0).toLocaleString("id-ID")}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-col items-end">
                        <span className="font-medium text-primary">
                          Rp {(sale.profit || 0).toLocaleString("id-ID")}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {sale.totalAmount && sale.totalAmount > 0
                            ? (((sale.profit || 0) / sale.totalAmount) * 100).toFixed(1)
                            : "0.0"}
                          %
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredSales.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Tidak ada data penjualan
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
