import { describe, it, expect, beforeEach } from "vitest"

type Purchase = { productId: string; qty: number; price: number }
type Sale = { productId: string; qty: number; price: number }

let purchases: Purchase[] = []
let sales: Sale[] = []

function addPurchase(productId: string, qty: number, price: number) {
  purchases.push({ productId, qty, price })
}

function addSale(productId: string, qty: number, price: number) {
  sales.push({ productId, qty, price })
}

function generateReport() {
  const revenue = sales.reduce((sum, s) => sum + s.qty * s.price, 0)
  const cogs = sales.reduce((sum, s) => {
    const purchase = purchases.find(p => p.productId === s.productId)
    return sum + (purchase ? s.qty * purchase.price : 0)
  }, 0)
  return {
    totalRevenue: revenue,
    totalCOGS: cogs,
    totalProfit: revenue - cogs,
  }
}

describe("Inventory Integration Flow", () => {
  beforeEach(() => {
    purchases = []
    sales = []
  })

  it("handles purchase → sale → report correctly", () => {
    addPurchase("P001", 10, 1000)  // beli 10 pcs @1000
    addSale("P001", 5, 1500)       // jual 5 pcs @1500

    const report = generateReport()
    expect(report.totalRevenue).toBe(7500)
    expect(report.totalCOGS).toBe(5000)
    expect(report.totalProfit).toBe(2500)
  })

  it("reports zero if no transactions", () => {
    const report = generateReport()
    expect(report).toEqual({
      totalRevenue: 0,
      totalCOGS: 0,
      totalProfit: 0,
    })
  })
})
