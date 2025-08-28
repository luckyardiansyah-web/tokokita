"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"

interface StockLevelChartProps {
  data: {
    productName: string
    currentStock: number
    minStock: number
    status: "normal" | "low" | "out"
  }[]
}

export function StockLevelChart({ data }: StockLevelChartProps) {
  const productColors = [
    "hsl(var(--chart-1))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-5))",
    "hsl(24, 95%, 53%)", // Orange
    "hsl(142, 76%, 36%)", // Green
    "hsl(262, 83%, 58%)", // Purple
    "hsl(346, 87%, 43%)", // Pink
    "hsl(221, 83%, 53%)", // Blue
  ]

  const getBarColor = (index: number, status: string) => {
    const baseColor = productColors[index % productColors.length]

    // Adjust opacity/brightness based on status
    switch (status) {
      case "out":
        return "hsl(var(--destructive))"
      case "low":
        return baseColor.replace(")", ", 0.7)").replace("hsl(", "hsla(")
      default:
        return baseColor
    }
  }

  // Show only top 10 products by stock level
  const chartData = data
    .sort((a, b) => b.currentStock - a.currentStock)
    .slice(0, 10)
    .map((item) => ({
      ...item,
      productName: item.productName.length > 15 ? `${item.productName.substring(0, 15)}...` : item.productName,
    }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Level Stok Produk</CardTitle>
        <CardDescription>10 produk dengan stok tertinggi dan status stok</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="productName" angle={-45} textAnchor="end" height={80} className="text-xs" interval={0} />
              <YAxis className="text-xs" />
              <Tooltip
                formatter={(value: number, name: string) => [value, name === "currentStock" ? "Stok Saat Ini" : name]}
                labelFormatter={(label) => `Produk: ${label}`}
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "6px",
                }}
              />
              <Bar dataKey="currentStock" name="Stok Saat Ini" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getBarColor(index, entry.status)} />
                ))}
              </Bar>
              <Bar dataKey="minStock" name="Stok Minimum" fill="hsl(var(--muted-foreground))" opacity={0.3} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-center gap-6 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: "hsl(var(--primary))" }} />
            <span>Normal</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: "hsl(var(--chart-4), 0.7)" }} />
            <span>Stok Menipis</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: "hsl(var(--destructive))" }} />
            <span>Habis</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
