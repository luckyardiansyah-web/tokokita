import { createClient } from "@/lib/supabase/client"
import type { Product, StockBatch } from "@/lib/types"

const transformToDatabase = (product: Partial<Product>) => ({
  name: product.name,
  description: product.description,
  category: product.category,
  unit: product.unit,
  selling_price: product.sellingPrice,
  minimum_stock: product.minimumStock,
})

const transformFromDatabase = (dbProduct: any): Product => ({
  id: dbProduct.id,
  name: dbProduct.name,
  description: dbProduct.description,
  category: dbProduct.category,
  unit: dbProduct.unit,
  sellingPrice: dbProduct.selling_price,
  minimumStock: dbProduct.minimum_stock,
  createdAt: dbProduct.created_at,
  updatedAt: dbProduct.updated_at,
})

export const productService = {
  // Get all products
  async getProducts(): Promise<Product[]> {
    const supabase = createClient()
    const { data, error } = await supabase.from("products").select("*").order("name")

    if (error) throw error
    return (data || []).map(transformFromDatabase)
  },

  // Get product by ID
  async getProduct(id: string): Promise<Product | null> {
    const supabase = createClient()
    const { data, error } = await supabase.from("products").select("*").eq("id", id).single()

    if (error) {
      if (error.code === "PGRST116") return null // Not found
      throw error
    }
    return transformFromDatabase(data)
  },

  // Add new product
  async addProduct(product: Omit<Product, "id" | "createdAt" | "updatedAt">): Promise<string> {
    const supabase = createClient()
    const dbProduct = transformToDatabase(product)
    const { data, error } = await supabase.from("products").insert([dbProduct]).select("id").single()

    if (error) throw error
    return data.id
  },

  // Update product
  async updateProduct(id: string, updates: Partial<Omit<Product, "id" | "createdAt">>): Promise<void> {
    const supabase = createClient()
    const dbUpdates = transformToDatabase(updates)
    const { error } = await supabase
      .from("products")
      .update({
        ...dbUpdates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)

    if (error) throw error
  },

  // Delete product
  async deleteProduct(id: string): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase.from("products").delete().eq("id", id)

    if (error) throw error
  },

  // Get stock batches for a product
  async getStockBatches(productId: string): Promise<StockBatch[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("stock_batches")
      .select("*")
      .eq("product_id", productId)
      .gt("remaining_quantity", 0)
      .order("batch_date")

    if (error) throw error
    return data || []
  },

  // Get total stock for a product
  async getTotalStock(productId: string): Promise<number> {
    const batches = await this.getStockBatches(productId)
    return batches.reduce((total, batch) => total + batch.remaining_quantity, 0)
  },

  // Get products with stock information
  async getProductsWithStock(): Promise<(Product & { totalStock: number; lowStock: boolean })[]> {
    const products = await this.getProducts()

    const productsWithStock = await Promise.all(
      products.map(async (product) => {
        const totalStock = await this.getTotalStock(product.id)
        return {
          ...product,
          totalStock,
          lowStock: totalStock <= product.minimumStock,
        }
      }),
    )

    return productsWithStock
  },
}
