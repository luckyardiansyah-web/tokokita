"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"

interface TopProductsChartProps {
  data: {
    productName: string
    revenue: number
    profit: number
    quantitySold: number
  }[]
}

export function TopProductsChart({ data }: TopProductsChartProps) {
  const colors = [
    "hsl(var(--chart-1))", // Orange
    "hsl(var(--chart-2))", // Red
    "hsl(var(--chart-3))", // Green
    "hsl(var(--chart-4))", // Blue
    "hsl(var(--chart-5))", // Purple
    "hsl(var(--chart-6))", // Teal
    "hsl(var(--chart-7))", // Yellow
    "hsl(var(--chart-8))", // Pink
    "hsl(var(--chart-9))", // Cyan
    "hsl(var(--chart-10))", // Lime
  ]

  // Show top 5 products by revenue
  const chartData = data.slice(0, 5).map((item, index) => ({
    ...item,
    name: item.productName.length > 20 ? `${item.productName.substring(0, 20)}...` : item.productName,
    color: colors[index % colors.length],
  }))

  const totalRevenue = chartData.reduce((sum, item) => sum + item.revenue, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Produk Terlaris</CardTitle>
        <CardDescription>5 produk dengan pendapatan tertinggi</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                outerRadius={100}
                dataKey="revenue"
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(1)}%)`}
                labelLine={false}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => [`Rp ${value.toLocaleString("id-ID")}`, "Pendapatan"]}
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "6px",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 space-y-2">
          {chartData.map((item, index) => (
            <div key={index} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: item.color }} />
                <span>{item.productName}</span>
              </div>
              <div className="text-right">
                <div className="font-medium">Rp {item.revenue.toLocaleString("id-ID")}</div>
                <div className="text-muted-foreground">{item.quantitySold} terjual</div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
