"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { MapPin, Printer, Scan, Circle, CheckCircle2, XCircle } from "lucide-react"
import type { PointOfSale } from "@/hooks/usePointsOfSale"

interface POSHeaderProps {
  points: any[]
  selectedPointId: string
  onPointChange: (id: string) => void
  session: any
  printerStatus: any
  isScanning: boolean
}

export function POSHeader({
  points,
  selectedPointId,
  onPointChange,
  session,
  printerStatus,
  isScanning,
}: POSHeaderProps) {
  const isSessionOpen = session?.status === "OPEN"

  return (
    <div className="border-b bg-card">
      <div className="flex items-center justify-between px-6 py-3">
        {/* Left: Branding + Point */}
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-xl font-bold">PDV Moderno</h1>
            <p className="text-xs text-muted-foreground">
              Sistema integrado com hardware
            </p>
          </div>

          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <Select value={selectedPointId} onValueChange={onPointChange}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Selecione ponto" />
              </SelectTrigger>
              <SelectContent>
                {points.map((point) => (
                  <SelectItem key={point.id} value={point.id}>
                    {point.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Right: Status Indicators */}
        <div className="flex items-center gap-3">
          {/* Caixa Status */}
          <div className="flex items-center gap-2">
            <Badge
              variant={isSessionOpen ? "default" : "secondary"}
              className="flex items-center gap-1"
            >
              {isSessionOpen ? (
                <>
                  <CheckCircle2 className="h-3 w-3" />
                  Caixa Aberto
                </>
              ) : (
                <>
                  <XCircle className="h-3 w-3" />
                  Caixa Fechado
                </>
              )}
            </Badge>
          </div>

          {/* Scanner Status */}
          {isScanning && (
            <Badge variant="outline" className="flex items-center gap-1">
              <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
              <Scan className="h-3 w-3" />
              Scanner Ativo
            </Badge>
          )}

          {/* Printer Status */}
          <Badge
            variant={printerStatus?.connected ? "default" : "secondary"}
            className="flex items-center gap-1"
          >
            <Printer className="h-3 w-3" />
            {printerStatus?.connected ? "Impressora OK" : "Sem Impressora"}
          </Badge>
        </div>
      </div>
    </div>
  )
}
