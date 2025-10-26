import { NextRequest, NextResponse } from "next/server";
import { logger } from '@/lib/logger'
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";
import type { UserWhereInput } from "@/types";
import { z } from 'zod'
import { createUserSchema, searchUsersSchema } from '@/lib/validations'
import { withoutDeleted } from '@/lib/soft-delete'

// Force dynamic rendering - critical for real-time updates
export const dynamic = 'force-dynamic'
export const revalidate = 0

// GET /api/users - Listar usuários com filtros
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user.isAdmin) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const parsedFilters = searchUsersSchema.safeParse({
    search: searchParams.get("search") ?? undefined,
    status: searchParams.get("status") ?? undefined,
    isAdmin: searchParams.get("isAdmin") ?? undefined,
    page: searchParams.get("page") ?? undefined,
    limit: searchParams.get("limit") ?? undefined,
  })

  if (!parsedFilters.success) {
    return NextResponse.json(
      { error: "Parâmetros de busca inválidos", details: parsedFilters.error.errors },
      { status: 400 },
    )
  }

  const filters = parsedFilters.data

  const where: UserWhereInput = {}

  if (filters.search) {
    where.OR = [
      { fullName: { contains: filters.search, mode: "insensitive" } },
      { email: { contains: filters.search, mode: "insensitive" } },
      { cpf: { contains: filters.search, mode: "insensitive" } },
    ]
  }

  if (filters.status) {
    where.status = filters.status
  }

  if (filters.isAdmin !== undefined) {
    where.isAdmin = filters.isAdmin
  }

  const users = await prisma.user.findMany({
    where: withoutDeleted(where),
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

    if (existingUser && !existingUser.deletedAt) {
      return NextResponse.json(
        { error: "Email já cadastrado" },
        { status: 400 }
      );
    }

    if (existingUser?.deletedAt) {
      return NextResponse.json(
        { error: "Conta com este e-mail foi desativada. Restaure o usuário antes de reutilizar." },
        { status: 409 }
      )
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
