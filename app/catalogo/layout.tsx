import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Catálogo Nitrobeer - Produtos e Soluções',
  description: 'Navegue pelo catálogo completo de produtos e soluções Nitrobeer',
  keywords: ['catálogo', 'produtos', 'nitrobeer', 'soluções'],
  openGraph: {
    title: 'Catálogo Nitrobeer',
    description: 'Navegue pelo catálogo completo de produtos e soluções Nitrobeer',
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
