"use client"

import React, { useEffect, useState } from 'react'

type SavedSale = {
  id: number;
  date: string;
  items: any[];
  total: number;
}

export default function SalesHistory() {
  const [items, setItems] = useState<SavedSale[]>([])

  useEffect(() => {
    const vendas = JSON.parse(localStorage.getItem('vendas') || '[]')
    setItems(vendas)
  }, [])

  function exportCSV() {
    const rows = [
      ['id', 'date', 'items', 'total'],
      ...items.map((s) => [s.id, s.date, JSON.stringify(s.items), s.total]),
    ]
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `vendas_${new Date().toISOString()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold">Histórico de Vendas</h3>
        <div className="flex gap-2">
          <button onClick={exportCSV} className="btn">Exportar CSV</button>
          <button onClick={() => { localStorage.removeItem('vendas'); setItems([]) }} className="btn btn-ghost">Limpar</button>
        </div>
      </div>

      {items.length === 0 && <div className="text-sm text-muted-foreground">Nenhuma venda registrada.</div>}

      <div className="space-y-2 mt-3">
        {items.map((s) => (
          <div key={s.id} className="p-2 border rounded">
            <div className="text-sm font-medium">{new Date(s.date).toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">Total: R$ {s.total.toFixed(2)}</div>
            <details>
              <summary className="text-xs">Itens ({s.items.length})</summary>
              <ul className="text-xs list-disc pl-4">
                {s.items.map((it: any, idx: number) => (
                  <li key={`${it.product.id}-${idx}`}>{it.product.name} x {it.qty} — R$ {Number(it.product.price).toFixed(2)}</li>
                ))}
              </ul>
            </details>
          </div>
        ))}
      </div>
    </div>
  )
}
