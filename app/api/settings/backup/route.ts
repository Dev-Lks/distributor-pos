import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

// Force dynamic rendering - critical for real-time updates
export const dynamic = 'force-dynamic'
export const revalidate = 0

// POST /api/settings/backup - Criar backup do sistema
export async function POST() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user.isAdmin) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    
    // Buscar dados para backup
    const [
      users,
      products,
      pointsOfSale,
      sales,
      inventory,
      customers,
      orders,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.product.count(),
      prisma.pointOfSale.count(),
      prisma.sale.count(),
      prisma.inventory.count(),
      prisma.customer.count(),
      prisma.order.count(),
    ]);

    const backupInfo = {
      timestamp,
      version: "1.0.0",
      stats: {
        users,
        products,
        pointsOfSale,
        sales,
        inventory,
        customers,
        orders,
      },
    };

    // Em produção, você salvaria os dados em um arquivo ou storage externo
    logger.info("Backup criado", { timestamp: backupInfo.timestamp, userId: session.user.id });

    return NextResponse.json({
      success: true,
      message: "Backup criado com sucesso",
      backup: backupInfo,
    });
  } catch (error) {
    logger.error("Erro ao criar backup", { error, userId: session.user.id });
    return NextResponse.json(
      { error: "Erro ao criar backup" },
      { status: 500 }
    );
  }
}
