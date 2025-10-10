# PDV - Duas Versões Disponíveis

## 🔄 Estrutura Atual

O sistema possui **duas versões do PDV (Ponto de Venda)**:

### 1. PDV Clássico (Produção) 🏭
**Rota**: `/dashboard/sales`  
**Arquivo**: `app/(app)/dashboard/sales/page.tsx`  
**Status**: ✅ Em produção, estável, testado

**Características**:
- Interface tradicional testada e validada
- Grid de produtos com busca
- Carrinho com gestão de quantidades
- Formas de pagamento: Dinheiro, Cartão, PIX
- Gestão de sessão de caixa
- Pull-to-refresh
- Keyboard shortcuts
- Sistema de clientes

**Componentes**:
- `CartSection.tsx` - Carrinho de compras
- `ProductGrid.tsx` - Grade de produtos
- `PaymentPanel.tsx` - Painel de pagamento
- `CustomerDialog.tsx` - Diálogo de cliente
- `CashSessionPanel.tsx` - Painel de caixa
- `CashDialogs/` - Dialogs de abertura/fechamento de caixa

### 2. PDV Moderno (Experimental) 🚀
**Rota**: `/dashboard/sales/modern-pos` (a criar)  
**Arquivo**: `app/(app)/dashboard/sales/modern-pos.tsx`  
**Status**: ⚠️ Em desenvolvimento, experimental

**Características**:
- Interface redesenhada para hardware
- **Scanner de código de barras** (USB/Bluetooth)
- **Impressora térmica** com auto-print
- Keyboard shortcuts avançados (F2, F3, F9, F12, Shift+F4)
- Workflow scanner-first (5-10s por venda vs 30-45s)
- Real-time hardware status

**Componentes v2**:
- `v2/POSHeader.tsx` - Cabeçalho com status de hardware
- `v2/POSCart.tsx` - Carrinho com badges scanner/manual
- `v2/POSProducts.tsx` - Grid de produtos otimizado
- `v2/POSPayment.tsx` - Pagamento com valores rápidos
- `v2/POSSessionControl.tsx` - Controle de sessão
- `v2/POSCustomerDialog.tsx` - Diálogo de cliente

**Hardware**:
- `lib/hardware/useBarcodeScanner.ts` - Hook de scanner
- `lib/hardware/useThermalPrinter.ts` - Hook de impressora
- `lib/hardware/types.ts` - Interfaces

## 🎯 Quando Usar Cada Versão?

### Use o PDV Clássico se:
- ✅ Precisa de estabilidade em produção
- ✅ Não tem hardware adicional (scanner/impressora)
- ✅ Quer o sistema testado e validado
- ✅ Funciona bem com mouse/teclado padrão

### Use o PDV Moderno se:
- ⚠️ Tem scanner de código de barras USB/Bluetooth
- ⚠️ Tem impressora térmica configurada
- ⚠️ Quer testar workflow mais rápido
- ⚠️ Aceita riscos de versão experimental

## 🔄 Migração Futura

Quando o PDV Moderno estiver pronto para produção:

1. Testar extensivamente com hardware real
2. Validar todos os fluxos de venda
3. Treinar operadores
4. Fazer rollout gradual
5. Manter PDV Clássico como fallback

## 📊 Histórico

- **Outubro 2025**: PDV Moderno desenvolvido (commits 60d225b, a8c7fe9, e924a13)
- **Outubro 2025**: Restaurado PDV Clássico em `/sales` (commit 50631a9)
- **Sprint 2**: PDV Clássico com pull-to-refresh e gestos

## 🚧 Próximos Passos

### Para PDV Moderno:
- [ ] Criar rota `/sales/modern-pos`
- [ ] Testes com hardware real
- [ ] Documentação de setup de hardware
- [ ] Treinamento de operadores
- [ ] Migração gradual

### Para PDV Clássico:
- [x] Manter estável em produção
- [x] Bug fixes conforme necessário
- [ ] Pequenas melhorias de UX

## 📖 Documentação Adicional

- `PDV_MODERNO_SPEC.md` - Especificação técnica completa
- `PDV_MODERNO_QUICKSTART.md` - Guia rápido de implementação
- `PDV_MODERNO_STATUS.md` - Status da implementação
- `PROMPT_THERMAL_PRINTER_BARCODE.md` - Prompt de hardware

---

**Nota**: A UI quebrada reportada em `/sales` foi causada pela substituição acidental do PDV Clássico pelo PDV Moderno. Isso foi corrigido no commit 50631a9.
