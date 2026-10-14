"use client"

import { useState, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, Download, FileText, AlertCircle, CheckCircle2, X } from "lucide-react"
import { toast } from "sonner"

interface ImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImportComplete: () => void
}

export function ImportDialog({ open, onOpenChange, onImportComplete }: ImportDialogProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [previewData, setPreviewData] = useState<any[]>([])
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.csv') && !selectedFile.name.endsWith('.xlsx')) {
        toast.error("Por favor, selecione um arquivo CSV ou Excel")
        return
      }
      setFile(selectedFile)
      parseFile(selectedFile)
    }
  }

  const parseFile = async (file: File) => {
    // Aqui implementaria a lógica de parsing do CSV/Excel
    // Por enquanto, apenas um exemplo
    try {
      const text = await file.text()
      const lines = text.split('\n')
      const headers = lines[0].split(',')
      
      // Validação básica de headers
      const requiredHeaders = ['name', 'size', 'cost', 'salePrice']
      const missingHeaders = requiredHeaders.filter(h => !headers.includes(h))
      
      if (missingHeaders.length > 0) {
        setValidationErrors([`Colunas obrigatórias faltando: ${missingHeaders.join(', ')}`])
        return
      }
      
      // Preview das primeiras 5 linhas
      const preview = lines.slice(1, 6).map(line => {
        const values = line.split(',')
        return headers.reduce((obj: any, header, index) => {
          obj[header.trim()] = values[index]?.trim()
          return obj
        }, {})
      })
      
      setPreviewData(preview)
      setValidationErrors([])
    } catch (error) {
      console.error("Error parsing file:", error)
      setValidationErrors(["Erro ao ler o arquivo"])
    }
  }

  const handleImport = async () => {
    if (!file) return

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/products/import', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erro ao importar produtos')
      }

      const result = await response.json()
      toast.success(`${result.imported} produtos importados com sucesso!`)
      onImportComplete()
      handleClose()
    } catch (error) {
      console.error("Import error:", error)
      toast.error(error instanceof Error ? error.message : "Erro ao importar produtos")
    } finally {
      setIsUploading(false)
    }
  }

  const handleDownloadTemplate = () => {
    const template = `name,size,category,brand,cost,salePrice,supplier,bonifications,sku,packaging
Distribuidora Lager,600ml,Cerveja,Distribuidora,5.50,12.00,Distribuidora XYZ,0,EX-LAGER-600,Long Neck
Distribuidora IPA,350ml,Cerveja,Distribuidora,6.00,15.00,Distribuidora XYZ,0,EX-IPA-350,Lata`

    const blob = new Blob([template], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'template-produtos.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleClose = () => {
    setFile(null)
    setPreviewData([])
    setValidationErrors([])
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Importar Produtos em Massa
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Download Template */}
          <Alert>
            <FileText className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>Baixe o template para facilitar a importação</span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadTemplate}
              >
                <Download className="mr-2 h-4 w-4" />
                Download Template
              </Button>
            </AlertDescription>
          </Alert>

          {/* File Upload */}
          <div className="border-2 border-dashed rounded-lg p-8 text-center">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx"
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer flex flex-col items-center gap-3"
            >
              <Upload className="h-12 w-12 text-muted-foreground" />
              <div>
                <p className="font-medium">
                  {file ? file.name : "Clique para selecionar ou arraste o arquivo"}
                </p>
                <p className="text-sm text-muted-foreground">
                  Formatos aceitos: CSV, Excel (.xlsx)
                </p>
              </div>
            </label>
          </div>

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  {validationErrors.map((error, index) => (
                    <p key={index}>{error}</p>
                  ))}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Preview */}
          {previewData.length > 0 && validationErrors.length === 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                Preview (primeiras 5 linhas)
              </div>
              <div className="border rounded-lg overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-4 py-2 text-left">Nome</th>
                      <th className="px-4 py-2 text-left">Tamanho</th>
                      <th className="px-4 py-2 text-left">Categoria</th>
                      <th className="px-4 py-2 text-left">Custo</th>
                      <th className="px-4 py-2 text-left">Preço</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.map((row, index) => (
                      <tr key={index} className="border-t">
                        <td className="px-4 py-2">{row.name}</td>
                        <td className="px-4 py-2">{row.size}</td>
                        <td className="px-4 py-2">{row.category}</td>
                        <td className="px-4 py-2">R$ {row.cost}</td>
                        <td className="px-4 py-2">R$ {row.salePrice}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            <X className="mr-2 h-4 w-4" />
            Cancelar
          </Button>
          <Button
            onClick={handleImport}
            disabled={!file || validationErrors.length > 0 || isUploading}
          >
            {isUploading ? (
              <>
                <span className="mr-2 h-4 w-4 animate-spin">⏳</span>
                Importando...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Importar Produtos
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
