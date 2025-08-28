"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, CheckCircle, Package } from "lucide-react"
import { productService } from "@/lib/services/products"
import { salesService } from "@/lib/services/sales"
import { stockBatchService } from "@/lib/services/stockBatches"
import type { Product } from "@/lib/types"

interface SaleFormProps {
  onSubmit: (data: {
    productId: string
    quantity: number
    sellingPrice: number
    saleDate: Date
  }) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

export function SaleForm({ onSubmit, onCancel, isLoading }: SaleFormProps) {
  const [products, setProducts] = useState<(Product & { totalStock: number })[]>([])
  const [formData, setFormData] = useState({
    productId: "",
    quantity: 0,
    sellingPrice: 0,
    saleDate: new Date().toISOString().split("T")[0],
  })
  const [stockCheck, setStockCheck] = useState<{
    available: boolean
    currentStock: number
    message: string
    estimatedCogs?: number
    estimatedProfit?: number
  } | null>(null)
  const [isCheckingStock, setIsCheckingStock] = useState(false)

  useEffect(() => {
    loadProducts()
  }, [])

  useEffect(() => {
    if (formData.productId && formData.quantity > 0) {
      checkStock()
    } else {
      setStockCheck(null)
    }
  }, [formData.productId, formData.quantity])

  useEffect(() => {
    // Auto-fill selling price when product is selected
    if (formData.productId) {
      const selectedProduct = products.find((p) => p.id === formData.productId)
      if (selectedProduct && formData.sellingPrice === 0) {
        setFormData((prev) => ({ ...prev, sellingPrice: selectedProduct.sellingPrice }))
      }
    }
  }, [formData.productId, products])

  const loadProducts = async () => {
    try {
      const productsData = await productService.getProductsWithStock()
      setProducts(productsData)
    } catch (error) {
      console.error("Error loading products:", error)
    }
  }

  const checkStock = async () => {
    if (!formData.productId || formData.quantity <= 0) return

    try {
      setIsCheckingStock(true)
      const [stockAvailability, fifoResult] = await Promise.all([
        salesService.checkStockAvailability(formData.productId, formData.quantity),
        stockBatchService.calculateFIFOCogs(formData.productId, formData.quantity),
      ])

      const estimatedRevenue = formData.quantity * formData.sellingPrice
      const estimatedProfit = fifoResult.canFulfill ? estimatedRevenue - fifoResult.cogs : 0

      setStockCheck({
        ...stockAvailability,
        estimatedCogs: fifoResult.canFulfill ? fifoResult.cogs : undefined,
        estimatedProfit: fifoResult.canFulfill ? estimatedProfit : undefined,
      })
    } catch (error) {
      console.error("Error checking stock:", error)
      setStockCheck({
        available: false,
        currentStock: 0,
        message: "Terjadi kesalahan saat mengecek stok",
      })
    } finally {
      setIsCheckingStock(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stockCheck?.available) return

    await onSubmit({
      ...formData,
      saleDate: new Date(formData.saleDate),
    })
  }

  const handleChange = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const selectedProduct = products.find((p) => p.id === formData.productId)
  const totalAmount = formData.quantity * formData.sellingPrice

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Catat Penjualan</CardTitle>
        <CardDescription>Catat penjualan dengan perhitungan FIFO otomatis</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="productId">Produk *</Label>
            <Select value={formData.productId} onValueChange={(value) => handleChange("productId", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih produk" />
              </SelectTrigger>
              <SelectContent>
                {products.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    <div className="flex items-center justify-between w-full">
                      <span>
                        {product.name} ({product.unit})
                      </span>
                      <Badge
                        variant={product.totalStock > product.minStock ? "secondary" : "destructive"}
                        className="ml-2"
                      >
                        {product.totalStock} stok
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Jumlah * {selectedProduct && `(${selectedProduct.unit})`}</Label>
              <Input
                id="quantity"
                type="number"
                value={formData.quantity}
                onChange={(e) => handleChange("quantity", Number(e.target.value))}
                placeholder="0"
                min="1"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sellingPrice">Harga Jual per Unit *</Label>
              <Input
                id="sellingPrice"
                type="number"
                value={formData.sellingPrice}
                onChange={(e) => handleChange("sellingPrice", Number(e.target.value))}
                placeholder="0"
                min="0"
                step="100"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="saleDate">Tanggal Penjualan *</Label>
            <Input
              id="saleDate"
              type="date"
              value={formData.saleDate}
              onChange={(e) => handleChange("saleDate", e.target.value)}
              required
            />
          </div>

          {/* Stock Check Alert */}
          {isCheckingStock && (
            <Alert>
              <Package className="h-4 w-4" />
              <AlertDescription>Mengecek ketersediaan stok...</AlertDescription>
            </Alert>
          )}

          {stockCheck && (
            <Alert variant={stockCheck.available ? "default" : "destructive"}>
              {stockCheck.available ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
              <AlertDescription>{stockCheck.message}</AlertDescription>
            </Alert>
          )}

          {/* Sale Summary */}
          {stockCheck?.available && totalAmount > 0 && (
            <div className="p-4 bg-muted rounded-lg space-y-3">
              <h4 className="font-medium">Ringkasan Penjualan</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex justify-between">
                  <span>Total Penjualan:</span>
                  <span className="font-medium">Rp {totalAmount.toLocaleString("id-ID")}</span>
                </div>
                {stockCheck.estimatedCogs !== undefined && (
                  <div className="flex justify-between">
                    <span>HPP (FIFO):</span>
                    <span className="font-medium">Rp {stockCheck.estimatedCogs.toLocaleString("id-ID")}</span>
                  </div>
                )}
                {stockCheck.estimatedProfit !== undefined && (
                  <div className="flex justify-between">
                    <span>Estimasi Laba:</span>
                    <span className="font-medium text-primary">
                      Rp {stockCheck.estimatedProfit.toLocaleString("id-ID")}
                    </span>
                  </div>
                )}
                {stockCheck.estimatedProfit !== undefined && totalAmount > 0 && (
                  <div className="flex justify-between">
                    <span>Margin Laba:</span>
                    <span className="font-medium text-primary">
                      {((stockCheck.estimatedProfit / totalAmount) * 100).toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex gap-4 pt-4">
            <Button
              type="submit"
              disabled={
                isLoading ||
                !formData.productId ||
                formData.quantity <= 0 ||
                formData.sellingPrice <= 0 ||
                !stockCheck?.available
              }
              className="flex-1"
            >
              {isLoading ? "Memproses..." : "Catat Penjualan"}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
              Batal
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
