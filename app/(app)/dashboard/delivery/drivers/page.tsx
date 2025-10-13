"use client"

import { useState } from "react"
import { ArrowLeft, Plus, Edit, Trash2, User, Truck as TruckIcon } from "lucide-react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  useDeliveryDrivers,
  useCreateDeliveryDriver,
  useUpdateDeliveryDriver,
  useDeleteDeliveryDriver,
} from "@/lib/useDeliveryDrivers"
import type { CreateDeliveryDriverInput, VehicleType } from "@/types/delivery"
import { toast } from "sonner"
import { Loader } from "@/components/Loader"

const vehicleTypeLabels: Record<VehicleType, string> = {
  MOTORCYCLE: "Moto",
  CAR: "Carro",
  BICYCLE: "Bicicleta",
  FOOT: "A pé",
}

export default function DeliveryDriversPage() {
  const router = useRouter()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingDriver, setEditingDriver] = useState<any>(null)
  const [formData, setFormData] = useState<CreateDeliveryDriverInput>({
    name: "",
    phone: "",
    email: "",
    document: "",
    vehicleType: "MOTORCYCLE",
    vehiclePlate: "",
    vehicleModel: "",
    vehicleColor: "",
    notes: "",
    photo: "",
  })

  const { data: drivers = [], isLoading } = useDeliveryDrivers()
  const createDriver = useCreateDeliveryDriver()
  const updateDriver = useUpdateDeliveryDriver()
  const deleteDriver = useDeleteDeliveryDriver()

  const handleOpenDialog = (driver?: any) => {
    if (driver) {
      setEditingDriver(driver)
      setFormData({
        name: driver.name,
        phone: driver.phone,
        email: driver.email || "",
        document: driver.document || "",
        vehicleType: driver.vehicleType,
        vehiclePlate: driver.vehiclePlate || "",
        vehicleModel: driver.vehicleModel || "",
        vehicleColor: driver.vehicleColor || "",
        notes: driver.notes || "",
        photo: driver.photo || "",
      })
    } else {
      setEditingDriver(null)
      setFormData({
        name: "",
        phone: "",
        email: "",
        document: "",
        vehicleType: "MOTORCYCLE",
        vehiclePlate: "",
        vehicleModel: "",
        vehicleColor: "",
        notes: "",
        photo: "",
      })
    }
    setIsDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (editingDriver) {
        await updateDriver.mutateAsync({
          id: editingDriver.id,
          ...formData,
        })
        toast.success("Entregador atualizado com sucesso!")
      } else {
        await createDriver.mutateAsync(formData)
        toast.success("Entregador criado com sucesso!")
      }
      setIsDialogOpen(false)
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar entregador")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este entregador?")) return

    try {
      await deleteDriver.mutateAsync(id)
      toast.success("Entregador excluído com sucesso!")
    } catch (error: any) {
      toast.error(error.message || "Erro ao excluir entregador")
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
            <h1 className="text-2xl font-bold">Entregadores</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Gerencie a equipe de entregadores
            </p>
          </div>
        </div>

        <Button onClick={() => handleOpenDialog()}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Entregador
        </Button>
      </div>

      {/* Estatísticas Rápidas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{drivers.length}</div>
            <div className="text-xs text-muted-foreground">Total</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              {drivers.filter(d => d.isActive).length}
            </div>
            <div className="text-xs text-muted-foreground">Ativos</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">
              {drivers.filter(d => d.isAvailable).length}
            </div>
            <div className="text-xs text-muted-foreground">Disponíveis</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-600">
              ⭐ {(drivers.reduce((sum, d) => sum + (d.rating || 0), 0) / drivers.length || 0).toFixed(1)}
            </div>
            <div className="text-xs text-muted-foreground">Média</div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Entregadores */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {drivers.map((driver) => (
          <Card key={driver.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <CardTitle className="text-base">{driver.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{driver.phone}</p>
                  </div>
                </div>
                <div className="flex flex-col gap-1 items-end">
                  <Badge variant={driver.isActive ? "default" : "secondary"}>
                    {driver.isActive ? "Ativo" : "Inativo"}
                  </Badge>
                  {driver.isAvailable && driver.isActive && (
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      Disponível
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <TruckIcon className="h-4 w-4 text-muted-foreground" />
                <span>{vehicleTypeLabels[driver.vehicleType as VehicleType]}</span>
                {driver.vehiclePlate && (
                  <Badge variant="outline" className="ml-auto">
                    {driver.vehiclePlate}
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground text-xs">Entregas:</span>
                  <p className="font-semibold">{driver.totalDeliveries}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Sucesso:</span>
                  <p className="font-semibold text-green-600">{driver.successfulDeliveries}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Avaliação:</span>
                  <p className="font-semibold">
                    {driver.rating ? `⭐ ${driver.rating.toFixed(1)}` : "-"}
                  </p>
                </div>
              </div>

              {driver.vehicleModel && (
                <div className="text-xs text-muted-foreground">
                  {driver.vehicleModel}
                  {driver.vehicleColor && ` - ${driver.vehicleColor}`}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleOpenDialog(driver)}
                >
                  <Edit className="h-3 w-3 mr-1" />
                  Editar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive"
                  onClick={() => handleDelete(driver.id)}
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
              {editingDriver ? "Editar Entregador" : "Novo Entregador"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="name">Nome Completo *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="João da Silva"
                  required
                />
              </div>

              <div>
                <Label htmlFor="phone">Telefone *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(11) 99999-9999"
                  required
                />
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email || ""}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="joao@email.com"
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="document">CPF</Label>
                <Input
                  id="document"
                  value={formData.document || ""}
                  onChange={(e) => setFormData({ ...formData, document: e.target.value })}
                  placeholder="000.000.000-00"
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="vehicleType">Tipo de Veículo *</Label>
                <Select
                  value={formData.vehicleType}
                  onValueChange={(value) => setFormData({ ...formData, vehicleType: value as VehicleType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(vehicleTypeLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="vehiclePlate">Placa</Label>
                <Input
                  id="vehiclePlate"
                  value={formData.vehiclePlate || ""}
                  onChange={(e) => setFormData({ ...formData, vehiclePlate: e.target.value })}
                  placeholder="ABC-1234"
                />
              </div>

              <div>
                <Label htmlFor="vehicleModel">Modelo</Label>
                <Input
                  id="vehicleModel"
                  value={formData.vehicleModel || ""}
                  onChange={(e) => setFormData({ ...formData, vehicleModel: e.target.value })}
                  placeholder="Honda CG 160"
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="vehicleColor">Cor</Label>
                <Input
                  id="vehicleColor"
                  value={formData.vehicleColor || ""}
                  onChange={(e) => setFormData({ ...formData, vehicleColor: e.target.value })}
                  placeholder="Vermelha"
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  value={formData.notes || ""}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Observações sobre o entregador"
                  rows={3}
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
                disabled={createDriver.isPending || updateDriver.isPending}
              >
                {editingDriver ? "Atualizar" : "Criar"} Entregador
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
