"use client"

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Product } from "@/lib/products";
import { useInventory } from '@/lib/useInventory';
import { toast } from 'sonner';
import ProductCard from "@/components/vendas/ProductCard";
import CartSummary from "@/components/vendas/CartSummary";
import PaymentForm from "@/components/vendas/PaymentForm";
import QuickStats from "@/components/vendas/QuickStats";
import { 
  ShoppingCart, 
  Search, 
  Filter, 
  Trash2, 
  Plus, 
  Minus, 
  CreditCard, 
  Receipt,
  Star,
  Clock,
  Package,
  Calculator,
  Users,
  TrendingUp,
  Barcode,
  Settings,
  Grid3X3,
  List
} from "lucide-react";

type CartItem = { 
  product: Product; 
  qty: number; 
  discount?: number;
  notes?: string;
};

type PaymentMethod = 'cash' | 'pix' | 'debit' | 'credit' | 'tab';

type SaleStatus = 'pending' | 'paid' | 'preparing' | 'delivered' | 'cancelled';

interface QuickAction {
  id: string;
  name: string;
  items: CartItem[];
  icon: string;
}

const formatBRL = (value: number) => 
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const paymentMethods = [
  { id: 'cash', name: 'Dinheiro', icon: '💵' },
  { id: 'pix', name: 'PIX', icon: '🏦' },
  { id: 'debit', name: 'Débito', icon: '💳' },
  { id: 'credit', name: 'Crédito', icon: '💎' },
  { id: 'tab', name: 'Fiado', icon: '📝' }
];

export default function VendasPage() {
  // State management
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeView, setActiveView] = useState<'products' | 'cart' | 'payment'>('products');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // UI state
  const [showFavorites, setShowFavorites] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [recentSales, setRecentSales] = useState<any[]>([]);

  const { getStockLevel } = useInventory();

  // Load initial data
  useEffect(() => {
    loadProducts();
    loadFavorites();
    loadRecentSales();
    loadSavedCart();
  }, []);

  // Auto-save cart
  useEffect(() => {
    if (cart.length > 0) {
      localStorage.setItem('vendas_cart', JSON.stringify(cart));
    }
  }, [cart]);

  const loadProducts = async () => {
    try {
      const response = await fetch('/api/products');
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      }
    } catch (error) {
      toast.error('Erro ao carregar produtos');
      console.error(error);
    }
  };

  const loadFavorites = () => {
    try {
      const saved = localStorage.getItem('vendas_favorites');
      if (saved) {
        setFavorites(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Erro ao carregar favoritos:', error);
    }
  };

  const loadRecentSales = async () => {
    try {
      const response = await fetch('/api/vendas?limit=10&period=week');
      if (response.ok) {
        const data = await response.json();
        setRecentSales(data);
      }
    } catch (error) {
      console.error('Erro ao carregar vendas recentes:', error);
    }
  };

  const loadSavedCart = () => {
    try {
      const saved = localStorage.getItem('vendas_cart');
      if (saved) {
        setCart(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Erro ao carregar carrinho salvo:', error);
    }
  };

  // Filter products based on search and category
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.size.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !categoryFilter || product.size === categoryFilter;
    const matchesFavorites = !showFavorites || favorites.includes(product.id);
    
    return matchesSearch && matchesCategory && matchesFavorites;
  });

  // Get unique categories
  const categories = [...new Set(products.map(p => p.size))].sort();

  // Cart operations
  const addToCart = (product: Product, qty: number = 1) => {
    const stockLevel = getStockLevel(product.id, 'ponto_venda');
    const currentQty = cart.find(item => item.product.id === product.id)?.qty || 0;
    
    if (stockLevel < currentQty + qty) {
      toast.error(`Estoque insuficiente! Disponível: ${stockLevel} unidades`);
      return;
    }

    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, qty: item.qty + qty }
            : item
        );
      }
      return [...prev, { product, qty }];
    });

    toast.success(`${product.name} adicionado ao carrinho`);
  };

  const updateCartItemQty = (productId: string, qty: number) => {
    if (qty <= 0) {
      removeFromCart(productId);
      return;
    }

    const product = products.find(p => p.id === productId);
    if (product) {
      const stockLevel = getStockLevel(productId, 'ponto_venda');
      if (qty > stockLevel) {
        toast.error(`Estoque insuficiente! Disponível: ${stockLevel} unidades`);
        return;
      }
    }

    setCart(prev => prev.map(item =>
      item.product.id === productId ? { ...item, qty } : item
    ));
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
    toast.success('Item removido do carrinho');
  };

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem('vendas_cart');
    toast.success('Carrinho limpo');
  };

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + (item.product.price * item.qty), 0);
  const total = subtotal;

  // Toggle favorite
  const toggleFavorite = (productId: string) => {
    const newFavorites = favorites.includes(productId)
      ? favorites.filter(id => id !== productId)
      : [...favorites, productId];
    
    setFavorites(newFavorites);
    localStorage.setItem('vendas_favorites', JSON.stringify(newFavorites));
  };

  // Process sale
  const processSale = async (saleData: any) => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/vendas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saleData)
      });

      if (response.ok) {
        const sale = await response.json();
        toast.success(`Venda #${sale.id} realizada com sucesso!`);
        
        // Clear cart and reset form
        clearCart();
        setActiveView('products');
        
        // Reload recent sales
        loadRecentSales();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao processar venda');
      }
    } catch (error) {
      toast.error('Erro ao processar venda');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <Card className="p-6 bg-black border-yellow-500 border-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-yellow-500 p-3 rounded-lg">
                <ShoppingCart className="h-8 w-8 text-black" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-yellow-500">Sistema de Vendas</h1>
                <p className="text-yellow-300">Gerencie vendas e controle de estoque</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant={activeView === 'products' ? 'default' : 'outline'}
                onClick={() => setActiveView('products')}
                className={`flex items-center gap-2 ${
                  activeView === 'products' 
                    ? 'bg-yellow-500 text-black hover:bg-yellow-600 border-yellow-500' 
                    : 'bg-black text-yellow-500 border-yellow-500 hover:bg-yellow-500 hover:text-black'
                }`}
              >
                <Package className="h-4 w-4" />
                Produtos
              </Button>
              <Button
                variant={activeView === 'cart' ? 'default' : 'outline'}
                onClick={() => setActiveView('cart')}
                className={`flex items-center gap-2 ${
                  activeView === 'cart' 
                    ? 'bg-yellow-500 text-black hover:bg-yellow-600 border-yellow-500' 
                    : 'bg-black text-yellow-500 border-yellow-500 hover:bg-yellow-500 hover:text-black'
                }`}
              >
                <ShoppingCart className="h-4 w-4" />
                Carrinho ({cart.length})
              </Button>
              <Button
                variant={activeView === 'payment' ? 'default' : 'outline'}
                onClick={() => setActiveView('payment')}
                disabled={cart.length === 0}
                className={`flex items-center gap-2 ${
                  activeView === 'payment' 
                    ? 'bg-yellow-500 text-black hover:bg-yellow-600 border-yellow-500' 
                    : 'bg-black text-yellow-500 border-yellow-500 hover:bg-yellow-500 hover:text-black disabled:opacity-50'
                }`}
              >
                <CreditCard className="h-4 w-4" />
                Pagamento
              </Button>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Products View */}
            {activeView === 'products' && (
              <>
                {/* Search and Filters */}
                <Card className="p-4 bg-black border-yellow-500">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-yellow-500" />
                      <Input
                        placeholder="Buscar produtos..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 bg-black border-yellow-500 text-yellow-100 placeholder-yellow-700 focus:border-yellow-400"
                      />
                    </div>
                    
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="px-3 py-2 border border-yellow-500 rounded-md bg-black text-yellow-100"
                    >
                      <option value="" className="bg-black text-yellow-100">Todas as categorias</option>
                      {categories.map(category => (
                        <option key={category} value={category} className="bg-black text-yellow-100">{category}</option>
                      ))}
                    </select>
                    
                    <Button
                      variant={showFavorites ? 'default' : 'outline'}
                      onClick={() => setShowFavorites(!showFavorites)}
                      className={`flex items-center gap-2 ${
                        showFavorites 
                          ? 'bg-yellow-500 text-black hover:bg-yellow-600' 
                          : 'bg-black text-yellow-500 border-yellow-500 hover:bg-yellow-500 hover:text-black'
                      }`}
                    >
                      <Star className="h-4 w-4" />
                      Favoritos
                    </Button>
                    
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'outline'}
                      onClick={() => setViewMode('grid')}
                      size="sm"
                      className={viewMode === 'grid' 
                        ? 'bg-yellow-500 text-black hover:bg-yellow-600' 
                        : 'bg-black text-yellow-500 border-yellow-500 hover:bg-yellow-500 hover:text-black'
                      }
                    >
                      <Grid3X3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'outline'}
                      onClick={() => setViewMode('list')}
                      size="sm"
                      className={viewMode === 'list' 
                        ? 'bg-yellow-500 text-black hover:bg-yellow-600' 
                        : 'bg-black text-yellow-500 border-yellow-500 hover:bg-yellow-500 hover:text-black'
                      }
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>

                {/* Products Grid */}
                <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
                  {filteredProducts.map(product => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onAddToCart={addToCart}
                      isFavorite={favorites.includes(product.id)}
                      onToggleFavorite={toggleFavorite}
                    />
                  ))}
                </div>
              </>
            )}

            {/* Cart View */}
            {activeView === 'cart' && (
              <CartSummary
                cart={cart}
                onUpdateQuantity={updateCartItemQty}
                onRemoveItem={removeFromCart}
                onClearCart={clearCart}
                onProceedToPayment={() => setActiveView('payment')}
              />
            )}

            {/* Payment View */}
            {activeView === 'payment' && (
              <PaymentForm
                cart={cart}
                onProcessSale={processSale}
                isLoading={isLoading}
              />
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <QuickStats 
              cart={cart} 
              recentSales={recentSales}
              onViewChange={(view) => {
                // Handle view changes for additional features
                console.log('View change requested:', view);
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}