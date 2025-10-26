import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";

// Force dynamic rendering - critical for real-time updates
export const dynamic = 'force-dynamic'
export const revalidate = 0

// POST /api/users/[id]/reset-password - Resetar senha de usuário
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  // Apenas admin pode resetar senhas
  if (!session.user.isAdmin) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const userId = id;
  const body = await req.json();
  const { newPassword } = body;

  if (!newPassword || newPassword.length < 6) {
    return NextResponse.json(
      { error: "Senha deve ter no mínimo 6 caracteres" },
      { status: 400 }
    );
  }

  try {
    // Verificar se usuário existe
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    // Hash da nova senha
    const passwordHash = await hash(newPassword, 10);

    // Atualizar senha
    await prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash,
        password: passwordHash, // Compatibilidade legado
        passwordChangedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Senha resetada com sucesso",
    });
  } catch (error) {
    console.error("Erro ao resetar senha:", error);
    return NextResponse.json(
      { error: "Erro ao resetar senha" },
      { status: 500 }
    );
  }
}
