import { Loader2, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"

interface PullToRefreshIndicatorProps {
  isPulling: boolean
  isRefreshing: boolean
  progress: number
  pullDistance: number
}

export function PullToRefreshIndicator({
  isPulling,
  isRefreshing,
  progress,
  pullDistance,
}: PullToRefreshIndicatorProps) {
  const isVisible = isPulling || isRefreshing

  if (!isVisible) return null

  return (
    <div
      className={cn(
        "fixed top-0 left-0 right-0 z-[60] flex items-center justify-center",
        "transition-all duration-200 ease-out pointer-events-none",
        "bg-gradient-to-b from-background via-background/90 to-transparent"
      )}
      style={{
        height: isRefreshing ? '80px' : `${Math.max(pullDistance, 0)}px`,
      }}
    >
      <div 
        className={cn(
          "flex flex-col items-center gap-2 transition-opacity duration-200",
          isVisible ? "opacity-100" : "opacity-0"
        )}
      >
        {isRefreshing ? (
          <>
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="text-xs font-medium text-muted-foreground">
              Atualizando...
            </span>
          </>
        ) : (
          <>
            <div
              className={cn(
                "relative flex h-8 w-8 items-center justify-center rounded-full",
                "border-2 transition-all duration-200",
                progress >= 1 
                  ? "border-primary bg-primary/10 scale-110" 
                  : "border-primary/30 bg-background"
              )}
            >
              <RefreshCw
                className={cn(
                  "h-4 w-4 text-primary transition-all duration-200",
                  progress >= 1 && "animate-spin"
                )}
                style={{
                  transform: `rotate(${progress * 180}deg)`,
                }}
              />
            </div>
            <span 
              className={cn(
                "text-xs font-medium transition-colors duration-200",
                progress >= 1 ? "text-primary" : "text-muted-foreground"
              )}
            >
              {progress >= 1 ? '✓ Solte para atualizar' : 'Puxe para atualizar'}
            </span>
          </>
        )}
      </div>
    </div>
  )
}
