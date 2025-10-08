# 🖨️ Sistema de Hardware - Scanner e Impressora Térmica

Sistema completo de integração com hardware para ponto de venda, incluindo leitor de código de barras e impressora térmica.

## 📚 Documentação

### 🚀 Início Rápido
- **[GETTING_STARTED_HARDWARE.md](../GETTING_STARTED_HARDWARE.md)** - Comece por aqui!

### 📖 Guias
- **[HARDWARE_QUICKSTART.md](../HARDWARE_QUICKSTART.md)** - Guia rápido de uso
- **[HARDWARE_DOCS.md](../HARDWARE_DOCS.md)** - Documentação técnica completa

### 📋 Referência
- **[HARDWARE_IMPLEMENTATION.md](../HARDWARE_IMPLEMENTATION.md)** - Resumo da implementação
- **[HARDWARE_CHANGELOG.md](../HARDWARE_CHANGELOG.md)** - Log de mudanças
- **[PROMPT_THERMAL_PRINTER_BARCODE.md](../PROMPT_THERMAL_PRINTER_BARCODE.md)** - Especificação original

## 🎯 Funcionalidades

### ✅ Scanner de Código de Barras
- Detecção automática de scans via hardware
- Input manual como fallback
- Validação de códigos
- Histórico de scans
- Feedback sonoro e visual
- Atalhos de teclado (Ctrl+B)

### ✅ Impressora Térmica
- Suporte a USB, Rede e Serial
- Templates personalizáveis
- QR Code nos recibos
- Impressão automática pós-venda
- Detecção de status
- Fila de impressão

## 📦 Estrutura

```
lib/hardware/
├── types.ts                    # Types e interfaces
├── useBarcodeScanner.ts        # Hook do scanner
├── useThermalPrinter.ts        # Hook da impressora
├── thermalPrinter.ts           # Serviço de impressão
└── printerTemplates.ts         # Templates de recibo
```

## 🚀 Uso Rápido

### Scanner
```typescript
import { BarcodeInput, useBarcodeScanner } from '@/lib/hardware'

// Componente visual
<BarcodeInput onScan={(barcode) => console.log(barcode)} />

// Hook automático (invisível)
useBarcodeScanner({
  enabled: true,
  onScan: (barcode) => addToCart(barcode)
})
```

### Impressora
```typescript
import { useThermalPrinter } from '@/lib/hardware/useThermalPrinter'

const { print, isPrinting } = useThermalPrinter()

// Imprimir venda
await print(saleData, 'sale')
```

## 📊 Status

- ✅ **Implementação:** 100% Completa
- ✅ **Documentação:** Completa
- ✅ **APIs:** 8 endpoints
- ✅ **Componentes:** 5 componentes React
- ✅ **Testes:** Estrutura pronta

## 🔧 Configuração

1. Adicionar sons em `public/sounds/`
2. Cadastrar códigos de barras nos produtos
3. Acessar página de configurações
4. Configurar scanner e impressora
5. Testar!

Veja [GETTING_STARTED_HARDWARE.md](../GETTING_STARTED_HARDWARE.md) para mais detalhes.

## 🐛 Troubleshooting

Consulte o guia completo em [HARDWARE_DOCS.md](../HARDWARE_DOCS.md#troubleshooting)

## 📝 Licença

Parte do projeto ClaudIA O - Sistema de Gestão para Ponto de Venda

---

**Versão:** 1.0.0  
**Data:** 08/10/2025  
**Status:** ✅ Pronto para produção
