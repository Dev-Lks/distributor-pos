"use client";

import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertTriangle, Package, ArrowRight, Plus, Minus } from 'lucide-react';
import { useInventory } from '@/lib/useInventory';
import { products } from '@/lib/products';
import { Location, LOCATION_LABELS } from '@/lib/inventory';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';

export default function InventoryDashboard() {
  const {
    stockLevels,
    movements,
    alerts,
    loading,
    getStockLevel,
    transferStock,
    directSale,
    stockEntry,
    adjustStock
  } = useInventory();

  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [transferFrom, setTransferFrom] = useState<Location | ''>('');
  const [transferTo, setTransferTo] = useState<Location | ''>('');
  const [transferQuantity, setTransferQuantity] = useState<number>(1);
  const [entryLocation, setEntryLocation] = useState<Location | ''>('');
  const [entryQuantity, setEntryQuantity] = useState<number>(1);
  const [adjustmentLocation, setAdjustmentLocation] = useState<Location | ''>('');
  const [adjustmentQuantity, setAdjustmentQuantity] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'overview' | 'transfer' | 'entry' | 'adjustment'>('overview');

  const handleTransfer = () => {
    if (!selectedProduct || !transferFrom || !transferTo || transferQuantity <= 0) {
      alert('Preencha todos os campos corretamente');
      return;
    }

    try {
      transferStock(selectedProduct, transferFrom, transferTo, transferQuantity, 'Transferência via dashboard');
      alert('Transferência realizada com sucesso!');
      setTransferFrom('');
      setTransferTo('');
      setTransferQuantity(1);
      setActiveTab('overview');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Erro na transferência');
    }
  };

  const handleDirectSale = () => {
    if (!selectedProduct || transferQuantity <= 0) {
      alert('Selecione um produto e quantidade');
      return;
    }

    try {
      directSale(selectedProduct, transferQuantity, 'Venda direta da câmara fria');
      alert('Venda direta realizada com sucesso!');
      setTransferQuantity(1);
      setActiveTab('overview');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Erro na venda direta');
    }
  };

  const handleStockEntry = () => {
    if (!selectedProduct || !entryLocation || entryQuantity <= 0) {
      alert('Preencha todos os campos');
      return;
    }

    try {
      stockEntry(selectedProduct, entryLocation, entryQuantity, 'Entrada via dashboard');
      alert('Entrada de mercadoria registrada!');
      setEntryLocation('');
      setEntryQuantity(1);
      setActiveTab('overview');
    } catch {
      alert('Erro na entrada de mercadoria');
    }
  };

  const handleAdjustment = () => {
    if (!selectedProduct || !adjustmentLocation) {
      alert('Selecione produto e local');
      return;
    }

    try {
      adjustStock(selectedProduct, adjustmentLocation, adjustmentQuantity, 'Ajuste via dashboard');
      alert('Ajuste realizado com sucesso!');
      setAdjustmentQuantity(0);
      setActiveTab('overview');
    } catch {
      alert('Erro no ajuste de estoque');
    }
  };

  if (loading) {
    return <div className="text-center py-8">Carregando inventário...</div>;
  }

  const activeAlerts = alerts.filter(a => !a.resolved);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Controle de Estoque</h2>
          <p className="text-muted-foreground">Gerencie seu inventário em todos os locais</p>
        </div>
        <div className="flex gap-2">
          {activeAlerts.length > 0 && (
            <div className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              {activeAlerts.length} alerta{activeAlerts.length > 1 ? 's' : ''}
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        {[
          { id: 'overview' as const, label: 'Visão Geral' },
          { id: 'transfer' as const, label: 'Transferir' },
          { id: 'entry' as const, label: 'Entrada' },
          { id: 'adjustment' as const, label: 'Ajuste' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 border-b-2 font-medium text-sm ${
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Alertas */}
      {activeAlerts.length > 0 && activeTab === 'overview' && (
        <Card className="p-4 border-red-200 bg-red-50">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-800">Alertas de Estoque</h3>
              <div className="space-y-1 mt-2">
                {activeAlerts.map(alert => (
                  <div key={alert.id} className="text-sm text-red-700">
                    • {alert.message}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Visão Geral */}
      {activeTab === 'overview' && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Visão Geral do Estoque</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map(product => (
              <div key={product.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium">{product.name}</h4>
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded">{product.size}</span>
                </div>

                <div className="space-y-2">
                  {(Object.keys(LOCATION_LABELS) as Location[]).map(location => {
                    const stock = getStockLevel(product.id, location);
                    const stockLevel = stockLevels.find(s => s.productId === product.id && s.location === location);
                    const isLow = stockLevel && stock <= stockLevel.minStock;
                    const isOut = stock <= 0;

                    return (
                      <div key={location} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{LOCATION_LABELS[location]}:</span>
                        <span className={`px-2 py-1 rounded text-xs ${
                          isOut ? 'bg-red-100 text-red-800' :
                          isLow ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {stock}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Transferência */}
      {activeTab === 'transfer' && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Transferir Estoque</h3>
          <div className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium mb-2">Produto</label>
              <Select value={selectedProduct} onValueChange={(val) => setSelectedProduct(val)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione um produto" />
                </SelectTrigger>
                <SelectContent>
                  {products.map(product => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name} - {product.size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">De</label>
                <Select value={transferFrom} onValueChange={(val: string) => setTransferFrom(val as Location)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Origem" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(LOCATION_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Para</label>
                <Select value={transferTo} onValueChange={(val: string) => setTransferTo(val as Location)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Destino" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(LOCATION_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Quantidade</label>
              <Input
                type="number"
                value={transferQuantity}
                onChange={(e) => setTransferQuantity(Number(e.target.value))}
                min="1"
                className="w-full"
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleTransfer} className="flex-1">
                <ArrowRight className="w-4 h-4 mr-2" />
                Transferir
              </Button>
              <Button onClick={handleDirectSale} variant="outline" className="flex-1">
                <Package className="w-4 h-4 mr-2" />
                Venda Direta
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Entrada */}
      {activeTab === 'entry' && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Entrada de Mercadoria</h3>
          <div className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium mb-2">Produto</label>
              <Select value={selectedProduct} onValueChange={(val: string) => setSelectedProduct(val)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione um produto" />
                </SelectTrigger>
                <SelectContent>
                  {products.map(product => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name} - {product.size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Local</label>
              <Select value={entryLocation} onValueChange={(val: string) => setEntryLocation(val as Location)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione o local" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(LOCATION_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Quantidade</label>
              <Input
                type="number"
                value={entryQuantity}
                onChange={(e) => setEntryQuantity(Number(e.target.value))}
                min="1"
                className="w-full"
              />
            </div>

            <Button onClick={handleStockEntry} className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Registrar Entrada
            </Button>
          </div>
        </Card>
      )}

      {/* Ajuste */}
      {activeTab === 'adjustment' && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Ajuste de Estoque</h3>
          <div className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium mb-2">Produto</label>
              <Select value={selectedProduct} onValueChange={(val: string) => setSelectedProduct(val)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione um produto" />
                </SelectTrigger>
                <SelectContent>
                  {products.map(product => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name} - {product.size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Local</label>
              <Select value={adjustmentLocation} onValueChange={(val: string) => setAdjustmentLocation(val as Location)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione o local" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(LOCATION_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Novo Estoque</label>
              <Input
                type="number"
                value={adjustmentQuantity}
                onChange={(e) => setAdjustmentQuantity(Number(e.target.value))}
                min="0"
                className="w-full"
              />
            </div>

            <Button onClick={handleAdjustment} className="w-full">
              <Minus className="w-4 h-4 mr-2" />
              Ajustar Estoque
            </Button>
          </div>
        </Card>
      )}

      {/* Movimentações Recentes */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Movimentações Recentes</h3>
        <div className="space-y-3">
          {movements.slice(0, 10).map(movement => {
            const product = products.find(p => p.id === movement.productId);
            return (
              <div key={movement.id} className="flex items-center justify-between p-3 border rounded">
                <div>
                  <div className="font-medium">{product?.name} - {product?.size}</div>
                  <div className="text-sm text-muted-foreground">
                    {movement.fromLocation && `${LOCATION_LABELS[movement.fromLocation]} → `}
                    {movement.toLocation ? LOCATION_LABELS[movement.toLocation] : 'Saída'}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">Qtd: {movement.quantity}</div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(movement.timestamp).toLocaleString()}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}