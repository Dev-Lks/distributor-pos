"use client"

import { useState } from 'react'
import { VirtualList } from '@/components/VirtualList'
import { InfiniteScrollList } from '@/components/InfiniteScrollList'
import { LazySection } from '@/components/LazySection'
import { useDebounce } from '@/hooks/useDebounce'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

/**
 * Componente de exemplo demonstrando todos os recursos de performance
 * Use como referência para implementar em suas páginas
 */

// Mock data
const generateMockItems = (count: number) => 
  Array.from({ length: count }, (_, i) => ({
    id: i,
    name: `Item ${i + 1}`,
    description: `Descrição do item ${i + 1}`,
    price: Math.random() * 100,
  }))

const mockItems = generateMockItems(1000)

export default function PerformanceExamplesPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearch = useDebounce(searchTerm, 300)
  
  const [infiniteItems, setInfiniteItems] = useState(generateMockItems(20))
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)

  const filteredItems = mockItems.filter(item =>
    item.name.toLowerCase().includes(debouncedSearch.toLowerCase())
  )

  const handleLoadMore = async () => {
    setIsLoadingMore(true)
    // Simula API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const currentLength = infiniteItems.length
    const newItems = generateMockItems(20).map((item, i) => ({
      ...item,
      id: currentLength + i,
      name: `Item ${currentLength + i + 1}`,
    }))
    
    setInfiniteItems([...infiniteItems, ...newItems])
    setIsLoadingMore(false)
    
    // Parar de carregar após 100 items
    if (infiniteItems.length + 20 >= 100) {
      setHasMore(false)
    }
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Exemplos de Performance</h1>
        <p className="text-muted-foreground">
          Demonstração dos componentes de otimização implementados no Sprint 3
        </p>
      </div>

      <Tabs defaultValue="virtual" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="virtual">Virtual Scroll</TabsTrigger>
          <TabsTrigger value="infinite">Infinite Scroll</TabsTrigger>
          <TabsTrigger value="lazy">Lazy Loading</TabsTrigger>
        </TabsList>

        {/* 1. Virtual Scrolling */}
        <TabsContent value="virtual" className="space-y-4">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">
              Virtual Scrolling (1000 items)
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Renderiza apenas os items visíveis. Scroll suave mesmo com 1000+ items.
            </p>

            {/* Debounced Search */}
            <div className="mb-4">
              <Input
                placeholder="Buscar items... (debounced 300ms)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {filteredItems.length} items encontrados
              </p>
            </div>

            {/* VirtualList */}
            <div className="h-[500px] border rounded-lg overflow-hidden">
              <VirtualList
                items={filteredItems}
                itemHeight={80}
                renderItem={(item) => (
                  <Card className="p-4 flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{item.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">
                        R$ {item.price.toFixed(2)}
                      </p>
                      <Button size="sm" variant="outline">
                        Adicionar
                      </Button>
                    </div>
                  </Card>
                )}
                overscanCount={5}
              />
            </div>

            <div className="mt-4 space-y-2 text-sm text-muted-foreground">
              <p>✅ Scroll a 60fps</p>
              <p>✅ Memória constante (~10-15 items renderizados)</p>
              <p>✅ Search debounced (não dispara a cada tecla)</p>
            </div>
          </Card>
        </TabsContent>

        {/* 2. Infinite Scroll */}
        <TabsContent value="infinite" className="space-y-4">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">
              Infinite Scroll
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Carrega mais items automaticamente ao scrollar até o fim.
            </p>

            <div className="h-[500px] border rounded-lg overflow-auto">
              <InfiniteScrollList
                items={infiniteItems}
                renderItem={(item) => (
                  <Card className="p-4 mx-4 my-2">
                    <h3 className="font-semibold">{item.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {item.description}
                    </p>
                    <p className="font-bold mt-2">
                      R$ {item.price.toFixed(2)}
                    </p>
                  </Card>
                )}
                onLoadMore={handleLoadMore}
                hasMore={hasMore}
                isLoading={isLoadingMore}
                emptyMessage="Nenhum item encontrado"
              />
            </div>

            <div className="mt-4 space-y-2 text-sm text-muted-foreground">
              <p>✅ Carregamento automático ao scrollar</p>
              <p>✅ Loading indicator integrado</p>
              <p>✅ {infiniteItems.length} items carregados</p>
              <p>✅ Perfeito para APIs paginadas</p>
            </div>
          </Card>
        </TabsContent>

        {/* 3. Lazy Loading */}
        <TabsContent value="lazy" className="space-y-4">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">
              Lazy Loading de Seções
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Componentes pesados carregam apenas quando ficam visíveis.
            </p>

            <div className="space-y-8">
              {/* Seção sempre visível */}
              <Card className="p-6 bg-primary/10">
                <h3 className="font-semibold mb-2">Seção 1 (Sempre Carregada)</h3>
                <p className="text-sm text-muted-foreground">
                  Esta seção está sempre carregada (above the fold).
                </p>
              </Card>

              {/* Seção lazy 1 */}
              <LazySection
                fallback={<Skeleton className="h-64" />}
                rootMargin="100px"
              >
                <Card className="p-6 bg-blue-50 dark:bg-blue-950">
                  <h3 className="font-semibold mb-2">Seção 2 (Lazy Loaded)</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Esta seção foi carregada quando ficou próxima do viewport.
                  </p>
                  <div className="grid grid-cols-3 gap-4">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                      <Card key={i} className="p-4 text-center">
                        <p className="text-2xl font-bold">{i}</p>
                      </Card>
                    ))}
                  </div>
                </Card>
              </LazySection>

              {/* Seção lazy 2 */}
              <LazySection
                fallback={<Skeleton className="h-64" />}
                rootMargin="100px"
              >
                <Card className="p-6 bg-green-50 dark:bg-green-950">
                  <h3 className="font-semibold mb-2">Seção 3 (Lazy Loaded)</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Outra seção pesada carregada sob demanda.
                  </p>
                  <div className="h-48 bg-gradient-to-r from-green-400 to-blue-500 rounded-lg" />
                </Card>
              </LazySection>

              {/* Seção lazy 3 */}
              <LazySection
                fallback={<Skeleton className="h-64" />}
                rootMargin="100px"
              >
                <Card className="p-6 bg-purple-50 dark:bg-purple-950">
                  <h3 className="font-semibold mb-2">Seção 4 (Lazy Loaded)</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Última seção - observe que só carregou quando você scrollou até aqui!
                  </p>
                  <div className="space-y-2">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="p-4 bg-background rounded">
                        Item {i}
                      </div>
                    ))}
                  </div>
                </Card>
              </LazySection>
            </div>

            <div className="mt-8 space-y-2 text-sm text-muted-foreground">
              <p>✅ Seções carregam apenas quando visíveis</p>
              <p>✅ Skeleton loader enquanto carrega</p>
              <p>✅ Initial bundle menor</p>
              <p>✅ Perfeito para dashboards com muitos charts</p>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dicas */}
      <Card className="p-6 bg-muted/50">
        <h2 className="text-lg font-semibold mb-3">💡 Dicas de Uso</h2>
        <div className="space-y-2 text-sm">
          <p>
            <strong>Virtual Scroll:</strong> Use para listas com 50+ items e altura fixa
          </p>
          <p>
            <strong>Infinite Scroll:</strong> Use com APIs paginadas e datasets grandes
          </p>
          <p>
            <strong>Lazy Loading:</strong> Use para conteúdo abaixo da dobra e componentes pesados
          </p>
          <p>
            <strong>Debounce:</strong> Use em search inputs e autocomplete (300ms típico)
          </p>
        </div>
      </Card>
    </div>
  )
}
