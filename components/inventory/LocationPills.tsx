"use client"

import { Badge } from "@/components/ui/badge"
import { Snowflake, Home, Store } from "lucide-react"
import { cn } from "@/lib/utils"

interface LocationPillsProps {
  coldRoom: number
  house: number
  salePoint: number
  coldRoomAlert?: boolean
  houseAlert?: boolean
  salePointAlert?: boolean
  className?: string
}

export function LocationPills({
  coldRoom,
  house,
  salePoint,
  coldRoomAlert,
  houseAlert,
  salePointAlert,
  className,
}: LocationPillsProps) {
  return (
    <div className={cn("flex flex-wrap gap-1", className)}>
      <Badge
        variant="outline"
        className={cn(
          "gap-1",
          coldRoomAlert && "border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-300"
        )}
      >
        <Snowflake className="size-3" />
        {coldRoom}
      </Badge>
      <Badge
        variant="outline"
        className={cn(
          "gap-1",
          houseAlert && "border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-300"
        )}
      >
        <Home className="size-3" />
        {house}
      </Badge>
      <Badge
        variant="outline"
        className={cn(
          "gap-1",
          salePointAlert && "border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-300"
        )}
      >
        <Store className="size-3" />
        {salePoint}
      </Badge>
    </div>
  )
}
