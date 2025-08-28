"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { Supplier } from "@/lib/types"

interface SupplierFormProps {
  supplier?: Supplier
  onSubmit: (data: Omit<Supplier, "id" | "created_at" | "updated_at">) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

export function SupplierForm({ supplier, onSubmit, onCancel, isLoading }: SupplierFormProps) {
  const [formData, setFormData] = useState({
    name: supplier?.name || "",
    contact_person: supplier?.contact_person || "",
    phone: supplier?.phone || "",
    email: supplier?.email || "",
    address: supplier?.address || "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit(formData)
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{supplier ? "Edit Pemasok" : "Tambah Pemasok Baru"}</CardTitle>
        <CardDescription>{supplier ? "Perbarui informasi pemasok" : "Masukkan informasi pemasok baru"}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Nama Pemasok *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="Contoh: PT Sumber Rejeki"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact_person">Nama Kontak</Label>
            <Input
              id="contact_person"
              value={formData.contact_person}
              onChange={(e) => handleChange("contact_person", e.target.value)}
              placeholder="Nama person in charge"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Nomor Telepon</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              placeholder="Contoh: 08123456789"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              placeholder="Contoh: supplier@email.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Alamat</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => handleChange("address", e.target.value)}
              placeholder="Alamat lengkap pemasok"
              rows={3}
            />
          </div>

          <div className="flex gap-4 pt-4">
            <Button type="submit" disabled={isLoading || !formData.name.trim()} className="flex-1">
              {isLoading ? "Menyimpan..." : supplier ? "Perbarui Pemasok" : "Tambah Pemasok"}
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
