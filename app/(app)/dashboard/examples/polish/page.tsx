'use client'

import { useState } from 'react'
import { Package, ShoppingCart, Receipt, WifiOff, Plus, Trash2, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { RippleButton } from '@/components/ui/ripple-button'
import { EmptyState } from '@/components/EmptyState'
import { Loader } from '@/components/Loader'
import { CountUp } from '@/components/animations/CountUp'
import { SuccessCheck } from '@/components/animations/SuccessCheck'
import { ProductCardSkeleton } from '@/components/skeletons/ProductCardSkeleton'
import { OrderCardSkeleton } from '@/components/skeletons/OrderCardSkeleton'
import { StatCardSkeleton } from '@/components/skeletons/StatCardSkeleton'
import { TableSkeleton } from '@/components/skeletons/TableSkeleton'
import { ShimmerSkeleton, TextSkeleton, CardSkeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function PolishExamplesPage() {
  const [showSuccess, setShowSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSuccessDemo = () => {
    setShowSuccess(true)
    setTimeout(() => setShowSuccess(false), 2000)
  }

  const handleLoadingDemo = () => {
    setLoading(true)
    setTimeout(() => setLoading(false), 3000)
  }

  return (
    <div className="container max-w-6xl mx-auto p-4 md:p-6 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Sprint 4: Polish & UX Avançado</h1>
        <p className="text-muted-foreground">
          Demonstração de skeleton loaders, empty states, animações e micro-interactions
        </p>
      </div>

      {/* Skeleton Loaders */}
      <Card>
        <CardHeader>
          <CardTitle>1. Skeleton Loaders</CardTitle>
          <CardDescription>
            Estados de carregamento personalizados para cada tipo de conteúdo
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-sm font-semibold mb-3">Product Card Skeleton</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <ProductCardSkeleton />
              <ProductCardSkeleton />
              <ProductCardSkeleton />
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-3">Order Card Skeleton</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <OrderCardSkeleton />
              <OrderCardSkeleton />
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-3">Stat Card Skeleton</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-3">Shimmer Effect</h3>
            <ShimmerSkeleton className="h-32 w-full" />
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-3">Text Skeleton</h3>
            <TextSkeleton lines={5} />
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-3">Card Skeleton</h3>
            <CardSkeleton />
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-3">Table Skeleton</h3>
            <TableSkeleton rows={3} cols={4} />
          </div>
        </CardContent>
      </Card>

      {/* Empty States */}
      <Card>
        <CardHeader>
          <CardTitle>2. Empty States</CardTitle>
          <CardDescription>
            Estados vazios informativos com CTAs apropriados
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="border rounded-lg">
            <EmptyState
              icon={ShoppingCart}
              title="Carrinho vazio"
              description="Adicione produtos para começar uma venda"
            />
          </div>

          <div className="border rounded-lg">
            <EmptyState
              icon={Package}
              title="Nenhum produto encontrado"
              description="Tente ajustar os filtros ou adicione novos produtos"
              action={{
                label: "Adicionar Produto",
                onClick: () => alert('Adicionar produto!')
              }}
            />
          </div>

          <div className="border rounded-lg">
            <EmptyState
              icon={Receipt}
              title="Sem encomendas"
              description="Você ainda não recebeu nenhuma encomenda"
              action={{
                label: "Nova Encomenda",
                onClick: () => alert('Nova encomenda!')
              }}
            />
          </div>

          <div className="border rounded-lg">
            <EmptyState
              icon={WifiOff}
              title="Erro de conexão"
              description="Não foi possível carregar os dados. Verifique sua conexão."
              action={{
                label: "Tentar Novamente",
                onClick: () => alert('Tentando novamente...')
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Animações e Micro-interactions */}
      <Card>
        <CardHeader>
          <CardTitle>3. Animações e Micro-interactions</CardTitle>
          <CardDescription>
            Feedback visual e animações fluidas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-sm font-semibold mb-3">Success Check Animation</h3>
            <div className="flex gap-4 items-center">
              <Button onClick={handleSuccessDemo}>
                Mostrar Sucesso
              </Button>
              {showSuccess && (
                <div className="animate-fade-in">
                  <SuccessCheck />
                </div>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-3">CountUp Animation</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">
                    <CountUp end={15450} prefix="R$ " duration={2000} />
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">Vendas Totais</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">
                    <CountUp end={342} duration={1500} />
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">Produtos</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">
                    <CountUp end={98} suffix="%" duration={1800} />
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">Satisfação</p>
                </CardContent>
              </Card>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-3">Ripple Button</h3>
            <div className="flex gap-4 flex-wrap">
              <RippleButton variant="default">
                <Plus className="h-4 w-4" />
                Adicionar
              </RippleButton>
              <RippleButton variant="destructive">
                <Trash2 className="h-4 w-4" />
                Excluir
              </RippleButton>
              <RippleButton variant="outline">
                <Check className="h-4 w-4" />
                Confirmar
              </RippleButton>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-3">Loading States</h3>
            <div className="space-y-4">
              <div className="flex gap-4 items-center">
                <Button onClick={handleLoadingDemo} disabled={loading}>
                  {loading ? 'Carregando...' : 'Simular Loading'}
                </Button>
                {loading && <Loader size="md" />}
              </div>
              
              <div className="flex gap-4 items-center">
                <span className="text-sm text-muted-foreground">Tamanhos:</span>
                <Loader size="sm" />
                <Loader size="md" />
                <Loader size="lg" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Hover Effects */}
      <Card>
        <CardHeader>
          <CardTitle>4. Hover Effects</CardTitle>
          <CardDescription>
            Efeitos de hover e transições suaves
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="border rounded-lg p-6 hover-lift cursor-pointer"
              >
                <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Package className="h-10 w-10 text-primary" />
                </div>
                <h3 className="font-semibold">Card com Hover Lift</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Passe o mouse para ver o efeito
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Accessibility */}
      <Card>
        <CardHeader>
          <CardTitle>5. Acessibilidade</CardTitle>
          <CardDescription>
            Todas as animações respeitam prefers-reduced-motion
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p>✅ Animações desabilitadas com <code>prefers-reduced-motion</code></p>
            <p>✅ ARIA labels em elementos interativos</p>
            <p>✅ Keyboard navigation funcional</p>
            <p>✅ Contraste adequado (WCAG AA)</p>
            <p>✅ Touch targets ≥ 44px em mobile</p>
          </div>
        </CardContent>
      </Card>

      {/* Conclusão */}
      <Card className="border-primary">
        <CardHeader>
          <CardTitle>🎉 Sprint 4 Completa!</CardTitle>
          <CardDescription>
            Todos os componentes de polish e UX avançado foram implementados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p>✅ Skeleton loaders personalizados</p>
            <p>✅ Empty states informativos</p>
            <p>✅ Animações e micro-interactions</p>
            <p>✅ Loading states avançados</p>
            <p>✅ Hover effects suaves</p>
            <p>✅ Acessibilidade completa</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
