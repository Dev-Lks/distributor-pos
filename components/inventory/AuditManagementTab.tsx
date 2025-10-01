"use client";

import { useState } from "react";
import { useAudits, useCreateAudit, useUpdateAudit } from "@/lib/useInventoryAdvanced";
import { useProducts } from "@/lib/useProducts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
  ClipboardCheck,
  Plus,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  FileText,
  Search,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface AuditItem {
  productId: string;
  expectedQuantity: number;
  countedQuantity: number;
  notes?: string;
}

const auditSteps = [
  { id: 1, name: "Configurar", description: "Defina os parâmetros da auditoria" },
  { id: 2, name: "Selecionar", description: "Escolha os produtos a serem auditados" },
  { id: 3, name: "Contagem", description: "Registre as quantidades contadas" },
  { id: 4, name: "Revisar", description: "Revise as diferenças encontradas" },
  { id: 5, name: "Concluir", description: "Finalize e gere o relatório" },
];

const auditStatusConfig = {
  IN_PROGRESS: {
    label: "Em Progresso",
    color: "bg-blue-500/10 text-blue-700 border-blue-200",
  },
  COMPLETED: {
    label: "Concluída",
    color: "bg-emerald-500/10 text-emerald-700 border-emerald-200",
  },
  CANCELLED: {
    label: "Cancelada",
    color: "bg-gray-500/10 text-gray-700 border-gray-200",
  },
};

export function AuditManagementTab() {
  const [showWizard, setShowWizard] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [currentAuditId, setCurrentAuditId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Estados do wizard
  const [location, setLocation] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [auditItems, setAuditItems] = useState<Map<string, AuditItem>>(new Map());

  const { data: audits, isLoading: loadingAudits } = useAudits();
  const { data: products } = useProducts();
  const createAudit = useCreateAudit();
  const updateAudit = useUpdateAudit();

  const startNewAudit = () => {
    setShowWizard(true);
    setCurrentStep(1);
    setLocation("");
    setNotes("");
    setSelectedProducts(new Set());
    setAuditItems(new Map());
    setCurrentAuditId(null);
  };

  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleToggleProduct = (productId: string) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
      const newItems = new Map(auditItems);
      newItems.delete(productId);
      setAuditItems(newItems);
    } else {
      newSelected.add(productId);
    }
    setSelectedProducts(newSelected);
  };

  const handleUpdateCount = (productId: string, countedQuantity: number) => {
    const product = products?.find((p) => p.id === productId);
    if (!product) return;

    const expectedQuantity = (product.inventory?.totalQuantity || 0);
    const newItems = new Map(auditItems);
    newItems.set(productId, {
      productId,
      expectedQuantity,
      countedQuantity,
      notes: auditItems.get(productId)?.notes || "",
    });
    setAuditItems(newItems);
  };

  const handleCreateAudit = async () => {
    try {
      const response = await createAudit.mutateAsync({
        location: location || undefined,
        notes: notes || undefined,
      });

      setCurrentAuditId(response.id);
      toast.success("Auditoria criada com sucesso!");
      handleNext();
    } catch (error) {
      toast.error("Erro ao criar auditoria");
    }
  };

  const handleAddItems = async () => {
    if (!currentAuditId) {
      toast.error("Auditoria não encontrada");
      return;
    }

    try {
      const items = Array.from(auditItems.values());
      for (const item of items) {
        await fetch(`/api/inventory/audits/${currentAuditId}/items`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item),
        });
      }
      toast.success("Itens registrados com sucesso!");
      handleNext();
    } catch (error) {
      toast.error("Erro ao registrar itens");
    }
  };

  const handleCompleteAudit = async () => {
    if (!currentAuditId) {
      toast.error("Auditoria não encontrada");
      return;
    }

    try {
      await updateAudit.mutateAsync({
        id: currentAuditId,
        status: "COMPLETED",
      });
      toast.success("Auditoria concluída com sucesso!");
      setShowWizard(false);
      setCurrentStep(1);
    } catch (error) {
      toast.error("Erro ao concluir auditoria");
    }
  };

  const filteredProducts = products?.filter((product) => {
    if (searchQuery) {
      return product.name.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  const auditItemsArray = Array.from(auditItems.values());
  const totalDifference = auditItemsArray.reduce(
    (sum, item) => sum + Math.abs(item.countedQuantity - item.expectedQuantity),
    0
  );
  const itemsWithDifference = auditItemsArray.filter(
    (item) => item.countedQuantity !== item.expectedQuantity
  ).length;
  const accuracyRate = auditItemsArray.length > 0
    ? ((auditItemsArray.length - itemsWithDifference) / auditItemsArray.length) * 100
    : 100;

  const summaryStats = {
    total: audits?.length || 0,
    inProgress: audits?.filter((a) => a.status === "IN_PROGRESS").length || 0,
    completed: audits?.filter((a) => a.status === "COMPLETED").length || 0,
    avgAccuracy: (audits?.filter((a) => a.accuracyRate)
      .reduce((sum, a) => sum + (a.accuracyRate || 0), 0) || 0) / 
      (audits?.filter((a) => a.accuracyRate).length || 1),
  };

  if (loadingAudits) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (showWizard) {
    return (
      <div className="space-y-6">
        {/* Progresso do wizard */}
        <Card>
          <CardHeader>
            <CardTitle>Nova Auditoria de Inventário</CardTitle>
            <CardDescription>Etapa {currentStep} de 5</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Progress value={(currentStep / 5) * 100} className="h-2" />
              <div className="flex justify-between">
                {auditSteps.map((step) => (
                  <div
                    key={step.id}
                    className={cn(
                      "flex flex-col items-center gap-2",
                      step.id === currentStep && "text-primary font-semibold",
                      step.id < currentStep && "text-emerald-600"
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-full border-2",
                        step.id === currentStep && "border-primary bg-primary/10",
                        step.id < currentStep && "border-emerald-600 bg-emerald-50",
                        step.id > currentStep && "border-gray-300"
                      )}
                    >
                      {step.id < currentStep ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                      ) : (
                        <span>{step.id}</span>
                      )}
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium">{step.name}</p>
                      <p className="text-xs text-muted-foreground">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Etapa 1: Configurar */}
        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Configurar Auditoria</CardTitle>
              <CardDescription>Defina os parâmetros básicos da auditoria</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="location">Localização (opcional)</Label>
                <Select value={location} onValueChange={setLocation}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma localização" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as Localizações</SelectItem>
                    <SelectItem value="coldRoom">Câmara Fria</SelectItem>
                    <SelectItem value="house">Casa</SelectItem>
                    <SelectItem value="salePoint">Ponto de Venda</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="notes">Observações</Label>
                <Input
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Adicione informações sobre esta auditoria"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowWizard(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateAudit} disabled={createAudit.isPending}>
                  {createAudit.isPending ? "Criando..." : "Próximo"}
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Etapa 2: Selecionar Produtos */}
        {currentStep === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Selecionar Produtos</CardTitle>
              <CardDescription>
                Escolha os produtos que serão auditados ({selectedProducts.size} selecionados)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar produtos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <ScrollArea className="h-[400px] rounded-md border">
                <div className="p-4 space-y-2">
                  {filteredProducts?.map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer"
                      onClick={() => handleToggleProduct(product.id)}
                    >
                      <Checkbox
                        checked={selectedProducts.has(product.id)}
                        onCheckedChange={() => handleToggleProduct(product.id)}
                      />
                      <div className="flex-1">
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Estoque atual: {product.inventory?.totalQuantity || 0} unidades
                        </p>
                      </div>
                      <Badge variant="outline">{product.category}</Badge>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <div className="flex justify-between gap-2">
                <Button variant="outline" onClick={handleBack}>
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Voltar
                </Button>
                <Button onClick={handleNext} disabled={selectedProducts.size === 0}>
                  Próximo ({selectedProducts.size} produtos)
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Etapa 3: Contagem */}
        {currentStep === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Registrar Contagem</CardTitle>
              <CardDescription>
                Digite as quantidades contadas para cada produto
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ScrollArea className="h-[400px] rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produto</TableHead>
                      <TableHead className="text-center">Estoque Esperado</TableHead>
                      <TableHead className="text-center">Quantidade Contada</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Array.from(selectedProducts).map((productId) => {
                      const product = products?.find((p) => p.id === productId);
                      if (!product) return null;

                      const expected = product.inventory?.totalQuantity || 0;
                      const counted = auditItems.get(productId)?.countedQuantity || 0;

                      return (
                        <TableRow key={productId}>
                          <TableCell>
                            <div className="font-medium">{product.name}</div>
                            <div className="text-sm text-muted-foreground">{product.category}</div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline">{expected}</Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Input
                              type="number"
                              min="0"
                              value={counted}
                              onChange={(e) =>
                                handleUpdateCount(productId, Number.parseInt(e.target.value, 10) || 0)
                              }
                              className="w-24 mx-auto text-center"
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </ScrollArea>
              <div className="flex justify-between gap-2">
                <Button variant="outline" onClick={handleBack}>
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Voltar
                </Button>
                <Button onClick={handleAddItems} disabled={auditItems.size === 0}>
                  Próximo
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Etapa 4: Revisar */}
        {currentStep === 4 && (
          <Card>
            <CardHeader>
              <CardTitle>Revisar Diferenças</CardTitle>
              <CardDescription>
                Verifique as discrepâncias encontradas antes de finalizar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Itens Auditados</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{auditItemsArray.length}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Itens com Diferença</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-amber-600">{itemsWithDifference}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Taxa de Precisão</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-emerald-600">
                      {accuracyRate.toFixed(1)}%
                    </div>
                  </CardContent>
                </Card>
              </div>

              <ScrollArea className="h-[300px] rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produto</TableHead>
                      <TableHead className="text-center">Esperado</TableHead>
                      <TableHead className="text-center">Contado</TableHead>
                      <TableHead className="text-center">Diferença</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditItemsArray
                      .filter((item) => item.countedQuantity !== item.expectedQuantity)
                      .map((item) => {
                        const product = products?.find((p) => p.id === item.productId);
                        const difference = item.countedQuantity - item.expectedQuantity;

                        return (
                          <TableRow key={item.productId}>
                            <TableCell>
                              <div className="font-medium">{product?.name}</div>
                            </TableCell>
                            <TableCell className="text-center">{item.expectedQuantity}</TableCell>
                            <TableCell className="text-center">{item.countedQuantity}</TableCell>
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center gap-2">
                                {difference > 0 ? (
                                  <>
                                    <TrendingUp className="h-4 w-4 text-emerald-600" />
                                    <span className="text-emerald-600 font-semibold">+{difference}</span>
                                  </>
                                ) : (
                                  <>
                                    <TrendingDown className="h-4 w-4 text-red-600" />
                                    <span className="text-red-600 font-semibold">{difference}</span>
                                  </>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                  </TableBody>
                </Table>
              </ScrollArea>

              <div className="flex justify-between gap-2">
                <Button variant="outline" onClick={handleBack}>
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Voltar
                </Button>
                <Button onClick={handleNext}>
                  Próximo
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Etapa 5: Concluir */}
        {currentStep === 5 && (
          <Card>
            <CardHeader>
              <CardTitle>Concluir Auditoria</CardTitle>
              <CardDescription>
                Revise o resumo final e finalize a auditoria
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="rounded-lg border p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                  <div>
                    <h3 className="text-lg font-semibold">Auditoria Concluída</h3>
                    <p className="text-sm text-muted-foreground">
                      Todos os itens foram registrados com sucesso
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total de Itens:</span>
                    <span className="font-semibold">{auditItemsArray.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Itens com Diferença:</span>
                    <span className="font-semibold text-amber-600">{itemsWithDifference}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Taxa de Precisão:</span>
                    <span className="font-semibold text-emerald-600">{accuracyRate.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Diferença Total:</span>
                    <span className="font-semibold">{totalDifference} unidades</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-between gap-2">
                <Button variant="outline" onClick={handleBack}>
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Voltar
                </Button>
                <Button onClick={handleCompleteAudit} disabled={updateAudit.isPending}>
                  {updateAudit.isPending ? "Finalizando..." : "Finalizar Auditoria"}
                  <CheckCircle2 className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Resumo de estatísticas */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Auditorias</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryStats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Progresso</CardTitle>
            <AlertTriangle className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{summaryStats.inProgress}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Concluídas</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{summaryStats.completed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Precisão Média</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {summaryStats.avgAccuracy.toFixed(1)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ações */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Histórico de Auditorias</h2>
          <p className="text-muted-foreground">Visualize e gerencie as auditorias realizadas</p>
        </div>
        <Button onClick={startNewAudit}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Auditoria
        </Button>
      </div>

      {/* Tabela de auditorias */}
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Localização</TableHead>
                <TableHead className="text-center">Itens</TableHead>
                <TableHead className="text-center">Diferenças</TableHead>
                <TableHead className="text-center">Precisão</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {audits?.map((audit) => {
                const statusInfo = auditStatusConfig[audit.status];
                return (
                  <TableRow key={audit.id}>
                    <TableCell>
                      <div className="font-medium">
                        {format(new Date(audit.startedAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </div>
                      {audit.completedAt && (
                        <div className="text-xs text-muted-foreground">
                          Concluída em {format(new Date(audit.completedAt), "dd/MM/yyyy", { locale: ptBR })}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {audit.location ? (
                        <Badge variant="outline">{audit.location}</Badge>
                      ) : (
                        <span className="text-muted-foreground">Todas</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center font-semibold">{audit.totalItems}</TableCell>
                    <TableCell className="text-center">
                      {audit.itemsWithDifference > 0 ? (
                        <span className="text-amber-600 font-semibold">{audit.itemsWithDifference}</span>
                      ) : (
                        <span className="text-emerald-600">0</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {audit.accuracyRate ? (
                        <span
                          className={cn(
                            "font-semibold",
                            audit.accuracyRate >= 95 && "text-emerald-600",
                            audit.accuracyRate < 95 && audit.accuracyRate >= 90 && "text-amber-600",
                            audit.accuracyRate < 90 && "text-red-600"
                          )}
                        >
                          {audit.accuracyRate.toFixed(1)}%
                        </span>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost">
                        <FileText className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
