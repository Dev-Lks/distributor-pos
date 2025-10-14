#!/bin/bash

# Script para substituir console.error por logger.error nas rotas de API
# e adicionar import do logger onde necessário

echo "🔄 Substituindo console.error por logger.error nas rotas de API..."

# Lista de arquivos para processar
files=(
  "app/api/users/route.ts"
  "app/api/users/[id]/route.ts"
  "app/api/analytics/kpis/route.ts"
  "app/api/analytics/top-products/route.ts"
  "app/api/analytics/recent-activity/route.ts"
  "app/api/analytics/team-performance/route.ts"
  "app/api/analytics/stock-alerts/route.ts"
  "app/api/analytics/upcoming-events/route.ts"
  "app/api/delivery/route.ts"
  "app/api/delivery-drivers/route.ts"
  "app/api/delivery-drivers/[id]/route.ts"
  "app/api/reports/daily/route.ts"
  "app/api/reports/daily/cron/route.ts"
  "app/api/reports/daily/[id]/route.ts"
  "app/api/reports/daily/[id]/resend/route.ts"
  "app/api/reports/[id]/csv/route.ts"
  "app/api/reports/[id]/pdf/route.ts"
  "app/api/cash-sessions/[id]/route.ts"
  "app/api/cash-sessions/[id]/transactions/route.ts"
  "app/api/cash-sessions/current/route.ts"
  "app/api/customers/[id]/route.ts"
  "app/api/sales/[id]/route.ts"
  "app/api/pending-carts/route.ts"
  "app/api/inventory/audits/route.ts"
  "app/api/product-points-of-sale/route.ts"
  "app/api/hardware/printer/test/route.ts"
  "app/api/hardware/printer/print/route.ts"
  "app/api/hardware/printer/status/route.ts"
  "app/api/hardware/printer/configure/route.ts"
  "app/api/hardware/config/route.ts"
  "app/api/hardware/config/[pointOfSaleId]/route.ts"
)

count=0

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    # Verificar se já tem import do logger
    if ! grep -q "import { logger } from '@/lib/logger'" "$file"; then
      # Adicionar import do logger após outros imports
      sed -i "1a import { logger } from '@/lib/logger'" "$file"
      echo "  ✅ Adicionado import em $file"
    fi
    
    # Substituir console.error por logger.error
    # Padrão: console.error('message', error) -> logger.error('message', { error })
    # Padrão: console.error('message:', error) -> logger.error('message', { error })
    if grep -q "console.error" "$file"; then
      sed -i "s/console\.error(\([^,]*\),\s*error)/logger.error(\1, { error })/g" "$file"
      sed -i "s/console\.error(\([^)]*\))/logger.error(\1)/g" "$file"
      echo "  ✅ Substituído console.error em $file"
      ((count++))
    fi
  fi
done

echo ""
echo "✅ Processamento concluído!"
echo "📊 Arquivos modificados: $count"
echo ""
echo "⚠️  IMPORTANTE: Revise os arquivos modificados para garantir que as mudanças estão corretas."
echo "   Alguns console.error podem precisar de ajustes manuais no formato dos parâmetros."
