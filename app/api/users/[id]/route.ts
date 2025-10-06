import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";

// GET /api/users/[id] - Buscar usuário por ID
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: params.id },
    include: {
      permissions: true,
      userPointsOfSale: {
        include: {
          pointOfSale: true,
        },
      },
      _count: {
        select: {
          salesCreated: true,
          cashSessions: true,
          inventoryMovements: true,
          ordersCreated: true,
        },
      },
    },
  });

  if (!user) {
    return NextResponse.json(
      { error: "Usuário não encontrado" },
      { status: 404 }
    );
  }

  return NextResponse.json(user);
}

// PATCH /api/users/[id] - Atualizar usuário
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user.isAdmin) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const body = await req.json();
  const { fullName, phone, cpf, isAdmin, status, pointsOfSaleIds, newPassword, permissions } =
    body;

  const updateData: any = {};
  if (fullName) {
    updateData.fullName = fullName;
    updateData.name = fullName; // Compatibilidade legado
  }
  if (phone !== undefined) updateData.phone = phone;
  if (cpf !== undefined) updateData.cpf = cpf;
  if (isAdmin !== undefined) updateData.isAdmin = isAdmin;
  if (status) updateData.status = status;

  // Se nova senha foi fornecida
  if (newPassword) {
    const passwordHash = await hash(newPassword, 10);
    updateData.passwordHash = passwordHash;
    updateData.password = passwordHash; // Compatibilidade legado
    updateData.passwordChangedAt = new Date();
  }

  const user = await prisma.user.update({
    where: { id: params.id },
    data: updateData,
  });

  // Atualizar vinculações de PDVs se fornecido
  if (pointsOfSaleIds) {
    // Remover vinculações antigas
    await prisma.userPointOfSale.deleteMany({
      where: { userId: params.id },
    });

    // Criar novas vinculações
    await prisma.userPointOfSale.createMany({
      data: pointsOfSaleIds.map((posId: string, index: number) => ({
        userId: params.id,
        pointOfSaleId: posId,
        isPrimary: index === 0,
        assignedBy: session.user.id,
      })),
    });
  }

  // Atualizar permissões se fornecido
  if (permissions) {
    // Remover permissões antigas
    await prisma.userPermission.deleteMany({
      where: { userId: params.id },
    });

    // Criar novas permissões
    await prisma.userPermission.createMany({
      data: permissions.map((perm: string) => ({
        userId: params.id,
        permission: perm,
        granted: true,
        grantedBy: session.user.id,
      })),
    });
  }

  return NextResponse.json(user);
}

// DELETE /api/users/[id] - Desativar usuário (soft delete)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user.isAdmin) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  // Não permitir que o admin delete a si mesmo
  if (params.id === session.user.id) {
    return NextResponse.json(
      { error: "Você não pode desativar sua própria conta" },
      { status: 400 }
    );
  }

  const user = await prisma.user.update({
    where: { id: params.id },
    data: { 
      status: "INACTIVE",
      isActive: false // Compatibilidade legado
    },
  });

  return NextResponse.json({ message: "Usuário desativado com sucesso" });
}
