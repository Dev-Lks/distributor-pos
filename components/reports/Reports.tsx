"use client"

import React, { useEffect, useState } from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';

interface SaleData {
  id: number;
  date: string;
  items: Array<{
    product: {
      id: string;
      name: string;
      size: string;
      price: number;
    };
    qty: number;
  }>;
  total: number;
}

export default function Reports() {
  const [sales, setSales] = useState<SaleData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSales = async () => {
      try {
        const response = await fetch('/api/sales');
        if (response.ok) {
          const data = await response.json();
          setSales(data);
        }
      } catch (error) {
        console.error('Error loading sales for reports:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSales();
  }, []);

  if (loading) {
    return <div className="text-center py-8">Carregando relatórios...</div>;
  }

  // Calcular métricas
  const totalSales = sales.length;
  const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0);
  const averageSale = totalSales > 0 ? totalRevenue / totalSales : 0;

  // Vendas por dia (últimos 7 dias)
  const salesByDay = sales.reduce((acc, sale) => {
    const date = new Date(sale.date).toISOString().split('T')[0];
    acc[date] = (acc[date] || 0) + sale.total;
    return acc;
  }, {} as Record<string, number>);

  const dailyData = Object.entries(salesByDay)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-7)
    .map(([date, total]) => ({
      date: new Date(date).toLocaleDateString('pt-BR'),
      total: Number(total.toFixed(2))
    }));

  // Produtos mais vendidos
  const productSales = sales.flatMap(sale =>
    sale.items.map(item => ({
      name: item.product.name,
      size: item.product.size,
      quantity: item.qty,
      revenue: item.product.price * item.qty
    }))
  ).reduce((acc, item) => {
    const key = `${item.name} ${item.size}`;
    if (!acc[key]) {
      acc[key] = { name: key, quantity: 0, revenue: 0 };
    }
    acc[key].quantity += item.quantity;
    acc[key].revenue += item.revenue;
    return acc;
  }, {} as Record<string, { name: string; quantity: number; revenue: number }>);

  const topProducts = Object.values(productSales)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  const pieData = topProducts.map((product, index) => ({
    name: product.name,
    value: product.quantity,
    fill: ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1'][index] || '#8884d8'
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{totalSales}</div>
            <div className="text-sm text-muted-foreground">Total de Vendas</div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">R$ {totalRevenue.toFixed(2)}</div>
            <div className="text-sm text-muted-foreground">Receita Total</div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">R$ {averageSale.toFixed(2)}</div>
            <div className="text-sm text-muted-foreground">Ticket Médio</div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-4">Vendas por Dia (Últimos 7 dias)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value) => [`R$ ${value}`, 'Total']} />
              <Bar dataKey="total" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-4">Produtos Mais Vendidos</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-4">Top 5 Produtos por Quantidade</h3>
        <div className="space-y-2">
          {topProducts.map((product, index) => (
            <div key={product.name} className="flex items-center justify-between p-2 border rounded">
              <div className="flex items-center gap-3">
                <Badge variant="outline">{index + 1}</Badge>
                <span className="font-medium">{product.name}</span>
              </div>
              <div className="text-right">
                <div className="font-semibold">{product.quantity} unidades</div>
                <div className="text-sm text-muted-foreground">R$ {product.revenue.toFixed(2)}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}