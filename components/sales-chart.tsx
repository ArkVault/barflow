"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

interface SalesData {
  sale_date: string;
  total_price: number;
}

interface SalesChartProps {
  data: SalesData[];
}

export function SalesChart({ data }: SalesChartProps) {
  const aggregatedData = data.reduce((acc, sale) => {
    const date = new Date(sale.sale_date).toLocaleDateString('es', { 
      month: 'short', 
      day: 'numeric' 
    });
    
    const existing = acc.find(item => item.date === date);
    if (existing) {
      existing.ventas += Number(sale.total_price);
    } else {
      acc.push({ date, ventas: Number(sale.total_price) });
    }
    return acc;
  }, [] as { date: string; ventas: number }[]);

  if (aggregatedData.length === 0) {
    return (
      <Card className="neumorphic border-0">
        <CardHeader>
          <CardTitle>Tendencia de Ventas (Últimos 30 días)</CardTitle>
        </CardHeader>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">No hay datos de ventas para mostrar</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="neumorphic border-0">
      <CardHeader>
        <CardTitle>Tendencia de Ventas (Últimos 30 días)</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{
            ventas: {
              label: "Ventas",
              color: "hsl(var(--chart-3))",
            },
          }}
          className="h-[300px]"
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={aggregatedData}>
              <defs>
                <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-3))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--chart-3))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis 
                dataKey="date" 
                fontSize={12}
                tickLine={false}
              />
              <YAxis 
                fontSize={12}
                tickLine={false}
                tickFormatter={(value) => `$${value}`}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area
                type="monotone"
                dataKey="ventas"
                stroke="hsl(var(--chart-3))"
                strokeWidth={2}
                fill="url(#colorVentas)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
