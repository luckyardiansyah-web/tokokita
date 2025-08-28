"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"

interface ProfitChartProps {
  data: {
    month: string
    monthName: string
    sales: number
    cogs: number
    profit: number
    profitMargin: number
  }[]
}

export function ProfitChart({ data }: ProfitChartProps) {
  const formatCurrency = (value: number) => {
    return `Rp ${(value / 1000000).toFixed(1)}M`
  }

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tren Laba Bulanan</CardTitle>
        <CardDescription>Perkembangan penjualan, HPP, dan laba dari Agustus 2025 - Agustus 2026</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="monthName" className="text-xs" />
              <YAxis yAxisId="left" tickFormatter={formatCurrency} className="text-xs" />
              <YAxis yAxisId="right" orientation="right" tickFormatter={formatPercentage} className="text-xs" />
              <Tooltip
                formatter={(value: number, name: string) => {
                  if (name === "Margin Laba") {
                    return [formatPercentage(value), name]
                  }
                  return [`Rp ${value.toLocaleString("id-ID")}`, name]
                }}
                labelFormatter={(label) => `Bulan: ${label}`}
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "6px",
                }}
              />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="sales"
                stroke="hsl(var(--chart-1))"
                strokeWidth={3}
                name="Penjualan"
                dot={{ fill: "hsl(var(--chart-1))", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, strokeWidth: 2 }}
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="cogs"
                stroke="hsl(var(--chart-2))"
                strokeWidth={3}
                name="HPP"
                dot={{ fill: "hsl(var(--chart-2))", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, strokeWidth: 2 }}
                strokeDasharray="8 4"
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="profit"
                stroke="hsl(var(--chart-3))"
                strokeWidth={4}
                name="Laba"
                dot={{ fill: "hsl(var(--chart-3))", strokeWidth: 2, r: 5 }}
                activeDot={{ r: 7, strokeWidth: 2 }}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="profitMargin"
                stroke="hsl(var(--chart-4))"
                strokeWidth={3}
                strokeDasharray="12 6"
                name="Margin Laba"
                dot={{ fill: "hsl(var(--chart-4))", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
