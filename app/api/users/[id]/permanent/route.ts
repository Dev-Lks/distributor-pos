import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// DELETE /api/users/[id]/permanent - Deletar usuário permanentemente (hard delete)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user.isAdmin) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const userId = params.id;

  // Não permitir que o admin delete a si mesmo
  if (userId === session.user.id) {
    return NextResponse.json(
      { error: "Você não pode deletar sua própria conta" },
      { status: 400 }
    );
  }

  try {
    // Verificar se usuário existe
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
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

    // Avisar se o usuário tem dados associados
    const hasData =
      user._count.salesCreated > 0 ||
      user._count.cashSessions > 0 ||
      user._count.inventoryMovements > 0 ||
      user._count.ordersCreated > 0;

    if (hasData) {
      return NextResponse.json(
        {
          error:
            "Este usuário possui vendas, movimentações ou outros dados associados. Por segurança, não é possível deletar permanentemente. Use a desativação ao invés disso.",
          details: {
            salesCreated: user._count.salesCreated,
            cashSessions: user._count.cashSessions,
            inventoryMovements: user._count.inventoryMovements,
            ordersCreated: user._count.ordersCreated,
          },
        },
        { status: 400 }
      );
    }

    // Deletar usuário e suas relações (cascade)
    await prisma.user.delete({
      where: { id: userId },
    });

    return NextResponse.json({
      success: true,
      message: "Usuário deletado permanentemente com sucesso",
    });
  } catch (error) {
    console.error("Erro ao deletar usuário:", error);
    return NextResponse.json(
      { error: "Erro ao deletar usuário" },
      { status: 500 }
    );
  }
}
