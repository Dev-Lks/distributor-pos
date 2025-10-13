#!/bin/bash

# Script de diagnóstico da impressora
# Uso: ./diagnostico-impressora.sh

echo "🔍 DIAGNÓSTICO DA IMPRESSORA"
echo "================================"
echo ""

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para testar endpoint
test_endpoint() {
  local url=$1
  local method=$2
  local token=$3
  local description=$4
  
  echo -n "🧪 Testando: $description... "
  
  if [ "$method" = "GET" ]; then
    if [ -n "$token" ]; then
      response=$(curl -s -w "\n%{http_code}" -H "Authorization: Bearer $token" "$url")
    else
      response=$(curl -s -w "\n%{http_code}" "$url")
    fi
  else
    if [ -n "$token" ]; then
      response=$(curl -s -w "\n%{http_code}" -X POST -H "Authorization: Bearer $token" -H "Content-Type: application/json" "$url")
    else
      response=$(curl -s -w "\n%{http_code}" -X POST -H "Content-Type: application/json" "$url")
    fi
  fi
  
  http_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | head -n-1)
  
  if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
    echo -e "${GREEN}✅ OK ($http_code)${NC}"
  elif [ "$http_code" = "401" ]; then
    echo -e "${RED}❌ ERRO 401 - Token inválido ou não configurado${NC}"
    echo "   Resposta: $body"
  elif [ "$http_code" = "503" ]; then
    echo -e "${RED}❌ ERRO 503 - Servidor não disponível${NC}"
    echo "   Resposta: $body"
  elif [ "$http_code" = "000" ]; then
    echo -e "${RED}❌ ERRO - Não foi possível conectar${NC}"
  else
    echo -e "${YELLOW}⚠️  AVISO ($http_code)${NC}"
    echo "   Resposta: $body"
  fi
}

# Configuração
PRINT_SERVER_URL=${PRINT_SERVER_URL:-"https://print.nitrobeer.com.br"}
AUTH_TOKEN=${AUTH_TOKEN:-""}

echo "📍 Print Server URL: $PRINT_SERVER_URL"
echo ""

# Verificar se o token está configurado
if [ -z "$AUTH_TOKEN" ]; then
  echo -e "${YELLOW}⚠️  Token não configurado${NC}"
  echo "   Para testar com autenticação, defina: export AUTH_TOKEN='seu-token'"
  echo ""
fi

# Testes
echo "1️⃣  TESTES BÁSICOS (sem autenticação)"
echo "-----------------------------------"
test_endpoint "$PRINT_SERVER_URL/api/health" "GET" "" "Health check"
echo ""

if [ -n "$AUTH_TOKEN" ]; then
  echo "2️⃣  TESTES COM AUTENTICAÇÃO"
  echo "-----------------------------------"
  test_endpoint "$PRINT_SERVER_URL/api/printer/status" "GET" "$AUTH_TOKEN" "Status da impressora"
  test_endpoint "$PRINT_SERVER_URL/api/printer/test" "POST" "$AUTH_TOKEN" "Teste de impressão"
  test_endpoint "$PRINT_SERVER_URL/api/printer/configure" "POST" "$AUTH_TOKEN" "Configuração"
  echo ""
else
  echo "2️⃣  TESTES COM AUTENTICAÇÃO"
  echo "-----------------------------------"
  echo -e "${YELLOW}⚠️  Pulado - Token não configurado${NC}"
  echo "   Execute: export AUTH_TOKEN='seu-token' && ./diagnostico-impressora.sh"
  echo ""
fi

echo "3️⃣  TESTE DE DELIVERY (sem autenticação)"
echo "-----------------------------------"
test_endpoint "$PRINT_SERVER_URL/print" "POST" "" "Endpoint de delivery"
echo ""

echo "================================"
echo "✨ Diagnóstico concluído!"
echo ""
echo "📝 INSTRUÇÕES:"
echo ""
if [ -z "$AUTH_TOKEN" ]; then
  echo "❌ Configure o token para testar completamente:"
  echo "   export AUTH_TOKEN='valor-do-AUTH_TOKEN-do-print-server'"
  echo "   ./diagnostico-impressora.sh"
  echo ""
fi
echo "🔧 Se houver erro 401:"
echo "   - Verifique se PRINT_SERVER_TOKEN está configurado na Vercel"
echo "   - Certifique-se que é o MESMO valor do AUTH_TOKEN do print-server"
echo ""
echo "🔧 Se houver erro 503:"
echo "   - Verifique se o print-server está rodando: pm2 status"
echo "   - Verifique se o Cloudflare Tunnel está ativo"
echo "   - Teste diretamente: curl $PRINT_SERVER_URL/api/health"
echo ""

