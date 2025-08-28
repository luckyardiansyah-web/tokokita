export interface StockBatch {
  id: string
  product_id: string
  purchase_id?: string
  quantity: number
  remaining_quantity: number
  purchase_price: number
  batch_date: string // Date string in YYYY-MM-DD format
  expiry_date?: string
  created_at: string
  updated_at: string
}

export interface Product {
  id: string
  name: string
  description?: string
  unit: string // 'pcs', 'kg', 'liter', etc.
  minimum_stock: number
  created_at: string
  updated_at: string
}

export interface Supplier {
  id: string
  name: string
  contact_person?: string
  phone?: string
  email?: string
  address?: string
  created_at: string
  updated_at: string
}

export interface Sale {
  id: string
  productId: string
  quantity: number
  sellingPrice: number
  totalAmount: number
  cogs: number
  profit: number
  profitMargin: number
  saleDate: Date
  customerName?: string
  notes?: string
  createdAt: Date
  updatedAt: Date
}

export interface SaleBatchItem {
  id: string
  sale_id: string
  stock_batch_id: string
  quantity_used: number
  batch_cost: number
  created_at: string
}

export interface Purchase {
  id: string
  supplier_id?: string
  purchase_date: string // Date string in YYYY-MM-DD format
  total_amount: number
  notes?: string
  created_at: string
  updated_at: string
  // Relations
  suppliers?: Supplier
  items?: PurchaseItem[]
}

export interface PurchaseItem {
  product_id: string
  quantity: number
  purchase_price: number
  expiry_date?: string
}

export interface MonthlyReport {
  month: string // 'YYYY-MM'
  totalSales: number
  totalCogs: number
  totalProfit: number
  salesCount: number
  topProducts: {
    productId: string
    productName: string
    quantitySold: number
    revenue: number
    profit: number
  }[]
}
