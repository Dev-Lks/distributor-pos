"use client";

import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertTriangle, Package, ArrowRight, Plus, Minus } from 'lucide-react';
import { useInventory } from '@/lib/useInventory';
import { products } from '@/lib/products';
import { Location, LOCATION_LABELS } from '@/lib/inventory';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

// Schemas de validação
const transferSchema = z.object({
  productId: z.string().min(1, 'Selecione um produto'),
  fromLocation: z.string().min(1, 'Selecione a origem'),
  toLocation: z.string().min(1, 'Selecione o destino'),
  quantity: z.number().min(1, 'Quantidade deve ser maior que 0'),
});

const entrySchema = z.object({
  productId: z.string().min(1, 'Selecione um produto'),
  location: z.string().min(1, 'Selecione o local'),
  quantity: z.number().min(1, 'Quantidade deve ser maior que 0'),
});

const adjustmentSchema = z.object({
  productId: z.string().min(1, 'Selecione um produto'),
  location: z.string().min(1, 'Selecione o local'),
  quantity: z.number().min(0, 'Quantidade deve ser maior ou igual a 0'),
});

type TransferForm = z.infer<typeof transferSchema>;
type EntryForm = z.infer<typeof entrySchema>;
type AdjustmentForm = z.infer<typeof adjustmentSchema>;

export default function InventoryDashboard() {
  const {
    stockLevels,
    movements,
    alerts,
    loading,
    getStockLevel,
    transferStock,
    directSale,
    stockEntry,
    adjustStock,
    loadInventory
  } = useInventory();

  // Filtros e busca
  const [search, setSearch] = useState('');
  const [onlyLow, setOnlyLow] = useState(false);
  const [locationFilter, setLocationFilter] = useState<Location | ''>('');

  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [transferFrom, setTransferFrom] = useState<Location | ''>('');
  const [transferTo, setTransferTo] = useState<Location | ''>('');
  const [transferQuantity, setTransferQuantity] = useState<number>(1);
  const [entryLocation, setEntryLocation] = useState<Location | ''>('');
  const [entryQuantity, setEntryQuantity] = useState<number>(1);
  const [adjustmentLocation, setAdjustmentLocation] = useState<Location | ''>('');
  const [adjustmentQuantity, setAdjustmentQuantity] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'overview' | 'transfer' | 'entry' | 'adjustment' | 'import'>('overview');
  const [importing, setImporting] = useState(false);
  const [defaultImportLocation, setDefaultImportLocation] = useState<Location>('camara_fria');
  const [importMode, setImportMode] = useState<'file' | 'paste'>('file');
  const [pasteText, setPasteText] = useState('');
  type UIRow = { Quantidade: number; Item: string; Tamanho: string; Custo?: number; ValorTotal?: number; Peso?: string; VendaConsumidor?: number; TotalVenda?: number; Local?: Location; MinStock: number };
  const [parsedRows, setParsedRows] = useState<UIRow[]>([]);
  const [parsing, setParsing] = useState(false);

  // Estados para dialogs de confirmação
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [showAdjustmentDialog, setShowAdjustmentDialog] = useState(false);

  // Estados de loading
  const [isTransferring, setIsTransferring] = useState(false);
  const [isEntering, setIsEntering] = useState(false);
  const [isAdjusting, setIsAdjusting] = useState(false);

  // Forms com validação
  const transferForm = useForm<TransferForm>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      productId: '',
      fromLocation: '',
      toLocation: '',
      quantity: 1,
    },
  });

  // Entrada simplificada: usaremos estados locais e submissão direta

  const adjustmentForm = useForm<AdjustmentForm>({
    resolver: zodResolver(adjustmentSchema),
    defaultValues: {
      productId: '',
      location: '',
      quantity: 0,
    },
  });

  const confirmTransfer = async (data: TransferForm) => {
    setIsTransferring(true);
    try {
      transferStock(data.productId, data.fromLocation as Location, data.toLocation as Location, data.quantity, 'Transferência via dashboard');
      toast.success('Transferência realizada com sucesso!');
      transferForm.reset();
      setActiveTab('overview');
      setShowTransferDialog(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro na transferência');
    } finally {
      setIsTransferring(false);
    }
  };

  const handleDirectSale = () => {
    if (!selectedProduct || transferQuantity <= 0) {
      toast.error('Selecione um produto e quantidade');
      return;
    }

    try {
      directSale(selectedProduct, transferQuantity, 'Venda direta da câmara fria');
      toast.success('Venda direta realizada com sucesso!');
      setTransferQuantity(1);
      setActiveTab('overview');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro na venda direta');
    }
  };

  const handleEntry = async () => {
    if (!selectedProduct || !entryLocation || entryQuantity <= 0) {
      toast.error('Selecione produto, local e quantidade');
      return;
    }
    setIsEntering(true);
    try {
      await stockEntry(selectedProduct, entryLocation as Location, entryQuantity, 'Entrada rápida');
      toast.success('Entrada registrada!');
      setEntryQuantity(1);
      setActiveTab('overview');
    } catch (e) {
      toast.error('Erro na entrada de mercadoria');
    } finally {
      setIsEntering(false);
    }
  };

  const handleQuickEntry = async (productId: string, loc: Location, qty: number) => {
    setIsEntering(true);
    try {
      await stockEntry(productId, loc, qty, 'Entrada rápida');
      toast.success(`+${qty} em ${LOCATION_LABELS[loc]}`);
    } catch {
      toast.error('Erro ao registrar entrada');
    } finally {
      setIsEntering(false);
    }
  };

  const confirmAdjustment = async (data: AdjustmentForm) => {
    setIsAdjusting(true);
    try {
      adjustStock(data.productId, data.location as Location, data.quantity, 'Ajuste via dashboard');
      toast.success('Ajuste realizado com sucesso!');
      adjustmentForm.reset();
      setActiveTab('overview');
      setShowAdjustmentDialog(false);
    } catch {
      toast.error('Erro no ajuste de estoque');
    } finally {
      setIsAdjusting(false);
    }
  };

  // Produtos filtrados para a visão geral
  const filteredProducts = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter(p => {
      const matchesQuery = !q || `${p.name} ${p.size}`.toLowerCase().includes(q);
      const matchesLocation = !locationFilter || getStockLevel(p.id, locationFilter) > 0;
      const stockLowOrOut = (() => {
        if (!onlyLow) return true;
        // considera baixo quando em algum local está <= minStock ou zerado
        const levels = stockLevels.filter(s => s.productId === p.id);
        if (levels.length === 0) return false;
        return levels.some(s => s.quantity <= 0 || s.quantity <= s.minStock);
      })();
      return matchesQuery && matchesLocation && stockLowOrOut;
    });
  }, [search, locationFilter, onlyLow, stockLevels]);

  // Ações rápidas: preenche e vai para a aba correta
  const quickTransfer = (productId: string) => {
    setSelectedProduct(productId);
    // origem sugerida: local com maior estoque
    const byProduct = stockLevels.filter(s => s.productId === productId);
    const bestFrom = byProduct.sort((a,b) => b.quantity - a.quantity)[0]?.location as Location | undefined;
    setTransferFrom(bestFrom ?? 'camara_fria');
    setTransferTo('ponto_venda');
    setTransferQuantity(1);
    setActiveTab('transfer');
  };

  const quickEntry = (productId: string) => {
    setSelectedProduct(productId);
    setEntryLocation('camara_fria');
    setEntryQuantity(1);
    setActiveTab('entry');
  };

  const quickAdjust = (productId: string) => {
    setSelectedProduct(productId);
    // se há filtro de local, usar; senão, usar ponto de venda
    const loc = (locationFilter || 'ponto_venda') as Location;
    setAdjustmentLocation(loc);
    setAdjustmentQuantity(getStockLevel(productId, loc));
    setActiveTab('adjustment');
  };

  if (loading) {
    return <div className="text-center py-8">Carregando inventário...</div>;
  }

  const activeAlerts = alerts.filter(a => !a.resolved);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold">Controle de Estoque</h2>
          <p className="text-muted-foreground text-sm sm:text-base">Gerencie seu inventário em todos os locais</p>
        </div>
        <div className="flex gap-2 self-start sm:self-auto">
          {activeAlerts.length > 0 && (
            <div className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              {activeAlerts.length} alerta{activeAlerts.length > 1 ? 's' : ''}
            </div>
          )}
        </div>
      </div>

  {/* Tabs */}
      <div className="flex flex-wrap gap-1 sm:gap-2 border-b overflow-x-auto">
        {[
          { id: 'overview' as const, label: 'Visão Geral' },
          { id: 'transfer' as const, label: 'Transferir' },
          { id: 'entry' as const, label: 'Entrada' },
          { id: 'adjustment' as const, label: 'Ajuste' },
          { id: 'import' as const, label: 'Importar Excel' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-2 sm:px-4 py-2 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Alertas */}
      {activeAlerts.length > 0 && activeTab === 'overview' && (
        <Card className="p-4 border-red-200 bg-red-50">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-800">Alertas de Estoque</h3>
              <div className="space-y-1 mt-2">
                {activeAlerts.map(alert => (
                  <div key={alert.id} className="text-sm text-red-700">
                    • {alert.message}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Visão Geral */}
      {activeTab === 'overview' && (
        <Card className="p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold">Visão Geral do Estoque</h3>
              <p className="text-xs text-muted-foreground">Busque, filtre e use as ações rápidas para movimentar.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Input
                placeholder="Buscar por nome ou tamanho"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="sm:w-64"
              />
              <select
                value={locationFilter}
                onChange={e => setLocationFilter((e.target.value || '') as Location | '')}
                className="px-3 py-2 border rounded bg-background text-sm"
                aria-label="Filtrar por local com estoque"
              >
                <option value="">Todos os locais</option>
                {Object.entries(LOCATION_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
              <label className="inline-flex items-center gap-2 text-sm">
                <input type="checkbox" checked={onlyLow} onChange={e => setOnlyLow(e.target.checked)} />
                Só baixo/zerado
              </label>
            </div>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>Tamanho</TableHead>
                  {(Object.keys(LOCATION_LABELS) as Location[]).map(location => (
                    <TableHead key={location} className="text-center">
                      {LOCATION_LABELS[location]}
                    </TableHead>
                  ))}
                  <TableHead className="text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map(product => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{product.size}</Badge>
                    </TableCell>
                    {(Object.keys(LOCATION_LABELS) as Location[]).map(location => {
                      const stock = getStockLevel(product.id, location);
                      const stockLevel = stockLevels.find(s => s.productId === product.id && s.location === location);
                      const isLow = stockLevel && stock <= stockLevel.minStock;
                      const isOut = stock <= 0;

                      return (
                        <TableCell key={location} className="text-center">
                          <div className="flex flex-col items-center gap-1">
                            <Badge
                              variant={
                                isOut ? 'destructive' :
                                isLow ? 'secondary' :
                                'default'
                              }
                            >
                              {stock}
                            </Badge>
                            <div className="flex gap-1">
                              <Button size="sm" variant="outline" className="h-7 px-2 text-xs" disabled={isEntering}
                                onClick={() => handleQuickEntry(product.id, location, 1)}>
                                +1
                              </Button>
                              <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" disabled={isEntering}
                                onClick={() => handleQuickEntry(product.id, location, 5)}>
                                +5
                              </Button>
                            </div>
                          </div>
                        </TableCell>
                      );
                    })}
                    <TableCell className="text-center">
                      <div className="flex flex-wrap gap-1 justify-center">
                        <Button size="sm" variant="outline" onClick={() => quickEntry(product.id)}>Entrada</Button>
                        <Button size="sm" onClick={() => quickTransfer(product.id)}>Transferir</Button>
                        <Button size="sm" variant="ghost" onClick={() => quickAdjust(product.id)}>Ajustar</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* Transferência */}
      {activeTab === 'transfer' && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Transferir Estoque</h3>
          <div className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium mb-2">Produto</label>
              <Select value={selectedProduct} onValueChange={(val) => setSelectedProduct(val)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione um produto" />
                </SelectTrigger>
                <SelectContent>
                  {products.map(product => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name} - {product.size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">De</label>
                <Select value={transferFrom} onValueChange={(val: string) => setTransferFrom(val as Location)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Origem" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(LOCATION_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedProduct && transferFrom && (
                  <div className="text-xs text-muted-foreground mt-1">Disponível: {getStockLevel(selectedProduct, transferFrom as Location)}</div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Para</label>
                <Select value={transferTo} onValueChange={(val: string) => setTransferTo(val as Location)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Destino" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(LOCATION_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedProduct && transferTo && (
                  <div className="text-xs text-muted-foreground mt-1">No destino: {getStockLevel(selectedProduct, transferTo as Location)}</div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Quantidade</label>
              <Input
                type="number"
                value={transferQuantity}
                onChange={(e) => setTransferQuantity(Number(e.target.value))}
                min="1"
                className="w-full"
              />
            </div>

            <div className="flex gap-2">
              <Dialog open={showTransferDialog} onOpenChange={setShowTransferDialog}>
                <DialogTrigger asChild>
                  <Button onClick={() => setShowTransferDialog(true)} className="flex-1">
                    <ArrowRight className="w-4 h-4 mr-2" />
                    Transferir
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Confirmar Transferência</DialogTitle>
                    <DialogDescription>
                      Preencha os dados da transferência abaixo.
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...transferForm}>
                    <form onSubmit={transferForm.handleSubmit(confirmTransfer)} className="space-y-4">
                      <FormField
                        control={transferForm.control}
                        name="productId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Produto</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione um produto" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {products.map(product => (
                                  <SelectItem key={product.id} value={product.id}>
                                    {product.name} - {product.size}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={transferForm.control}
                          name="fromLocation"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>De</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Origem" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {Object.entries(LOCATION_LABELS).map(([key, label]) => (
                                    <SelectItem key={key} value={key}>
                                      {label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={transferForm.control}
                          name="toLocation"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Para</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Destino" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {Object.entries(LOCATION_LABELS).map(([key, label]) => (
                                    <SelectItem key={key} value={key}>
                                      {label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={transferForm.control}
                        name="quantity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Quantidade</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                                min="1"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <DialogFooter className="flex flex-col sm:flex-row gap-2">
                        <Button type="button" variant="outline" onClick={() => setShowTransferDialog(false)} disabled={isTransferring} className="w-full sm:w-auto">
                          Cancelar
                        </Button>
                        <Button type="submit" disabled={isTransferring} className="w-full sm:w-auto">
                          {isTransferring ? 'Transferindo...' : 'Confirmar'}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
              <Button onClick={handleDirectSale} variant="outline" className="flex-1">
                <Package className="w-4 h-4 mr-2" />
                Venda Direta
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Entrada - fluxo simples, sem modal */}
      {activeTab === 'entry' && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Entrada de Mercadoria</h3>
          <div className="space-y-4 max-w-lg">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-2">Produto</label>
                <Select value={selectedProduct} onValueChange={(val: string) => setSelectedProduct(val)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione um produto" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map(product => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name} - {product.size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Local</label>
                <Select value={entryLocation} onValueChange={(val: string) => setEntryLocation(val as Location)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione o local" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(LOCATION_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedProduct && entryLocation && (
                  <div className="text-xs text-muted-foreground mt-1">
                    Atual: {getStockLevel(selectedProduct, entryLocation as Location)}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Quantidade</label>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => setEntryQuantity(Math.max(1, entryQuantity - 1))}>
                  <Minus className="w-4 h-4" />
                </Button>
                <Input
                  type="number"
                  value={entryQuantity}
                  onChange={(e) => setEntryQuantity(Number(e.target.value))}
                  min="1"
                  className="w-24 text-center"
                />
                <Button size="sm" variant="outline" onClick={() => setEntryQuantity(entryQuantity + 1)}>
                  <Plus className="w-4 h-4" />
                </Button>
                <div className="flex gap-1 ml-2">
                  <Button size="sm" variant="ghost" onClick={() => setEntryQuantity(1)}>+1</Button>
                  <Button size="sm" variant="ghost" onClick={() => setEntryQuantity(5)}>+5</Button>
                  <Button size="sm" variant="ghost" onClick={() => setEntryQuantity(10)}>+10</Button>
                </div>
              </div>
            </div>

            {selectedProduct && entryLocation && (
              <div className="text-xs text-muted-foreground">
                Vai adicionar {entryQuantity} em {LOCATION_LABELS[entryLocation as Location]}.
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={handleEntry} disabled={isEntering || !selectedProduct || !entryLocation || entryQuantity <= 0}>
                {isEntering ? 'Registrando...' : 'Registrar Entrada'}
              </Button>
              <Button variant="outline" onClick={() => { setSelectedProduct(''); setEntryLocation(''); setEntryQuantity(1); }}>
                Limpar
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Ajuste */}
      {activeTab === 'adjustment' && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Ajuste de Estoque</h3>
          <div className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium mb-2">Produto</label>
              <Select value={selectedProduct} onValueChange={(val: string) => setSelectedProduct(val)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione um produto" />
                </SelectTrigger>
                <SelectContent>
                  {products.map(product => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name} - {product.size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Local</label>
              <Select value={adjustmentLocation} onValueChange={(val: string) => setAdjustmentLocation(val as Location)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione o local" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(LOCATION_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedProduct && adjustmentLocation && (
                <div className="text-xs text-muted-foreground mt-1">Atual: {getStockLevel(selectedProduct, adjustmentLocation as Location)}</div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Novo Estoque</label>
              <Input
                type="number"
                value={adjustmentQuantity}
                onChange={(e) => setAdjustmentQuantity(Number(e.target.value))}
                min="0"
                className="w-full"
              />
            </div>

            <Dialog open={showAdjustmentDialog} onOpenChange={setShowAdjustmentDialog}>
              <DialogTrigger asChild>
                <Button onClick={() => setShowAdjustmentDialog(true)} className="w-full">
                  <Minus className="w-4 h-4 mr-2" />
                  Ajustar Estoque
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Ajustar Estoque</DialogTitle>
                  <DialogDescription>
                    Preencha os dados do ajuste de estoque.
                  </DialogDescription>
                </DialogHeader>
                <Form {...adjustmentForm}>
                  <form onSubmit={adjustmentForm.handleSubmit(confirmAdjustment)} className="space-y-4">
                    <FormField
                      control={adjustmentForm.control}
                      name="productId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Produto</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione um produto" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {products.map(product => (
                                <SelectItem key={product.id} value={product.id}>
                                  {product.name} - {product.size}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={adjustmentForm.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Local</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o local" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Object.entries(LOCATION_LABELS).map(([key, label]) => (
                                <SelectItem key={key} value={key}>
                                  {label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={adjustmentForm.control}
                      name="quantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Novo Estoque</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                              min="0"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <DialogFooter className="flex flex-col sm:flex-row gap-2">
                      <Button type="button" variant="outline" onClick={() => setShowAdjustmentDialog(false)} disabled={isAdjusting} className="w-full sm:w-auto">
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={isAdjusting} className="w-full sm:w-auto">
                        {isAdjusting ? 'Ajustando...' : 'Confirmar'}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </Card>
      )}

      {/* Importação Excel/Paste */}
      {activeTab === 'import' && (
        <div className="mt-6 space-y-4">
          <h3 className="text-lg font-semibold">Importar Estoque</h3>
          <div className="text-sm text-muted-foreground">
            Cole direto do Excel/Google Sheets ou envie um arquivo .xlsx. Reconhecemos colunas: &quot;Quantidade de compra&quot;, &quot;Item&quot;, &quot;Tamanho&quot;, &quot;Venda Consumidor R$&quot; (as demais são opcionais).
          </div>

          {/* Modo de importação */}
          <div className="flex gap-2">
            <Button variant={importMode === 'file' ? 'default' : 'outline'} size="sm" onClick={() => setImportMode('file')}>Arquivo Excel</Button>
            <Button variant={importMode === 'paste' ? 'default' : 'outline'} size="sm" onClick={() => setImportMode('paste')}>Colar Dados</Button>
          </div>

          {/* Local padrão */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <label className="text-sm font-medium">Local padrão:</label>
            <select
              value={defaultImportLocation}
              onChange={(e) => setDefaultImportLocation(e.target.value as Location)}
              className="px-3 py-2 border rounded bg-background"
            >
              <option value="camara_fria">Câmara Fria</option>
              <option value="casa">Casa</option>
              <option value="ponto_venda">Ponto de Venda</option>
            </select>
            <div className="text-xs text-muted-foreground">Pode ser sobrescrito pela coluna &quot;Local&quot;.</div>
          </div>

          {/* Conteúdo principal: arquivo ou colar */}
          {importMode === 'file' ? (
            <div className="space-y-3">
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setImporting(true);
                  try {
                    const data = await file.arrayBuffer();
                    const workbook = XLSX.read(data);
                    const sheetName = workbook.SheetNames[0];
                    const sheet = workbook.Sheets[sheetName];
                    const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });

                    const rows = json.map((row) => {
                      const get = (k: string) => (row as Record<string, unknown>)[k];
                      const parseMoney = (v: unknown) => Number(String(v ?? '').replace(/[^0-9.,]/g, '').replace(',', '.'));
                      const locRaw = String(get('Local') ?? '').trim();
                      const loc = locRaw === 'camara_fria' || locRaw === 'casa' || locRaw === 'ponto_venda' ? (locRaw as Location) : undefined;
                      return {
                        Quantidade: Number(get('Quantidade de compra') ?? get('Quantidade') ?? get('Qtd') ?? 0),
                        Item: String(get('Item') ?? get('Produto') ?? get('Nome') ?? ''),
                        Tamanho: String(get('Tamanho') ?? get('Volume') ?? get('Tamanho (L)') ?? ''),
                        Custo: parseMoney(get('Custo')) || undefined,
                        ValorTotal: parseMoney(get('Valor total')) || undefined,
                        Peso: String(get('Peso') ?? ''),
                        VendaConsumidor: parseMoney(get('Venda Consumidor R$') ?? get('Preço Venda')) || undefined,
                        TotalVenda: parseMoney(get('Total Venda')) || undefined,
                        Local: loc,
                        MinStock: Number(get('MinStock') ?? get('Estoque Mínimo') ?? 0) || 0
                      } as UIRow;
                    }).filter((r) => r.Item && r.Tamanho && r.Quantidade > 0);

                    const res = await fetch('/api/inventory/import', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ rows, defaultLocation: defaultImportLocation })
                    });

                    if (!res.ok) throw new Error('Falha ao importar');
                    const result = await res.json();
                    toast.success(`${result.imported} itens importados com sucesso!`);
                    if (result.failures && result.failures.length > 0) {
                      toast.warning(`${result.failures.length} linha(s) foram ignoradas por erro.`);
                      console.warn('Falhas na importação:', result.failures);
                    }
                    await loadInventory();
                  } catch (err) {
                    console.error(err);
                    toast.error('Erro ao importar planilha. Verifique o formato.');
                  } finally {
                    setImporting(false);
                    e.currentTarget.value = '';
                  }
                }}
                className="block"
                disabled={importing}
              />
            </div>
          ) : (
            <div className="space-y-3">
              <textarea
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder={`Cole aqui os dados da sua planilha (incluindo cabeçalhos).\nExemplo de colunas: Quantidade de compra\tItem\tTamanho\tVenda Consumidor R$`}
                className="w-full min-h-[160px] p-3 border rounded font-mono text-sm"
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="default"
                  disabled={!pasteText.trim() || parsing}
                  onClick={() => {
                    setParsing(true);
                    try {
                      const lines = pasteText
                        .split(/\r?\n/)
                        .map((l) => l.trim())
                        .filter((l) => l.length > 0);
                      if (lines.length === 0) {
                        setParsedRows([]);
                        setParsing(false);
                        return;
                      }
                      // Detect delimiter: tab, semicolon, comma
                      const detectDelim = (s: string) => (s.includes('\t') ? '\t' : s.includes(';') ? ';' : ',');
                      const delim = detectDelim(lines[0]);
                      const cells = (s: string) => s.split(delim).map((c) => c.trim());
                      const header = cells(lines[0]).map((h) => h.toLowerCase());

                      const headerKeywords = ['quantidade', 'qtd', 'item', 'produto', 'tamanho', 'volume', 'venda', 'preço', 'preco', 'local', 'estoque', 'mínimo', 'minimo'];
                      const hasHeader = header.some((h) => headerKeywords.some((k) => h.includes(k)));

                      const idx = (names: string[]) => {
                        for (let i = 0; i < header.length; i++) {
                          if (names.some((n) => header[i].includes(n))) return i;
                        }
                        return -1;
                      };

                      const iQtd = idx(['quantidade de compra', 'quantidade', 'qtd']);
                      const iItem = idx(['item', 'produto', 'nome']);
                      const iTam = idx(['tamanho', 'volume', 'tamanho (l)']);
                      const iVenda = idx(['venda consumidor', 'preço venda', 'preco venda']);
                      const iLocal = idx(['local']);
                      const iMin = idx(['minstock', 'estoque mínimo', 'estoque minimo']);

                      const start = hasHeader ? 1 : 0; // se não tiver header, começa na primeira linha
                      const rows: UIRow[] = [];

                      for (let r = start; r < lines.length; r++) {
                        const cols = cells(lines[r]);
                        const getBy = (i: number, fallbackIndex?: number) => (i >= 0 ? cols[i] : (fallbackIndex !== undefined && fallbackIndex < cols.length ? cols[fallbackIndex] : ''));
                        const parseMoney = (v: string) => Number(String(v ?? '').replace(/[^0-9.,]/g, '').replace(',', '.'));

                        // Se não há header, tenta posição padrão: 0=Qtd,1=Item,2=Tamanho,6=Venda
                        const qtdStr = getBy(iQtd, 0);
                        const itemStr = getBy(iItem, 1);
                        const tamStr = getBy(iTam, 2);
                        const vendaStr = getBy(iVenda, 6);
                        const locStr = getBy(iLocal);
                        const minStr = getBy(iMin);

                        const locVal = ['camara_fria', 'casa', 'ponto_venda'].includes(locStr) ? (locStr as Location) : undefined;

                        const row: UIRow = {
                          Quantidade: Number(qtdStr || 0),
                          Item: String(itemStr || ''),
                          Tamanho: String(tamStr || ''),
                          VendaConsumidor: vendaStr ? parseMoney(vendaStr) : undefined,
                          Local: locVal,
                          MinStock: Number(minStr || 0) || 0
                        };
                        if (row.Item && row.Tamanho && row.Quantidade > 0) rows.push(row);
                      }
                      setParsedRows(rows);
                    } finally {
                      setParsing(false);
                    }
                  }}
                >Analisar</Button>
                <Button type="button" variant="ghost" onClick={() => { setPasteText(''); setParsedRows([]); }}>Limpar</Button>
              </div>

              {parsedRows.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Foram detectadas {parsedRows.length} linhas válidas.</div>
                  <div className="overflow-x-auto border rounded">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="p-2 text-left">Item</th>
                          <th className="p-2 text-left">Tamanho</th>
                          <th className="p-2 text-left">Quantidade</th>
                          <th className="p-2 text-left">Local</th>
                          <th className="p-2 text-left">Venda Consumidor</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parsedRows.slice(0, 10).map((r, i) => (
                          <tr key={i} className="border-t">
                            <td className="p-2">{r.Item}</td>
                            <td className="p-2">{r.Tamanho}</td>
                            <td className="p-2">{r.Quantidade}</td>
                            <td className="p-2">{r.Local ?? '-'}</td>
                            <td className="p-2">{r.VendaConsumidor ? `R$ ${r.VendaConsumidor.toFixed(2)}` : '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="text-xs text-muted-foreground">Mostrando as 10 primeiras linhas.</div>
                  <div>
                    <Button
                      type="button"
                      disabled={parsedRows.length === 0 || importing}
                      onClick={async () => {
                        setImporting(true);
                        try {
                          const res = await fetch('/api/inventory/import', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ rows: parsedRows, defaultLocation: defaultImportLocation })
                          });
                          if (!res.ok) throw new Error('Falha ao importar');
                          const result = await res.json();
                          toast.success(`${result.imported} itens importados com sucesso!`);
                          if (result.failures && result.failures.length > 0) {
                            toast.warning(`${result.failures.length} linha(s) foram ignoradas por erro.`);
                            console.warn('Falhas na importação:', result.failures);
                          }
                          setParsedRows([]);
                          setPasteText('');
                          await loadInventory();
                        } catch (err) {
                          console.error(err);
                          toast.error('Erro ao importar dados colados.');
                        } finally {
                          setImporting(false);
                        }
                      }}
                    >Importar {parsedRows.length} itens</Button>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="text-sm text-muted-foreground">
            Dica: se a coluna &quot;Local&quot; não existir, usaremos o local padrão selecionado.
          </div>
        </div>
      )}

      {/* Movimentações Recentes */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Movimentações Recentes</h3>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Origem</TableHead>
                <TableHead>Destino</TableHead>
                <TableHead className="text-center">Quantidade</TableHead>
                <TableHead>Data/Hora</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {movements.slice(0, 10).map(movement => {
                const product = products.find(p => p.id === movement.productId);
                return (
                  <TableRow key={movement.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{product?.name}</div>
                        <div className="text-sm text-muted-foreground">{product?.size}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {movement.type === 'transfer' ? 'Transferência' :
                         movement.type === 'sale' ? 'Venda' :
                         movement.type === 'entry' ? 'Entrada' :
                         'Ajuste'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {movement.fromLocation ? LOCATION_LABELS[movement.fromLocation] : '-'}
                    </TableCell>
                    <TableCell>
                      {movement.toLocation ? LOCATION_LABELS[movement.toLocation] : 'Saída'}
                    </TableCell>
                    <TableCell className="text-center font-medium">
                      {movement.quantity}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(movement.timestamp).toLocaleString('pt-BR')}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}