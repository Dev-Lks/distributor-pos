# 🚀 Guia Rápido - Sistema de Delivery

## 📱 Como Usar o Sistema

### 1. Acessar o Dashboard de Entregas

```
URL: /dashboard/delivery
```

**Você verá:**
- 8 cards de estatísticas no topo
- Barra de busca e filtro por status
- Lista de todas as entregas

---

### 2. Criar uma Nova Entrega (Método Completo)

#### Passo a Passo:

**2.1. Clique em "Nova Entrega"**  
Você será redirecionado para: `/dashboard/delivery/new`

**2.2. Etapa 1 - Selecionar Cliente** 👤
- Digite o nome ou telefone do cliente
- Selecione da lista ou crie um novo
- O sistema verifica automaticamente se há duplicatas
- Avança automaticamente ao selecionar

**2.3. Etapa 2 - Endereço** 📍
- Digite o CEP (busca automática pela ViaCEP)
- Preencha os campos obrigatórios:
  - Endereço
  - Bairro
  - Cidade
  - Estado
- Adicione instruções de entrega (opcional)

**2.4. Etapa 3 - Produtos** 📦
- **Lado Esquerdo:** Busque e adicione produtos
  - Busca por nome, SKU ou código de barras
  - Clique em "Adicionar"
  
- **Lado Direito:** Gerenciar carrinho
  - Ajuste quantidades (+/-)
  - Adicione desconto por item
  - Adicione observações por item
  - Remova itens se necessário
  
- **Taxa de Entrega:** Defina o valor
- **Observações Gerais:** Campo opcional

**2.5. Etapa 4 - Pagamento** 💰
- Selecione forma de pagamento:
  - Dinheiro
  - PIX
  - Cartão de Débito
  - Cartão de Crédito
- Marque "Pago Antecipadamente" se aplicável
- Se dinheiro: informe "Troco para"
- Agende data/hora (opcional)

**2.6. Etapa 5 - Revisar** 📋
- Confira todos os dados
- Clique em "Criar Entrega"
- Sistema gerará número único (DEL-2025-0001)
- Redirecionará para listagem com toast de sucesso

---

### 3. Ver Detalhes de uma Entrega

**3.1. No Dashboard, clique em qualquer card de entrega**

**O modal exibirá:**
- Todas as informações da entrega
- Status atual com timeline
- Dados do cliente e endereço
- Lista de produtos
- Resumo financeiro
- Forma de pagamento

**3.2. Ações Disponíveis:**
- **Atualizar Status:** Dropdown com próximos status
- **Avaliar Entrega:** Após status "Entregue" (1-5 estrelas)
- **Editar:** Modificar dados
- **Imprimir Recibo:** Gerar para impressora térmica
- **Deletar:** Remove a entrega (com confirmação)

---

### 4. Gerenciar Zonas de Entrega

```
URL: /dashboard/delivery/zones
```

#### Criar Nova Zona:

**4.1. Clique em "Nova Zona"**

**4.2. Preencha os campos:**
- **Nome:** Ex: "Centro"
- **Taxa Base:** Ex: 5.00
- **Valor Mínimo do Pedido:** Ex: 20.00
- **Frete Grátis Acima de:** Ex: 50.00 (opcional)
- **Bairros:** Lista separada por vírgulas
  - Ex: Centro, Copacabana, Ipanema
- **CEPs:** Lista separada por linha
  - Ex: 
    ```
    20000-000
    20100-000
    20200-000
    ```
- **Tempo Estimado:** Em minutos (opcional)
- **Ativa:** Marque o checkbox

**4.3. Clique em "Salvar"**

#### Editar/Deletar:
- Cada card de zona tem botões de ação
- Editar: abre modal com dados pré-preenchidos
- Deletar: solicita confirmação

---

### 5. Gerenciar Entregadores

```
URL: /dashboard/delivery/drivers
```

#### Adicionar Novo Entregador:

**5.1. Clique em "Novo Entregador"**

**5.2. Preencha:**
- **Nome:** Nome completo
- **Telefone:** (XX) XXXXX-XXXX
- **Email:** opcional
- **CPF:** XXX.XXX.XXX-XX
- **CNH:** Número da carteira
- **Tipo de Veículo:** Selecione
  - 🚲 Bicicleta
  - 🛵 Moto
  - 🚗 Carro
  - 🚐 Van
- **Placa:** AAA-1234
- **Cor do Veículo:** Ex: Preto
- **Observações:** Campo livre
- **Disponível:** Marque se está ativo

**5.3. Salvar**

#### Toggle Disponibilidade:
- Cada card tem um botão para marcar disponível/indisponível
- Verde = Disponível
- Vermelho = Indisponível

---

### 6. Buscar e Filtrar Entregas

#### Busca por Texto:
No dashboard principal, use a barra de busca para filtrar por:
- Nome do cliente
- Número da entrega (DEL-2025-0001)
- Telefone do cliente
- Endereço

#### Filtro por Status:
Use o dropdown ao lado da busca:
- **Todos** - Exibe todas
- **Pendente** - Aguardando preparação
- **Preparando** - Em preparação
- **Pronto** - Pronto para retirada
- **Em Trânsito** - Saiu para entrega
- **Entregue** - Finalizado
- **Cancelado** - Cancelado ou falhado

---

### 7. Processar uma Entrega (Workflow Típico)

#### Cenário: Pedido Online Recebido

**7.1. Criar Entrega**
- Use o wizard `/dashboard/delivery/new`
- Preencha dados do cliente e produtos
- Defina taxa de entrega
- Salvar

**7.2. Preparar Pedido**
- No dashboard, clique na entrega
- Status atual: **Pendente** 🟡
- Atualizar para: **Preparando** 🟣
- Separe os produtos do estoque

**7.3. Pedido Pronto**
- Atualizar para: **Pronto para Retirada** 🔵
- Notificar entregador (futuro)

**7.4. Entregador Pega o Pedido**
- Atribuir entregador (dropdown no modal)
- Atualizar para: **Em Trânsito** 🟠
- Registra timestamp de saída

**7.5. Entrega Concluída**
- Entregador marca como: **Entregue** 🟢
- Sistema exibe formulário de avaliação
- Cliente (ou operador) avalia de 1-5 ⭐

**7.6. Finalizado!**
- Entrega aparece nas estatísticas
- Rating do entregador é atualizado
- Receita é contabilizada

---

### 8. Imprimir Recibo

**8.1. Abrir detalhes da entrega**

**8.2. Clicar em "Imprimir"**

**8.3. Sistema gera recibo com:**
- Logo da empresa
- Dados da entrega
- Lista de produtos
- Valores (subtotal, taxa, total)
- Observações

**8.4. Envia para impressora térmica**

---

### 9. Avaliar uma Entrega

**Apenas após status = DELIVERED**

**9.1. Abrir modal de detalhes**

**9.2. Rolar até "Avaliação do Cliente"**

**9.3. Clicar nas estrelas (1-5)**
- 1 ⭐ = Péssimo
- 2 ⭐⭐ = Ruim
- 3 ⭐⭐⭐ = Regular
- 4 ⭐⭐⭐⭐ = Bom
- 5 ⭐⭐⭐⭐⭐ = Excelente

**9.4. Adicionar comentário (opcional)**

**9.5. Clicar em "Salvar Avaliação"**

**9.6. Rating aparecerá:**
- No card da entrega
- Na média geral do dashboard
- No perfil do entregador

---

### 10. Cancelar uma Entrega

**10.1. Abrir detalhes da entrega**

**10.2. No dropdown de status, selecionar "Cancelado"**

**10.3. Sistema solicitará motivo (campo obrigatório)**

**10.4. Confirmar cancelamento**

**10.5. Entrega é marcada como cancelada:**
- Aparece na estatística de canceladas
- Estoque é devolvido (se produtos foram separados)
- Timeline registra o cancelamento

---

## 🎯 Atalhos do Teclado

| Tecla | Ação |
|-------|------|
| `Ctrl + K` | Abrir busca de entregas (futuro) |
| `Ctrl + N` | Nova entrega (futuro) |
| `Esc` | Fechar modais |

---

## 📊 Interpretando as Estatísticas

### Dashboard Principal:

**Total:** Todas as entregas no sistema  
**Pendentes:** Aguardando preparação (precisa atenção!)  
**Em Andamento:** Sendo preparadas ou em rota  
**Entregues:** Finalizadas com sucesso  
**Canceladas:** Não concluídas  
**Receita:** R$ total de entregas pagas  
**Taxa Média:** Média do valor cobrado por entrega  
**Avaliação:** ⭐ média de satisfação dos clientes  

### Insights:

✅ **Taxa Média Alta** = Bom lucro por entrega  
⚠️ **Muitas Pendentes** = Gargalo na preparação  
🚨 **Muitas Canceladas** = Investigar motivos  
🌟 **Avaliação Alta (4.5+)** = Clientes satisfeitos  

---

## 🆘 Solução de Problemas

### Problema: CEP não encontra endereço
**Solução:** Preencha manualmente os campos de endereço

### Problema: Produto sem estoque
**Solução:** 
1. Vá em `/products`
2. Edite o produto
3. Adicione estoque no ponto de venda desejado

### Problema: Entrega não aparece na listagem
**Solução:** 
1. Verifique os filtros ativos
2. Limpe a busca
3. Selecione "Todos os Status"

### Problema: Erro ao criar entrega
**Solução:**
1. Verifique se todos os campos obrigatórios foram preenchidos
2. Verifique se há produtos no carrinho
3. Verifique sua conexão com a internet
4. Veja o console do navegador (F12) para mais detalhes

### Problema: Não consigo avaliar a entrega
**Solução:** A avaliação só aparece após o status ser "Entregue"

---

## 🎓 Melhores Práticas

### ✅ Faça:
- Confirme o endereço com o cliente antes de criar
- Atualize o status conforme o pedido avança
- Avalie todas as entregas para manter histórico
- Configure zonas antes de começar a usar
- Cadastre todos os entregadores no sistema
- Mantenha dados de clientes atualizados

### ❌ Evite:
- Criar entregas sem produtos
- Deixar entregas em "Pendente" por muito tempo
- Deletar entregas (prefira cancelar)
- Esquecer de atribuir entregador
- Ignorar avaliações negativas
- Cadastrar zonas que não serão atendidas

---

## 📞 Suporte

Em caso de dúvidas ou problemas:

1. Consulte este guia
2. Veja a documentação completa: `SISTEMA_DELIVERY_COMPLETO.md`
3. Verifique os logs no console (F12)
4. Entre em contato com o administrador do sistema

---

## 🎉 Dicas de Produtividade

1. **Use o Wizard para pedidos complexos** - Mais organizado e guiado
2. **Use o Modal para entregas simples** - Mais rápido
3. **Configure zonas bem definidas** - Facilita cálculo de taxas
4. **Mantenha entregadores atualizados** - Atribuição mais eficiente
5. **Acompanhe as estatísticas diariamente** - Identifique tendências
6. **Ative notificações** (futuro) - Não perca entregas
7. **Treine sua equipe** - Reduza erros operacionais

---

**Última atualização:** 13 de Outubro de 2025  
**Versão do Sistema:** 1.0.0
