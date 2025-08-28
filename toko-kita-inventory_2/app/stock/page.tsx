"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Package, AlertTriangle, Edit, Trash2 } from "lucide-react"
import { ProductForm } from "@/components/stock/product-form"
import { StockBatchForm } from "@/components/stock/stock-batch-form"
import { productService } from "@/lib/services/products"
import { stockBatchService } from "@/lib/services/stockBatches"
import type { Product, Supplier } from "@/lib/types"

export default function StockPage() {
  const [products, setProducts] = useState<(Product & { totalStock: number; lowStock: boolean })[]>([])
  const [filteredProducts, setFilteredProducts] = useState<(Product & { totalStock: number; lowStock: boolean })[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [showProductForm, setShowProductForm] = useState(false)
  const [showStockForm, setShowStockForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [suppliers] = useState<Supplier[]>([
    { id: "1", name: "PT Sumber Rejeki", createdAt: new Date() },
    { id: "2", name: "CV Maju Bersama", createdAt: new Date() },
    { id: "3", name: "Toko Grosir Sentral", createdAt: new Date() },
  ])

  useEffect(() => {
    loadProducts()
  }, [])

  useEffect(() => {
    const filtered = products.filter((product) => product.name.toLowerCase().includes(searchTerm.toLowerCase()))
    setFilteredProducts(filtered)
  }, [products, searchTerm])

  const loadProducts = async () => {
    try {
      setIsLoading(true)
      const productsData = await productService.getProductsWithStock()
      setProducts(productsData)
    } catch (error) {
      console.error("Error loading products:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddProduct = async (productData: Omit<Product, "id" | "createdAt" | "updatedAt">) => {
    try {
      setIsLoading(true)
      await productService.addProduct(productData)
      await loadProducts()
      setShowProductForm(false)
    } catch (error) {
      console.error("Error adding product:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditProduct = async (productData: Omit<Product, "id" | "createdAt" | "updatedAt">) => {
    if (!editingProduct) return

    try {
      setIsLoading(true)
      await productService.updateProduct(editingProduct.id, productData)
      await loadProducts()
      setEditingProduct(null)
      setShowProductForm(false)
    } catch (error) {
      console.error("Error updating product:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddStock = async (stockData: {
    productId: string
    quantity: number
    purchasePrice: number
    purchaseDate: Date
    supplierId: string
  }) => {
    try {
      setIsLoading(true)
      await stockBatchService.addStockBatch(stockData)
      await loadProducts()
      setShowStockForm(false)
    } catch (error) {
      console.error("Error adding stock:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus produk ini?")) return

    try {
      setIsLoading(true)
      await productService.deleteProduct(productId)
      await loadProducts()
    } catch (error) {
      console.error("Error deleting product:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (showProductForm) {
    return (
      <div className="p-6">
        <ProductForm
          product={editingProduct || undefined}
          onSubmit={editingProduct ? handleEditProduct : handleAddProduct}
          onCancel={() => {
            setShowProductForm(false)
            setEditingProduct(null)
          }}
          isLoading={isLoading}
        />
      </div>
    )
  }

  if (showStockForm) {
    return (
      <div className="p-6">
        <StockBatchForm
          onSubmit={handleAddStock}
          onCancel={() => setShowStockForm(false)}
          isLoading={isLoading}
          suppliers={suppliers}
        />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Manajemen Stok</h1>
          <p className="text-muted-foreground">Kelola produk dan stok barang</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowStockForm(true)}>
            <Package className="h-4 w-4 mr-2" />
            Tambah Stok
          </Button>
          <Button onClick={() => setShowProductForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Produk Baru
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Produk</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stok Menipis</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{products.filter((p) => p.lowStock).length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Stok</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.reduce((sum, p) => sum + p.totalStock, 0)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Produk</CardTitle>
          <CardDescription>Kelola produk dan pantau stok</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari produk..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Produk</TableHead>
                  <TableHead>Satuan</TableHead>
                  <TableHead>Harga Jual</TableHead>
                  <TableHead>Stok</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{product.unit}</TableCell>
                    <TableCell>Rp {product.sellingPrice.toLocaleString("id-ID")}</TableCell>
                    <TableCell>{product.totalStock}</TableCell>
                    <TableCell>
                      {product.lowStock ? (
                        <Badge variant="destructive">Stok Menipis</Badge>
                      ) : (
                        <Badge variant="secondary">Normal</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingProduct(product)
                            setShowProductForm(true)
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteProduct(product.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
