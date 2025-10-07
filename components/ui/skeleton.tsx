import * as React from "react"

import { cn } from "@/lib/utils"

type SkeletonProps = React.HTMLAttributes<HTMLDivElement>

// Skeleton básico
export function Skeleton({ className, ...props }: SkeletonProps) {
  return <div className={cn("animate-pulse rounded-md bg-muted/70", className)} {...props} />
}

// Skeleton com shimmer effect
export function ShimmerSkeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md bg-muted",
        "before:absolute before:inset-0",
        "before:-translate-x-full before:animate-[shimmer_2s_infinite]",
        "before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent",
        className
      )}
      {...props}
    />
  )
}

// Skeleton de texto com linhas
export function TextSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            "h-4",
            i === lines - 1 && "w-3/4" // Última linha menor
          )}
        />
      ))}
    </div>
  )
}

// Skeleton de Card
export function CardSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <Skeleton className="h-24 w-full" />
      <div className="flex gap-2">
        <Skeleton className="h-8 flex-1" />
        <Skeleton className="h-8 w-24" />
      </div>
    </div>
  )
}

// Skeleton de Tabela
export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex gap-4 border-b pb-2">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={`header-${i}`} className="h-4 flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={`row-${rowIndex}`} className="flex gap-4">
          {Array.from({ length: cols }).map((_, colIndex) => (
            <Skeleton key={`cell-${rowIndex}-${colIndex}`} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  )
}

// Skeleton de Lista
export function ListSkeleton({ items = 5 }: { items?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-lg border">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </div>
          <Skeleton className="h-8 w-20" />
        </div>
      ))}
    </div>
  )
}

// Skeleton de Dashboard/Métricas
export function MetricsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-lg border bg-card p-6 space-y-2">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-3 w-3/4" />
        </div>
      ))}
    </div>
  )
}

// Skeleton de Formulário
export function FormSkeleton({ fields = 4 }: { fields?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" /> {/* Label */}
          <Skeleton className="h-10 w-full" /> {/* Input */}
        </div>
      ))}
      <div className="flex gap-2 justify-end">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
      </div>
    </div>
  )
}

// Skeleton de Produto/Item
export function ProductSkeleton() {
  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <Skeleton className="h-48 w-full" /> {/* Image */}
      <div className="p-4 space-y-3">
        <Skeleton className="h-5 w-3/4" /> {/* Title */}
        <Skeleton className="h-4 w-full" /> {/* Description line 1 */}
        <Skeleton className="h-4 w-2/3" /> {/* Description line 2 */}
        <div className="flex items-center justify-between pt-2">
          <Skeleton className="h-6 w-20" /> {/* Price */}
          <Skeleton className="h-9 w-24" /> {/* Button */}
        </div>
      </div>
    </div>
  )
}

// Grid de Produtos
export function ProductGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <ProductSkeleton key={i} />
      ))}
    </div>
  )
}
