// Script de teste do servidor de impressão
require('dotenv').config()

const SERVER_URL = process.env.TEST_SERVER_URL || 'http://localhost:3001'
const AUTH_TOKEN = process.env.AUTH_TOKEN

if (!AUTH_TOKEN) {
  console.error('❌ AUTH_TOKEN não configurado')
  console.log('Configure a variável de ambiente AUTH_TOKEN antes de executar os testes')
  console.log('Exemplo: AUTH_TOKEN=seu-token-secreto node test.js')
  process.exit(1)
}

async function testServer() {
  console.log('🧪 Testando Servidor de Impressão')
  console.log('====================================\n')
  
  // 1. Health Check
  console.log('1️⃣  Testando Health Check...')
  try {
    const res = await fetch(`${SERVER_URL}/api/health`)
    const data = await res.json()
    console.log('✅ Health:', data)
  } catch (error) {
    console.error('❌ Erro:', error.message)
    return
  }
  
  console.log('')
  
  // 2. Status da Impressora
  console.log('2️⃣  Verificando status da impressora...')
  try {
    const res = await fetch(`${SERVER_URL}/api/printer/status`)
    const data = await res.json()
    console.log('✅ Status:', data)
  } catch (error) {
    console.error('❌ Erro:', error.message)
  }
  
  console.log('')
  
  // 3. Teste de Impressão
  console.log('3️⃣  Enviando teste de impressão...')
  try {
    const res = await fetch(`${SERVER_URL}/api/printer/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AUTH_TOKEN}`,
      },
    })
    const data = await res.json()
    
    if (data.success) {
      console.log('✅ Teste enviado! Verifique sua impressora.')
    } else {
      console.log('❌ Erro:', data.error)
    }
  } catch (error) {
    console.error('❌ Erro:', error.message)
  }
  
  console.log('')
  
  // 4. Impressão Personalizada
  console.log('4️⃣  Testando impressão personalizada...')
  try {
    const template = {
      commands: [
        { type: 'align', value: 'center' },
        { type: 'text', value: '🍺 MINHA CERVEJARIA 🍺', size: 'large', bold: true },
        { type: 'feed', lines: 1 },
        { type: 'separator', char: '=' },
        { type: 'align', value: 'left' },
        { type: 'text', value: 'CUPOM DE TESTE' },
        { type: 'text', value: `Data: ${new Date().toLocaleString('pt-BR')}` },
        { type: 'separator', char: '-' },
        { type: 'text', value: 'Produto 1' },
        { type: 'text', value: '2x R$ 5.00            R$ 10.00' },
        { type: 'feed', lines: 1 },
        { type: 'text', value: 'Produto 2' },
        { type: 'text', value: '1x R$ 8.50            R$ 8.50' },
        { type: 'separator', char: '-' },
        { type: 'align', value: 'right' },
        { type: 'text', value: 'TOTAL: R$ 18.50', size: 'large', bold: true },
        { type: 'separator', char: '=' },
        { type: 'align', value: 'center' },
        { type: 'feed', lines: 1 },
        { type: 'text', value: 'Obrigado pela preferência!' },
        { type: 'feed', lines: 3 },
        { type: 'cut' },
      ],
    }
    
    const res = await fetch(`${SERVER_URL}/api/printer/print`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AUTH_TOKEN}`,
      },
      body: JSON.stringify({ template }),
    })
    
    const data = await res.json()
    
    if (data.success) {
      console.log('✅ Impressão personalizada enviada!')
    } else {
      console.log('❌ Erro:', data.error)
    }
  } catch (error) {
    console.error('❌ Erro:', error.message)
  }
  
  console.log('')
  console.log('====================================')
  console.log('🎉 Testes concluídos!')
}

// Executar testes
testServer().catch(console.error)
