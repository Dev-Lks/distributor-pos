# 🖨️ Configuração da Impressora Térmica

## Visão Geral
Este sistema suporta impressoras térmicas para impressão de recibos de venda, cupons fiscais e relatórios. A configuração é feita através da interface web.

## Como Acessar as Configurações

1. **Na página de Vendas (PDV)**:
   - Clique no **ícone da impressora** no canto superior direito (ao lado do seletor de PDV)
   - O ícone mostra o status atual: verde (pronta), vermelho (desconectada), amarelo (papel baixo)
   - No tooltip aparece "Clique para configurar"

2. **Na página de Pedidos (Encomendas)**:
   - Clique no **ícone da impressora** no canto superior direito
   - Mesma funcionalidade da página de vendas

3. **Usando o componente diretamente**:
   - O componente `HardwareSettings` pode ser usado em qualquer página
   - Basta importar e usar: `<HardwareSettings pointOfSaleId="seu-pdv-id" />`

## Tipos de Conexão Suportados

### 1. USB (Mais Comum)
**Quando usar**: Impressora conectada diretamente ao computador via USB.

**Configuração**:
- **Tipo**: USB
- **String de Conexão**: 
  - Linux: `/dev/usb/lp0` ou `/dev/ttyUSB0`
  - Windows: `COM3` ou `COM4` (verificar no Gerenciador de Dispositivos)
  - Mac: `/dev/cu.usbserial`

**Como encontrar a porta USB no Linux**:
```bash
# Listar dispositivos USB
ls -l /dev/usb/

# Ou verificar portas seriais
ls -l /dev/tty*
```

### 2. Rede (TCP/IP)
**Quando usar**: Impressora conectada à rede local via Ethernet ou WiFi.

**Configuração**:
- **Tipo**: Network
- **String de Conexão**: `IP:PORTA`
  - Exemplo: `192.168.1.100:9100`
  - Porta padrão: `9100`

**Como encontrar o IP da impressora**:
- Imprimir página de configuração da impressora
- Verificar no roteador (lista de dispositivos)
- Usar comando: `arp -a` ou `nmap`

### 3. Serial (COM)
**Quando usar**: Impressoras antigas com porta serial.

**Configuração**:
- **Tipo**: Serial
- **String de Conexão**:
  - Windows: `COM1`, `COM2`, etc.
  - Linux: `/dev/ttyS0`, `/dev/ttyS1`, etc.

## Configurações Adicionais

### Largura do Papel
Selecione conforme o tamanho do papel da sua impressora:
- **32 caracteres** → Papel de 58mm (comum em impressoras portáteis)
- **48 caracteres** → Papel de 80mm (padrão)
- **58 caracteres** → Papel de 80mm (alternativo)
- **80 caracteres** → Papel de 110mm (raro)

### Codificação
- **UTF-8**: Padrão, suporta português e caracteres especiais
- **ISO-8859-1**: Para impressoras antigas
- **GB18030**: Para impressoras chinesas

## Testando a Impressora

1. Configure os parâmetros conforme explicado acima
2. Clique em **"Salvar Configurações"**
3. Clique em **"Testar Impressão"**
4. A impressora deve imprimir uma página de teste

Se a impressão de teste funcionar, sua impressora está configurada corretamente! ✅

## Problemas Comuns

### "Impressora não configurada"
- Verifique se salvou as configurações
- Teste a impressão após salvar

### "Erro ao conectar"
**USB**:
- Verifique se a impressora está ligada
- Confirme a porta USB correta
- No Linux, pode precisar de permissões: `sudo chmod 666 /dev/usb/lp0`

**Rede**:
- Ping no IP: `ping 192.168.1.100`
- Verifique se a porta 9100 está aberta
- Confirme que está na mesma rede

### "Sem papel" ou "Papel baixo"
- Verifique se há papel na impressora
- Alguns modelos precisam de papel específico

### Caracteres estranhos na impressão
- Tente outra codificação (UTF-8 → ISO-8859-1)
- Verifique o modelo da impressora

## Impressoras Testadas

Este sistema foi testado com os seguintes modelos:
- Epson TM-T20
- Epson TM-T88
- Bematech MP-4200 TH
- Daruma DR700
- Elgin i9
- Genéricas ESC/POS

## Suporte

Se precisar de ajuda:
1. Verifique o modelo da sua impressora
2. Consulte o manual para verificar tipo de conexão
3. Teste com uma impressão de teste do sistema operacional primeiro
4. Entre em contato com o suporte técnico

## Desenvolvimento

Para desenvolvedores:
- O sistema usa a biblioteca `node-thermal-printer`
- Código fonte em `/lib/hardware/thermalPrinter.ts`
- API endpoints em `/app/api/hardware/printer/`
- Hook React em `/lib/hardware/useThermalPrinter.ts`
