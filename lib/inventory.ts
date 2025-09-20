// Tipos para controle de inventário
export type Location = 'camara_fria' | 'casa' | 'ponto_venda';

export type StockLevel = {
  productId: string;
  location: Location;
  quantity: number;
  minStock: number; // Estoque mínimo para alertas
  lastUpdated: string;
};

export type StockMovement = {
  id: string;
  productId: string;
  fromLocation: Location | null; // null para entrada externa
  toLocation: Location | null; // null para saída/venda
  quantity: number;
  type: 'transfer' | 'sale' | 'adjustment' | 'entry';
  timestamp: string;
  notes?: string;
  user?: string;
};

export type InventoryAlert = {
  id: string;
  productId: string;
  location: Location;
  type: 'low_stock' | 'out_of_stock' | 'over_stock';
  message: string;
  timestamp: string;
  resolved: boolean;
};

export const LOCATION_LABELS: Record<Location, string> = {
  camara_fria: 'Câmara Fria',
  casa: 'Casa',
  ponto_venda: 'Ponto de Venda'
};

export const LOCATION_COLORS: Record<Location, string> = {
  camara_fria: 'bg-blue-100 text-blue-800',
  casa: 'bg-green-100 text-green-800',
  ponto_venda: 'bg-orange-100 text-orange-800'
};