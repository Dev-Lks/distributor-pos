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
  // Chopp (L)
  { id: 'american-chopp', name: 'American lager', size: 'Chopp (L)', price: 17.5 },
  { id: 'pilsen-lager-chopp', name: 'Pilsen Lager', size: 'Chopp (L)', price: 12.6 },
  { id: 'pilsen-premium-chopp', name: 'Pilsen Premium', size: 'Chopp (L)', price: 12.6 },
  { id: 'pilsen-trad-chopp', name: 'Pilsen Tradicional', size: 'Chopp (L)', price: 11.5 },
];

export default products;
