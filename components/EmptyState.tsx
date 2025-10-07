import { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 px-4 text-center",
        className
      )}
    >
      {/* Icon com animação */}
      <div className="mb-4 rounded-full bg-muted p-6 animate-fade-in">
        <Icon className="h-12 w-12 text-muted-foreground opacity-50" />
      </div>
      
      {/* Title */}
      <h3 className="text-lg font-semibold mb-2 animate-fade-in animation-delay-100">
        {title}
      </h3>
      
      {/* Description */}
      {description && (
        <p className="text-sm text-muted-foreground max-w-sm mb-6 animate-fade-in animation-delay-200">
          {description}
        </p>
      )}
      
      {/* Action button */}
      {action && (
        <Button
          onClick={action.onClick}
          className="animate-fade-in animation-delay-300"
        >
          {action.label}
        </Button>
      )}
    </div>
  )
}
