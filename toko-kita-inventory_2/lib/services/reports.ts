import { salesService } from "./sales"
import { purchaseService } from "./purchases"
import { productService } from "./products"
import { supplierService } from "./suppliers"
import type { MonthlyReport } from "@/lib/types"

export const reportsService = {
  // Generate monthly report
  async generateMonthlyReport(year: number, month: number): Promise<MonthlyReport> {
    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0, 23, 59, 59)

    const [sales, salesStats, products] = await Promise.all([
      salesService.getSalesByDateRange(startDate, endDate),
      salesService.getSalesStats(startDate, endDate),
      productService.getProducts(),
    ])

    const totalSales = salesStats.totalRevenue
    const totalCogs = salesStats.totalCogs
    const totalProfit = salesStats.totalProfit

    // Get top products
    const topProducts = Object.entries(salesStats.productStats)
      .map(([productId, stats]) => {
        const product = products.find((p) => p.id === productId)
        return {
          productId,
          productName: product?.name || "Unknown Product",
          quantitySold: stats.quantitySold,
          revenue: stats.revenue,
          profit: stats.profit,
        }
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)

    return {
      month: `${year}-${month.toString().padStart(2, "0")}`,
      totalSales,
      totalCogs,
      totalProfit,
      salesCount: sales.length,
      topProducts,
    }
  },

  // Get profit trend for multiple months
  async getProfitTrend(): Promise<
    {
      month: string
      monthName: string
      sales: number
      cogs: number
      profit: number
      profitMargin: number
    }[]
  > {
    const trends = []

    // Start from August 2025 and go to August 2026 (13 months)
    const startYear = 2025
    const startMonth = 8 // August

    for (let i = 0; i < 13; i++) {
      const currentMonth = startMonth + i
      const year = currentMonth > 12 ? startYear + 1 : startYear
      const month = currentMonth > 12 ? currentMonth - 12 : currentMonth

      const date = new Date(year, month - 1, 1)
      const monthlyReport = await this.generateMonthlyReport(year, month)

      trends.push({
        month: monthlyReport.month,
        monthName: date.toLocaleDateString("id-ID", { month: "short", year: "numeric" }),
        sales: monthlyReport.totalSales,
        cogs: monthlyReport.totalCogs,
        profit: monthlyReport.totalProfit,
        profitMargin: monthlyReport.totalSales > 0 ? (monthlyReport.totalProfit / monthlyReport.totalSales) * 100 : 0,
      })
    }

    return trends
  },

  // Get stock level report
  async getStockLevelReport(): Promise<
    {
      productId: string
      productName: string
      unit: string
      currentStock: number
      minStock: number
      status: "normal" | "low" | "out"
      stockValue: number
      averageCogs: number
    }[]
  > {
    const productsWithStock = await productService.getProductsWithStock()

    const stockReport = await Promise.all(
      productsWithStock.map(async (product) => {
        const batches = await productService.getStockBatches(product.id)
        const totalValue = batches.reduce((sum, batch) => sum + batch.remaining_quantity * batch.purchase_price, 0)
        const averageCogs = product.totalStock > 0 ? totalValue / product.totalStock : 0

        let status: "normal" | "low" | "out" = "normal"
        if (product.totalStock === 0) {
          status = "out"
        } else if (product.totalStock <= product.minimum_stock) {
          status = "low"
        }

        return {
          productId: product.id,
          productName: product.name,
          unit: product.unit,
          currentStock: product.totalStock,
          minStock: product.minimum_stock,
          status,
          stockValue: totalValue,
          averageCogs,
        }
      }),
    )

    return stockReport.sort((a, b) => a.productName.localeCompare(b.productName))
  },

  // Get sales performance by product
  async getProductPerformance(
    startDate?: Date,
    endDate?: Date,
  ): Promise<
    {
      productId: string
      productName: string
      quantitySold: number
      revenue: number
      profit: number
      profitMargin: number
      salesCount: number
    }[]
  > {
    const salesStats = await salesService.getSalesStats(startDate, endDate)
    const products = await productService.getProducts()

    return Object.entries(salesStats.productStats)
      .map(([productId, stats]) => {
        const product = products.find((p) => p.id === productId)
        return {
          productId,
          productName: product?.name || "Unknown Product",
          quantitySold: stats.quantitySold,
          revenue: stats.revenue,
          profit: stats.profit,
          profitMargin: stats.revenue > 0 ? (stats.profit / stats.revenue) * 100 : 0,
          salesCount: stats.salesCount,
        }
      })
      .sort((a, b) => b.revenue - a.revenue)
  },

  // Get purchase analysis
  async getPurchaseAnalysis(
    startDate?: Date,
    endDate?: Date,
  ): Promise<{
    totalPurchases: number
    totalAmount: number
    averageAmount: number
    supplierBreakdown: {
      supplierId: string
      supplierName: string
      purchaseCount: number
      totalAmount: number
      percentage: number
    }[]
  }> {
    const purchaseStats = await purchaseService.getPurchaseStats(startDate, endDate)
    const suppliers = await supplierService.getSuppliers()

    const supplierBreakdown = Object.entries(purchaseStats.supplierStats).map(([supplierId, stats]) => {
      const supplier = suppliers.find((s) => s.id === supplierId)
      return {
        supplierId,
        supplierName: supplier?.name || `Supplier ${supplierId}`,
        purchaseCount: stats.count,
        totalAmount: stats.totalAmount,
        percentage: purchaseStats.totalAmount > 0 ? (stats.totalAmount / purchaseStats.totalAmount) * 100 : 0,
      }
    })

    return {
      totalPurchases: purchaseStats.totalPurchases,
      totalAmount: purchaseStats.totalAmount,
      averageAmount: purchaseStats.averageAmount,
      supplierBreakdown: supplierBreakdown.sort((a, b) => b.totalAmount - a.totalAmount),
    }
  },

  // Get dashboard summary
  async getDashboardSummary(): Promise<{
    totalProducts: number
    lowStockProducts: number
    outOfStockProducts: number
    totalStockValue: number
    todaySales: number
    todayProfit: number
    monthlyProfit: number
    profitGrowth: number
  }> {
    const [stockReport, todayStats, monthlyStats, lastMonthStats] = await Promise.all([
      this.getStockLevelReport(),
      salesService.getSalesStats(
        new Date(new Date().setHours(0, 0, 0, 0)),
        new Date(new Date().setHours(23, 59, 59, 999)),
      ),
      salesService.getSalesStats(new Date(new Date().getFullYear(), new Date().getMonth(), 1), new Date()),
      salesService.getSalesStats(
        new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1),
        new Date(new Date().getFullYear(), new Date().getMonth(), 0),
      ),
    ])

    const totalStockValue = stockReport.reduce((sum, item) => sum + item.stockValue, 0)
    const lowStockProducts = stockReport.filter((item) => item.status === "low").length
    const outOfStockProducts = stockReport.filter((item) => item.status === "out").length

    const profitGrowth =
      lastMonthStats.totalProfit > 0
        ? ((monthlyStats.totalProfit - lastMonthStats.totalProfit) / lastMonthStats.totalProfit) * 100
        : 0

    return {
      totalProducts: stockReport.length,
      lowStockProducts,
      outOfStockProducts,
      totalStockValue,
      todaySales: todayStats.totalRevenue,
      todayProfit: todayStats.totalProfit,
      monthlyProfit: monthlyStats.totalProfit,
      profitGrowth,
    }
  },
}
