"use client"

import React, { useEffect, useMemo, useState } from "react";
import productsData, { Product } from "../../lib/products";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

type CartItem = { product: Product; qty: number };

const formatBRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function SalesPanel() {
  const [products] = useState<Product[]>(productsData);
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [quickQty, setQuickQty] = useState<number>(1);
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("sales_cart");
    if (saved) setCart(JSON.parse(saved));
    const fav = localStorage.getItem("favorites");
    if (fav) setFavorites(JSON.parse(fav));
  }, []);

  useEffect(() => {
    localStorage.setItem("sales_cart", JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem("favorites", JSON.stringify(favorites));
  }, [favorites]);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (query && !(`${p.name} ${p.size}`).toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [products, query]);

  // no global keyboard shortcuts - intentionally removed for usability

  

  function add(product: Product, qty = 1) {
    setCart((c) => {
      const found = c.find((x) => x.product.id === product.id);
      if (found) return c.map((x) => (x.product.id === product.id ? { ...x, qty: x.qty + qty } : x));
      return [...c, { product, qty }];
    });
  }

  function quickAdd(product: Product) {
    add(product, quickQty);
  }

  function setQty(productId: string, qty: number) {
    if (qty <= 0) return setCart((c) => c.filter((x) => x.product.id !== productId));
    setCart((c) => c.map((x) => (x.product.id === productId ? { ...x, qty } : x)));
  }

  function remove(productId: string) {
    setCart((c) => c.filter((x) => x.product.id !== productId));
  }

  function clearCart() {
    setCart([]);
  }

  function saveSale() {
    if (cart.length === 0) return;
    const vendas = JSON.parse(localStorage.getItem("vendas") || "[]");
    const total = cart.reduce((s, c) => s + c.product.price * c.qty, 0);
    vendas.push({ id: Date.now(), date: new Date().toISOString(), items: cart, total });
    localStorage.setItem("vendas", JSON.stringify(vendas));
    clearCart();
  }

  function toggleFavorite(id: string) {
    setFavorites((cur) => {
      if (cur.includes(id)) return cur.filter((x) => x !== id);
      return [id, ...cur];
    });
  }

  const total = cart.reduce((s, c) => s + c.product.price * c.qty, 0);

  // split favorites and others
  const favProducts = filtered.filter((p) => favorites.includes(p.id));
  const otherProducts = filtered.filter((p) => !favorites.includes(p.id));

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Products area (span 2 on desktop) */}
        <div className="md:col-span-2">
          <div className="flex items-center gap-2 mb-3">
            <div className="hidden sm:block text-xs text-muted-foreground">Atalhos: 1-9 fav/pos | +/- qty | S salvar | C limpar | F favoritar</div>
            
            <Input placeholder="Buscar produto" value={query} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)} />
            <div className="flex items-center gap-2">
              <Button onClick={() => setQuickQty(Math.max(1, quickQty - 1))}>-</Button>
              <Input value={String(quickQty)} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuickQty(Math.max(1, Number(e.target.value || 1)))} className="w-20 text-center" />
              <Button onClick={() => setQuickQty(quickQty + 1)}>+</Button>
            </div>
            <div className="ml-auto text-sm">Total: <strong>{formatBRL(total)}</strong></div>
          </div>

          {favProducts.length > 0 && (
            <div className="mb-2">
              <div className="text-sm font-medium mb-1">Favoritos</div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {favProducts.map((p) => (
                  <button key={p.id} onClick={() => quickAdd(p)} className="p-4 bg-card border rounded text-left shadow-sm hover:scale-[1.01] transition">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-semibold">{p.name}</div>
                        <div className="text-xs text-muted-foreground">{p.size}</div>
                      </div>
                      <div className="text-sm font-semibold">{formatBRL(p.price)}</div>
                    </div>
                    <div className="mt-2 text-right">
                      <button onClick={(e) => { e.stopPropagation(); toggleFavorite(p.id); }} className="text-yellow-500">★</button>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <div className="text-sm font-medium mb-1">Produtos</div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {otherProducts.map((p) => (
                <button key={p.id} onClick={() => quickAdd(p)} className="p-4 bg-card border rounded text-left shadow-sm hover:scale-[1.01] transition">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold">{p.name}</div>
                      <div className="text-xs text-muted-foreground">{p.size}</div>
                    </div>
                    <div className="text-sm font-semibold">{formatBRL(p.price)}</div>
                  </div>
                  <div className="mt-2 text-right">
                    <button onClick={(e) => { e.stopPropagation(); toggleFavorite(p.id); }} className="text-gray-400">☆</button>
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
                  <div key={c.product.id} className="flex items-center justify-between p-2 border rounded">
                    <div className="min-w-0">
                      <div className="font-medium truncate">{c.product.name}</div>
                      <div className="text-xs text-muted-foreground">{c.product.size}</div>
                      <div className="text-xs">{formatBRL(c.product.price)} x {c.qty} = <strong>{formatBRL(c.product.price * c.qty)}</strong></div>
                    </div>
                    <div className="flex flex-col items-end gap-1 ml-2">
                      <div className="flex gap-1">
                        <Button size="sm" onClick={() => setQty(c.product.id, c.qty - 1)}>-</Button>
                        <div className="px-2 py-1 border rounded">{c.qty}</div>
                        <Button size="sm" onClick={() => setQty(c.product.id, c.qty + 1)}>+</Button>
                      </div>
                      <div>
                        <Button variant="ghost" onClick={() => remove(c.product.id)} className="text-xs">Rem</Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <Separator />

              <div className="flex gap-2 mt-2">
                <Button variant="outline" onClick={clearCart} className="flex-1">Limpar</Button>
                <Button onClick={saveSale} className="flex-1">Salvar Venda</Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
