"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Types
export interface Batch {
  id: string;
  productId: string;
  batchNumber: string;
  supplier?: string;
  productionDate?: string;
  expirationDate?: string;
  receivedDate: string;
  quantity: number;
  remainingQuantity: number;
  cost: number;
  location: string;
  notes?: string;
  qrCode?: string;
  status: 'ACTIVE' | 'DEPLETED' | 'EXPIRED' | 'RECALLED';
}

export interface InventoryAudit {
  id: string;
  startedAt: string;
  completedAt?: string;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  location?: string;
  performedBy: string[];
  totalItems: number;
  itemsWithDifference: number;
  accuracyRate?: number;
  totalValueDifference?: number;
  notes?: string;
}

export interface InventoryAuditItem {
  id: string;
  auditId: string;
  productId: string;
  batchId?: string;
  expectedQuantity: number;
  countedQuantity: number;
  difference: number;
  notes?: string;
  photoUrl?: string;
}

export interface ABCAnalysisItem {
  productId: string;
  name: string;
  size: string;
  totalRevenue: number;
  abcClass: 'A' | 'B' | 'C';
  revenueContribution: number;
  cumulativePercentage: number;
  rank: number;
}

export interface ABCAnalysis {
  analysis: ABCAnalysisItem[];
  summary: {
    totalProducts: number;
    totalRevenue: number;
    classA: {
      count: number;
      percentage: number;
      revenue: number;
      revenuePercentage: number;
    };
    classB: {
      count: number;
      percentage: number;
      revenue: number;
      revenuePercentage: number;
    };
    classC: {
      count: number;
      percentage: number;
      revenue: number;
      revenuePercentage: number;
    };
  };
  generatedAt: string;
}

export interface DemandForecast {
  productId: string;
  productName: string;
  size: string;
  averageDailyConsumption: number;
  currentStock: number;
  daysUntilStockout: number;
  suggestedReorderPoint: number;
  suggestedOrderQuantity: number;
  seasonalTrend?: 'up' | 'down' | 'stable';
  confidence: number;
  needsReorder: boolean;
  urgency: 'critical' | 'high' | 'medium' | 'low';
}

export interface DemandForecastResponse {
  forecasts: DemandForecast[];
  summary: {
    totalProducts: number;
    needsReorder: number;
    critical: number;
    high: number;
  };
  generatedAt: string;
  periodAnalyzed: {
    start: string;
    end: string;
  };
}

export interface ExpirationAlert {
  batchId: string;
  batchNumber: string;
  productId: string;
  productName: string;
  size: string;
  location: string;
  quantity: number;
  expiresAt: string;
  daysUntilExpiration: number;
  urgency: 'critical' | 'warning' | 'info';
  originalPrice: number;
  suggestedDiscount: number;
  suggestedPrice: number;
  estimatedLoss: number;
}

export interface ExpirationAlertsResponse {
  alerts: ExpirationAlert[];
  summary: {
    totalAlerts: number;
    critical: number;
    warning: number;
    info: number;
    totalQuantity: number;
    potentialLoss: number;
  };
  generatedAt: string;
  daysAhead: number;
}

export interface BulkOperation {
  productIds: string[];
  operation: 'adjust_price' | 'transfer' | 'activate' | 'deactivate' | 'delete' | 'add_tags';
  params: Record<string, any>;
}

// Hooks

// Batches
export function useBatches(productId?: string) {
  return useQuery({
    queryKey: ['batches', productId],
    queryFn: async () => {
      const url = productId 
        ? `/api/inventory/batches?productId=${productId}`
        : '/api/inventory/batches';
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch batches');
      return res.json() as Promise<Batch[]>;
    },
  });
}

export function useCreateBatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Batch>) => {
      const res = await fetch('/api/inventory/batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create batch');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batches'] });
    },
  });
}

// Audits
export function useAudits() {
  return useQuery({
    queryKey: ['audits'],
    queryFn: async () => {
      const res = await fetch('/api/inventory/audits');
      if (!res.ok) throw new Error('Failed to fetch audits');
      return res.json() as Promise<InventoryAudit[]>;
    },
  });
}

export function useCreateAudit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<InventoryAudit>) => {
      const res = await fetch('/api/inventory/audits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create audit');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audits'] });
    },
  });
}

export function useUpdateAudit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<InventoryAudit> & { id: string }) => {
      const res = await fetch(`/api/inventory/audits/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update audit');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audits'] });
    },
  });
}

// ABC Analysis
export function useABCAnalysis() {
  return useQuery({
    queryKey: ['abc-analysis'],
    queryFn: async () => {
      const res = await fetch('/api/inventory/analysis/abc');
      if (!res.ok) throw new Error('Failed to fetch ABC analysis');
      return res.json() as Promise<ABCAnalysis>;
    },
  });
}

// Demand Forecast
export function useDemandForecast() {
  return useQuery({
    queryKey: ['demand-forecast'],
    queryFn: async () => {
      const res = await fetch('/api/inventory/forecast');
      if (!res.ok) throw new Error('Failed to fetch demand forecast');
      return res.json() as Promise<DemandForecastResponse>;
    },
  });
}

// Expiration Alerts
export function useExpirationAlerts() {
  return useQuery({
    queryKey: ['expiration-alerts'],
    queryFn: async () => {
      const res = await fetch('/api/inventory/expiration-alerts');
      if (!res.ok) throw new Error('Failed to fetch expiration alerts');
      return res.json() as Promise<ExpirationAlertsResponse>;
    },
  });
}

// Bulk Operations
export function useBulkOperation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (operation: BulkOperation) => {
      const res = await fetch('/api/inventory/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(operation),
      });
      if (!res.ok) throw new Error('Failed to perform bulk operation');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
}

// Inventory History
export function useInventoryHistory(productId: string) {
  return useQuery({
    queryKey: ['inventory-history', productId],
    queryFn: async () => {
      const res = await fetch(`/api/inventory/history/${productId}`);
      if (!res.ok) throw new Error('Failed to fetch inventory history');
      const data = await res.json();
      return data.movements; // Retorna apenas os movements
    },
    enabled: !!productId,
  });
}
