import { createClient } from "@/lib/supabase/client"
import type { StockBatch } from "@/lib/types"

export const stockBatchService = {
  // Tambah batch stok baru
  async addStockBatch(batch: Omit<StockBatch, "id" | "created_at" | "updated_at" | "remaining_quantity">): Promise<string> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("stock_batches")
      .insert([
        {
          ...batch,
          remaining_quantity: batch.quantity,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select("id")
      .single()

    if (error) throw error
    return data.id
  },

  // Update batch stok
  async updateStockBatch(id: string, updates: Partial<StockBatch>): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase
      .from("stock_batches")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)

    if (error) throw error
  },

  // Ambil batch untuk FIFO
  async getStockBatchesForFIFO(
    productId: string,
    quantityNeeded: number
  ): Promise<{
    batches: StockBatch[]
    totalAvailable: number
    canFulfill: boolean
  }> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("stock_batches")
      .select("*")
      .eq("product_id", productId)
      .gt("remaining_quantity", 0)
      .order("batch_date") // oldest first (FIFO)

    if (error) throw error

    const batches = (data || []) as StockBatch[]
    const totalAvailable = batches.reduce((sum, b) => sum + b.remaining_quantity, 0)

    return {
      batches,
      totalAvailable,
      canFulfill: totalAvailable >= quantityNeeded,
    }
  },

  // Hitung COGS FIFO
  async calculateFIFOCogs(
    productId: string,
    quantityToSell: number
  ): Promise<{
    cogs: number
    batchesUsed: { batchId: string; quantityUsed: number; purchasePrice: number }[]
    canFulfill: boolean
  }> {
    const { batches, canFulfill } = await this.getStockBatchesForFIFO(productId, quantityToSell)

    if (!canFulfill) {
      return {
        cogs: 0,
        batchesUsed: [],
        canFulfill: false,
      }
    }

    let remainingQty = quantityToSell
    let totalCogs = 0
    const batchesUsed: { batchId: string; quantityUsed: number; purchasePrice: number }[] = []

    for (const batch of batches) {
      if (remainingQty <= 0) break

      const takeQty = Math.min(batch.remaining_quantity, remainingQty)
      totalCogs += takeQty * batch.purchase_price

      batchesUsed.push({
        batchId: batch.id,
        quantityUsed: takeQty,
        purchasePrice: batch.purchase_price,
      })

      remainingQty -= takeQty
    }

    return {
      cogs: totalCogs,
      batchesUsed,
      canFulfill: true,
    }
  },
}
