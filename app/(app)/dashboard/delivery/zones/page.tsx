"use client"

import { useState } from "react"
import { ArrowLeft, Plus, Edit, Trash2, MapPinned } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  useDeliveryZones,
  useCreateDeliveryZone,
  useUpdateDeliveryZone,
  useDeleteDeliveryZone,
} from "@/lib/useDeliveryZones"
import type { CreateDeliveryZoneInput } from "@/types/delivery"
import { toast } from "sonner"
import { Loader } from "@/components/Loader"

export default function DeliveryZonesPage() {
  const router = useRouter()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingZone, setEditingZone] = useState<any>(null)
  const [formData, setFormData] = useState<CreateDeliveryZoneInput>({
    name: "",
    description: "",
    baseDeliveryFee: 0,
    minOrderValue: 0,
    freeDeliveryAbove: undefined,
    estimatedTime: 30,
    maxDistance: undefined,
    postalCodes: [],
    neighborhoods: [],
    centerLat: undefined,
    centerLng: undefined,
    radius: undefined,
    motorcycleFee: undefined,
    carFee: undefined,
    bicycleFee: undefined,
  })

  const { data: zones = [], isLoading } = useDeliveryZones()
  const createZone = useCreateDeliveryZone()
  const updateZone = useUpdateDeliveryZone()
  const deleteZone = useDeleteDeliveryZone()

  const handleOpenDialog = (zone?: any) => {
    if (zone) {
      setEditingZone(zone)
      setFormData({
        name: zone.name,
        description: zone.description || "",
        baseDeliveryFee: zone.baseDeliveryFee,
        minOrderValue: zone.minOrderValue || 0,
        freeDeliveryAbove: zone.freeDeliveryAbove,
        estimatedTime: zone.estimatedTime || 30,
        maxDistance: zone.maxDistance,
        postalCodes: zone.postalCodes || [],
        neighborhoods: zone.neighborhoods || [],
        centerLat: zone.centerLat,
        centerLng: zone.centerLng,
        radius: zone.radius,
        motorcycleFee: zone.motorcycleFee,
        carFee: zone.carFee,
        bicycleFee: zone.bicycleFee,
      })
    } else {
      setEditingZone(null)
      setFormData({
        name: "",
        description: "",
        baseDeliveryFee: 0,
        minOrderValue: 0,
        freeDeliveryAbove: undefined,
        estimatedTime: 30,
        maxDistance: undefined,
        postalCodes: [],
        neighborhoods: [],
        centerLat: undefined,
        centerLng: undefined,
        radius: undefined,
        motorcycleFee: undefined,
        carFee: undefined,
        bicycleFee: undefined,
      })
    }
    setIsDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (editingZone) {
        await updateZone.mutateAsync({
          id: editingZone.id,
          ...formData,
        })
        toast.success("Zona atualizada com sucesso!")
      } else {
        await createZone.mutateAsync(formData)
        toast.success("Zona criada com sucesso!")
      }
      setIsDialogOpen(false)
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar zona")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta zona?")) return

    try {
      await deleteZone.mutateAsync(id)
      toast.success("Zona excluída com sucesso!")
    } catch (error: any) {
      toast.error(error.message || "Erro ao excluir zona")
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Zonas de Entrega</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Configure as zonas e taxas de entrega
            </p>
          </div>
        </div>

        <Button onClick={() => handleOpenDialog()}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Zona
        </Button>
      </div>

      {/* Lista de Zonas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {zones.map((zone) => (
          <Card key={zone.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2">
                    <MapPinned className="h-4 w-4" />
                    {zone.name}
                  </CardTitle>
                  {zone.description && (
                    <p className="text-sm text-muted-foreground">
                      {zone.description}
                    </p>
                  )}
                </div>
                <Badge variant={zone.isActive ? "default" : "secondary"}>
                  {zone.isActive ? "Ativa" : "Inativa"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Taxa Base:</span>
                  <p className="font-semibold">R$ {zone.baseDeliveryFee.toFixed(2)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Pedido Mín:</span>
                  <p className="font-semibold">R$ {zone.minOrderValue.toFixed(2)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Tempo Est:</span>
                  <p className="font-semibold">{zone.estimatedTime} min</p>
                </div>
                {zone.freeDeliveryAbove && (
                  <div>
                    <span className="text-muted-foreground">Grátis acima:</span>
                    <p className="font-semibold">R$ {zone.freeDeliveryAbove.toFixed(2)}</p>
                  </div>
                )}
              </div>

              {zone.neighborhoods.length > 0 && (
                <div>
                  <span className="text-xs text-muted-foreground">Bairros:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {zone.neighborhoods.slice(0, 3).map((neighborhood) => (
                      <Badge key={neighborhood} variant="outline" className="text-xs">
                        {neighborhood}
                      </Badge>
                    ))}
                    {zone.neighborhoods.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{zone.neighborhoods.length - 3}
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleOpenDialog(zone)}
                >
                  <Edit className="h-3 w-3 mr-1" />
                  Editar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive"
                  onClick={() => handleDelete(zone.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dialog de Criar/Editar */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingZone ? "Editar Zona" : "Nova Zona"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="name">Nome da Zona *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Centro, Zona Sul"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description || ""}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descrição opcional da zona"
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="baseDeliveryFee">Taxa Base de Entrega (R$) *</Label>
                <Input
                  id="baseDeliveryFee"
                  type="number"
                  step="0.01"
                  value={formData.baseDeliveryFee}
                  onChange={(e) => setFormData({ ...formData, baseDeliveryFee: parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="minOrderValue">Valor Mínimo do Pedido (R$)</Label>
                <Input
                  id="minOrderValue"
                  type="number"
                  step="0.01"
                  value={formData.minOrderValue}
                  onChange={(e) => setFormData({ ...formData, minOrderValue: parseFloat(e.target.value) || 0 })}
                />
              </div>

              <div>
                <Label htmlFor="freeDeliveryAbove">Frete Grátis Acima de (R$)</Label>
                <Input
                  id="freeDeliveryAbove"
                  type="number"
                  step="0.01"
                  value={formData.freeDeliveryAbove || ""}
                  onChange={(e) => setFormData({ ...formData, freeDeliveryAbove: e.target.value ? parseFloat(e.target.value) : undefined })}
                  placeholder="Deixe vazio se não houver"
                />
              </div>

              <div>
                <Label htmlFor="estimatedTime">Tempo Estimado (minutos)</Label>
                <Input
                  id="estimatedTime"
                  type="number"
                  value={formData.estimatedTime}
                  onChange={(e) => setFormData({ ...formData, estimatedTime: parseInt(e.target.value) || 30 })}
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="neighborhoods">Bairros Atendidos (separados por vírgula)</Label>
                <Input
                  id="neighborhoods"
                  value={formData.neighborhoods?.join(", ") || ""}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    neighborhoods: e.target.value.split(",").map(s => s.trim()).filter(Boolean)
                  })}
                  placeholder="Centro, Vila Mariana, Pinheiros"
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="postalCodes">CEPs Atendidos (separados por vírgula)</Label>
                <Input
                  id="postalCodes"
                  value={formData.postalCodes?.join(", ") || ""}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    postalCodes: e.target.value.split(",").map(s => s.trim()).filter(Boolean)
                  })}
                  placeholder="01310-000, 01311-000"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={createZone.isPending || updateZone.isPending}
              >
                {editingZone ? "Atualizar" : "Criar"} Zona
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
