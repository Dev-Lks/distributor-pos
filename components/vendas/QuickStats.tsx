import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Product } from "@/lib/products";
import { 
  ShoppingCart, 
  Calculator, 
  Clock, 
  TrendingUp, 
  Package,
  Users,
  DollarSign,
  BarChart3
} from "lucide-react";

type CartItem = { 
  product: Product; 
  qty: number; 
  discount?: number;
  notes?: string;
};

interface QuickStatsProps {
  cart: CartItem[];
  recentSales: any[];
  onViewChange?: (view: string) => void;
}

const formatBRL = (value: number) => 
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function QuickStats({ cart, recentSales, onViewChange }: QuickStatsProps) {
  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
  const cartTotal = cart.reduce((sum, item) => sum + (item.product.price * item.qty), 0);
  
  const todaysSales = recentSales.filter(sale => {
    const saleDate = new Date(sale.date);
    const today = new Date();
    return saleDate.toDateString() === today.toDateString();
  });

  const todaysRevenue = todaysSales.reduce((sum, sale) => sum + sale.total, 0);

  return (
    <div className="space-y-4">
      
      {/* Current Cart Stats */}
      <Card className="p-4 bg-black border-yellow-500">
        <h3 className="font-semibold mb-3 flex items-center gap-2 text-yellow-100">
          <ShoppingCart className="h-4 w-4" />
          Carrinho Atual
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-yellow-300">Produtos</span>
            <Badge variant="outline" className="border-yellow-500 text-yellow-300">{cart.length} tipos</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-yellow-300">Quantidade</span>
            <Badge variant="outline" className="border-yellow-500 text-yellow-300">{totalItems} itens</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-yellow-300">Total</span>
            <Badge variant="default" className="bg-yellow-500 text-black">
              {formatBRL(cartTotal)}
            </Badge>
          </div>
        </div>
      </Card>

      {/* Today's Performance */}
      <Card className="p-4 bg-black border-yellow-500">
        <h3 className="font-semibold mb-3 flex items-center gap-2 text-yellow-100">
          <TrendingUp className="h-4 w-4" />
          Hoje
        </h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="bg-yellow-500 p-2 rounded">
              <BarChart3 className="h-4 w-4 text-black" />
            </div>
            <div>
              <p className="text-sm text-yellow-300">Vendas</p>
              <p className="font-semibold text-yellow-100">{todaysSales.length}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="bg-yellow-600 p-2 rounded">
              <DollarSign className="h-4 w-4 text-black" />
            </div>
            <div>
              <p className="text-sm text-yellow-300">Faturamento</p>
              <p className="font-semibold text-yellow-500">{formatBRL(todaysRevenue)}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Recent Sales */}
      <Card className="p-4 bg-black border-yellow-500">
        <h3 className="font-semibold mb-3 flex items-center gap-2 text-yellow-100">
          <Clock className="h-4 w-4" />
          Vendas Recentes
        </h3>
        <div className="space-y-2">
          {recentSales.slice(0, 5).map((sale, index) => (
            <div key={sale.id} className="flex items-center justify-between text-sm p-2 hover:bg-yellow-900/20 rounded border border-yellow-600">
              <div>
                <span className="font-medium text-yellow-100">#{sale.id}</span>
                <p className="text-xs text-yellow-300">
                  {new Date(sale.date).toLocaleTimeString('pt-BR', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </p>
              </div>
              <div className="text-right">
                <p className="font-medium text-yellow-500">{formatBRL(sale.total)}</p>
                <p className="text-xs text-yellow-300">{sale.items?.length || 0} itens</p>
              </div>
            </div>
          ))}
          
          {recentSales.length === 0 && (
            <p className="text-sm text-yellow-300 text-center py-4">
              Nenhuma venda recente
            </p>
          )}
        </div>
      </Card>

      {/* Quick Actions */}
      <Card className="p-4 bg-black border-yellow-500">
        <h3 className="font-semibold mb-3 text-yellow-100">Ações Rápidas</h3>
        <div className="space-y-2">
          <Button 
            variant="outline" 
            className="w-full justify-start bg-black text-yellow-500 border-yellow-500 hover:bg-yellow-500 hover:text-black"
            onClick={() => onViewChange?.('history')}
          >
            <Clock className="h-4 w-4 mr-2" />
            Ver Histórico
          </Button>
          <Button 
            variant="outline" 
            className="w-full justify-start bg-black text-yellow-500 border-yellow-500 hover:bg-yellow-500 hover:text-black"
            onClick={() => onViewChange?.('reports')}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Relatórios
          </Button>
          <Button 
            variant="outline" 
            className="w-full justify-start bg-black text-yellow-500 border-yellow-500 hover:bg-yellow-500 hover:text-black"
            onClick={() => onViewChange?.('inventory')}
          >
            <Package className="h-4 w-4 mr-2" />
            Estoque
          </Button>
        </div>
      </Card>

      {/* Performance Indicators */}
      <Card className="p-4">
        <h3 className="font-semibold mb-3">Indicadores</h3>
        <div className="space-y-2">
          {todaysSales.length > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Ticket Médio</span>
              <span className="font-medium">
                {formatBRL(todaysRevenue / todaysSales.length)}
              </span>
            </div>
          )}
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Produtos no Sistema</span>
            <Badge variant="secondary">{cart.length > 0 ? 'Ativos' : 'Disponíveis'}</Badge>
          </div>
        </div>
      </Card>
    </div>
  );
}