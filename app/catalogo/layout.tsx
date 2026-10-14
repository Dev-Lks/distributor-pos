import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Catálogo - Produtos e Soluções',
  description: 'Navegue pelo catálogo completo de produtos e soluções Distribuidora',
  keywords: ['catálogo', 'produtos', 'distribuidora', 'soluções'],
  openGraph: {
    title: 'Catálogo',
    description: 'Navegue pelo catálogo completo de produtos e soluções Distribuidora',
    type: 'website',
  },
};

export default function CatalogoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
