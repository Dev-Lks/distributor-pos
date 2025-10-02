import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function setupAdmin() {
  try {
    console.log("🔧 Configurando usuário administrador...\n");

    // Buscar o admin
    const admin = await prisma.user.findUnique({
      where: { email: "admin@nitrobeer.com" },
    });

    if (!admin) {
      console.log("❌ Usuário admin não encontrado!");
      return;
    }

    // Atualizar para isAdmin = true
    await prisma.user.update({
      where: { id: admin.id },
      data: { isAdmin: true },
    });

    // Remover permissões antigas
    await prisma.userPermission.deleteMany({
      where: { userId: admin.id },
    });

    // Adicionar todas as permissões de admin
    const allPermissions = [
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
    ];

    await prisma.userPermission.createMany({
      data: allPermissions.map((perm: any) => ({
        userId: admin.id,
        permission: perm,
        granted: true,
        grantedBy: admin.id,
      })),
    });

    console.log("✅ Admin configurado com sucesso!");
    console.log(`   Email: ${admin.email}`);
    console.log(`   isAdmin: true`);
    console.log(`   Permissões: ${allPermissions.length} concedidas`);

  } catch (error) {
    console.error("❌ Erro:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

setupAdmin();
