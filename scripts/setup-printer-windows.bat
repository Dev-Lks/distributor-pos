@echo off
REM Script auxiliar para configurar impressora térmica no Windows
REM Execute como Administrador

echo ================================================
echo  Configuracao de Impressora Termica - Windows
echo ================================================
echo.

REM Verificar se está executando como administrador
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo AVISO: Este script precisa ser executado como Administrador
    echo Clique com botao direito e selecione "Executar como administrador"
    echo.
    pause
    exit /b 1
)

echo [1/3] Listando portas COM disponiveis...
echo.

REM Listar portas COM usando PowerShell
powershell -Command "Get-WmiObject Win32_SerialPort | Select-Object DeviceID, Description, Status | Format-Table -AutoSize"

echo.
echo [2/3] Verificando Gerenciador de Dispositivos...
echo.
echo Abrindo Gerenciador de Dispositivos...
echo Procure por "Portas (COM e LPT)" para ver sua impressora
echo.

timeout /t 2 >nul
start devmgmt.msc

echo.
echo ================================================
echo  Como identificar sua impressora:
echo ================================================
echo.
echo 1. No Gerenciador de Dispositivos, expanda "Portas (COM e LPT)"
echo 2. Procure por sua impressora termica (ex: "USB Serial Port" ou nome da impressora)
echo 3. Anote o numero da porta (ex: COM3, COM4, etc.)
echo 4. Se nao aparecer, verifique se:
echo    - A impressora esta ligada
echo    - O cabo USB esta conectado
echo    - Os drivers estao instalados
echo.
echo ================================================
echo  Instalacao de Drivers:
echo ================================================
echo.
echo Se sua impressora nao aparece, pode precisar instalar drivers:
echo.
echo Impressoras comuns:
echo - Epson TM-T20/T88: https://epson.com.br/suporte
echo - Bematech MP-4200: https://bemafa.com.br/suporte
echo - Elgin: https://elgin.com.br/suporte
echo.

:input
echo.
set /p COM_PORT="Digite o numero da porta COM (ex: COM3): "

if "%COM_PORT%"=="" (
    echo Porta invalida. Tente novamente.
    goto input
)

echo.
echo [3/3] Testando conexao com %COM_PORT%...
echo.

REM Testar se a porta existe
mode %COM_PORT% >nul 2>&1
if %errorLevel% neq 0 (
    echo ERRO: Porta %COM_PORT% nao encontrada ou inacessivel
    echo Verifique se digitou corretamente (ex: COM3)
    goto input
)

echo Porta %COM_PORT% encontrada!
echo.

REM Configurar porta COM com parametros padrao para impressoras termicas
echo Configurando parametros da porta...
mode %COM_PORT%: BAUD=9600 PARITY=N DATA=8 STOP=1 >nul 2>&1

if %errorLevel% equ 0 (
    echo Porta configurada com sucesso!
) else (
    echo Aviso: Nao foi possivel configurar a porta automaticamente
    echo Isso pode ser normal para algumas impressoras USB
)

echo.
echo ================================================
echo  Configuracao concluida!
echo ================================================
echo.
echo Configuracoes para usar na aplicacao web:
echo.
echo   Tipo de Conexao: USB (ou Serial)
echo   String de Conexao: %COM_PORT%
echo   Largura do Papel: 48 (para papel 80mm)
echo   Codificacao: UTF-8
echo.
echo ================================================
echo  Proximos passos:
echo ================================================
echo.
echo 1. Abra a aplicacao web
echo 2. Va em Configuracoes ^> Hardware
echo 3. Aba "Impressora"
echo 4. Configure com os valores acima
echo 5. Clique em "Salvar Configuracoes"
echo 6. Clique em "Testar Impressao"
echo.
echo ================================================
echo  Solucao de Problemas:
echo ================================================
echo.
echo Se o teste de impressao nao funcionar:
echo.
echo 1. Verifique se a impressora esta ligada
echo 2. Tente desconectar e reconectar o cabo USB
echo 3. Reinicie a impressora
echo 4. Verifique no Gerenciador de Dispositivos se nao ha !
echo 5. Tente outra porta COM se houver mais de uma listada
echo 6. Reinstale os drivers da impressora
echo.
echo Para mais ajuda, consulte: CONFIGURACAO_IMPRESSORA.md
echo.

pause
