import { createClient } from "@/lib/supabase/client"
import type { Supplier } from "@/lib/types"

const transformFromDatabase = (dbSupplier: any): Supplier => ({
  id: dbSupplier.id,
  name: dbSupplier.name,
  contactPerson: dbSupplier.contact_person,
  phone: dbSupplier.phone,
  email: dbSupplier.email,
  address: dbSupplier.address,
  createdAt: new Date(dbSupplier.created_at),
})

const transformToDatabase = (supplier: Omit<Supplier, "id" | "createdAt">) => ({
  name: supplier.name,
  contact_person: supplier.contactPerson,
  phone: supplier.phone,
  email: supplier.email,
  address: supplier.address,
})

export const supplierService = {
  // Get all suppliers
  async getSuppliers(): Promise<Supplier[]> {
    const supabase = createClient()
    const { data, error } = await supabase.from("suppliers").select("*").order("name")

    if (error) throw error
    return (data || []).map(transformFromDatabase)
  },

  // Get supplier by ID
  async getSupplier(id: string): Promise<Supplier | null> {
    const supabase = createClient()
    const { data, error } = await supabase.from("suppliers").select("*").eq("id", id).single()

    if (error) {
      if (error.code === "PGRST116") return null // Not found
      throw error
    }
    return transformFromDatabase(data)
  },

  // Add new supplier
  async addSupplier(supplier: Omit<Supplier, "id" | "createdAt">): Promise<string> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("suppliers")
      .insert([transformToDatabase(supplier)])
      .select("id")
      .single()

    if (error) throw error
    return data.id
  },

  // Update supplier
  async updateSupplier(id: string, updates: Partial<Omit<Supplier, "id" | "createdAt">>): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase
      .from("suppliers")
      .update({
        ...transformToDatabase(updates as Omit<Supplier, "id" | "createdAt">),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)

    if (error) throw error
  },

  // Delete supplier
  async deleteSupplier(id: string): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase.from("suppliers").delete().eq("id", id)

    if (error) throw error
  },
}
