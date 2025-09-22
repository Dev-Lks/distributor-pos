import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Product } from "../../lib/products";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useInventory } from '@/lib/useInventory';
import { toast } from 'sonner';

type CartItem = { product: Product; qty: number };

const formatBRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function SalesPanel() {
  const [products, setProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [quickQty, setQuickQty] = useState<number>(1);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [addingProduct, setAddingProduct] = useState<string | null>(null);
  const [savingSale, setSavingSale] = useState(false);

  // Hook de inventário
  const { getStockLevel } = useInventory();

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const response = await fetch('/api/products');
        if (response.ok) {
          const productsData = await response.json();
          setProducts(productsData);
        }
      } catch (error) {
        console.error('Error loading products:', error);
      }
    };

    loadProducts();
    try {
      const saved = localStorage.getItem("sales_cart");
      if (saved) {
        const parsedCart = JSON.parse(saved);
        if (Array.isArray(parsedCart)) {
          setCart(parsedCart);
        }
      }
    } catch (error) {
      console.error("Erro ao carregar carrinho do localStorage:", error);
      // Limpa dados corrompidos
      localStorage.removeItem("sales_cart");
    }

    try {
      const fav = localStorage.getItem("favorites");
      if (fav) {
        const parsedFav = JSON.parse(fav);
        if (Array.isArray(parsedFav)) {
          setFavorites(parsedFav);
        }
      }
    } catch (error) {
      console.error("Erro ao carregar favoritos do localStorage:", error);
      localStorage.removeItem("favorites");
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("sales_cart", JSON.stringify(cart));
    } catch (error) {
      console.error("Erro ao salvar carrinho no localStorage:", error);
      // Poderia mostrar uma notificação para o usuário aqui
    }
  }, [cart]);

  useEffect(() => {
    try {
      localStorage.setItem("favorites", JSON.stringify(favorites));
    } catch (error) {
      console.error("Erro ao salvar favoritos no localStorage:", error);
    }
  }, [favorites]);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (query && !(`${p.name} ${p.size}`).toLowerCase().includes(query.toLowerCase())) return false;
      if (categoryFilter && p.size !== categoryFilter) return false;
      return true;
    });
  }, [products, query, categoryFilter]);

  const categories = useMemo(() => {
    const uniqueSizes = [...new Set(products.map(p => p.size))];
    return uniqueSizes.sort();
  }, [products]);

  const add = useCallback((product: Product, qty = 1) => {
    setCart((c) => {
      const found = c.find((x) => x.product.id === product.id);
      if (found) return c.map((x) => (x.product.id === product.id ? { ...x, qty: x.qty + qty } : x));
      return [...c, { product, qty }];
    });
  }, []);

  const quickAdd = useCallback((product: Product) => {
    // Verificar estoque disponível no ponto de venda
    const availableStock = getStockLevel(product.id, 'ponto_venda');
    if (availableStock < quickQty) {
      toast.error(`Estoque insuficiente! Disponível: ${availableStock} unidades`);
      return;
    }

    setAddingProduct(product.id);
    add(product, quickQty);
    // Reset feedback after animation
    setTimeout(() => setAddingProduct(null), 200);
  }, [add, quickQty, getStockLevel]);

  const setQty = useCallback((productId: string, qty: number) => {
    if (qty <= 0) return setCart((c) => c.filter((x) => x.product.id !== productId));
    setCart((c) => c.map((x) => (x.product.id === productId ? { ...x, qty } : x)));
  }, []);

  const remove = useCallback((productId: string) => {
    setCart((c) => c.filter((x) => x.product.id !== productId));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const saveSale = useCallback(async () => {
    if (cart.length === 0) {
      alert("Carrinho vazio! Adicione produtos antes de salvar.");
      return;
    }

    if (savingSale) return; // Previne múltiplas chamadas

    setSavingSale(true);

    try {
      // Verificar estoque antes de salvar
      for (const item of cart) {
        const availableStock = getStockLevel(item.product.id, 'ponto_venda');
        if (availableStock < item.qty) {
          toast.error(`Estoque insuficiente para ${item.product.name}! Disponível: ${availableStock}`);
          setSavingSale(false);
          return;
        }
      }

      const total = cart.reduce((s, c) => s + c.product.price * c.qty, 0);

      if (total <= 0) {
        toast.error("Erro: Total da venda deve ser maior que zero.");
        setSavingSale(false);
        return;
      }

      // Save sale via API
      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: cart,
          total
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save sale');
      }

      clearCart();
      toast.success("Venda salva com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar venda:", error);
      toast.error("Erro ao salvar venda. Tente novamente.");
    } finally {
      setSavingSale(false);
    }
  }, [cart, savingSale, clearCart, getStockLevel]);

  const toggleFavorite = useCallback((id: string) => {
    setFavorites((cur) => {
      if (cur.includes(id)) return cur.filter((x) => x !== id);
      return [id, ...cur];
    });
  }, []);

  const total = cart.reduce((s, c) => s + c.product.price * c.qty, 0);

  // split favorites and others
  const favProducts = filtered.filter((p) => favorites.includes(p.id));
  const otherProducts = filtered.filter((p) => !favorites.includes(p.id));

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Só funciona se não estiver focado em um input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case 's':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            saveSale();
          }
          break;
        case 'c':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            clearCart();
          }
          break;
        case 'escape':
          // Limpa busca quando ESC é pressionado
          setQuery('');
          break;
        case '+':
        case '=':
          e.preventDefault();
          setQuickQty(prev => Math.min(99, prev + 1));
          break;
        case '-':
          e.preventDefault();
          setQuickQty(prev => Math.max(1, prev - 1));
          break;
      }

      // Atalhos numéricos para produtos favoritos (1-9)
      const num = parseInt(e.key);
      if (num >= 1 && num <= 9 && favProducts.length >= num) {
        e.preventDefault();
        quickAdd(favProducts[num - 1]);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [favProducts, saveSale, clearCart, quickAdd]);

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Products area (span 2 on desktop) */}
        <div className="md:col-span-2">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mb-3">
            <div className="hidden sm:block text-xs text-muted-foreground flex-shrink-0">Atalhos: 1-9 fav/pos | +/- qty | S salvar | C limpar | F favoritar</div>
            
            <div className="flex flex-col xs:flex-row gap-2 w-full sm:w-auto">
              <Input 
                placeholder="Buscar produto" 
                value={query} 
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)} 
                className="flex-1 sm:w-48"
              />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 border rounded text-sm bg-background"
              >
                <option value="">Todas as categorias</option>
                {categories.map((size) => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
              {(query || categoryFilter) && (
                <Button
                  onClick={() => { setQuery(''); setCategoryFilter(''); }}
                  variant="outline"
                  size="sm"
                >
                  Limpar
                </Button>
              )}
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <Button 
                  onClick={() => setQuickQty(Math.max(1, quickQty - 1))} 
                  size="sm"
                  className="px-4 h-10 text-lg"
                >
                  −
                </Button>
                <Input 
                  value={String(quickQty)} 
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuickQty(Math.max(1, Number(e.target.value || 1)))} 
                  className="w-20 text-center text-base h-10" 
                />
                <Button 
                  onClick={() => setQuickQty(quickQty + 1)} 
                  size="sm"
                  className="px-4 h-10 text-lg"
                >
                  +
                </Button>
              </div>
            </div>
            <div className="text-sm font-semibold self-center sm:ml-auto">Total: <strong>{formatBRL(total)}</strong></div>
          </div>

          {favProducts.length > 0 && (
            <div className="mb-2">
              <div className="text-sm font-medium mb-1">Favoritos</div>
              <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {favProducts.map((p) => (
                  <button 
                    key={p.id} 
                    onClick={() => quickAdd(p)} 
                    className={`p-3 sm:p-4 bg-card border rounded text-left shadow-sm hover:scale-[1.01] active:scale-95 transition-all duration-150 touch-manipulation ${
                      addingProduct === p.id ? 'bg-green-50 border-green-300' : ''
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-base truncate">{p.name}</div>
                        <div className="text-xs text-muted-foreground">{p.size}</div>
                      </div>
                      <div className="text-right ml-2 flex-shrink-0">
                        <div className="text-sm font-semibold">{formatBRL(p.price)}</div>
                        <div className="text-[10px] text-muted-foreground">Estoque: {getStockLevel(p.id, 'ponto_venda')}</div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="text-xs text-green-600 font-medium">
                        {addingProduct === p.id ? '✓ Adicionado!' : ''}
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); toggleFavorite(p.id); }} 
                        className="text-yellow-500 hover:text-yellow-600 transition-colors"
                      >
                        ★
                      </button>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <div className="text-sm font-medium mb-1">Produtos</div>
            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {otherProducts.map((p) => (
                <button 
                  key={p.id} 
                  onClick={() => quickAdd(p)} 
                  disabled={getStockLevel(p.id, 'ponto_venda') <= 0}
                  className={`p-3 sm:p-4 bg-card border rounded text-left shadow-sm hover:scale-[1.01] active:scale-95 transition-all duration-150 touch-manipulation ${
                    addingProduct === p.id ? 'bg-green-50 border-green-300' : ''
                  } ${getStockLevel(p.id, 'ponto_venda') <= 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-base truncate">{p.name}</div>
                      <div className="text-xs text-muted-foreground">{p.size}</div>
                    </div>
                    <div className="text-right ml-2 flex-shrink-0">
                      <div className="text-sm font-semibold">{formatBRL(p.price)}</div>
                      <div className="text-[10px] text-muted-foreground">Estoque: {getStockLevel(p.id, 'ponto_venda')}</div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="text-xs text-green-600 font-medium">
                      {addingProduct === p.id ? '✓ Adicionado!' : ''}
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); toggleFavorite(p.id); }} 
                      className="text-gray-400 hover:text-yellow-500 transition-colors"
                    >
                      ☆
                    </button>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Cart area */}
        <div className="md:col-span-1">
          <div className="md:sticky md:top-4">
            <Card className="p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="font-medium">Carrinho</div>
                <div className="text-sm font-semibold">{formatBRL(total)}</div>
              </div>

              <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                {cart.length === 0 && <div className="text-sm text-muted-foreground">Carrinho vazio</div>}
                {cart.map((c) => (
                  <div key={c.product.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-2 border rounded gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="font-medium truncate text-sm sm:text-base">{c.product.name}</div>
                      <div className="text-xs text-muted-foreground">{c.product.size}</div>
                      <div className="text-xs">{formatBRL(c.product.price)} x {c.qty} = <strong>{formatBRL(c.product.price * c.qty)}</strong></div>
                    </div>
                    <div className="flex flex-row sm:flex-col items-center sm:items-end gap-2 sm:gap-1 ml-0 sm:ml-2">
                      <div className="flex gap-2 items-center">
                        <Button size="sm" onClick={() => setQty(c.product.id, c.qty - 1)} className="px-3 h-10 text-lg">−</Button>
                        <div className="px-3 py-2 border rounded text-base min-w-[3rem] text-center select-none">{c.qty}</div>
                        <Button size="sm" onClick={() => setQty(c.product.id, c.qty + 1)} className="px-3 h-10 text-lg">+</Button>
                      </div>
                      <div>
                        <Button 
                          variant="ghost" 
                          onClick={() => remove(c.product.id)} 
                          className="text-xs h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          Remover
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <Separator />

              <div className="flex flex-col sm:flex-row gap-2 mt-2">
                <Button variant="outline" onClick={clearCart} className="flex-1">Limpar</Button>
                <Button onClick={saveSale} disabled={savingSale} className="flex-1">
                  {savingSale ? "Salvando..." : "Salvar Venda"}
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
