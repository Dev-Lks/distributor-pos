import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import type { Prisma } from "@prisma/client";

// Force dynamic rendering - critical for real-time updates
export const dynamic = 'force-dynamic'
export const revalidate = 0

// GET /api/settings - Buscar configurações do sistema
export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  try {
    // Buscar configurações do banco
    let settings = await prisma.systemSettings.findFirst();
    
    // Se não existir, criar com valores padrão
    if (!settings) {
      settings = await prisma.systemSettings.create({
        data: {
          businessName: "NitroBeer Tap House",
          receiptFooterMessage: "Obrigado por escolher a NitroBeer! Aproveite 10% off no próximo growler.",
        }
      });
    }

    return NextResponse.json({
      businessName: settings.businessName,
      cnpj: settings.cnpj,
      address: settings.address,
      addressNumber: settings.addressNumber,
      district: settings.district,
      city: settings.city,
      state: settings.state,
      postalCode: settings.postalCode,
      phone: settings.phone,
      email: settings.email,
      website: settings.website,
      supportEmail: settings.email,
      receiptMessage: settings.receiptFooterMessage,
      receiptLogoUrl: settings.receiptLogoUrl,
      receiptShowQRCode: settings.receiptShowQRCode,
      receiptWidth: settings.receiptWidth,
      defaultPointOfSaleId: settings.defaultPointOfSaleId,
      
      // Notificações
      notifications: {
        email: settings.notificationEmail,
        push: settings.notificationPush,
        desktop: settings.notificationDesktop,
      },
      
      // Alertas
      alerts: {
        lowStock: settings.alertLowStock,
        autoReceipt: settings.alertAutoReceipt,
      },
      
      lowStockThreshold: settings.lowStockThreshold,
      
      // Sincronização
      autoSync: settings.autoSync,
      syncInterval: settings.syncInterval,
    });
  } catch (error) {
    logger.error("Erro ao buscar configurações", { error });
    return NextResponse.json(
      { error: "Erro ao buscar configurações" },
      { status: 500 }
    );
  }
}

// PATCH /api/settings - Atualizar configurações
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  // Apenas admin pode atualizar configurações
  if (!session.user.isAdmin) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  try {
    const body = await req.json();
    
    // Buscar configurações existentes ou criar nova
    let settings = await prisma.systemSettings.findFirst();
    
  const updateData: Record<string, unknown> = {};
    
    // Dados da empresa
    if (body.businessName !== undefined) updateData.businessName = body.businessName;
    if (body.cnpj !== undefined) updateData.cnpj = body.cnpj;
    if (body.address !== undefined) updateData.address = body.address;
    if (body.addressNumber !== undefined) updateData.addressNumber = body.addressNumber;
    if (body.district !== undefined) updateData.district = body.district;
    if (body.city !== undefined) updateData.city = body.city;
    if (body.state !== undefined) updateData.state = body.state;
    if (body.postalCode !== undefined) updateData.postalCode = body.postalCode;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.email !== undefined) updateData.email = body.email;
    if (body.supportEmail !== undefined) updateData.email = body.supportEmail;
    if (body.website !== undefined) updateData.website = body.website;
    
    // Configurações de recibos
    if (body.receiptMessage !== undefined) updateData.receiptFooterMessage = body.receiptMessage;
    if (body.receiptLogoUrl !== undefined) updateData.receiptLogoUrl = body.receiptLogoUrl;
    if (body.receiptShowQRCode !== undefined) updateData.receiptShowQRCode = body.receiptShowQRCode;
    if (body.receiptWidth !== undefined) updateData.receiptWidth = body.receiptWidth;
    
    // Notificações
    if (body.notifications) {
      if (body.notifications.email !== undefined) updateData.notificationEmail = body.notifications.email;
      if (body.notifications.push !== undefined) updateData.notificationPush = body.notifications.push;
      if (body.notifications.desktop !== undefined) updateData.notificationDesktop = body.notifications.desktop;
    }
    
    // Alertas
    if (body.alerts) {
      if (body.alerts.lowStock !== undefined) updateData.alertLowStock = body.alerts.lowStock;
      if (body.alerts.autoReceipt !== undefined) updateData.alertAutoReceipt = body.alerts.autoReceipt;
    }
    
    if (body.lowStockThreshold !== undefined) updateData.lowStockThreshold = body.lowStockThreshold;
    
    // Sincronização
    if (body.autoSync !== undefined) updateData.autoSync = body.autoSync;
    if (body.syncInterval !== undefined) updateData.syncInterval = body.syncInterval;
    
    // Outras
    if (body.defaultPointOfSaleId !== undefined) updateData.defaultPointOfSaleId = body.defaultPointOfSaleId;
    
    if (settings) {
      settings = await prisma.systemSettings.update({
        where: { id: settings.id },
        data: updateData as Prisma.SystemSettingsUpdateInput,
      });
    } else {
      settings = await prisma.systemSettings.create({
        data: updateData as Prisma.SystemSettingsUncheckedCreateInput,
      });
    }
    
    logger.info("Configurações atualizadas", { userId: session.user.id });
    
    return NextResponse.json({
      success: true,
      message: "Configurações atualizadas com sucesso",
      settings,
    });
  } catch (error) {
    logger.error("Erro ao atualizar configurações", { error, userId: session.user.id });
    return NextResponse.json(
      { error: "Erro ao atualizar configurações" },
      { status: 500 }
    );
  }
}
