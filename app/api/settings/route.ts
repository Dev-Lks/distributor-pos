import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/settings - Buscar configurações do sistema
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  try {
    // Buscar configurações do banco (tabela Settings seria criada)
    // Por enquanto, retornar configurações padrão
    const settings = {
      businessName: "NitroBeer Tap House",
      supportEmail: "contato@nitrobeer.com",
      receiptMessage: "Obrigado por escolher a NitroBeer! Aproveite 10% off no próximo growler.",
      defaultPointOfSaleId: null,
      
      // Notificações
      notifications: {
        email: true,
        push: true,
        desktop: false,
      },
      
      // Alertas
      alerts: {
        lowStock: true,
        autoReceipt: false,
      },
      
      // Sincronização
      autoSync: true,
      syncInterval: 5, // minutos
      
      // Segurança
      security: {
        maxLoginAttempts: 5,
        lockoutDuration: 15, // minutos
        sessionTimeout: 480, // minutos (8 horas)
        requirePasswordChange: 90, // dias
      },
      
      // Backup
      backup: {
        autoBackup: true,
        backupInterval: "daily",
        retentionDays: 30,
      },
    };

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Erro ao buscar configurações:", error);
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
    
    // Aqui você salvaria as configurações no banco
    // Por enquanto, apenas validar e retornar
    
    console.log("Configurações atualizadas:", body);
    
    return NextResponse.json({
      success: true,
      message: "Configurações atualizadas com sucesso",
      settings: body,
    });
  } catch (error) {
    console.error("Erro ao atualizar configurações:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar configurações" },
      { status: 500 }
    );
  }
}
