export type Product = {
  id: string;
  name: string;
  size: string;
  price: number; // in BRL
};

export const products: Product[] = [
  // 1.5L bottles
  { id: 'american-1.5', name: 'American lager', size: '1,5L', price: 20.0 },
  { id: 'doppel-1.5', name: 'Doppel Bock', size: '1,5L', price: 25.0 },
  { id: 'ipa-1.5', name: 'Ipa', size: '1,5L', price: 23.0 },
  { id: 'pilsen-premium-1.5', name: 'Pilsen Premium', size: '1,5L', price: 18.0 },
  { id: 'vinho-1.5', name: 'Vinho', size: '1,5L', price: 22.0 },
  { id: 'weiss-1.5', name: 'Weiss', size: '1,5L', price: 23.0 },
  // 600ml bottles
  { id: 'american-600', name: 'American lager', size: '600ml', price: 14.0 },
  { id: 'doppel-600', name: 'Doppel Bock', size: '600ml', price: 15.0 },
  { id: 'ipa-600', name: 'Ipa', size: '600ml', price: 15.0 },
  { id: 'pilsen-premium-600', name: 'Pilsen Premium', size: '600ml', price: 11.0 },
  { id: 'vinho-600', name: 'Vinho', size: '600ml', price: 15.0 },
  { id: 'weiss-600', name: 'Weiss', size: '600ml', price: 15.0 },
  // Barris de Chopp
  { id: 'american-chopp-30', name: 'American lager', size: 'Barril 30L', price: 525.0 },
  { id: 'american-chopp-50', name: 'American lager', size: 'Barril 50L', price: 875.0 },
  { id: 'pilsen-lager-chopp-30', name: 'Pilsen Lager', size: 'Barril 30L', price: 378.0 },
  { id: 'pilsen-lager-chopp-50', name: 'Pilsen Lager', size: 'Barril 50L', price: 630.0 },
  { id: 'pilsen-premium-chopp-30', name: 'Pilsen Premium', size: 'Barril 30L', price: 378.0 },
  { id: 'pilsen-premium-chopp-50', name: 'Pilsen Premium', size: 'Barril 50L', price: 630.0 },
  { id: 'pilsen-trad-chopp-30', name: 'Pilsen Tradicional', size: 'Barril 30L', price: 345.0 },
  { id: 'pilsen-trad-chopp-50', name: 'Pilsen Tradicional', size: 'Barril 50L', price: 575.0 },
];

export default products;
