"use client"

import { useState } from "react";
import SalesPanel from "../../components/sales/SalesPanel";
import SalesHistory from "../../components/sales/SalesHistory";
import { Card } from "@/components/ui/card";

export default function SalesPrivatePage() {
  const [pin, setPin] = useState("");
  const [authed, setAuthed] = useState(false);
  const [view, setView] = useState<'sales'|'history'>('sales');

  const PIN = process.env.NEXT_PUBLIC_SALES_PIN || "1234"; // change via env or code

  function submit(e: React.FormEvent) {
    e.preventDefault();

    if (!pin.trim()) {
      alert("Digite o PIN de acesso.");
      return;
    }

    if (pin === PIN) {
      setAuthed(true);
      setPin('');
    } else {
      alert("PIN incorreto. Tente novamente.");
      setPin('');
    }
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container max-w-6xl mx-auto px-4">
        <Card className="p-4 sm:p-6">
          {!authed ? (
            <div>
              <h2 className="text-lg font-semibold mb-4">Área Privada - Registrar Vendas</h2>
              <form onSubmit={submit} className="space-y-3">
                <label className="block text-sm">PIN de acesso</label>
                <input
                  type="password"
                  value={pin}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, ''); // Só números
                    if (value.length <= 6) { // Limita a 6 dígitos
                      setPin(value);
                    }
                  }}
                  className="w-full p-3 border rounded text-lg text-center font-mono tracking-wider"
                  placeholder="Digite o PIN"
                  maxLength={6}
                  autoFocus
                />
                <div className="flex gap-2">
                  <button type="submit" className="btn">
                    Entrar
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex gap-2">
                  <button onClick={() => setView('sales')} className={`px-3 py-1 rounded ${view === 'sales' ? 'bg-primary text-white' : ''}`}>Vendas</button>
                  <button onClick={() => setView('history')} className={`px-3 py-1 rounded ${view === 'history' ? 'bg-primary text-white' : ''}`}>Histórico</button>
                </div>
                <div>
                  <button onClick={() => {
                    if (confirm("Tem certeza que deseja fazer logout?")) {
                      setAuthed(false);
                      setPin('');
                      setView('sales');
                    }
                  }} className="btn btn-ghost">Logout</button>
                </div>
              </div>

              {view === 'sales' ? <SalesPanel /> : <SalesHistory />}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
