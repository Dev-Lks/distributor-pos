"use client";

import { useState, useEffect, useCallback } from 'react';
import { StockLevel, StockMovement, InventoryAlert, Location } from './inventory';

export function useInventory() {
  const [stockLevels, setStockLevels] = useState<StockLevel[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [alerts, setAlerts] = useState<InventoryAlert[]>([]);
  const [loading, setLoading] = useState(true);

  // Carregar dados do localStorage
  useEffect(() => {
    try {
      const savedStock = localStorage.getItem('inventory_stock');
      const savedMovements = localStorage.getItem('inventory_movements');
      const savedAlerts = localStorage.getItem('inventory_alerts');

      if (savedStock) {
        const parsed = JSON.parse(savedStock);
        if (Array.isArray(parsed)) setStockLevels(parsed);
      }

      if (savedMovements) {
        const parsed = JSON.parse(savedMovements);
        if (Array.isArray(parsed)) setMovements(parsed);
      }

      if (savedAlerts) {
        const parsed = JSON.parse(savedAlerts);
        if (Array.isArray(parsed)) setAlerts(parsed);
      }
    } catch (error) {
      console.error('Erro ao carregar inventário:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Salvar dados no localStorage
  useEffect(() => {
    try {
      localStorage.setItem('inventory_stock', JSON.stringify(stockLevels));
    } catch (error) {
      console.error('Erro ao salvar estoque:', error);
    }
  }, [stockLevels]);

  useEffect(() => {
    try {
      localStorage.setItem('inventory_movements', JSON.stringify(movements));
    } catch (error) {
      console.error('Erro ao salvar movimentações:', error);
    }
  }, [movements]);

  useEffect(() => {
    try {
      localStorage.setItem('inventory_alerts', JSON.stringify(alerts));
    } catch (error) {
      console.error('Erro ao salvar alertas:', error);
    }
  }, [alerts]);

  // Função para obter nível de estoque de um produto em um local
  const getStockLevel = useCallback((productId: string, location: Location): number => {
    const stock = stockLevels.find(s => s.productId === productId && s.location === location);
    return stock?.quantity || 0;
  }, [stockLevels]);

  // Função para atualizar nível de estoque
  const updateStockLevel = useCallback((productId: string, location: Location, quantity: number, minStock = 0) => {
    setStockLevels(prev => {
      const existing = prev.find(s => s.productId === productId && s.location === location);
      if (existing) {
        return prev.map(s =>
          s.productId === productId && s.location === location
            ? { ...s, quantity, lastUpdated: new Date().toISOString() }
            : s
        );
      } else {
        return [...prev, {
          productId,
          location,
          quantity,
          minStock,
          lastUpdated: new Date().toISOString()
        }];
      }
    });
  }, []);

  // Função para registrar movimentação
  const recordMovement = useCallback((
    productId: string,
    fromLocation: Location | null,
    toLocation: Location | null,
    quantity: number,
    type: StockMovement['type'],
    notes?: string
  ) => {
    const movement: StockMovement = {
      id: Date.now().toString(),
      productId,
      fromLocation,
      toLocation,
      quantity,
      type,
      timestamp: new Date().toISOString(),
      notes,
      user: 'Sistema' // TODO: implementar usuário logado
    };

    setMovements(prev => [movement, ...prev]);

    // Atualizar níveis de estoque
    if (fromLocation) {
      const currentFromStock = getStockLevel(productId, fromLocation);
      updateStockLevel(productId, fromLocation, Math.max(0, currentFromStock - quantity));
    }

    if (toLocation) {
      const currentToStock = getStockLevel(productId, toLocation);
      updateStockLevel(productId, toLocation, currentToStock + quantity);
    }

    // Verificar alertas
    checkAlerts(productId, toLocation || fromLocation!);
  }, [getStockLevel, updateStockLevel]);

  // Função para verificar e criar alertas
  const checkAlerts = useCallback((productId: string, location: Location) => {
    const stock = stockLevels.find(s => s.productId === productId && s.location === location);
    if (!stock) return;

    const existingAlert = alerts.find(a =>
      a.productId === productId &&
      a.location === location &&
      !a.resolved
    );

    if (stock.quantity <= 0) {
      // Sem estoque
      if (!existingAlert || existingAlert.type !== 'out_of_stock') {
        const alert: InventoryAlert = {
          id: Date.now().toString(),
          productId,
          location,
          type: 'out_of_stock',
          message: `Produto sem estoque em ${location}`,
          timestamp: new Date().toISOString(),
          resolved: false
        };
        setAlerts(prev => [alert, ...prev.filter(a => !(a.productId === productId && a.location === location))]);
      }
    } else if (stock.quantity <= stock.minStock) {
      // Estoque baixo
      if (!existingAlert || existingAlert.type !== 'low_stock') {
        const alert: InventoryAlert = {
          id: Date.now().toString(),
          productId,
          location,
          type: 'low_stock',
          message: `Estoque baixo (${stock.quantity}) em ${location}`,
          timestamp: new Date().toISOString(),
          resolved: false
        };
        setAlerts(prev => [alert, ...prev.filter(a => !(a.productId === productId && a.location === location))]);
      }
    } else if (existingAlert) {
      // Resolver alerta se estoque normalizou
      setAlerts(prev => prev.map(a =>
        a.productId === productId && a.location === location
          ? { ...a, resolved: true }
          : a
      ));
    }
  }, [stockLevels, alerts]);

  // Função para transferência entre locais
  const transferStock = useCallback((
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

    recordMovement(productId, fromLocation, toLocation, quantity, 'transfer', notes);
  }, [getStockLevel, recordMovement, checkAlerts]);

  // Função para venda direta da câmara fria
  const directSale = useCallback((
    productId: string,
    quantity: number,
    notes?: string
  ) => {
    const availableStock = getStockLevel(productId, 'camara_fria');
    if (availableStock < quantity) {
      throw new Error(`Estoque insuficiente na câmara fria. Disponível: ${availableStock}`);
    }

    recordMovement(productId, 'camara_fria', null, quantity, 'sale', notes || 'Venda direta');
  }, [getStockLevel, recordMovement]);

  // Função para entrada de mercadoria
  const stockEntry = useCallback((
    productId: string,
    location: Location,
    quantity: number,
    notes?: string
  ) => {
    recordMovement(productId, null, location, quantity, 'entry', notes);
  }, [recordMovement]);

  // Função para ajuste manual de estoque
  const adjustStock = useCallback((
    productId: string,
    location: Location,
    newQuantity: number,
    notes?: string
  ) => {
    const currentStock = getStockLevel(productId, location);
    const difference = newQuantity - currentStock;

    if (difference > 0) {
      recordMovement(productId, null, location, difference, 'adjustment', notes || 'Ajuste positivo');
    } else if (difference < 0) {
      recordMovement(productId, location, null, Math.abs(difference), 'adjustment', notes || 'Ajuste negativo');
    }
  }, [getStockLevel, recordMovement]);

  return {
    stockLevels,
    movements,
    alerts,
    loading,
    getStockLevel,
    updateStockLevel,
    recordMovement,
    transferStock,
    directSale,
    stockEntry,
    adjustStock,
    checkAlerts
  };
}