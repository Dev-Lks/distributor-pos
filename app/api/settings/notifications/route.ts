import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

// Force dynamic rendering - critical for real-time updates
export const dynamic = 'force-dynamic'
export const revalidate = 0

interface NotificationSettings {
  enableDeliveryUpdates: boolean;
  enableStockAlerts: boolean;
  enableSaleNotifications: boolean;
  enableDesktopNotifications: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

// GET /api/settings/notifications - Buscar configurações de notificações do usuário
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  try {
    const userId = session.user.id as string;

    // Buscar configurações do usuário
    let userSettings = await prisma.userPreferences.findUnique({
      where: { userId },
      select: {
        notificationDeliveries: true,
        notificationStockAlerts: true,
        notificationSales: true,
        notificationDesktop: true,
        notificationSound: true,
        notificationVibration: true,
      },
    });

    // Se não existir, criar com defaults
    if (!userSettings) {
      userSettings = await prisma.userPreferences.create({
        data: {
          userId,
          notificationDeliveries: true,
          notificationStockAlerts: true,
          notificationSales: true,
          notificationDesktop: true,
          notificationSound: true,
          notificationVibration: true,
        },
        select: {
          notificationDeliveries: true,
          notificationStockAlerts: true,
          notificationSales: true,
          notificationDesktop: true,
          notificationSound: true,
          notificationVibration: true,
        },
      });
    }

    return NextResponse.json({
      enableDeliveryUpdates: userSettings.notificationDeliveries,
      enableStockAlerts: userSettings.notificationStockAlerts,
      enableSaleNotifications: userSettings.notificationSales,
      enableDesktopNotifications: userSettings.notificationDesktop,
      soundEnabled: userSettings.notificationSound,
      vibrationEnabled: userSettings.notificationVibration,
    });
  } catch (error) {
    logger.error("Erro ao buscar configurações de notificações", { error });
    return NextResponse.json(
      { error: "Erro ao buscar configurações" },
      { status: 500 }
    );
  }
}

// PATCH /api/settings/notifications - Atualizar configurações de notificações
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  try {
    const userId = session.user.id as string;
    const body = (await req.json()) as NotificationSettings;

    // Atualizar ou criar preferências do usuário
    const updated = await prisma.userPreferences.upsert({
      where: { userId },
      update: {
        notificationDeliveries: body.enableDeliveryUpdates,
        notificationStockAlerts: body.enableStockAlerts,
        notificationSales: body.enableSaleNotifications,
        notificationDesktop: body.enableDesktopNotifications,
        notificationSound: body.soundEnabled,
        notificationVibration: body.vibrationEnabled,
      },
      create: {
        userId,
        notificationDeliveries: body.enableDeliveryUpdates,
        notificationStockAlerts: body.enableStockAlerts,
        notificationSales: body.enableSaleNotifications,
        notificationDesktop: body.enableDesktopNotifications,
        notificationSound: body.soundEnabled,
        notificationVibration: body.vibrationEnabled,
      },
      select: {
        notificationDeliveries: true,
        notificationStockAlerts: true,
        notificationSales: true,
        notificationDesktop: true,
        notificationSound: true,
        notificationVibration: true,
      },
    });

    logger.info("Configurações de notificações atualizadas", {
      userId,
    });

    return NextResponse.json({
      success: true,
      settings: {
        enableDeliveryUpdates: updated.notificationDeliveries,
        enableStockAlerts: updated.notificationStockAlerts,
        enableSaleNotifications: updated.notificationSales,
        enableDesktopNotifications: updated.notificationDesktop,
        soundEnabled: updated.notificationSound,
        vibrationEnabled: updated.notificationVibration,
      },
    });
  } catch (error) {
    logger.error("Erro ao atualizar configurações de notificações", {
      error,
      userId: session.user.id,
    });
    return NextResponse.json(
      { error: "Erro ao atualizar configurações" },
      { status: 500 }
    );
  }
}
