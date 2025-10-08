'use client';

import { useState, useEffect, useCallback } from 'react';
import { useBarcodeScanner } from '@/lib/hardware/useBarcodeScanner';
import { useThermalPrinter } from '@/lib/hardware/useThermalPrinter';
import { useCashSession } from '@/lib/useCashSession';
import { usePointsOfSale } from '@/lib/usePointsOfSale';
import { useProducts, type Product } from '@/lib/useProducts';

// V2 Components
import { POSHeader } from './components/v2/POSHeader';
import { POSCart } from './components/v2/POSCart';
import { POSProducts } from './components/v2/POSProducts';
import { POSPayment } from './components/v2/POSPayment';
import { POSSessionControl } from './components/v2/POSSessionControl';
import { POSCustomerDialog } from './components/v2/POSCustomerDialog';

/**
 * PDV Moderno - Modern Point of Sale Interface
 * 
 * Features:
 * - Barcode scanner integration (USB/Bluetooth)
 * - Thermal printer auto-print
 * - Keyboard shortcuts (F2, F3, F9, F12, Shift+F4)
 * - Real-time cash session management
 * - Scanner-first workflow for speed
 * 
 * Target: Reduce transaction time from 30-45s to 5-10s
 */
export default function ModernPOSPage() {
  // === STATE ===
  const [selectedPointId, setSelectedPointId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false);
  
  // Cart State
  const [cart, setCart] = useState<Array<{
    id: string;
    name: string;
    size: string;
    salePrice: number;
    quantity: number;
    stock: number;
    addedVia: 'manual' | 'barcode';
  }>>([]);

  // Customer State
  const [customer, setCustomer] = useState<{
    name: string;
    document?: string;
    phone?: string;
  } | null>(null);

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'pix'>('cash');
  const [cashReceived, setCashReceived] = useState<string>('0');
  const [isProcessing, setIsProcessing] = useState(false);

  // === DATA HOOKS ===
  const pointsQuery = usePointsOfSale();
  const productsQuery = useProducts();
  const sessionHook = useCashSession(selectedPointId);

  // === HARDWARE HOOKS ===
  const scanner = useBarcodeScanner({
    enabled: sessionHook.session?.status === 'OPEN',
    onScan: (barcode: string) => {
      console.log('Barcode scanned:', barcode);
    },
  });

  const printer = useThermalPrinter();

  // === DERIVED STATE ===
  const points = pointsQuery.data || [];
  const products = productsQuery.data || [];
  const session = sessionHook.session;
  const isSessionOpen = session?.status === 'OPEN';
  const isLoading = pointsQuery.isLoading || sessionHook.isLoading || productsQuery.isLoading;

  const cartTotal = cart.reduce((sum, item) => sum + item.salePrice * item.quantity, 0);
  const change = paymentMethod === 'cash' ? Math.max(0, parseFloat(cashReceived || '0') - cartTotal) : 0;
  const canFinalize = cart.length > 0 && isSessionOpen && !isProcessing;

  // Enrich products with available stock
  const enrichedProducts = products.map((product: Product) => ({
    ...product,
    availableStock: product.inventory?.totalQuantity || 0,
  }));

  // === AUTO-SELECT FIRST POINT ===
  useEffect(() => {
    if (!selectedPointId && points.length > 0) {
      setSelectedPointId(points[0].id);
    }
  }, [points, selectedPointId]);

  // === BARCODE SCAN HANDLER ===
  useEffect(() => {
    const lastScan = scanner.lastScanned;
    if (!lastScan || !isSessionOpen) return;

    // Find product by barcode
    const product = enrichedProducts.find(p => p.barcode === lastScan);
    
    if (!product) {
      console.warn('[Scanner] Product not found:', lastScan);
      return;
    }

    if (product.availableStock <= 0) {
      console.warn('[Scanner] Product out of stock:', product.name);
      return;
    }

    // Add to cart via barcode
    handleAddToCart(product, 'barcode');
  }, [scanner.lastScanned, isSessionOpen]);

  // === CART MANAGEMENT ===
  const handleAddToCart = useCallback((product: any, via: 'manual' | 'barcode') => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      
      if (existing) {
        // Increment quantity
        return prev.map(item =>
          item.id === product.id
            ? { ...item, quantity: Math.min(item.quantity + 1, item.stock) }
            : item
        );
      }

      // Add new item
      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          size: product.size,
          salePrice: product.salePrice,
          quantity: 1,
          stock: product.availableStock,
          addedVia: via,
        },
      ];
    });
  }, []);

  const handleUpdateQuantity = useCallback((id: string, delta: number) => {
    setCart(prev =>
      prev.map(item => {
        if (item.id === id) {
          const newQty = item.quantity + delta;
          return { ...item, quantity: Math.max(1, Math.min(newQty, item.stock)) };
        }
        return item;
      })
    );
  }, []);

  const handleRemoveItem = useCallback((id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  }, []);

  const handleClearCart = useCallback(() => {
    setCart([]);
    setCustomer(null);
    setPaymentMethod('cash');
    setCashReceived('0');
  }, []);

  // === PAYMENT FINALIZATION ===
  const handleFinalize = useCallback(async () => {
    if (!canFinalize) return;

    setIsProcessing(true);
    try {
      // Create sale (placeholder - implement actual API call)
      const saleData = {
        pointOfSaleId: selectedPointId,
        sessionId: session?.id,
        items: cart.map(item => ({
          productId: item.id,
          quantity: item.quantity,
          price: item.salePrice,
        })),
        paymentMethod,
        total: cartTotal,
        cashReceived: paymentMethod === 'cash' ? parseFloat(cashReceived) : undefined,
        change: paymentMethod === 'cash' ? change : undefined,
        customer,
      };

      console.log('[Sale] Creating sale:', saleData);

      // TODO: Call createSale API

      // Auto-print receipt
      if (printer.status.connected) {
        await printer.print(saleData, 'sale');
      }

      // Clear cart
      handleClearCart();
      productsQuery.refetch();

      console.log('[Sale] Sale completed successfully');
    } catch (error) {
      console.error('[Sale] Error:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [
    canFinalize,
    selectedPointId,
    session,
    cart,
    paymentMethod,
    cartTotal,
    cashReceived,
    change,
    customer,
    printer,
    handleClearCart,
    productsQuery,
  ]);

  // === KEYBOARD SHORTCUTS ===
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // F3: Toggle search focus
      if (e.key === 'F3') {
        e.preventDefault();
        document.getElementById('product-search')?.focus();
      }

      // F9: Open customer dialog
      if (e.key === 'F9') {
        e.preventDefault();
        if (isSessionOpen) setCustomerDialogOpen(true);
      }

      // F12: Finalize sale
      if (e.key === 'F12') {
        e.preventDefault();
        if (canFinalize) handleFinalize();
      }

      // Shift+F4: Clear cart
      if (e.shiftKey && e.key === 'F4') {
        e.preventDefault();
        handleClearCart();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSessionOpen, canFinalize, handleFinalize, handleClearCart]);

  // === LOADING STATE ===
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando PDV...</p>
        </div>
      </div>
    );
  }

  // === RENDER ===
  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <POSHeader
        points={points}
        selectedPointId={selectedPointId}
        onPointChange={setSelectedPointId}
        session={session}
        printerStatus={printer.status}
        isScanning={scanner.isScanning}
      />

      {/* Main Content: Products + Cart/Payment */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Products */}
        <div className="w-1/2 border-r">
          <POSProducts
            products={enrichedProducts}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onProductClick={(product) => handleAddToCart(product, 'manual')}
            isSessionOpen={isSessionOpen}
          />
        </div>

        {/* Right: Cart + Payment */}
        <div className="w-1/2 flex flex-col">
          {/* Cart */}
          <div className="flex-1 overflow-auto">
            <POSCart
              cart={cart}
              onUpdateQuantity={handleUpdateQuantity}
              onRemoveItem={handleRemoveItem}
              onClearCart={handleClearCart}
              customer={customer}
              onCustomerClick={() => setCustomerDialogOpen(true)}
            />
          </div>

          {/* Payment */}
          <POSPayment
            total={cartTotal}
            itemCount={cart.length}
            paymentMethod={paymentMethod}
            onPaymentMethodChange={setPaymentMethod}
            cashReceived={cashReceived}
            onCashReceivedChange={setCashReceived}
            change={change}
            isProcessing={isProcessing}
            onFinalize={handleFinalize}
            canFinalize={canFinalize}
            printerConnected={printer.status.connected}
            onReprint={async () => {}} // TODO: Implement reprint
            hasLastSale={false} // TODO: Track last sale
          />
        </div>
      </div>

      {/* Footer: Session Control */}
      <POSSessionControl
        session={session}
        pointOfSaleId={selectedPointId}
        isLoading={sessionHook.isLoading}
      />

      {/* Dialogs */}
      <POSCustomerDialog
        open={customerDialogOpen}
        onOpenChange={setCustomerDialogOpen}
        customer={customer}
        onCustomerSet={setCustomer}
      />
    </div>
  );
}
