"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Search, Users, Edit, Trash2 } from "lucide-react"
import { SupplierForm } from "@/components/suppliers/supplier-form"
import { supplierService } from "@/lib/services/suppliers"
import type { Supplier } from "@/lib/types"

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [filteredSuppliers, setFilteredSuppliers] = useState<Supplier[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [showSupplierForm, setShowSupplierForm] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    loadSuppliers()
  }, [])

  useEffect(() => {
    const filtered = suppliers.filter((supplier) => supplier.name.toLowerCase().includes(searchTerm.toLowerCase()))
    setFilteredSuppliers(filtered)
  }, [suppliers, searchTerm])

  const loadSuppliers = async () => {
    try {
      setIsLoading(true)
      const suppliersData = await supplierService.getSuppliers()
      setSuppliers(suppliersData)
    } catch (error) {
      console.error("Error loading suppliers:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddSupplier = async (supplierData: Omit<Supplier, "id" | "createdAt">) => {
    try {
      setIsLoading(true)
      await supplierService.addSupplier(supplierData)
      await loadSuppliers()
      setShowSupplierForm(false)
    } catch (error) {
      console.error("Error adding supplier:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditSupplier = async (supplierData: Omit<Supplier, "id" | "createdAt">) => {
    if (!editingSupplier) return

    try {
      setIsLoading(true)
      await supplierService.updateSupplier(editingSupplier.id, supplierData)
      await loadSuppliers()
      setEditingSupplier(null)
      setShowSupplierForm(false)
    } catch (error) {
      console.error("Error updating supplier:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteSupplier = async (supplierId: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus pemasok ini?")) return

    try {
      setIsLoading(true)
      await supplierService.deleteSupplier(supplierId)
      await loadSuppliers()
    } catch (error) {
      console.error("Error deleting supplier:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (showSupplierForm) {
    return (
      <div className="p-6">
        <SupplierForm
          supplier={editingSupplier || undefined}
          onSubmit={editingSupplier ? handleEditSupplier : handleAddSupplier}
          onCancel={() => {
            setShowSupplierForm(false)
            setEditingSupplier(null)
          }}
          isLoading={isLoading}
        />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Manajemen Pemasok</h1>
          <p className="text-muted-foreground">Kelola informasi pemasok</p>
        </div>
        <Button onClick={() => setShowSupplierForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Tambah Pemasok
        </Button>
      </div>

      {/* Stats Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Pemasok</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{suppliers.length}</div>
          <p className="text-xs text-muted-foreground">Pemasok terdaftar</p>
        </CardContent>
      </Card>

      {/* Suppliers List */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Pemasok</CardTitle>
          <CardDescription>Kelola informasi pemasok dan kontak</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari pemasok..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Pemasok</TableHead>
                  <TableHead>Kontak Person</TableHead>
                  <TableHead>Telepon</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Alamat</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSuppliers.map((supplier) => (
                  <TableRow key={supplier.id}>
                    <TableCell className="font-medium">{supplier.name}</TableCell>
                    <TableCell>{supplier.contactPerson || "-"}</TableCell>
                    <TableCell>{supplier.phone || "-"}</TableCell>
                    <TableCell>{supplier.email || "-"}</TableCell>
                    <TableCell>{supplier.address || "-"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingSupplier(supplier)
                            setShowSupplierForm(true)
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteSupplier(supplier.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredSuppliers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Tidak ada data pemasok
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
