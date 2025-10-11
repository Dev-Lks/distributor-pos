#!/bin/bash

echo "╔═══════════════════════════════════════╗"
echo "║  🖨️  INSTALADOR DO SERVIDOR DE      ║"
echo "║      IMPRESSÃO TÉRMICA               ║"
echo "╚═══════════════════════════════════════╝"
echo ""

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado!"
    echo "   Instale com: sudo apt install nodejs npm"
    exit 1
fi

echo "✅ Node.js encontrado: $(node -v)"
echo ""

# Instalar dependências
echo "📦 Instalando dependências..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Erro ao instalar dependências"
    exit 1
fi

echo "✅ Dependências instaladas"
echo ""

# Criar .env se não existir
if [ ! -f .env ]; then
    echo "📝 Criando arquivo .env..."
    cp .env.example .env
    echo "✅ Arquivo .env criado"
    echo "⚠️  IMPORTANTE: Edite o .env com suas configurações!"
    echo ""
else
    echo "ℹ️  Arquivo .env já existe"
    echo ""
fi

# Detectar impressora (Linux)
echo "🔍 Procurando impressoras USB..."
if [ -e /dev/usb/lp0 ]; then
    echo "✅ Impressora encontrada em /dev/usb/lp0"
    
    # Verificar permissões
    if [ ! -w /dev/usb/lp0 ]; then
        echo "⚠️  Sem permissão de escrita"
        echo "   Execute: sudo chmod 666 /dev/usb/lp0"
        echo "   Ou adicione seu usuário ao grupo: sudo usermod -a -G lp $USER"
    else
        echo "✅ Permissões OK"
    fi
else
    echo "⚠️  Nenhuma impressora USB detectada"
    echo "   Conecte a impressora e execute novamente"
fi

echo ""
echo "╔═══════════════════════════════════════╗"
echo "║  ✅ INSTALAÇÃO CONCLUÍDA             ║"
echo "╚═══════════════════════════════════════╝"
echo ""
echo "📋 Próximos passos:"
echo ""
echo "1. Edite o arquivo .env:"
echo "   nano .env"
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
