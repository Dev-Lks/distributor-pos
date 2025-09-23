import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Product } from "@/lib/products";
import { Receipt, CreditCard, Banknote, Smartphone, Clock, FileText } from "lucide-react";

type CartItem = { 
  product: Product; 
  qty: number; 
  discount?: number;
  notes?: string;
};

type PaymentMethod = 'cash' | 'pix' | 'debit' | 'credit' | 'tab';

interface PaymentFormProps {
  cart: CartItem[];
  onProcessSale: (saleData: any) => Promise<void>;
  isLoading: boolean;
}

const paymentMethods = [
  { id: 'cash', name: 'Dinheiro', icon: Banknote, color: 'bg-yellow-500 text-black' },
  { id: 'pix', name: 'PIX', icon: Smartphone, color: 'bg-yellow-600 text-black' },
  { id: 'debit', name: 'Débito', icon: CreditCard, color: 'bg-yellow-700 text-white' },
  { id: 'credit', name: 'Crédito', icon: CreditCard, color: 'bg-yellow-800 text-white' },
  { id: 'tab', name: 'Fiado', icon: Clock, color: 'bg-yellow-900 text-yellow-100' }
];

const formatBRL = (value: number) => 
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function PaymentForm({ cart, onProcessSale, isLoading }: PaymentFormProps) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [customerName, setCustomerName] = useState("");
  const [orderNotes, setOrderNotes] = useState("");
  const [discount, setDiscount] = useState(0);
  const [amountReceived, setAmountReceived] = useState(0);
  const [installments, setInstallments] = useState(1);

  const subtotal = cart.reduce((sum, item) => sum + (item.product.price * item.qty), 0);
  const discountAmount = (subtotal * discount) / 100;
  const total = subtotal - discountAmount;
  const change = amountReceived > total ? amountReceived - total : 0;
  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (paymentMethod === 'cash' && amountReceived < total) {
      alert('Valor recebido insuficiente!');
      return;
    }

    if (paymentMethod === 'tab' && !customerName.trim()) {
      alert('Nome do cliente é obrigatório para vendas fiadas!');
      return;
    }

    const saleData = {
      items: cart.map(item => ({
        product: {
          id: item.product.id,
          name: item.product.name,
          size: item.product.size,
          price: item.product.price
        },
        qty: item.qty
      })),
      total,
      paymentMethod,
      notes: orderNotes,
      customerName: customerName.trim() || null,
      discount: discountAmount,
      status: 'paid',
      amountReceived: paymentMethod === 'cash' ? amountReceived : total,
      change: paymentMethod === 'cash' ? change : 0,
      installments: paymentMethod === 'credit' ? installments : 1
    };

    await onProcessSale(saleData);
  };

  const resetForm = () => {
    setCustomerName("");
    setOrderNotes("");
    setDiscount(0);
    setAmountReceived(0);
    setInstallments(1);
  };

  return (
    <Card className="p-6 bg-black border-yellow-500">
      <div className="flex items-center gap-2 mb-6">
        <Receipt className="h-5 w-5 text-yellow-500" />
        <h2 className="text-xl font-semibold text-yellow-100">Finalizar Venda</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Left Column - Payment Details */}
          <div className="space-y-4">
            
            {/* Customer Name */}
            <div>
              <Label htmlFor="customerName" className="text-yellow-100">
                Nome do Cliente {paymentMethod === 'tab' && <span className="text-red-400">*</span>}
              </Label>
              <Input
                id="customerName"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Digite o nome do cliente"
                required={paymentMethod === 'tab'}
                className="bg-black border-yellow-500 text-yellow-100 placeholder-yellow-700 focus:border-yellow-400"
              />
            </div>

            {/* Payment Method */}
            <div>
              <Label className="text-yellow-100">Método de Pagamento</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {paymentMethods.map(method => {
                  const IconComponent = method.icon;
                  return (
                    <Button
                      key={method.id}
                      type="button"
                      variant={paymentMethod === method.id ? 'default' : 'outline'}
                      onClick={() => setPaymentMethod(method.id as PaymentMethod)}
                      className={`flex items-center gap-2 h-12 ${
                        paymentMethod === method.id 
                          ? 'bg-yellow-500 text-black border-yellow-500' 
                          : 'bg-black text-yellow-500 border-yellow-500 hover:bg-yellow-500 hover:text-black'
                      }`}
                    >
                      <div className={`p-1 rounded ${paymentMethod === method.id ? 'bg-black/20' : method.color}`}>
                        <IconComponent className="h-4 w-4" />
                      </div>
                      {method.name}
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Credit Card Installments */}
            {paymentMethod === 'credit' && (
              <div>
                <Label htmlFor="installments" className="text-yellow-100">Parcelas</Label>
                <select
                  id="installments"
                  value={installments}
                  onChange={(e) => setInstallments(Number(e.target.value))}
                  className="w-full p-2 border border-yellow-500 rounded-md bg-black text-yellow-100"
                >
                  {[...Array(12)].map((_, i) => {
                    const installmentValue = total / (i + 1);
                    return (
                      <option key={i + 1} value={i + 1}>
                        {i + 1}x de {formatBRL(installmentValue)}
                      </option>
                    );
                  })}
                </select>
              </div>
            )}

            {/* Discount */}
            <div>
              <Label htmlFor="discount" className="text-yellow-100">Desconto (%)</Label>
              <Input
                id="discount"
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={discount}
                onChange={(e) => setDiscount(Number(e.target.value))}
                placeholder="0"
                className="bg-black border-yellow-500 text-yellow-100 placeholder-yellow-700 focus:border-yellow-400"
              />
            </div>

            {/* Cash Payment - Amount Received */}
            {paymentMethod === 'cash' && (
              <div>
                <Label htmlFor="amountReceived" className="text-yellow-100">Valor Recebido *</Label>
                <Input
                  id="amountReceived"
                  type="number"
                  min="0"
                  step="0.01"
                  value={amountReceived}
                  onChange={(e) => setAmountReceived(Number(e.target.value))}
                  placeholder={total.toString()}
                  required
                  className="bg-black border-yellow-500 text-yellow-100 placeholder-yellow-700 focus:border-yellow-400"
                />
                {change > 0 && (
                  <div className="mt-2 p-2 bg-yellow-600/20 border border-yellow-500 rounded">
                    <p className="text-sm text-yellow-300 font-medium">
                      💰 Troco: {formatBRL(change)}
                    </p>
                  </div>
                )}
                {amountReceived > 0 && amountReceived < total && (
                  <div className="mt-2 p-2 bg-red-600/20 border border-red-500 rounded">
                    <p className="text-sm text-red-300">
                      ⚠️ Valor insuficiente (falta {formatBRL(total - amountReceived)})
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Order Notes */}
            <div>
              <Label htmlFor="orderNotes" className="text-yellow-100">Observações</Label>
              <Input
                id="orderNotes"
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                placeholder="Observações da venda"
                className="bg-black border-yellow-500 text-yellow-100 placeholder-yellow-700 focus:border-yellow-400"
              />
            </div>
          </div>

          {/* Right Column - Sale Summary */}
          <div className="space-y-4">
            
            {/* Sale Summary */}
            <div className="bg-yellow-900/20 border border-yellow-600 p-4 rounded-lg">
              <h3 className="font-medium mb-3 flex items-center gap-2 text-yellow-100">
                <FileText className="h-4 w-4" />
                Resumo da Venda
              </h3>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-yellow-300">Produtos:</span>
                  <span className="text-yellow-100">{cart.length} {cart.length === 1 ? 'tipo' : 'tipos'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-yellow-300">Quantidade total:</span>
                  <span className="text-yellow-100">{totalItems} {totalItems === 1 ? 'item' : 'itens'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-yellow-300">Subtotal:</span>
                  <span className="text-yellow-100">{formatBRL(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-red-400">
                    <span>Desconto ({discount}%):</span>
                    <span>-{formatBRL(discountAmount)}</span>
                  </div>
                )}
                <Separator className="bg-yellow-600" />
                <div className="flex justify-between text-lg font-bold">
                  <span className="text-yellow-100">Total:</span>
                  <span className="text-yellow-500">{formatBRL(total)}</span>
                </div>
                
                {paymentMethod === 'credit' && installments > 1 && (
                  <div className="mt-2 p-2 bg-yellow-600/20 border border-yellow-500 rounded">
                    <p className="text-xs text-yellow-300">
                      {installments}x de {formatBRL(total / installments)}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Items List */}
            <div className="bg-yellow-900/20 border border-yellow-600 p-4 rounded-lg max-h-60 overflow-y-auto">
              <h4 className="font-medium mb-2 text-sm text-yellow-100">Itens da Venda</h4>
              <div className="space-y-2">
                {cart.map((item, index) => (
                  <div key={`${item.product.id}-${index}`} className="flex justify-between text-xs">
                    <span className="truncate flex-1 mr-2 text-yellow-200">
                      {item.qty}x {item.product.name} ({item.product.size})
                    </span>
                    <span className="font-medium text-yellow-500">
                      {formatBRL(item.product.price * item.qty)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Method Info */}
            <div className="bg-yellow-600/20 border border-yellow-500 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                {paymentMethods.find(m => m.id === paymentMethod)?.icon && (
                  <div className="bg-yellow-500 p-1 rounded">
                    {(() => {
                      const IconComponent = paymentMethods.find(m => m.id === paymentMethod)!.icon;
                      return <IconComponent className="h-3 w-3 text-black" />;
                    })()}
                  </div>
                )}
                <span className="text-sm font-medium text-yellow-100">
                  Pagamento: {paymentMethods.find(m => m.id === paymentMethod)?.name}
                </span>
              </div>
              
              {paymentMethod === 'cash' && amountReceived > 0 && (
                <p className="text-xs text-yellow-300">
                  Recebido: {formatBRL(amountReceived)}
                  {change > 0 && ` | Troco: ${formatBRL(change)}`}
                </p>
              )}
              
              {paymentMethod === 'credit' && installments > 1 && (
                <p className="text-xs text-yellow-300">
                  Parcelado em {installments}x
                </p>
              )}
              
              {paymentMethod === 'tab' && customerName && (
                <p className="text-xs text-yellow-300">
                  Cliente: {customerName}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <Separator />
        
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={resetForm}
            className="flex-1 bg-black text-yellow-500 border-yellow-500 hover:bg-yellow-500 hover:text-black"
          >
            Limpar Formulário
          </Button>
          
          <Button
            type="submit"
            disabled={isLoading || (paymentMethod === 'cash' && amountReceived < total)}
            className="flex-1 bg-yellow-500 text-black hover:bg-yellow-600"
            size="lg"
          >
            {isLoading ? (
              'Processando...'
            ) : (
              <>
                <Receipt className="h-4 w-4 mr-2" />
                Finalizar Venda ({formatBRL(total)})
              </>
            )}
          </Button>
        </div>
      </form>
    </Card>
  );
}