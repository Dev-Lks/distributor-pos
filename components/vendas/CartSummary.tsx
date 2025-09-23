import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Product } from "@/lib/products";
import { Plus, Minus, Trash2, ShoppingCart, CreditCard } from "lucide-react";

type CartItem = { 
  product: Product; 
  qty: number; 
  discount?: number;
  notes?: string;
};

interface CartSummaryProps {
  cart: CartItem[];
  onUpdateQuantity: (productId: string, qty: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  onProceedToPayment: () => void;
  discount?: number;
}

const formatBRL = (value: number) => 
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function CartSummary({
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onProceedToPayment,
  discount = 0
}: CartSummaryProps) {
  const subtotal = cart.reduce((sum, item) => sum + (item.product.price * item.qty), 0);
  const discountAmount = (subtotal * discount) / 100;
  const total = subtotal - discountAmount;
  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);

  if (cart.length === 0) {
    return (
      <Card className="p-8 bg-black border-yellow-500">
        <div className="text-center">
          <ShoppingCart className="h-16 w-16 text-yellow-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-yellow-100 mb-2">Carrinho Vazio</h3>
          <p className="text-yellow-300 mb-4">Adicione produtos para começar uma venda</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-black border-yellow-500">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold flex items-center gap-2 text-yellow-100">
          <ShoppingCart className="h-5 w-5" />
          Carrinho ({totalItems} {totalItems === 1 ? 'item' : 'itens'})
        </h2>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onClearCart}
          className="bg-black text-yellow-500 border-yellow-500 hover:bg-yellow-500 hover:text-black"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Limpar
        </Button>
      </div>
      
      <div className="space-y-4 mb-6">
        {cart.map((item, index) => (
          <div key={`${item.product.id}-${index}`}>
            <div className="flex items-center gap-4 p-4 border border-yellow-500 rounded-lg hover:bg-yellow-900/20 transition-colors bg-black">
              <div className="flex-1">
                <h3 className="font-medium text-yellow-100">{item.product.name}</h3>
                <p className="text-sm text-yellow-300">{item.product.size}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="text-xs bg-yellow-600 text-black">
                    {formatBRL(item.product.price)} cada
                  </Badge>
                  <span className="text-sm text-yellow-300">×</span>
                  <Badge variant="outline" className="text-xs border-yellow-500 text-yellow-300">
                    {item.qty} {item.qty === 1 ? 'unidade' : 'unidades'}
                  </Badge>
                </div>
                <p className="text-sm font-semibold text-yellow-500 mt-1">
                  Subtotal: {formatBRL(item.product.price * item.qty)}
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onUpdateQuantity(item.product.id, item.qty - 1)}
                    disabled={item.qty <= 1}
                    className="bg-black text-yellow-500 border-yellow-500 hover:bg-yellow-500 hover:text-black"
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  
                  <span className="w-8 text-center font-medium text-sm text-yellow-100">
                    {item.qty}
                  </span>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onUpdateQuantity(item.product.id, item.qty + 1)}
                    className="bg-black text-yellow-500 border-yellow-500 hover:bg-yellow-500 hover:text-black"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => onRemoveItem(item.product.id)}
                  className="bg-red-600 hover:bg-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <Separator className="my-4" />
      
      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-yellow-300">Subtotal:</span>
          <span className="font-medium text-yellow-100">{formatBRL(subtotal)}</span>
        </div>
        
        {discount > 0 && (
          <div className="flex justify-between text-sm text-red-400">
            <span>Desconto ({discount}%):</span>
            <span>-{formatBRL(discountAmount)}</span>
          </div>
        )}
        
        <Separator className="bg-yellow-600" />
        
        <div className="flex justify-between text-lg font-bold">
          <span className="text-yellow-100">Total:</span>
          <span className="text-yellow-500">{formatBRL(total)}</span>
        </div>
      </div>
      
      <Button
        onClick={onProceedToPayment}
        className="w-full mt-6 bg-yellow-500 text-black hover:bg-yellow-600"
        size="lg"
      >
        <CreditCard className="h-4 w-4 mr-2" />
        Finalizar Compra
      </Button>
    </Card>
  );
}