import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { softDelete, withoutDeleted } from '@/lib/soft-delete';

// GET /api/inventory/batches/[id] - Buscar lote específico
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const batch = await prisma.batch.findFirst({
      where: withoutDeleted({ id }),
      include: {
        product: true,
        inventoryMovements: {
          orderBy: {
            occurredAt: 'desc',
          },
          take: 20,
        },
      },
    });

    if (!batch) {
      return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
    }

    return NextResponse.json(batch);
  } catch (error) {
    console.error('Error fetching batch:', error);
    return NextResponse.json(
      { error: 'Failed to fetch batch' },
      { status: 500 }
    );
  }
}

// PATCH /api/inventory/batches/[id] - Atualizar lote
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();

    const existingBatch = await prisma.batch.findFirst({
      where: withoutDeleted({ id }),
    });

    if (!existingBatch) {
      return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
    }

    const batch = await prisma.batch.update({
      where: { id: id },
      data: {
        supplier: data.supplier,
        notes: data.notes,
        status: data.status,
        location: data.location,
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

    return NextResponse.json(batch);
  } catch (error) {
    console.error('Error updating batch:', error);
    return NextResponse.json(
      { error: 'Failed to update batch' },
      { status: 500 }
    );
  }
}

// DELETE /api/inventory/batches/[id] - Deletar lote
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const existingBatch = await prisma.batch.findFirst({
      where: withoutDeleted({ id }),
    });

    if (!existingBatch) {
      return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
    }

    await softDelete('batch', id, {
      sessionUserId: session.user?.id,
      data: { status: 'DEPLETED' },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting batch:', error);
    return NextResponse.json(
      { error: 'Failed to delete batch' },
      { status: 500 }
    );
  }
}
