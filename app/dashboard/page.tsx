"use client"

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  Package,
  ShoppingCart,
  History,
  Settings,
  LogOut,
  Bell,
  TrendingUp,
  AlertTriangle
} from "lucide-react";
import SalesPanel from "../../components/sales/SalesPanel";
import SalesHistory from "../../components/sales/SalesHistory";
import InventoryDashboard from "../../components/inventory/InventoryDashboard";
import Reports from "../../components/reports/Reports";
import { AppShell } from "@/components/layout/AppShell";
import { useInventory } from '@/lib/useInventory';

type View = 'overview' | 'sales' | 'inventory' | 'history' | 'reports';

export default function DashboardPage() {
  const [pin, setPin] = useState("");
  const [authed, setAuthed] = useState(false);
  const [currentView, setCurrentView] = useState<View>('overview');
  const { alerts } = useInventory();

  const PIN = process.env.NEXT_PUBLIC_DASHBOARD_PIN || "1234";

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (pin === PIN) {
      setAuthed(true);
      setPin('');
    } else {
      alert("PIN incorreto.");
      setPin('');
    }
  }

  if (!authed) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 w-full max-w-md">
          <h2 className="text-2xl font-bold text-center mb-6">Dashboard NitroBeer</h2>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">PIN de Acesso</label>
              <input
                type="password"
                value={pin}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  if (value.length <= 6) setPin(value);
                }}
                className="w-full p-3 border rounded-lg text-center text-lg font-mono"
                placeholder="Digite o PIN"
                maxLength={6}
                autoFocus
              />
            </div>
            <Button type="submit" className="w-full">Entrar</Button>
          </form>
        </Card>
      </div>
    );
  }

  const sidebarItems = [
    { id: 'overview' as View, label: 'Visão Geral', icon: BarChart3 },
    { id: 'sales' as View, label: 'Vendas', icon: ShoppingCart },
    { id: 'inventory' as View, label: 'Inventário', icon: Package },
    { id: 'history' as View, label: 'Histórico', icon: History },
    { id: 'reports' as View, label: 'Relatórios', icon: TrendingUp },
  ];

  const activeAlerts = alerts.filter(a => !a.resolved);

  return (
    <AppShell
      title="Dashboard NitroBeer"
      subtitle="Operação e Vendas"
      alertsCount={activeAlerts.length}
      navItems={sidebarItems.map((it) => ({
        id: it.id,
        label: it.label,
        icon: it.icon,
        active: currentView === it.id,
        onClick: () => setCurrentView(it.id),
      }))}
      rightActions={
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            if (confirm("Fazer logout?")) {
              setAuthed(false);
              setCurrentView('overview');
            }
          }}
        >
          <LogOut className="w-4 h-4" />
        </Button>
      }
    >
      {currentView === 'overview' && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Visão Geral</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <Card className="text-center p-4">
              <div className="text-2xl font-bold text-primary">R$ 0,00</div>
              <div className="text-sm text-muted-foreground">Vendas Hoje</div>
            </Card>
            <Card className="text-center p-4">
              <div className="text-2xl font-bold text-primary">0</div>
              <div className="text-sm text-muted-foreground">Produtos em Estoque</div>
            </Card>
            <Card className="text-center p-4">
              <div className="text-2xl font-bold text-primary">{activeAlerts.length}</div>
              <div className="text-sm text-muted-foreground">Alertas Ativos</div>
            </Card>
          </div>
          <div className="text-center text-muted-foreground">
            Selecione uma seção no menu lateral para começar.
          </div>
        </div>
      )}

      {currentView === 'sales' && <SalesPanel />}
      {currentView === 'inventory' && <InventoryDashboard />}
      {currentView === 'history' && <SalesHistory />}
      {currentView === 'reports' && <Reports />}
    </AppShell>
  );
}