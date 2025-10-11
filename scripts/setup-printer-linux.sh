#!/bin/bash
# Script auxiliar para configurar permissões de impressora térmica USB no Linux

echo "🖨️  Configuração de Impressora Térmica USB - Linux"
echo "=================================================="
echo ""

# Verificar se está rodando como root
if [ "$EUID" -eq 0 ]; then 
    echo "⚠️  Não execute este script como root/sudo diretamente."
    echo "O script pedirá senha quando necessário."
    exit 1
fi

echo "📋 Verificando dispositivos USB conectados..."
echo ""

# Listar dispositivos USB
lsusb

echo ""
echo "📂 Verificando portas USB disponíveis..."
echo ""

# Listar portas USB
ls -l /dev/usb/ 2>/dev/null || echo "Nenhum dispositivo em /dev/usb/"
echo ""
ls -l /dev/ttyUSB* 2>/dev/null || echo "Nenhum dispositivo ttyUSB"
echo ""
ls -l /dev/ttyACM* 2>/dev/null || echo "Nenhum dispositivo ttyACM"

echo ""
echo "🔍 Qual é o caminho da sua impressora?"
echo "   Exemplos: /dev/usb/lp0, /dev/ttyUSB0, /dev/ttyACM0"
read -p "Digite o caminho completo: " DEVICE_PATH

if [ ! -e "$DEVICE_PATH" ]; then
    echo "❌ Dispositivo não encontrado: $DEVICE_PATH"
    exit 1
fi

echo ""
echo "✅ Dispositivo encontrado: $DEVICE_PATH"
echo ""

# Verificar permissões atuais
echo "📝 Permissões atuais:"
ls -l "$DEVICE_PATH"
echo ""

# Pegar o usuário atual
CURRENT_USER=$(whoami)

echo "👤 Usuário atual: $CURRENT_USER"
echo ""

# Adicionar usuário ao grupo correto
if [[ "$DEVICE_PATH" == *"lp"* ]]; then
    echo "🔧 Adicionando usuário ao grupo 'lp'..."
    sudo usermod -a -G lp "$CURRENT_USER"
    GROUP="lp"
elif [[ "$DEVICE_PATH" == *"ttyUSB"* ]] || [[ "$DEVICE_PATH" == *"ttyACM"* ]]; then
    echo "🔧 Adicionando usuário ao grupo 'dialout'..."
    sudo usermod -a -G dialout "$CURRENT_USER"
    GROUP="dialout"
else
    echo "⚠️  Tipo de dispositivo não reconhecido. Definindo permissões diretas..."
    sudo chmod 666 "$DEVICE_PATH"
    GROUP=""
fi

# Criar regra udev para permissões automáticas
echo ""
echo "📜 Criando regra udev para permissões persistentes..."

# Pegar informações do dispositivo
VENDOR=$(udevadm info -a -n "$DEVICE_PATH" | grep '{idVendor}' | head -n1 | sed 's/.*=="\(.*\)".*/\1/')
PRODUCT=$(udevadm info -a -n "$DEVICE_PATH" | grep '{idProduct}' | head -n1 | sed 's/.*=="\(.*\)".*/\1/')

if [ -n "$VENDOR" ] && [ -n "$PRODUCT" ]; then
    RULE_FILE="/etc/udev/rules.d/99-thermal-printer.rules"
    
    echo "SUBSYSTEM==\"usb\", ATTR{idVendor}==\"$VENDOR\", ATTR{idProduct}==\"$PRODUCT\", MODE=\"0666\"" | sudo tee "$RULE_FILE" > /dev/null
    echo "✅ Regra udev criada em: $RULE_FILE"
    
    # Recarregar regras udev
    sudo udevadm control --reload-rules
    sudo udevadm trigger
    
    echo "✅ Regras udev recarregadas"
else
    echo "⚠️  Não foi possível criar regra udev automaticamente"
fi

echo ""
echo "======================================"
echo "✨ Configuração concluída!"
echo "======================================"
echo ""

if [ -n "$GROUP" ]; then
    echo "⚠️  IMPORTANTE: Você foi adicionado ao grupo '$GROUP'"
    echo "   Para aplicar as mudanças, você precisa:"
    echo "   1. Fazer logout e login novamente"
    echo "   2. OU reiniciar o computador"
    echo ""
fi

echo "📋 Próximos passos:"
echo "1. Reinicie a aplicação web (se estiver rodando)"
echo "2. Acesse as configurações de Hardware"
echo "3. Configure a impressora com:"
echo "   - Tipo: USB"
echo "   - String de Conexão: $DEVICE_PATH"
echo "   - Largura: 48 (para papel 80mm)"
echo "   - Codificação: UTF-8"
echo "4. Clique em 'Testar Impressão'"
echo ""
echo "💡 Se não funcionar após logout/login, tente:"
echo "   sudo chmod 666 $DEVICE_PATH"
echo ""
echo "📖 Para mais ajuda, consulte: CONFIGURACAO_IMPRESSORA.md"
