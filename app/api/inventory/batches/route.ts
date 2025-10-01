import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/inventory/batches - Listar lotes
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const status = searchParams.get('status');

    const where: any = {};
    if (productId) {
      where.productId = productId;
    }
    if (status) {
      where.status = status;
    }

    const batches = await prisma.batch.findMany({
      where,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            size: true,
          },
        },
      },
      orderBy: {
        receivedDate: 'desc',
      },
    });

    return NextResponse.json(batches);
  } catch (error) {
    console.error('Error fetching batches:', error);
    return NextResponse.json(
      { error: 'Failed to fetch batches' },
      { status: 500 }
    );
  }
}

// POST /api/inventory/batches - Criar novo lote
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();

    // Validação básica
    if (!data.productId || !data.batchNumber || !data.quantity) {
      return NextResponse.json(
        { error: 'Missing required fields: productId, batchNumber, quantity' },
        { status: 400 }
      );
    }

    // Verificar se o produto existe
    const product = await prisma.product.findUnique({
      where: { id: data.productId },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Verificar se o número do lote já existe
    const existingBatch = await prisma.batch.findUnique({
      where: { batchNumber: data.batchNumber },
    });

    if (existingBatch) {
      return NextResponse.json(
        { error: 'Batch number already exists' },
        { status: 400 }
      );
    }

    // Normalizar location para uppercase
    const locationMap = {
      coldRoom: 'COLD_ROOM' as const,
      house: 'HOUSE' as const,
      salePoint: 'SALE_POINT' as const,
      COLD_ROOM: 'COLD_ROOM' as const,
      HOUSE: 'HOUSE' as const,
      SALE_POINT: 'SALE_POINT' as const,
    };
    
    const normalizedLocation = locationMap[data.location as keyof typeof locationMap] || 'COLD_ROOM';

    // Gerar QR Code simples (base64 do batch number)
    const qrCode = Buffer.from(data.batchNumber).toString('base64');

    // Criar o lote
    const batch = await prisma.batch.create({
      data: {
        productId: data.productId,
        batchNumber: data.batchNumber,
        supplier: data.supplier,
        productionDate: data.productionDate ? new Date(data.productionDate) : null,
        expirationDate: data.expirationDate ? new Date(data.expirationDate) : null,
        receivedDate: data.receivedDate ? new Date(data.receivedDate) : new Date(),
        quantity: parseInt(data.quantity),
        remainingQuantity: parseInt(data.quantity),
        cost: parseFloat(data.cost) || 0,
        location: normalizedLocation,
        notes: data.notes,
        qrCode,
        status: 'ACTIVE',
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

    // Criar movimentação de recebimento
    await prisma.inventoryMovement.create({
      data: {
        productId: data.productId,
        batchId: batch.id,
        type: 'RECEIPT',
        quantity: parseInt(data.quantity),
        unitCost: parseFloat(data.cost) || 0,
        toLocation: normalizedLocation,
        notes: `Lote ${data.batchNumber} recebido`,
        performedBy: session.user?.email || 'system',
      },
    });

    // Atualizar estoque do produto
    const locationFieldMap = {
      COLD_ROOM: 'coldRoomQuantity',
      HOUSE: 'houseQuantity',
      SALE_POINT: 'salePointQuantity',
    };
    
    const locationField = locationFieldMap[normalizedLocation as keyof typeof locationFieldMap];
    
    await prisma.inventory.upsert({
      where: { productId: data.productId },
      create: {
        productId: data.productId,
        [locationField]: parseInt(data.quantity),
        lastRestockedAt: new Date(),
      },
      update: {
        [locationField]: {
          increment: parseInt(data.quantity),
        },
        lastRestockedAt: new Date(),
      },
    });

    return NextResponse.json(batch, { status: 201 });
  } catch (error) {
    console.error('Error creating batch:', error);
    return NextResponse.json(
      { error: 'Failed to create batch' },
      { status: 500 }
    );
  }
}
