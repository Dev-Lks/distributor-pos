"use client"

import { useState } from "react"
import { Plus, Edit, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PointAddressForm } from "@/components/points/PointAddressForm"
import {
  usePointsOfSale,
  useCreatePointOfSale,
  useUpdatePointOfSale,
  useDeletePointOfSale,
  type PointOfSale
} from "@/hooks/usePointsOfSale"

export default function PointsOfSalePage() {
  const { data: points = [], isLoading, error } = usePointsOfSale()
  const createMutation = useCreatePointOfSale()
  const updateMutation = useUpdatePointOfSale()
  const deleteMutation = useDeletePointOfSale()

  const [newName, setNewName] = useState("")
  const [newAddress, setNewAddress] = useState("")
  const [newCity, setNewCity] = useState("")
  const [newState, setNewState] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [editAddress, setEditAddress] = useState("")
  const [editCity, setEditCity] = useState("")
  const [editState, setEditState] = useState("")
  const [editActive, setEditActive] = useState(true)

  const handleCreate = () => {
    if (newName.trim()) {
      createMutation.mutate({ 
        name: newName.trim(),
        address: newAddress || undefined,
        city: newCity || undefined,
        state: newState || undefined,
      })
      setNewName("")
      setNewAddress("")
      setNewCity("")
      setNewState("")
    }
  }

  const handleEdit = (point: PointOfSale) => {
    setEditingId(point.id)
    setEditName(point.name)
    setEditAddress(point.address || "")
    setEditCity(point.city || "")
    setEditState(point.state || "")
    setEditActive(point.isActive)
  }

  const handleSaveEdit = () => {
    if (editingId) {
      updateMutation.mutate({ 
        id: editingId, 
        name: editName.trim(), 
        isActive: editActive,
        address: editAddress || undefined,
        city: editCity || undefined,
        state: editState || undefined,
      })
      setEditingId(null)
    }
  }

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja excluir este ponto de venda?")) {
      deleteMutation.mutate(id)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        Carregando pontos de venda...
      </div>
    )
  }

  if (error) {
    return <div className="text-sm text-red-500">Erro: {error.message}</div>
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold">Pontos de venda</h1>
        <p className="text-xs sm:text-sm md:text-base text-muted-foreground">
          Gerencie as unidades ativas e mantenha o mapa de operação sempre atualizado.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
            Adicionar ponto de venda
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="newName">Nome do ponto</Label>
              <Input
                id="newName"
                value={newName}
                onChange={(event) => setNewName(event.target.value)}
                placeholder="Ex: Bar Central"
              />
            </div>

            <PointAddressForm
              address={newAddress}
              city={newCity}
              state={newState}
              onAddressChange={(field, value) => {
                if (field === 'address') setNewAddress(value)
                else if (field === 'city') setNewCity(value)
                else if (field === 'state') setNewState(value)
              }}
            />

            <div className="flex justify-end">
              <Button onClick={handleCreate} disabled={!newName.trim() || createMutation.isPending}>
                {createMutation.isPending ? "Adicionando..." : "Adicionar"}
              </Button>
            </div>
          </div>

          {createMutation.error && (
            <p className="mt-2 text-sm text-red-500">Erro ao criar: {createMutation.error.message}</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pontos de venda ativos</CardTitle>
        </CardHeader>
        <CardContent>
          {updateMutation.error && (
            <p className="mb-4 text-sm text-red-500">Erro ao atualizar: {updateMutation.error.message}</p>
          )}
          {deleteMutation.error && (
            <p className="mb-4 text-sm text-red-500">Erro ao excluir: {deleteMutation.error.message}</p>
          )}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs md:text-sm">Nome</TableHead>
                  <TableHead className="text-xs md:text-sm">Status</TableHead>
                  <TableHead className="text-xs md:text-sm">Criado em</TableHead>
                  <TableHead className="w-24 text-xs md:w-32 md:text-sm">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {points.map((point: PointOfSale) => (
                  <TableRow key={point.id}>
                    <TableCell className="text-xs md:text-sm">
                      {editingId === point.id ? (
                        <Input
                          value={editName}
                          onChange={(event) => setEditName(event.target.value)}
                          className="h-8 text-xs md:text-sm"
                        />
                      ) : (
                        point.name
                      )}
                    </TableCell>
                    <TableCell className="text-xs md:text-sm">
                      {editingId === point.id ? (
                        <Select
                          value={editActive ? "active" : "inactive"}
                          onValueChange={(value) => setEditActive(value === "active")}
                        >
                          <SelectTrigger className="h-8 w-24 md:w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Ativo</SelectItem>
                            <SelectItem value="inactive">Inativo</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <span className={point.isActive ? "text-green-600" : "text-red-600"}>
                          {point.isActive ? "Ativo" : "Inativo"}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs md:text-sm">
                      {new Date(point.createdAt).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 md:gap-2">
                        {editingId === point.id ? (
                          <>
                            <Button
                              size="sm"
                              onClick={handleSaveEdit}
                              disabled={updateMutation.isPending}
                              className="h-7 text-xs md:h-8"
                            >
                              {updateMutation.isPending ? "Salvando..." : "Salvar"}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingId(null)}
                              className="h-7 text-xs md:h-8"
                            >
                              Cancelar
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(point)}
                              className="h-7 p-1 text-xs md:h-8 md:p-2"
                            >
                              <Edit className="h-3 w-3 md:h-4 md:w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDelete(point.id)}
                              disabled={deleteMutation.isPending}
                              className="h-7 p-1 text-xs md:h-8 md:p-2"
                            >
                              {deleteMutation.isPending ? "Excluindo..." : <Trash2 className="h-3 w-3 md:h-4 md:w-4" />}
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
