"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { BarcodeInput } from "@/components/hardware/BarcodeInput"
import { Barcode, AlertCircle, Zap, Package } from "lucide-react"

interface QuickBarcodeCreateProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

interface ProductBasicData {
  barcode: string
  name: string
  size: string
  cost: string
  salePrice: string
}

export function QuickBarcodeCreate({ open, onOpenChange, onSuccess }: QuickBarcodeCreateProps) {
  const [step, setStep] = useState<"scan" | "details">("scan")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [existingProduct, setExistingProduct] = useState<string | null>(null)
  const [formData, setFormData] = useState<ProductBasicData>({
    barcode: "",
    name: "",
    size: "",
    cost: "",
    salePrice: "",
  })

  const handleBarcodeDetected = async (barcode: string) => {
    setFormData((prev) => ({ ...prev, barcode }))

    // Verificar se produto já existe
    try {
      const response = await fetch(`/api/products/barcode/${barcode}`)
      if (response.ok) {
        const product = await response.json()
        setExistingProduct(product.name)
        toast.error(`Produto já cadastrado: ${product.name}`)
        return
      }
    } catch (error) {
      console.error("Error checking barcode:", error)
    }

    // Se não existe, avançar para detalhes
    setExistingProduct(null)
    setStep("details")
  }

  const handleSubmit = async () => {
    // Validação básica
    if (!formData.name.trim()) {
      toast.error("Informe o nome do produto")
      return
    }
    if (!formData.size.trim()) {
      toast.error("Informe o tamanho/volume")
      return
    }
    if (!formData.cost || parseFloat(formData.cost) <= 0) {
      toast.error("Informe um custo válido")
      return
    }
    if (!formData.salePrice || parseFloat(formData.salePrice) <= 0) {
      toast.error("Informe um preço de venda válido")
      return
    }

    setIsSubmitting(true)
    try {
      const payload = {
        name: formData.name.trim(),
        size: formData.size.trim(),
        cost: parseFloat(formData.cost),
        salePrice: parseFloat(formData.salePrice),
        barcode: formData.barcode.trim(),
        isActive: true,
      }

      const response = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || "Erro ao cadastrar produto")
      }

      toast.success("🎉 Produto cadastrado via código de barras!")
      handleClose()
      onSuccess()
    } catch (error) {
      console.error("Error creating product:", error)
      toast.error(error instanceof Error ? error.message : "Erro ao cadastrar produto")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setStep("scan")
    setFormData({
      barcode: "",
      name: "",
      size: "",
      cost: "",
      salePrice: "",
    })
    setExistingProduct(null)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Cadastro Rápido por Código de Barras
          </DialogTitle>
          <DialogDescription>
            {step === "scan"
              ? "Escaneie ou digite o código de barras do produto"
              : "Preencha os dados básicos do produto"}
          </DialogDescription>
        </DialogHeader>

        {step === "scan" && (
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <Barcode className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground mb-2">
                  Aguardando leitura do scanner...
                </p>
                <p className="text-xs text-muted-foreground">
                  Ou digite manualmente abaixo
                </p>
              </div>
            </div>

            <BarcodeInput
              onScan={handleBarcodeDetected}
              autoFocus
              showHistory={false}
            />

            {existingProduct && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Produto já existe:</strong> {existingProduct}
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {step === "details" && (
          <div className="space-y-4 py-4">
            <Alert>
              <Package className="h-4 w-4" />
              <AlertDescription className="text-xs">
                <strong>Código de barras:</strong> {formData.barcode}
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="quick-name">Nome do Produto *</Label>
              <Input
                id="quick-name"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Heineken Long Neck"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quick-size">Tamanho/Volume *</Label>
              <Input
                id="quick-size"
                value={formData.size}
                onChange={(e) => setFormData((prev) => ({ ...prev, size: e.target.value }))}
                placeholder="Ex: 330ml, 600ml, 1L"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quick-cost">Custo (R$) *</Label>
                <Input
                  id="quick-cost"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.cost}
                  onChange={(e) => setFormData((prev) => ({ ...prev, cost: e.target.value }))}
                  placeholder="0,00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="quick-price">Preço Venda (R$) *</Label>
                <Input
                  id="quick-price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.salePrice}
                  onChange={(e) => setFormData((prev) => ({ ...prev, salePrice: e.target.value }))}
                  placeholder="0,00"
                />
              </div>
            </div>

            {formData.cost && formData.salePrice && parseFloat(formData.salePrice) > 0 && (
              <Alert>
                <AlertDescription className="text-xs">
                  <strong>Margem:</strong>{" "}
                  {(
                    ((parseFloat(formData.salePrice) - parseFloat(formData.cost)) /
                      parseFloat(formData.cost)) *
                    100
                  ).toFixed(1)}
                  % • <strong>Lucro:</strong> R${" "}
                  {(parseFloat(formData.salePrice) - parseFloat(formData.cost)).toFixed(2)}
                </AlertDescription>
              </Alert>
            )}

            <p className="text-xs text-muted-foreground">
              💡 Você poderá adicionar mais detalhes editando o produto depois
            </p>
          </div>
        )}

        <DialogFooter>
          {step === "scan" && (
            <Button variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
          )}
          {step === "details" && (
            <>
              <Button variant="outline" onClick={() => setStep("scan")} disabled={isSubmitting}>
                Voltar
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? "Cadastrando..." : "Cadastrar Produto"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
