import { createClient } from "@/lib/supabase/client"
import type { Purchase } from "@/lib/types"

const transformToDatabase = (purchase: any) => ({
  supplier_id: purchase.supplierId,
  purchase_date:
    purchase.purchaseDate instanceof Date ? purchase.purchaseDate.toISOString().split("T")[0] : purchase.purchaseDate,
  total_amount: purchase.totalAmount,
})

const transformFromDatabase = (dbPurchase: any): Purchase => ({
  id: dbPurchase.id,
  productId: dbPurchase.product_id, // Added missing productId mapping
  supplierId: dbPurchase.supplier_id,
  quantity: dbPurchase.quantity, // Added missing quantity mapping
  purchasePrice: dbPurchase.purchase_price, // Added missing purchasePrice mapping
  purchaseDate: new Date(dbPurchase.purchase_date),
  totalAmount: dbPurchase.total_amount,
  notes: dbPurchase.notes,
  createdAt: new Date(dbPurchase.created_at),
})

export const purchaseService = {
  // Get all purchases
  async getPurchases(): Promise<Purchase[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("purchases")
      .select(`
        *,
        products (
          id,
          name
        ),
        suppliers (
          id,
          name
        )
      `)
      .order("purchase_date", { ascending: false })

    if (error) throw error
    return (data || []).map(transformFromDatabase)
  },

  // Get purchases by date range
  async getPurchasesByDateRange(startDate: Date, endDate: Date): Promise<Purchase[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("purchases")
      .select(`
        *,
        products (
          id,
          name
        ),
        suppliers (
          id,
          name
        )
      `)
      .gte("purchase_date", startDate.toISOString().split("T")[0])
      .lte("purchase_date", endDate.toISOString().split("T")[0])
      .order("purchase_date", { ascending: false })

    if (error) throw error
    return (data || []).map(transformFromDatabase)
  },

  // Get purchases by supplier
  async getPurchasesBySupplier(supplierId: string): Promise<Purchase[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("purchases")
      .select(`
        *,
        products (
          id,
          name
        ),
        suppliers (
          id,
          name
        )
      `)
      .eq("supplier_id", supplierId)
      .order("purchase_date", { ascending: false })

    if (error) throw error
    return (data || []).map(transformFromDatabase)
  },

  async addPurchase(purchaseData: {
    productId: string
    supplierId: string
    quantity: number
    purchasePrice: number
    totalAmount: number
    purchaseDate: Date
  }): Promise<string> {
    const supabase = createClient()

    try {
      // Create purchase record first
      const { data: purchase, error: purchaseError } = await supabase
        .from("purchases")
        .insert([
          {
            product_id: purchaseData.productId,
            supplier_id: purchaseData.supplierId,
            quantity: purchaseData.quantity,
            purchase_price: purchaseData.purchasePrice,
            purchase_date: purchaseData.purchaseDate.toISOString().split("T")[0],
            total_amount: purchaseData.totalAmount,
          },
        ])
        .select("id")
        .single()

      if (purchaseError) throw purchaseError

      // Create stock batch for the purchase
      const { error: batchError } = await supabase.from("stock_batches").insert([
        {
          product_id: purchaseData.productId,
          supplier_id: purchaseData.supplierId,
          quantity: purchaseData.quantity,
          remaining_quantity: purchaseData.quantity,
          purchase_price: purchaseData.purchasePrice,
          batch_date: purchaseData.purchaseDate.toISOString().split("T")[0],
        },
      ])

      if (batchError) throw batchError

      return purchase.id
    } catch (error) {
      console.error("Error adding purchase:", error)
      throw error
    }
  },

  // Update purchase
  async updatePurchase(id: string, updates: Partial<Purchase>): Promise<void> {
    const supabase = createClient()
    const dbUpdates = transformToDatabase(updates)
    const { error } = await supabase.from("purchases").update(dbUpdates).eq("id", id)

    if (error) throw error
  },

  // Delete purchase (also removes associated stock batches)
  async deletePurchase(id: string): Promise<void> {
    const supabase = createClient()

    try {
      // Delete purchase directly - stock_batches are independent records
      const { error: purchaseError } = await supabase.from("purchases").delete().eq("id", id)

      if (purchaseError) throw purchaseError
    } catch (error) {
      console.error("Error deleting purchase:", error)
      throw error
    }
  },

  // Get purchase statistics
  async getPurchaseStats(startDate?: Date, endDate?: Date) {
    let purchases: Purchase[]

    if (startDate && endDate) {
      purchases = await this.getPurchasesByDateRange(startDate, endDate)
    } else {
      purchases = await this.getPurchases()
    }

    const totalPurchases = purchases.length
    const totalAmount = purchases.reduce((sum, purchase) => sum + purchase.totalAmount, 0)
    const averageAmount = totalPurchases > 0 ? totalAmount / totalPurchases : 0

    // Group by supplier
    const supplierStats = purchases.reduce(
      (acc, purchase) => {
        const supplierId = purchase.supplierId
        if (!acc[supplierId]) {
          acc[supplierId] = {
            count: 0,
            totalAmount: 0,
          }
        }
        acc[supplierId].count++
        acc[supplierId].totalAmount += purchase.totalAmount
        return acc
      },
      {} as Record<string, { count: number; totalAmount: number }>,
    )

    return {
      totalPurchases,
      totalAmount,
      averageAmount,
      supplierStats,
    }
  },
}
