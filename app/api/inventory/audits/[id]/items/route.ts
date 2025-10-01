import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// POST /api/inventory/audits/[id]/items - Adicionar item auditado
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();

    // Validação
    if (!data.productId || data.countedQuantity === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verificar se a auditoria existe e está em progresso
    const audit = await prisma.inventoryAudit.findUnique({
      where: { id: params.id },
    });

    if (!audit) {
      return NextResponse.json({ error: 'Audit not found' }, { status: 404 });
    }

    if (audit.status !== 'IN_PROGRESS') {
      return NextResponse.json(
        { error: 'Audit is not in progress' },
        { status: 400 }
      );
    }

    // Buscar estoque esperado
    const inventory = await prisma.inventory.findUnique({
      where: { productId: data.productId },
    });

    let expectedQuantity = 0;
    if (inventory) {
      const location = audit.location || 'COLD_ROOM';
      expectedQuantity =
        location === 'COLD_ROOM'
          ? inventory.coldRoomQuantity
          : location === 'HOUSE'
          ? inventory.houseQuantity
          : inventory.salePointQuantity;
    }

    const countedQuantity = parseInt(data.countedQuantity);
    const difference = countedQuantity - expectedQuantity;

    // Criar item da auditoria
    const auditItem = await prisma.inventoryAuditItem.create({
      data: {
        auditId: params.id,
        productId: data.productId,
        batchId: data.batchId,
        expectedQuantity,
        countedQuantity,
        difference,
        notes: data.notes,
        photoUrl: data.photoUrl,
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            size: true,
          },
        },
      },
    });

    // Se há diferença, criar ajuste de inventário
    if (difference !== 0) {
      await prisma.inventoryMovement.create({
        data: {
          productId: data.productId,
          batchId: data.batchId,
          type: 'ADJUSTMENT',
          quantity: difference,
          adjustmentReason: 'AUDIT',
          notes: `Ajuste de auditoria: diferença de ${difference}`,
          performedBy: session.user?.email || 'system',
        },
      });

      // Atualizar estoque
      const location = audit.location || 'COLD_ROOM';
      const locationField = `${
        location === 'COLD_ROOM' ? 'coldRoom' : location === 'HOUSE' ? 'house' : 'salePoint'
      }Quantity`;

      await prisma.inventory.update({
        where: { productId: data.productId },
        data: {
          [locationField]: countedQuantity,
        },
      });
    }

    return NextResponse.json(auditItem, { status: 201 });
  } catch (error) {
    console.error('Error creating audit item:', error);
    return NextResponse.json(
      { error: 'Failed to create audit item' },
      { status: 500 }
    );
  }
}
