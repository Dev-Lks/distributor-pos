import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";
import type { Prisma, PermissionKey } from "@prisma/client";
import { softDelete, withoutDeleted } from '@/lib/soft-delete'
import { updateUserSchema } from '@/lib/validations'

// Force dynamic rendering - critical for real-time updates
export const dynamic = 'force-dynamic'
export const revalidate = 0

// GET /api/users/[id] - Buscar usuário por ID
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const user = await prisma.user.findFirst({
    where: withoutDeleted({ id }),
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
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await getServerSession(authOptions);

  if (!session || !session.user.isAdmin) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const body = await req.json();

  const parsed = updateUserSchema.parse({
    ...body,
    id,
  });

  const existingUser = await prisma.user.findFirst({
    where: withoutDeleted({ id }),
    include: {
      permissions: true,
      userPointsOfSale: true,
    },
  });

  if (!existingUser) {
    return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
  }

  if (parsed.email && parsed.email !== existingUser.email) {
    const emailInUse = await prisma.user.findFirst({
      where: withoutDeleted({ email: parsed.email }),
      select: { id: true },
    });

    if (emailInUse && emailInUse.id !== id) {
      return NextResponse.json({ error: "Email já utilizado por outro usuário" }, { status: 400 });
    }
  }

  const updateData: Prisma.UserUpdateInput = {};

  if (parsed.fullName !== undefined) {
    updateData.fullName = parsed.fullName;
    updateData.name = parsed.fullName; // Compatibilidade legado
  }

  if (parsed.email !== undefined) {
    updateData.email = parsed.email;
  }

  if (parsed.phone !== undefined) {
    updateData.phone = parsed.phone ?? null;
  }

  if (parsed.cpf !== undefined) {
    updateData.cpf = parsed.cpf ?? null;
  }

  if (parsed.isAdmin !== undefined) {
    updateData.isAdmin = parsed.isAdmin;
  }

  if (parsed.status !== undefined) {
    updateData.status = parsed.status;
    updateData.isActive = parsed.status === "ACTIVE"; // Compatibilidade legado
  }

  if (parsed.newPassword) {
    const passwordHash = await hash(parsed.newPassword, 10);
    updateData.passwordHash = passwordHash;
    updateData.password = passwordHash; // Compatibilidade legado
    updateData.passwordChangedAt = new Date();
  }

  const result = await prisma.$transaction(async (tx) => {
    const updatedUser = await tx.user.update({
      where: { id },
      data: updateData,
    });

    if (parsed.pointsOfSaleIds) {
      await tx.userPointOfSale.deleteMany({ where: { userId: id } });

      await tx.userPointOfSale.createMany({
        data: parsed.pointsOfSaleIds.map((posId, index) => ({
          userId: id,
          pointOfSaleId: posId,
          isPrimary: index === 0,
          assignedBy: session.user.id,
        })),
      });
    }

    if (parsed.permissions) {
      await tx.userPermission.deleteMany({ where: { userId: id } });

      if (parsed.permissions.length > 0) {
        await tx.userPermission.createMany({
          data: parsed.permissions.map((perm) => ({
            userId: id,
            permission: perm as PermissionKey,
            granted: true,
            grantedBy: session.user.id,
          })),
        });
      }
    }

    return updatedUser;
  });

  return NextResponse.json(result);
}

// DELETE /api/users/[id] - Desativar usuário (soft delete)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await getServerSession(authOptions);

  if (!session || !session.user.isAdmin) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  // Não permitir que o admin delete a si mesmo
  if (id === session.user.id) {
    return NextResponse.json(
      { error: "Você não pode desativar sua própria conta" },
      { status: 400 }
    );
  }

  const user = await prisma.user.findFirst({
    where: withoutDeleted({ id }),
    select: { id: true },
  })

  if (!user) {
    return NextResponse.json(
      { error: "Usuário não encontrado" },
      { status: 404 }
    )
  }

  await softDelete('user', id, {
    data: {
      status: "INACTIVE",
      isActive: false,
    },
  })

  return NextResponse.json({ message: "Usuário desativado com sucesso" });
}
