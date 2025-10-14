/**
 * Script para criar usuário administrador manualmente
 * 
 * Execute: npx tsx scripts/create-admin.ts
 */

import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    console.log('🔧 Criando usuário administrador...\n');

    const email = process.env.ADMIN_EMAIL || 'nitrobeer.chopp@gmail.com';
    const password = process.env.ADMIN_PASSWORD || 'Clk26267*';
    const fullName = process.env.ADMIN_NAME || 'Administrador Geral';

    // Verificar se já existe
    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      console.log('⚠️  Usuário admin já existe:');
      console.log(`   Email: ${existing.email}`);
      console.log(`   Nome: ${existing.fullName || existing.name}`);
      console.log(`   isAdmin: ${existing.isAdmin}`);
      console.log(`   Status: ${existing.status}\n`);
      return;
    }

    // Hash da senha
    const passwordHash = await hash(password, 12);

    // Buscar primeiro PDV
    const firstPOS = await prisma.pointOfSale.findFirst();

    // Criar admin
    const admin = await prisma.user.create({
      data: {
        email,
        fullName,
        name: fullName, // Compatibilidade legado
        passwordHash,
        password: passwordHash, // Compatibilidade legado
        isAdmin: true,
        status: 'ACTIVE',
        isActive: true,
      },
    });

    console.log('✅ Usuário admin criado com sucesso!\n');
    console.log('📋 Credenciais:');
    console.log(`   Email: ${email}`);
    console.log(`   Senha: ${password}`);
    console.log(`   isAdmin: ${admin.isAdmin}`);
    console.log(`   ID: ${admin.id}\n`);

    // Vincular ao PDV se existir
    if (firstPOS) {
      await prisma.userPointOfSale.create({
        data: {
          userId: admin.id,
          pointOfSaleId: firstPOS.id,
          isPrimary: true,
        },
      });
      console.log(`✅ Vinculado ao PDV: ${firstPOS.name}\n`);
    } else {
      console.log('⚠️  Nenhum PDV encontrado. Crie um PDV depois.\n');
    }

    if (!process.env.ADMIN_PASSWORD) {
      console.log('⚠️  IMPORTANTE: Senha padrão em uso!');
      console.log('   Altere a senha após o primeiro login.\n');
    }

  } catch (error) {
    console.error('❌ Erro ao criar admin:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
