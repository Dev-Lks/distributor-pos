/**
 * Script de validação da implementação Multi-Usuários RBAC
 * 
 * Execute: npx tsx scripts/validate-implementation.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function validate() {
  console.log('🔍 Validando implementação Multi-Usuários RBAC...\n');

  let errors = 0;
  let warnings = 0;

  // 1. Verificar usuário admin
  console.log('📋 Verificando usuário administrador...');
  const admin = await prisma.user.findFirst({
    where: { isAdmin: true },
  });

  if (!admin) {
    console.log('   ❌ ERRO: Nenhum usuário ADMIN encontrado');
    console.log('   → Execute: npx tsx scripts/create-admin.ts\n');
    errors++;
  } else {
    console.log(`   ✅ Admin encontrado: ${admin.email}`);
    console.log(`   → Status: ${admin.status}`);
    console.log(`   → ID: ${admin.id}\n`);
  }

  // 2. Verificar pontos de venda
  console.log('📋 Verificando pontos de venda...');
  const pointsOfSale = await prisma.pointOfSale.findMany();

  if (pointsOfSale.length === 0) {
    console.log('   ⚠️  AVISO: Nenhum ponto de venda encontrado');
    console.log('   → Execute: npx tsx scripts/create-points-of-sale.ts\n');
    warnings++;
  } else {
    console.log(`   ✅ ${pointsOfSale.length} ponto(s) de venda encontrado(s)`);
    pointsOfSale.forEach((pos) => {
      console.log(`   → ${pos.name} (${pos.code})`);
    });
    console.log('');
  }

  // 3. Verificar vinculação admin ↔ PDV
  if (admin && pointsOfSale.length > 0) {
    console.log('📋 Verificando vinculação Admin ↔ PDV...');
    const adminPOS = await prisma.userPointOfSale.findFirst({
      where: { userId: admin.id },
      include: { pointOfSale: true },
    });

    if (!adminPOS) {
      console.log('   ⚠️  AVISO: Admin não vinculado a nenhum PDV');
      console.log('   → Execute: npx tsx scripts/create-points-of-sale.ts\n');
      warnings++;
    } else {
      console.log(`   ✅ Admin vinculado a: ${adminPOS.pointOfSale.name}\n`);
    }
  }

  // 4. Verificar usuários de teste
  console.log('📋 Verificando usuários de teste...');
  const testUsers = await prisma.user.findMany({
    where: {
      isAdmin: false,
    },
  });

  if (testUsers.length === 0) {
    console.log('   ⚠️  AVISO: Nenhum usuário de teste (não-admin)');
    console.log('   → Execute: npx tsx scripts/create-test-user.ts\n');
    warnings++;
  } else {
    console.log(`   ✅ ${testUsers.length} usuário(s) de teste encontrado(s)`);
    testUsers.forEach((user) => {
      console.log(`   → ${user.fullName || user.name} (isAdmin: ${user.isAdmin})`);
    });
    console.log('');
  }

  // 5. Verificar campos do schema
  console.log('📋 Verificando schema do banco...');
  const userFields = [
    'fullName',
    'passwordHash',
    'role',
    'status',
    'lastLoginAt',
    'failedLoginAttempts',
  ];

  let schemaOk = true;
  const sampleUser = await prisma.user.findFirst();
  
  if (sampleUser) {
    for (const field of userFields) {
      if (!(field in sampleUser)) {
        console.log(`   ❌ ERRO: Campo '${field}' não encontrado no modelo User`);
        schemaOk = false;
        errors++;
      }
    }
  }

  if (schemaOk && sampleUser) {
    console.log('   ✅ Schema do User está correto\n');
  } else if (!sampleUser) {
    console.log('   ⚠️  Não foi possível verificar (nenhum usuário existe)\n');
    warnings++;
  } else {
    console.log('   → Rode: pnpm prisma db push\n');
  }

  // 6. Resumo final
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 RESUMO DA VALIDAÇÃO\n');

  const totalUsers = await prisma.user.count();
  const totalPOS = await prisma.pointOfSale.count();
  const totalLinks = await prisma.userPointOfSale.count();

  console.log(`   Usuários:              ${totalUsers}`);
  console.log(`   Pontos de Venda:       ${totalPOS}`);
  console.log(`   Vinculações:           ${totalLinks}`);
  console.log('');
  console.log(`   ❌ Erros:              ${errors}`);
  console.log(`   ⚠️  Avisos:             ${warnings}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // 7. Status final
  if (errors > 0) {
    console.log('❌ IMPLEMENTAÇÃO INCOMPLETA');
    console.log('   Corrija os erros acima antes de continuar.\n');
    process.exit(1);
  } else if (warnings > 0) {
    console.log('⚠️  IMPLEMENTAÇÃO FUNCIONAL MAS INCOMPLETA');
    console.log('   Recomendado executar os scripts sugeridos.\n');
  } else {
    console.log('✅ IMPLEMENTAÇÃO COMPLETA E FUNCIONAL!');
    console.log('   Sistema pronto para uso.\n');
    console.log('🚀 Próximos passos:');
    console.log('   1. Execute: pnpm dev');
    console.log('   2. Acesse: http://localhost:3000/login');
    console.log('   3. Entre com: admin@nitrobeer.com / admin123');
    console.log('   4. Teste: http://localhost:3000/admin/users\n');
  }

  // 8. Informações adicionais
  console.log('📚 Documentação:');
  console.log('   → docs/PRONTO_PARA_TESTAR.md');
  console.log('   → docs/GUIA_MULTI_USUARIOS.md');
  console.log('   → IMPLEMENTACAO_CONCLUIDA.md\n');
}

validate()
  .catch((error) => {
    console.error('❌ Erro ao validar:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
