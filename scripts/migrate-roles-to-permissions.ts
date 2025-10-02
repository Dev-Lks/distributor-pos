import { PrismaClient, PermissionKey } from "@prisma/client";

const prisma = new PrismaClient();

// Mapeamento de roles antigas para permissões
const ROLE_PERMISSIONS: Record<string, PermissionKey[]> = {
  ADMIN: [
    // Admin tem todas as permissões
    "VIEW_DASHBOARD",
    "VIEW_ANALYTICS",
    "VIEW_REPORTS",
    "CREATE_SALES",
    "VIEW_ALL_SALES",
    "VIEW_OWN_SALES",
    "EDIT_SALES",
    "DELETE_SALES",
    "APPLY_DISCOUNTS",
    "VIEW_PRODUCTS",
    "CREATE_PRODUCTS",
    "EDIT_PRODUCTS",
    "DELETE_PRODUCTS",
    "MANAGE_PRICES",
    "VIEW_INVENTORY",
    "MANAGE_INVENTORY",
    "TRANSFER_STOCK",
    "ADJUST_STOCK",
    "VIEW_STOCK_MOVEMENTS",
    "VIEW_CUSTOMERS",
    "CREATE_CUSTOMERS",
    "EDIT_CUSTOMERS",
    "DELETE_CUSTOMERS",
    "VIEW_CUSTOMER_HISTORY",
    "OPEN_CASH_SESSION",
    "CLOSE_CASH_SESSION",
    "MANAGE_CASH_TRANSACTIONS",
    "FORCE_CLOSE_CASH",
    "VIEW_CASH_REPORTS",
    "VIEW_ORDERS",
    "CREATE_ORDERS",
    "EDIT_ORDERS",
    "DELETE_ORDERS",
    "MANAGE_ORDER_STATUS",
    "VIEW_POINTS_OF_SALE",
    "MANAGE_POINTS_OF_SALE",
    "MANAGE_USERS",
    "VIEW_USERS",
    "ASSIGN_PERMISSIONS",
    "CREATE_BONIFICATIONS",
    "APPROVE_BONIFICATIONS",
    "VIEW_BONIFICATIONS",
    "VIEW_SETTINGS",
    "MANAGE_SETTINGS",
  ],
  MANAGER: [
    "VIEW_DASHBOARD",
    "VIEW_ANALYTICS",
    "VIEW_REPORTS",
    "CREATE_SALES",
    "VIEW_ALL_SALES",
    "VIEW_OWN_SALES",
    "EDIT_SALES",
    "DELETE_SALES",
    "APPLY_DISCOUNTS",
    "VIEW_PRODUCTS",
    "CREATE_PRODUCTS",
    "EDIT_PRODUCTS",
    "MANAGE_PRICES",
    "VIEW_INVENTORY",
    "MANAGE_INVENTORY",
    "TRANSFER_STOCK",
    "ADJUST_STOCK",
    "VIEW_STOCK_MOVEMENTS",
    "VIEW_CUSTOMERS",
    "CREATE_CUSTOMERS",
    "EDIT_CUSTOMERS",
    "VIEW_CUSTOMER_HISTORY",
    "OPEN_CASH_SESSION",
    "CLOSE_CASH_SESSION",
    "MANAGE_CASH_TRANSACTIONS",
    "VIEW_CASH_REPORTS",
    "VIEW_ORDERS",
    "CREATE_ORDERS",
    "EDIT_ORDERS",
    "MANAGE_ORDER_STATUS",
    "VIEW_POINTS_OF_SALE",
    "VIEW_USERS",
    "CREATE_BONIFICATIONS",
    "APPROVE_BONIFICATIONS",
    "VIEW_BONIFICATIONS",
    "VIEW_SETTINGS",
  ],
  SUPERVISOR: [
    "VIEW_DASHBOARD",
    "VIEW_ANALYTICS",
    "VIEW_REPORTS",
    "CREATE_SALES",
    "VIEW_ALL_SALES",
    "VIEW_OWN_SALES",
    "VIEW_PRODUCTS",
    "VIEW_INVENTORY",
    "VIEW_STOCK_MOVEMENTS",
    "VIEW_CUSTOMERS",
    "CREATE_CUSTOMERS",
    "VIEW_CUSTOMER_HISTORY",
    "OPEN_CASH_SESSION",
    "CLOSE_CASH_SESSION",
    "VIEW_CASH_REPORTS",
    "VIEW_ORDERS",
    "CREATE_ORDERS",
    "VIEW_POINTS_OF_SALE",
    "CREATE_BONIFICATIONS",
    "VIEW_BONIFICATIONS",
  ],
  SELLER: [
    "CREATE_SALES",
    "VIEW_OWN_SALES",
    "VIEW_PRODUCTS",
    "VIEW_INVENTORY",
    "VIEW_CUSTOMERS",
    "CREATE_CUSTOMERS",
    "CREATE_ORDERS",
    "VIEW_ORDERS",
    "CREATE_BONIFICATIONS",
    "VIEW_BONIFICATIONS",
  ],
  CASHIER: [
    "CREATE_SALES",
    "VIEW_OWN_SALES",
    "VIEW_PRODUCTS",
    "VIEW_CUSTOMERS",
    "CREATE_CUSTOMERS",
    "OPEN_CASH_SESSION",
    "CLOSE_CASH_SESSION",
    "MANAGE_CASH_TRANSACTIONS",
    "VIEW_CASH_REPORTS",
    "CREATE_ORDERS",
    "VIEW_ORDERS",
  ],
};

async function migrate() {
  try {
    console.log("🔄 Iniciando migração de roles para permissões...\n");

    // Buscar todos os usuários que ainda têm o campo role (se existir)
    // Como já removemos o campo role do schema, vamos assumir que queremos
    // configurar o admin existente
    
    // Buscar todos os usuários
    const users = await prisma.user.findMany({
      include: {
        permissions: true,
      },
    });

    console.log(`📊 Encontrados ${users.length} usuários\n`);

    let adminCount = 0;
    let updatedCount = 0;

    for (const user of users) {
      // Se o usuário já tem permissões, pular
      if (user.permissions.length > 0) {
        console.log(`⏭️  ${user.email} - já tem permissões configuradas`);
        continue;
      }

      // Se o usuário é admin (isAdmin = true), dar todas as permissões de ADMIN
      if (user.isAdmin) {
        console.log(`👑 ${user.email} - configurando como ADMIN`);
        
        await prisma.userPermission.createMany({
          data: ROLE_PERMISSIONS.ADMIN.map((perm) => ({
            userId: user.id,
            permission: perm,
            granted: true,
            grantedBy: user.id, // Admin concede a si mesmo
          })),
        });

        adminCount++;
        updatedCount++;
      } else {
        // Para usuários não-admin sem permissões, vamos dar permissões de SELLER por padrão
        console.log(`👤 ${user.email} - configurando permissões padrão (SELLER)`);
        
        await prisma.userPermission.createMany({
          data: ROLE_PERMISSIONS.SELLER.map((perm) => ({
            userId: user.id,
            permission: perm,
            granted: true,
            grantedBy: user.id,
          })),
        });

        updatedCount++;
      }
    }

    console.log("\n✅ Migração concluída!");
    console.log(`   - ${adminCount} administradores configurados`);
    console.log(`   - ${updatedCount} usuários atualizados no total`);
    console.log(`   - ${users.length - updatedCount} usuários já tinham permissões`);

  } catch (error) {
    console.error("❌ Erro na migração:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

migrate();
