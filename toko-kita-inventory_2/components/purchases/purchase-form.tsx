"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { productService } from "@/lib/services/products"
import { supplierService } from "@/lib/services/suppliers"
import type { Product, Supplier } from "@/lib/types"

interface PurchaseFormProps {
  onSubmit: (data: {
    productId: string
    supplierId: string
    quantity: number
    purchasePrice: number
    totalAmount: number
    purchaseDate: Date
  }) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

export function PurchaseForm({ onSubmit, onCancel, isLoading }: PurchaseFormProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [formData, setFormData] = useState({
    productId: "",
    supplierId: "",
    quantity: 0,
    purchasePrice: 0,
    purchaseDate: new Date().toISOString().split("T")[0],
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [productsData, suppliersData] = await Promise.all([
        productService.getProducts(),
        supplierService.getSuppliers(),
      ])
      setProducts(productsData)
      setSuppliers(suppliersData)
    } catch (error) {
      console.error("Error loading data:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const totalAmount = formData.quantity * formData.purchasePrice
    await onSubmit({
      ...formData,
      totalAmount,
      purchaseDate: new Date(formData.purchaseDate),
    })
  }

  const handleChange = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const totalAmount = formData.quantity * formData.purchasePrice
  const selectedProduct = products.find((p) => p.id === formData.productId)

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Catat Pembelian Baru</CardTitle>
        <CardDescription>Tambahkan pembelian stok dari pemasok</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="productId">Produk *</Label>
              <Select value={formData.productId} onValueChange={(value) => handleChange("productId", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih produk" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name} ({product.unit})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="supplierId">Pemasok *</Label>
              <Select value={formData.supplierId} onValueChange={(value) => handleChange("supplierId", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih pemasok" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
              <Label htmlFor="purchasePrice">Harga Beli per Unit *</Label>
              <Input
                id="purchasePrice"
                type="number"
                value={formData.purchasePrice}
                onChange={(e) => handleChange("purchasePrice", Number(e.target.value))}
                placeholder="0"
                min="0"
                step="100"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="purchaseDate">Tanggal Pembelian *</Label>
            <Input
              id="purchaseDate"
              type="date"
              value={formData.purchaseDate}
              onChange={(e) => handleChange("purchaseDate", e.target.value)}
              required
            />
          </div>

          {totalAmount > 0 && (
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-medium">Total Pembelian:</span>
                <span className="text-lg font-bold text-primary">Rp {totalAmount.toLocaleString("id-ID")}</span>
              </div>
              {selectedProduct && (
                <div className="text-sm text-muted-foreground">
                  {formData.quantity} {selectedProduct.unit} × Rp {formData.purchasePrice.toLocaleString("id-ID")}
                </div>
              )}
            </div>
          )}

          <div className="flex gap-4 pt-4">
            <Button
              type="submit"
              disabled={isLoading || !formData.productId || !formData.supplierId || formData.quantity <= 0}
              className="flex-1"
            >
              {isLoading ? "Menyimpan..." : "Catat Pembelian"}
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
