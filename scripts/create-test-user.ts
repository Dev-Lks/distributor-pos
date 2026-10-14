/**
 * Script para criar usuário vendedor de teste
 * 
 * Execute: npx tsx scripts/create-test-user.ts
 */

import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    console.log('👤 Criando usuário de teste...\n');

    const email = 'vendedor@exemplo.com';
    const password = 'vendedor123';
    const fullName = 'João Vendedor';

    // Verificar se já existe
    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      console.log('⚠️  Usuário vendedor já existe\n');
      return;
    }

    // Hash da senha
    const passwordHash = await hash(password, 12);

    // Buscar primeiro PDV
    const firstPOS = await prisma.pointOfSale.findFirst();

    if (!firstPOS) {
      console.log('❌ Nenhum PDV encontrado. Execute create-points-of-sale.ts primeiro.\n');
      return;
    }

    // Criar vendedor
    const seller = await prisma.user.create({
      data: {
        email,
        fullName,
        name: fullName,
        passwordHash,
        password: passwordHash,
        phone: '11999999999',
        isAdmin: false,
        status: 'ACTIVE',
        isActive: true,
      },
    });

    // Vincular ao PDV
    await prisma.userPointOfSale.create({
      data: {
        userId: seller.id,
        pointOfSaleId: firstPOS.id,
        isPrimary: true,
      },
    });

    console.log('✅ Usuário vendedor criado com sucesso!\n');
    console.log('📋 Credenciais:');
    console.log(`   Email: ${email}`);
    console.log(`   Senha: ${password}`);
    console.log(`   isAdmin: false`);
    console.log(`   PDV: ${firstPOS.name}\n`);

    console.log('🧪 Para testar:');
    console.log('   1. Faça login com estas credenciais');
    console.log('   2. Deve ser redirecionado para /sales');
    console.log('   3. Não conseguirá acessar /dashboard ou /admin\n');

  } catch (error) {
    console.error('❌ Erro ao criar usuário:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();
