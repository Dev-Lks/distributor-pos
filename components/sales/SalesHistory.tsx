"use client"

import React, { useEffect, useState } from 'react'
import { Product } from '../../lib/products'

type CartItem = { product: Product; qty: number };

type SavedSale = {
  id: number;
  date: string;
  items: CartItem[];
  total: number;
}

export default function SalesHistory() {
  const [items, setItems] = useState<SavedSale[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    try {
      const vendas = JSON.parse(localStorage.getItem('vendas') || '[]');
      if (Array.isArray(vendas)) {
        setItems(vendas);
      }
    } catch (error) {
      console.error("Erro ao carregar histórico de vendas:", error);
      alert("Erro ao carregar histórico de vendas. Os dados podem estar corrompidos.");
    } finally {
      setLoading(false);
    }
  }, [])

  function exportCSV() {
    try {
      if (items.length === 0) {
        alert("Nenhuma venda para exportar.");
        return;
      }

      const rows = [
        ['id', 'date', 'items', 'total'],
        ...items.map((s) => [s.id, s.date, JSON.stringify(s.items), s.total]),
      ]
      const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `vendas_${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Erro ao exportar CSV:", error);
      alert("Erro ao exportar dados. Tente novamente.");
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold">Histórico de Vendas</h3>
        <div className="flex gap-2">
          <button onClick={exportCSV} disabled={loading || items.length === 0} className="btn disabled:opacity-50">
            {loading ? "Carregando..." : "Exportar CSV"}
          </button>
          <button onClick={() => {
            if (confirm("Tem certeza que deseja limpar todo o histórico de vendas? Esta ação não pode ser desfeita.")) {
              try {
                localStorage.removeItem('vendas');
                setItems([]);
                alert("Histórico limpo com sucesso!");
              } catch (error) {
                console.error("Erro ao limpar histórico:", error);
                alert("Erro ao limpar histórico. Tente novamente.");
              }
            }
          }} disabled={loading || items.length === 0} className="btn btn-ghost disabled:opacity-50">
            Limpar
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="text-sm text-muted-foreground">Carregando histórico...</div>
        </div>
      ) : items.length === 0 ? (
        <div className="text-sm text-muted-foreground">Nenhuma venda registrada.</div>
      ) : (
        <div className="space-y-2 mt-3">
          {items.map((s) => (
            <div key={s.id} className="p-2 border rounded">
              <div className="text-sm font-medium">{new Date(s.date).toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">Total: R$ {s.total.toFixed(2)}</div>
              <details>
                <summary className="text-xs">Itens ({s.items.length})</summary>
                <ul className="text-xs list-disc pl-4">
                  {s.items.map((it: CartItem, idx: number) => (
                    <li key={`${it.product.id}-${idx}`}>{it.product.name} x {it.qty} — R$ {Number(it.product.price).toFixed(2)}</li>
                  ))}
                </ul>
              </details>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
