import { createClient } from "@/lib/supabase/client"
import { stockBatchService } from "./stockBatches"
import type { Sale } from "@/lib/types"

const transformFromDatabase = (dbSale: any): Sale => ({
  id: dbSale.id,
  productId: dbSale.product_id,
  quantity: dbSale.quantity,
  sellingPrice: dbSale.selling_price,
  totalAmount: dbSale.total_amount,
  cogs: dbSale.cost_of_goods_sold,
  profit: dbSale.profit,
  profitMargin: dbSale.profit_margin,
  saleDate: new Date(dbSale.sale_date),
  customerName: dbSale.customer_name,
  notes: dbSale.notes,
  createdAt: new Date(dbSale.created_at),
  updatedAt: new Date(dbSale.updated_at),
})

export const salesService = {
  // Get all sales
  async getSales(): Promise<Sale[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("sales")
      .select(`
        *,
        products (
          id,
          name
        )
      `)
      .order("sale_date", { ascending: false })

    if (error) throw error
    return (data || []).map(transformFromDatabase)
  },

  // Get sales by date range
  async getSalesByDateRange(startDate: Date, endDate: Date): Promise<Sale[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("sales")
      .select(`
        *,
        products (
          id,
          name
        )
      `)
      .gte("sale_date", startDate.toISOString().split("T")[0])
      .lte("sale_date", endDate.toISOString().split("T")[0])
      .order("sale_date", { ascending: false })

    if (error) throw error
    return (data || []).map(transformFromDatabase)
  },

  // Get sales by product
  async getSalesByProduct(productId: string): Promise<Sale[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("sales")
      .select(`
        *,
        products (
          id,
          name
        )
      `)
      .eq("product_id", productId)
      .order("sale_date", { ascending: false })

    if (error) throw error
    return (data || []).map(transformFromDatabase)
  },

  // Process sale with FIFO method
  async processSale(saleData: {
    productId: string
    quantity: number
    sellingPrice: number
    saleDate: Date
    customerName?: string
    notes?: string
  }): Promise<{
    success: boolean
    message: string
    saleId?: string
  }> {
    const { productId, quantity, sellingPrice, saleDate, customerName, notes } = saleData

    try {
      // Calculate FIFO COGS and check stock availability
      const fifoResult = await stockBatchService.calculateFIFOCogs(productId, quantity)

      if (!fifoResult.canFulfill) {
        return {
          success: false,
          message: "Stok tidak mencukupi untuk penjualan ini",
        }
      }

      const totalAmount = quantity * sellingPrice
      const cogs = fifoResult.cogs
      const profit = totalAmount - cogs

      const supabase = createClient()

      // Create sale record
      const { data: saleDataResult, error: saleError } = await supabase
        .from("sales")
        .insert([
          {
            product_id: productId,
            quantity,
            selling_price: sellingPrice,
            total_amount: totalAmount,
            cost_of_goods_sold: cogs,
            profit,
            sale_date: saleDate.toISOString().split("T")[0],
            customer_name: customerName,
            notes,
          },
        ])
        .select("id")
        .single()

      if (saleError) throw saleError

      // Create sale batch items records
      const saleBatchItems = fifoResult.batchesUsed.map((batchUsed) => ({
        sale_id: saleDataResult.id,
        stock_batch_id: batchUsed.batchId,
        quantity_used: batchUsed.quantityUsed,
        unit_cost: batchUsed.purchasePrice, // Use unit_cost instead of batch_cost
      }))

      const { error: batchItemsError } = await supabase.from("sale_batch_items").insert(saleBatchItems)

      if (batchItemsError) throw batchItemsError

      // Update stock batches - reduce remaining quantities
      for (const batchUsed of fifoResult.batchesUsed) {
        // Get current batch data to calculate new remaining quantity
        const { data: currentBatch, error: batchError } = await supabase
          .from("stock_batches")
          .select("remaining_quantity")
          .eq("id", batchUsed.batchId)
          .single()

        if (batchError) throw batchError

        const newRemainingQuantity = currentBatch.remaining_quantity - batchUsed.quantityUsed

        const { error: updateError } = await supabase
          .from("stock_batches")
          .update({
            remaining_quantity: Math.max(0, newRemainingQuantity),
            updated_at: new Date().toISOString(),
          })
          .eq("id", batchUsed.batchId)

        if (updateError) throw updateError
      }

      return {
        success: true,
        message: "Penjualan berhasil dicatat",
        saleId: saleDataResult.id,
      }
    } catch (error) {
      console.error("Error processing sale:", error)
      return {
        success: false,
        message: "Terjadi kesalahan saat memproses penjualan",
      }
    }
  },

  // Get sales statistics
  async getSalesStats(startDate?: Date, endDate?: Date) {
    let sales: Sale[]

    if (startDate && endDate) {
      sales = await this.getSalesByDateRange(startDate, endDate)
    } else {
      sales = await this.getSales()
    }

    const totalSales = sales.length
    const totalRevenue = sales.reduce((sum, sale) => sum + sale.sellingPrice * sale.quantity, 0)
    const totalCogs = sales.reduce((sum, sale) => sum + sale.cogs, 0)
    const totalProfit = sales.reduce((sum, sale) => sum + sale.profit, 0)
    const averageSale = totalSales > 0 ? totalRevenue / totalSales : 0

    // Group by product
    const productStats = sales.reduce(
      (acc, sale) => {
        const productId = sale.productId
        if (!acc[productId]) {
          acc[productId] = {
            quantitySold: 0,
            revenue: 0,
            cogs: 0,
            profit: 0,
            salesCount: 0,
          }
        }
        acc[productId].quantitySold += sale.quantity
        acc[productId].revenue += sale.sellingPrice * sale.quantity
        acc[productId].cogs += sale.cogs
        acc[productId].profit += sale.profit
        acc[productId].salesCount++
        return acc
      },
      {} as Record<
        string,
        {
          quantitySold: number
          revenue: number
          cogs: number
          profit: number
          salesCount: number
        }
      >,
    )

    // Daily sales for charts
    const dailySales = sales.reduce(
      (acc, sale) => {
        const dateKey = sale.saleDate.toISOString().split("T")[0]
        if (!acc[dateKey]) {
          acc[dateKey] = {
            date: dateKey,
            revenue: 0,
            profit: 0,
            salesCount: 0,
          }
        }
        acc[dateKey].revenue += sale.sellingPrice * sale.quantity
        acc[dateKey].profit += sale.profit
        acc[dateKey].salesCount++
        return acc
      },
      {} as Record<
        string,
        {
          date: string
          revenue: number
          profit: number
          salesCount: number
        }
      >,
    )

    return {
      totalSales,
      totalRevenue,
      totalCogs,
      totalProfit,
      averageSale,
      profitMargin: totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0,
      productStats,
      dailySales: Object.values(dailySales).sort((a, b) => a.date.localeCompare(b.date)),
    }
  },

  // Check stock availability before sale
  async checkStockAvailability(
    productId: string,
    quantity: number,
  ): Promise<{
    available: boolean
    currentStock: number
    message: string
  }> {
    const { totalAvailable, canFulfill } = await stockBatchService.getStockBatchesForFIFO(productId, quantity)

    return {
      available: canFulfill,
      currentStock: totalAvailable,
      message: canFulfill
        ? `Stok tersedia: ${totalAvailable} unit`
        : `Stok tidak mencukupi. Tersedia: ${totalAvailable} unit, dibutuhkan: ${quantity} unit`,
    }
  },
}
