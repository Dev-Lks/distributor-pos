"use client";

import { useState, useEffect, useCallback } from 'react';
import { StockLevel, StockMovement, InventoryAlert, Location } from './inventory';

interface ApiStockLevel {
  id: string;
  productId: string;
  location: string;
  quantity: number;
  minStock: number;
  lastUpdated: string;
  product: {
    id: string;
    name: string;
    size: string;
    price: string;
  };
}

interface ApiStockMovement {
  id: string;
  productId: string;
  fromLocation: string | null;
  toLocation: string | null;
  quantity: number;
  type: string;
  timestamp: string;
  notes: string | null;
  user: string | null;
  product: {
    id: string;
    name: string;
    size: string;
    price: string;
  };
}

interface ApiInventoryAlert {
  id: string;
  productId: string;
  location: string;
  type: string;
  message: string;
  timestamp: string;
  resolved: boolean;
  product: {
    id: string;
    name: string;
    size: string;
    price: string;
  };
}

export function useInventory() {
  const [stockLevels, setStockLevels] = useState<StockLevel[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [alerts, setAlerts] = useState<InventoryAlert[]>([]);
  const [loading, setLoading] = useState(true);

  // Carregar dados da API
  const loadInventory = useCallback(async () => {
    try {
      const response = await fetch('/api/inventory');
      if (response.ok) {
        const data = await response.json();
        setStockLevels(data.stockLevels.map((sl: ApiStockLevel) => ({
          ...sl,
          lastUpdated: sl.lastUpdated
        })));
        setMovements(data.movements.map((m: ApiStockMovement) => ({
          ...m,
          timestamp: m.timestamp
        })));
        setAlerts(data.alerts.map((a: ApiInventoryAlert) => ({
          ...a,
          timestamp: a.timestamp
        })));
      }
    } catch (error) {
      console.error('Erro ao carregar inventário:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  // Função para obter nível de estoque de um produto em um local
  const getStockLevel = useCallback((productId: string, location: Location): number => {
    const stock = stockLevels.find(s => s.productId === productId && s.location === location);
    return stock?.quantity || 0;
  }, [stockLevels]);

  // Função para atualizar nível de estoque
  const updateStockLevel = useCallback(async (productId: string, location: Location, quantity: number, minStock = 0) => {
    try {
      const response = await fetch('/api/inventory/stock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId,
          location,
          quantity,
          minStock
        }),
      });

      if (response.ok) {
        // Reload inventory data
        await loadInventory();
      } else {
        console.error('Failed to update stock level');
      }
    } catch (error) {
      console.error('Error updating stock level:', error);
    }
  }, [loadInventory]);

  // Função para registrar movimentação
  const recordMovement = useCallback(async (
    productId: string,
    fromLocation: Location | null,
    toLocation: Location | null,
    quantity: number,
    type: StockMovement['type'],
    notes?: string
  ) => {
    try {
      const response = await fetch('/api/inventory/movements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId,
          fromLocation,
          toLocation,
          quantity,
          type,
          notes
        }),
      });

      if (response.ok) {
        // Reload inventory data
        await loadInventory();
      } else {
        console.error('Failed to record movement');
      }
    } catch (error) {
      console.error('Error recording movement:', error);
    }
  }, [loadInventory]);

  // Função para transferência entre locais
  const transferStock = useCallback(async (
    productId: string,
    fromLocation: Location,
    toLocation: Location,
    quantity: number,
    notes?: string
  ) => {
    const availableStock = getStockLevel(productId, fromLocation);
    if (availableStock < quantity) {
      throw new Error(`Estoque insuficiente. Disponível: ${availableStock}`);
    }

    await recordMovement(productId, fromLocation, toLocation, quantity, 'transfer', notes);
  }, [getStockLevel, recordMovement]);

  // Função para venda direta da câmara fria
  const directSale = useCallback(async (
    productId: string,
    quantity: number,
    notes?: string
  ) => {
    const availableStock = getStockLevel(productId, 'camara_fria');
    if (availableStock < quantity) {
      throw new Error(`Estoque insuficiente na câmara fria. Disponível: ${availableStock}`);
    }

    await recordMovement(productId, 'camara_fria', null, quantity, 'sale', notes || 'Venda direta');
  }, [getStockLevel, recordMovement]);

  // Função para entrada de mercadoria
  const stockEntry = useCallback(async (
    productId: string,
    location: Location,
    quantity: number,
    notes?: string
  ) => {
    await recordMovement(productId, null, location, quantity, 'entry', notes);
  }, [recordMovement]);

  // Função para ajuste manual de estoque
  const adjustStock = useCallback(async (
    productId: string,
    location: Location,
    newQuantity: number,
    notes?: string
  ) => {
    const currentStock = getStockLevel(productId, location);
    const difference = newQuantity - currentStock;

    if (difference > 0) {
      await recordMovement(productId, null, location, difference, 'adjustment', notes || 'Ajuste positivo');
    } else if (difference < 0) {
      await recordMovement(productId, location, null, Math.abs(difference), 'adjustment', notes || 'Ajuste negativo');
    }
  }, [getStockLevel, recordMovement]);

  return {
    stockLevels,
    movements,
    alerts,
    loading,
    loadInventory,
    getStockLevel,
    updateStockLevel,
    recordMovement,
    transferStock,
    directSale,
    stockEntry,
    adjustStock
  };
}