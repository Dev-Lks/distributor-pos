#!/bin/bash

echo "╔═══════════════════════════════════════╗"
echo "║  🖨️  INSTALADOR DO SERVIDOR DE      ║"
echo "║      IMPRESSÃO TÉRMICA               ║"
echo "╚═══════════════════════════════════════╝"
echo ""

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Verificar Node.js
echo "🔍 Verificando Node.js..."
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js não encontrado!${NC}"
    echo "   Instale com:"
    echo "   - Ubuntu/Debian: sudo apt install nodejs npm"
    echo "   - CentOS/RHEL: sudo yum install nodejs npm"
    echo "   - Ou baixe em: https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v)
echo -e "${GREEN}✅ Node.js encontrado: $NODE_VERSION${NC}"
echo ""

# Verificar npm/pnpm
if command -v pnpm &> /dev/null; then
    PKG_MANAGER="pnpm"
    echo -e "${GREEN}✅ Usando pnpm${NC}"
elif command -v npm &> /dev/null; then
    PKG_MANAGER="npm"
    echo -e "${GREEN}✅ Usando npm${NC}"
else
    echo -e "${RED}❌ npm/pnpm não encontrado!${NC}"
    exit 1
fi
echo ""

# Instalar dependências
echo "📦 Instalando dependências..."
$PKG_MANAGER install

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Erro ao instalar dependências${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Dependências instaladas${NC}"
echo ""

# Criar .env se não existir
if [ ! -f .env ]; then
    echo "📝 Criando arquivo .env..."
    cp .env.example .env
    echo -e "${GREEN}✅ Arquivo .env criado${NC}"
    echo -e "${YELLOW}⚠️  IMPORTANTE: Edite o .env com suas configurações!${NC}"
    echo ""
else
    echo -e "${YELLOW}ℹ️  Arquivo .env já existe (não será sobrescrito)${NC}"
    echo ""
fi

# Detectar impressora (Linux)
echo "🔍 Procurando impressoras USB..."
if [ -e /dev/usb/lp0 ]; then
    echo -e "${GREEN}✅ Impressora encontrada em /dev/usb/lp0${NC}"
    
    # Verificar permissões
    if [ ! -w /dev/usb/lp0 ]; then
        echo -e "${YELLOW}⚠️  Sem permissão de escrita em /dev/usb/lp0${NC}"
        echo "   Execute: sudo chmod 666 /dev/usb/lp0"
        echo "   Ou adicione seu usuário ao grupo: sudo usermod -a -G lp $USER"
    else
        echo -e "${GREEN}✅ Permissões OK${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Nenhuma impressora USB detectada em /dev/usb/lp0${NC}"
    echo "   Se sua impressora está em outra porta, edite PRINTER_PORT no .env"
    echo "   Portas comuns:"
    echo "   - Linux USB: /dev/usb/lp0, /dev/usb/lp1"
    echo "   - Linux Serial: /dev/ttyUSB0, /dev/ttyS0"
    echo "   - Rede: 192.168.1.100:9100"
fi

echo ""

# Verificar PM2
echo "🔍 Verificando PM2..."
if command -v pm2 &> /dev/null; then
    echo -e "${GREEN}✅ PM2 encontrado$(NC)"
    PM2_INSTALLED=true
else
    echo -e "${YELLOW}⚠️  PM2 não instalado (opcional para produção)${NC}"
    echo "   Para instalar: npm install -g pm2"
    PM2_INSTALLED=false
fi

echo ""
echo "╔═══════════════════════════════════════╗"
echo "║  ✅ INSTALAÇÃO CONCLUÍDA             ║"
echo "╚═══════════════════════════════════════╝"
echo ""
echo -e "${GREEN}📋 Próximos passos:${NC}"
echo ""
echo "1️⃣  Edite o arquivo .env com suas configurações:"
echo -e "   ${YELLOW}nano .env${NC}"
echo "   - Configure PRINTER_PORT (porta da impressora)"
echo "   - Gere AUTH_TOKEN seguro"
echo "   - Configure ALLOWED_ORIGINS (domínios permitidos)"
echo ""
echo "2️⃣  Teste a impressora:"
echo -e "   ${YELLOW}npm run test${NC}"
echo ""
echo "3️⃣  Inicie o servidor:"
echo -e "   ${YELLOW}npm run dev${NC}  (desenvolvimento)"
if [ "$PM2_INSTALLED" = true ]; then
    echo -e "   ${YELLOW}pm2 start index.js --name print-server${NC}  (produção)"
else
    echo -e "   ${YELLOW}npm start${NC}  (produção)"
fi
echo ""
echo "4️⃣  Configure variáveis no projeto Next.js (.env):"
echo "   PRINT_SERVER_URL=http://localhost:3001"
echo "   PRINT_SERVER_TOKEN=seu-token-do-passo-1"
echo ""
echo -e "${GREEN}📚 Documentação completa:${NC}"
echo "   - README.md"
echo "   - ../TUTORIAL_IMPRESSORA_TERMICA.md"
echo "   - ../DEPLOY_IMPRESSORA_PRODUCAO.md"
echo ""
echo -e "${GREEN}✨ Pronto para imprimir!${NC}"
echo ""
echo "2. Configure a porta da impressora:"
echo "   PRINTER_PORT=/dev/usb/lp0"
echo ""
echo "3. MUDE o token de autenticação:"
echo "   AUTH_TOKEN=seu-token-forte-aqui"
echo ""
echo "4. Inicie o servidor:"
echo "   npm start"
echo ""
echo "5. Teste a impressora:"
echo "   npm test"
echo ""
echo "💡 Para executar em background:"
echo "   npm install -g pm2"
echo "   pm2 start index.js --name print-server"
echo ""
