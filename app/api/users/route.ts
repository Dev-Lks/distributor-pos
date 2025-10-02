import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";

// GET /api/users - Listar usuários com filtros
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search");
  const role = searchParams.get("role");
  const status = searchParams.get("status");

  const where: any = {};

  if (search) {
    where.OR = [
      { fullName: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { cpf: { contains: search, mode: "insensitive" } },
    ];
  }

  if (role) where.role = role;
  if (status) where.status = status;

  const users = await prisma.user.findMany({
    where,
    include: {
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

  // Apenas ADMIN pode criar qualquer usuário
  // MANAGER só pode criar SELLER e CASHIER
  if (
    session.user.role !== "ADMIN" &&
    session.user.role !== "MANAGER"
  ) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const body = await req.json();
  const { fullName, email, password, phone, cpf, role, pointsOfSaleIds } =
    body;

  // Validações
  if (!fullName || !email || !password) {
    return NextResponse.json(
      { error: "Nome, email e senha são obrigatórios" },
      { status: 400 }
    );
  }

  if (!pointsOfSaleIds || pointsOfSaleIds.length === 0) {
    return NextResponse.json(
      { error: "Selecione pelo menos um ponto de venda" },
      { status: 400 }
    );
  }

  // MANAGER não pode criar ADMIN ou outros MANAGERS
  if (session.user.role === "MANAGER") {
    if (role === "ADMIN" || role === "MANAGER") {
      return NextResponse.json(
        { error: "Você não tem permissão para criar este tipo de usuário" },
        { status: 403 }
      );
    }
  }

  // Verificar se email já existe
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    return NextResponse.json(
      { error: "Email já cadastrado" },
      { status: 400 }
    );
  }

  // Hash da senha
  const passwordHash = await hash(password, 10);

  // Criar usuário com vinculações aos PDVs
  const user = await prisma.user.create({
    data: {
      fullName,
      email,
      passwordHash,
      password: passwordHash, // Compatibilidade legado
      name: fullName, // Compatibilidade legado
      phone,
      cpf,
      role: role || "SELLER",
      createdById: session.user.id,
      userPointsOfSale: {
        create: pointsOfSaleIds.map((posId: string, index: number) => ({
          pointOfSaleId: posId,
          roleInPOS:
            role === "MANAGER" ? "MANAGER" : "SELLER",
          isPrimary: index === 0, // Primeiro PDV é o primário
          assignedBy: session.user.id,
        })),
      },
    },
    include: {
      userPointsOfSale: {
        include: {
          pointOfSale: true,
        },
      },
    },
  });

  return NextResponse.json(user, { status: 201 });
}
