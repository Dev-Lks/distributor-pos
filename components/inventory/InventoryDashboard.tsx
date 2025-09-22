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

  // Estados para dialogs de confirmação
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [showEntryDialog, setShowEntryDialog] = useState(false);
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

  const entryForm = useForm<EntryForm>({
    resolver: zodResolver(entrySchema),
    defaultValues: {
      productId: '',
      location: '',
      quantity: 1,
    },
  });

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

  const confirmStockEntry = async (data: EntryForm) => {
    setIsEntering(true);
    try {
      stockEntry(data.productId, data.location as Location, data.quantity, 'Entrada via dashboard');
      toast.success('Entrada de mercadoria registrada!');
      entryForm.reset();
      setActiveTab('overview');
      setShowEntryDialog(false);
    } catch {
      toast.error('Erro na entrada de mercadoria');
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
          <h3 className="text-lg font-semibold mb-4">Visão Geral do Estoque</h3>
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map(product => (
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
                          <Badge
                            variant={
                              isOut ? 'destructive' :
                              isLow ? 'secondary' :
                              'default'
                            }
                          >
                            {stock}
                          </Badge>
                        </TableCell>
                      );
                    })}
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

      {/* Entrada */}
      {activeTab === 'entry' && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Entrada de Mercadoria</h3>
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
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Quantidade</label>
              <Input
                type="number"
                value={entryQuantity}
                onChange={(e) => setEntryQuantity(Number(e.target.value))}
                min="1"
                className="w-full"
              />
            </div>

            <Dialog open={showEntryDialog} onOpenChange={setShowEntryDialog}>
              <DialogTrigger asChild>
                <Button onClick={() => setShowEntryDialog(true)} className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Registrar Entrada
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Registrar Entrada</DialogTitle>
                  <DialogDescription>
                    Preencha os dados da entrada de mercadoria.
                  </DialogDescription>
                </DialogHeader>
                <Form {...entryForm}>
                  <form onSubmit={entryForm.handleSubmit(confirmStockEntry)} className="space-y-4">
                    <FormField
                      control={entryForm.control}
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
                      control={entryForm.control}
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
                      control={entryForm.control}
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
                      <Button type="button" variant="outline" onClick={() => setShowEntryDialog(false)} disabled={isEntering} className="w-full sm:w-auto">
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={isEntering} className="w-full sm:w-auto">
                        {isEntering ? 'Registrando...' : 'Confirmar'}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
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

      {/* Importação Excel */}
      {activeTab === 'import' && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-4">Importar Estoque via Excel</h3>
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              <label className="text-sm font-medium">Local padrão:</label>
              <select
                value={defaultImportLocation}
                onChange={(e) => setDefaultImportLocation(e.target.value as any)}
                className="px-3 py-2 border rounded bg-background"
              >
                <option value="camara_fria">Câmara Fria</option>
                <option value="casa">Casa</option>
                <option value="ponto_venda">Ponto de Venda</option>
              </select>
              <div className="text-xs text-muted-foreground">Pode ser sobrescrito pela coluna "Local" da planilha.</div>
            </div>

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
                  const json: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

                  // Mapear possíveis nomes de colunas
                  const rows = json.map((row) => ({
                    Quantidade: Number(row['Quantidade de compra'] || row['Quantidade'] || row['Qtd'] || 0),
                    Item: String(row['Item'] || row['Produto'] || row['Nome'] || ''),
                    Tamanho: String(row['Tamanho'] || row['Volume'] || row['Tamanho (L)'] || ''),
                    Custo: Number(String(row['Custo'] || '').replace(/[^0-9.,]/g, '').replace(',', '.')) || undefined,
                    ValorTotal: Number(String(row['Valor total'] || '').replace(/[^0-9.,]/g, '').replace(',', '.')) || undefined,
                    Peso: String(row['Peso'] || ''),
                    VendaConsumidor: Number(String(row['Venda Consumidor R$'] || row['Preço Venda'] || '').replace(/[^0-9.,]/g, '').replace(',', '.')) || undefined,
                    TotalVenda: Number(String(row['Total Venda'] || '').replace(/[^0-9.,]/g, '').replace(',', '.')) || undefined,
                    Local: (row['Local'] as any) || undefined,
                    MinStock: Number(row['MinStock'] || row['Estoque Mínimo'] || 0) || 0
                  })).filter(r => r.Item && r.Tamanho && r.Quantidade > 0);

                  const res = await fetch('/api/inventory/import', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ rows, defaultLocation: defaultImportLocation })
                  });

                  if (!res.ok) throw new Error('Falha ao importar');
                  const result = await res.json();
                  toast.success(`${result.imported} itens importados com sucesso!`);
                  // Recarregar inventário
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
            <div className="text-sm text-muted-foreground">
              Modelo esperado: colunas "Quantidade de compra", "Item", "Tamanho", "Venda Consumidor R$". Outras colunas são opcionais.
            </div>
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