"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Search, ShoppingCart, Calendar } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PurchaseForm } from "@/components/purchases/purchase-form"
import { purchaseService } from "@/lib/services/purchases"
import { productService } from "@/lib/services/products"
import { supplierService } from "@/lib/services/suppliers"
import type { Purchase, Product, Supplier } from "@/lib/types"

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [filteredPurchases, setFilteredPurchases] = useState<Purchase[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedSupplier, setSelectedSupplier] = useState<string>("all")
  const [dateFilter, setDateFilter] = useState<string>("all")
  const [showPurchaseForm, setShowPurchaseForm] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [stats, setStats] = useState({
    totalPurchases: 0,
    totalAmount: 0,
    thisMonthAmount: 0,
  })

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    filterPurchases()
  }, [purchases, searchTerm, selectedSupplier, dateFilter])

  const loadData = async () => {
    try {
      setIsLoading(true)
      const [purchasesData, productsData, suppliersData] = await Promise.all([
        purchaseService.getPurchases(),
        productService.getProducts(),
        supplierService.getSuppliers(),
      ])

      setPurchases(purchasesData)
      setProducts(productsData)
      setSuppliers(suppliersData)

      // Calculate stats
      const totalAmount = purchasesData.reduce((sum, p) => sum + (p.totalAmount || 0), 0)
      const thisMonth = new Date()
      thisMonth.setDate(1)
      const thisMonthPurchases = purchasesData.filter((p) => p.purchaseDate && p.purchaseDate >= thisMonth)
      const thisMonthAmount = thisMonthPurchases.reduce((sum, p) => sum + (p.totalAmount || 0), 0)

      setStats({
        totalPurchases: purchasesData.length,
        totalAmount,
        thisMonthAmount,
      })
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const filterPurchases = () => {
    let filtered = purchases

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter((purchase) => {
        const product = products.find((p) => p.id === purchase.productId)
        const supplier = suppliers.find((s) => s.id === purchase.supplierId)
        return (
          product?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          supplier?.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
      })
    }

    // Filter by supplier
    if (selectedSupplier !== "all") {
      filtered = filtered.filter((purchase) => purchase.supplierId === selectedSupplier)
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

      filtered = filtered.filter((purchase) => purchase.purchaseDate && purchase.purchaseDate >= startDate)
    }

    setFilteredPurchases(filtered)
  }

  const handleAddPurchase = async (purchaseData: {
    productId: string
    supplierId: string
    quantity: number
    purchasePrice: number
    totalAmount: number
    purchaseDate: Date
  }) => {
    try {
      setIsLoading(true)
      await purchaseService.addPurchase(purchaseData)
      await loadData()
      setShowPurchaseForm(false)
    } catch (error) {
      console.error("Error adding purchase:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getProductName = (productId: string) => {
    return products.find((p) => p.id === productId)?.name || "Unknown Product"
  }

  const getSupplierName = (supplierId: string) => {
    return suppliers.find((s) => s.id === supplierId)?.name || "Unknown Supplier"
  }

  if (showPurchaseForm) {
    return (
      <div className="p-6">
        <PurchaseForm onSubmit={handleAddPurchase} onCancel={() => setShowPurchaseForm(false)} isLoading={isLoading} />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Riwayat Pembelian</h1>
          <p className="text-muted-foreground">Kelola dan pantau pembelian stok</p>
        </div>
        <Button onClick={() => setShowPurchaseForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Catat Pembelian
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pembelian</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPurchases}</div>
            <p className="text-xs text-muted-foreground">Transaksi pembelian</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Nilai</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rp {stats.totalAmount.toLocaleString("id-ID")}</div>
            <p className="text-xs text-muted-foreground">Keseluruhan pembelian</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bulan Ini</CardTitle>
            <Calendar className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">Rp {stats.thisMonthAmount.toLocaleString("id-ID")}</div>
            <p className="text-xs text-muted-foreground">Pembelian bulan ini</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Pembelian</CardTitle>
          <CardDescription>Riwayat pembelian stok dari pemasok</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex items-center space-x-2 flex-1">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari produk atau pemasok..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Semua Pemasok" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Pemasok</SelectItem>
                {suppliers.map((supplier) => (
                  <SelectItem key={supplier.id} value={supplier.id}>
                    {supplier.name}
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
                  <TableHead>Pemasok</TableHead>
                  <TableHead>Jumlah</TableHead>
                  <TableHead>Harga Satuan</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPurchases.map((purchase) => (
                  <TableRow key={purchase.id}>
                    <TableCell>
                      {purchase.purchaseDate
                        ? purchase.purchaseDate.toLocaleDateString("id-ID")
                        : "Tanggal tidak tersedia"}
                    </TableCell>
                    <TableCell className="font-medium">{getProductName(purchase.productId)}</TableCell>
                    <TableCell>{getSupplierName(purchase.supplierId)}</TableCell>
                    <TableCell>{purchase.quantity || 0}</TableCell>
                    <TableCell>Rp {(purchase.purchasePrice || 0).toLocaleString("id-ID")}</TableCell>
                    <TableCell className="text-right font-medium">
                      Rp {(purchase.totalAmount || 0).toLocaleString("id-ID")}
                    </TableCell>
                  </TableRow>
                ))}
                {filteredPurchases.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Tidak ada data pembelian
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
