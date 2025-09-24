"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { usePointsOfSale, useCreatePointOfSale, useUpdatePointOfSale, useDeletePointOfSale, type PointOfSale } from "@/lib/usePointsOfSale"
import { SidebarLayout } from "@/components/SidebarLayout"
import { Plus, Edit, Trash2 } from "lucide-react"

export default function PointsOfSalePage() {
  const { data: points = [], isLoading, error } = usePointsOfSale()
  const createMutation = useCreatePointOfSale()
  const updateMutation = useUpdatePointOfSale()
  const deleteMutation = useDeletePointOfSale()

  const [newName, setNewName] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [editActive, setEditActive] = useState(true)

  const handleCreate = () => {
    if (newName.trim()) {
      createMutation.mutate({ name: newName.trim() })
      setNewName("")
    }
  }

  const handleEdit = (point: PointOfSale) => {
    setEditingId(point.id)
    setEditName(point.name)
    setEditActive(point.isActive)
  }

  const handleSaveEdit = () => {
    if (editingId) {
      updateMutation.mutate({ id: editingId, name: editName.trim(), isActive: editActive })
      setEditingId(null)
    }
  }

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja excluir este ponto de venda?")) {
      deleteMutation.mutate(id)
    }
  }

  if (isLoading) return <div className="flex justify-center items-center h-64">Carregando...</div>
  if (error) return <div className="text-red-500">Erro: {error.message}</div>

  return (
    <SidebarLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Pontos de Venda</h1>
          <p className="text-muted-foreground">Gerencie os pontos de venda do seu negócio</p>
        </div>

        {/* Criar Novo Ponto */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Adicionar Ponto de Venda
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="newName">Nome do Ponto</Label>
                <Input
                  id="newName"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ex: Bar Central"
                />
              </div>
              <div className="flex items-end">
                <Button onClick={handleCreate} disabled={!newName.trim() || createMutation.isPending}>
                  {createMutation.isPending ? "Adicionando..." : "Adicionar"}
                </Button>
              </div>
            </div>
            {createMutation.error && (
              <div className="text-red-500 mt-2">Erro ao criar: {createMutation.error.message}</div>
            )}
          </CardContent>
        </Card>

        {/* Lista de Pontos */}
        <Card>
          <CardHeader>
            <CardTitle>Pontos de Venda Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            {updateMutation.error && (
              <div className="text-red-500 mb-4">Erro ao atualizar: {updateMutation.error.message}</div>
            )}
            {deleteMutation.error && (
              <div className="text-red-500 mb-4">Erro ao excluir: {deleteMutation.error.message}</div>
            )}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead className="w-32">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {points.map((point: PointOfSale) => (
                  <TableRow key={point.id}>
                    <TableCell>
                      {editingId === point.id ? (
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                        />
                      ) : (
                        point.name
                      )}
                    </TableCell>
                    <TableCell>
                      {editingId === point.id ? (
                        <Select value={editActive ? "active" : "inactive"} onValueChange={(value) => setEditActive(value === "active")}>
                          <SelectTrigger className="w-32">
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
                    <TableCell>
                      {new Date(point.createdAt).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {editingId === point.id ? (
                          <>
                            <Button size="sm" onClick={handleSaveEdit} disabled={updateMutation.isPending}>
                              {updateMutation.isPending ? "Salvando..." : "Salvar"}
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                              Cancelar
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button size="sm" variant="outline" onClick={() => handleEdit(point)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleDelete(point.id)} disabled={deleteMutation.isPending}>
                              {deleteMutation.isPending ? "Excluindo..." : <Trash2 className="w-4 h-4" />}
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </SidebarLayout>
  )
}