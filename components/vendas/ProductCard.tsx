import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Product } from "@/lib/products";
import { useInventory } from '@/lib/useInventory';
import { toast } from 'sonner';
import { Plus, Star, Package } from "lucide-react";

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product, qty?: number) => void;
  isFavorite: boolean;
  onToggleFavorite: (productId: string) => void;
}

const formatBRL = (value: number) => 
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function ProductCard({ 
  product, 
  onAddToCart, 
  isFavorite, 
  onToggleFavorite 
}: ProductCardProps) {
  const [quantity, setQuantity] = useState(1);
  const { getStockLevel } = useInventory();
  
  const stockLevel = getStockLevel(product.id, 'ponto_venda');
  const isLowStock = stockLevel <= 5;
  const isOutOfStock = stockLevel === 0;

  const handleAddToCart = () => {
    if (quantity > stockLevel) {
      toast.error(`Quantidade indisponível! Estoque: ${stockLevel}`);
      return;
    }
    onAddToCart(product, quantity);
    setQuantity(1);
  };

  const handleQuickAdd = () => {
    onAddToCart(product, 1);
  };

  return (
    <Card className={`p-4 hover:shadow-md transition-all duration-200 bg-black border-yellow-500 ${isOutOfStock ? 'opacity-50' : ''} ${isFavorite ? 'ring-2 ring-yellow-400' : ''}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-yellow-100">{product.name}</h3>
            {isFavorite && <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />}
          </div>
          <p className="text-sm text-yellow-300 mb-1">{product.size}</p>
          <p className="text-lg font-bold text-yellow-500">
            {formatBRL(product.price)}
          </p>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onToggleFavorite(product.id)}
          className="p-1 hover:bg-yellow-900"
        >
          <Star className={`h-4 w-4 ${isFavorite ? 'fill-yellow-400 text-yellow-400' : 'text-yellow-600'}`} />
        </Button>
      </div>
      
      <div className="flex items-center justify-between mb-3">
        <Badge 
          variant={isOutOfStock ? 'destructive' : isLowStock ? 'secondary' : 'default'}
          className={`flex items-center gap-1 ${
            isOutOfStock 
              ? 'bg-red-600 text-white' 
              : isLowStock 
                ? 'bg-yellow-600 text-black' 
                : 'bg-yellow-500 text-black'
          }`}
        >
          <Package className="h-3 w-3" />
          {stockLevel} em estoque
        </Badge>
      </div>
      
      {!isOutOfStock && (
        <div className="flex items-center gap-2 mb-3">
          <Input
            type="number"
            min="1"
            max={stockLevel}
            value={quantity}
            onChange={(e) => setQuantity(Math.min(Number(e.target.value), stockLevel))}
            className="w-20 bg-black border-yellow-500 text-yellow-100"
          />
          <span className="text-sm text-yellow-300">unidades</span>
        </div>
      )}
      
      <div className="flex gap-2">
        <Button
          onClick={handleQuickAdd}
          disabled={isOutOfStock}
          variant="outline"
          className="flex-1 bg-black text-yellow-500 border-yellow-500 hover:bg-yellow-500 hover:text-black"
        >
          <Plus className="h-4 w-4 mr-1" />
          +1
        </Button>
        
        <Button
          onClick={handleAddToCart}
          disabled={isOutOfStock || quantity <= 0}
          className="flex-1 bg-yellow-500 text-black hover:bg-yellow-600"
        >
          <Plus className="h-4 w-4 mr-1" />
          Adicionar {quantity > 1 ? `(${quantity})` : ''}
        </Button>
      </div>
      
      {isOutOfStock && (
        <p className="text-center text-red-400 text-sm mt-2 font-medium">
          Produto em falta
        </p>
      )}
    </Card>
  );
}