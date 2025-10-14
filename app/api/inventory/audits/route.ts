import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger'
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/inventory/audits - Listar auditorias
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const where: any = {};
    if (status) {
      where.status = status;
    }

    const audits = await prisma.inventoryAudit.findMany({
      where,
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                size: true,
              },
            },
          },
        },
      },
      orderBy: {
        startedAt: 'desc',
      },
    });

    return NextResponse.json(audits);
  } catch (error) {
    logger.error('Error fetching audits:', { error });
    return NextResponse.json(
      { error: 'Failed to fetch audits' },
      { status: 500 }
    );
  }
}

// POST /api/inventory/audits - Criar nova auditoria
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();

    const audit = await prisma.inventoryAudit.create({
      data: {
        status: 'IN_PROGRESS',
        location: data.location,
        performedBy: [session.user?.email || 'unknown'],
        notes: data.notes,
      },
    });

    return NextResponse.json(audit, { status: 201 });
  } catch (error) {
    logger.error('Error creating audit:', { error });
    return NextResponse.json(
      { error: 'Failed to create audit' },
      { status: 500 }
    );
  }
}
