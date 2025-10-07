import { Skeleton, ShimmerSkeleton } from "@/components/ui/skeleton"

export function ProductCardSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-3 space-y-3">
      {/* Image */}
      <ShimmerSkeleton className="h-32 w-full rounded" />
      
      {/* Title and price */}
      <div className="space-y-2">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      
      {/* Stock bar */}
      <Skeleton className="h-2 w-full rounded-full" />
      
      {/* Button */}
      <Skeleton className="h-10 w-full rounded-md" />
    </div>
  )
}
