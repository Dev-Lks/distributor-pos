#!/bin/bash

# Script para adicionar force-dynamic em todas as rotas de API
# Isso garante que nenhuma rota seja cacheada em produção

echo "🔄 Adicionando force-dynamic em todas as rotas de API..."

# Encontrar todos os arquivos route.ts dentro de app/api
find app/api -name "route.ts" -type f | while read -r file; do
  # Verificar se já tem export const dynamic
  if grep -q "export const dynamic" "$file"; then
    echo "✓ $file já tem dynamic configurado"
  else
    # Encontrar a primeira linha de import
    first_import=$(grep -n "^import" "$file" | head -1 | cut -d: -f1)
    
    if [ -n "$first_import" ]; then
      # Encontrar a última linha de import consecutiva
      last_import=$(awk -v start="$first_import" '
        NR >= start && /^import/ { last = NR }
        NR >= start && !/^import/ && !/^$/ && !/^\/\// { exit }
        END { print last }
      ' "$file")
      
      if [ -n "$last_import" ]; then
        # Inserir após os imports
        insert_line=$((last_import + 1))
        
        # Criar arquivo temporário
        temp_file="${file}.tmp"
        
        # Inserir as linhas
        awk -v line="$insert_line" '
          NR == line {
            print ""
            print "// Force dynamic rendering - critical for real-time updates"
            print "export const dynamic = '\''force-dynamic'\''"
            print "export const revalidate = 0"
          }
          { print }
        ' "$file" > "$temp_file"
        
        # Substituir arquivo original
        mv "$temp_file" "$file"
        
        echo "✅ $file atualizado"
      fi
    fi
  fi
done

echo ""
echo "✨ Concluído! Todas as rotas de API foram configuradas para force-dynamic"
echo "📝 Faça commit e deploy para aplicar as mudanças em produção"
