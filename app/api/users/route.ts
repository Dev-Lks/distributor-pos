import { NextRequest, NextResponse } from "next/server";
import { logger } from '@/lib/logger'
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";
import type { UserWhereInput } from "@/types";
import { z } from 'zod'
import { createUserSchema, searchUsersSchema } from '@/lib/validations'

// GET /api/users - Listar usuários com filtros
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user.isAdmin) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search");
  const status = searchParams.get("status");
  const isAdmin = searchParams.get("isAdmin");

  const where: UserWhereInput = {};

  if (search) {
    where.OR = [
      { fullName: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { cpf: { contains: search, mode: "insensitive" } },
    ];
  }

  if (status) where.status = status as "ACTIVE" | "INACTIVE" | "SUSPENDED";
  if (isAdmin !== null && isAdmin !== undefined) {
    where.isAdmin = isAdmin === "true";
  }

  const users = await prisma.user.findMany({
    where,
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
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(users);
}

// POST /api/users - Criar novo usuário
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  // Apenas ADMIN pode criar usuários
  if (!session.user.isAdmin) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  try {
    const body = await req.json();
    
    // Validação com Zod
    const validated = createUserSchema.parse(body);

    // Verificar se email já existe
    const existingUser = await prisma.user.findUnique({
      where: { email: validated.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email já cadastrado" },
        { status: 400 }
      );
    }

    // Hash da senha
    const passwordHash = await hash(validated.password, 10);

    // Criar usuário com vinculações aos PDVs e permissões
    const user = await prisma.user.create({
      data: {
        fullName: validated.fullName,
        email: validated.email,
        passwordHash,
        password: passwordHash, // Compatibilidade legado
        name: validated.fullName, // Compatibilidade legado
        phone: validated.phone,
        cpf: validated.cpf,
        isAdmin: validated.isAdmin,
        createdById: session.user.id,
        userPointsOfSale: {
          create: validated.pointsOfSaleIds.map((posId: string, index: number) => ({
            pointOfSaleId: posId,
            isPrimary: index === 0, // Primeiro PDV é o primário
            assignedBy: session.user.id,
          })),
        },
        permissions: {
          create: (validated.permissions || []).map((perm: string) => ({
            permission: perm as any, // Type assertion para PermissionKey
            granted: true,
            grantedBy: session.user.id,
          })),
        },
      },
      include: {
        permissions: true,
        userPointsOfSale: {
          include: {
            pointOfSale: true,
          },
        },
      },
    });

    logger.audit('user_created', session.user.email || 'unknown', {
      userId: user.id,
      userEmail: user.email,
      isAdmin: user.isAdmin,
      pointsOfSaleCount: validated.pointsOfSaleIds.length,
    })

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.errors },
        { status: 400 }
      );
    }
    logger.error('Failed to create user', { error })
    return NextResponse.json(
      { error: "Erro ao criar usuário" },
      { status: 500 }
    );
  }
}
