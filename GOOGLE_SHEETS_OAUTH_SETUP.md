# Configuração do Google Sheets com Service Account

## Problema Atual
A API key do Google Sheets só permite leitura de dados públicos. Para escrever dados, precisamos de autenticação OAuth2.

## Solução: Service Account

### Passos para configurar:

1. **Acesse o Google Cloud Console**: https://console.cloud.google.com/

2. **Crie um novo projeto** ou selecione um existente

3. **Ative a Google Sheets API**:
   - Vá para "APIs & Services" > "Library"
   - Procure por "Google Sheets API"
   - Clique em "Enable"

4. **Crie uma Service Account**:
   - Vá para "APIs & Services" > "Credentials"
   - Clique em "Create Credentials" > "Service Account"
   - Dê um nome (ex: "claudiao-sheets")
   - Clique em "Create and Continue"
   - Na seção "Grant this service account access to project", selecione "Editor"
   - Clique em "Done"

5. **Gere uma chave JSON**:
   - Na lista de Service Accounts, clique na que criou
   - Vá para a aba "Keys"
   - Clique em "Add Key" > "Create new key"
   - Selecione "JSON" e clique em "Create"
   - O arquivo JSON será baixado automaticamente

6. **Compartilhe a planilha com a Service Account**:
   - Abra sua planilha do Google Sheets
   - Clique em "Share"
   - Cole o email da Service Account (termina com @your-project.iam.gserviceaccount.com)
   - Dê permissão de "Editor"
   - Clique em "Send"

7. **Configure as variáveis de ambiente**:
   - Renomeie o arquivo JSON baixado para `service-account.json`
   - Coloque na raiz do projeto
   - Adicione ao `.env`:
   ```
   GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
   ```

## Segurança
- Nunca commite o arquivo `service-account.json` no Git
- Adicione `service-account.json` ao `.gitignore`
- Use apenas para backup de dados, não para dados sensíveis