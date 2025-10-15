import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { softDelete, withoutDeleted } from '@/lib/soft-delete';

// POST /api/inventory/bulk - Operações em massa
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { productIds, operation, params } = await request.json();

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json(
        { error: 'Product IDs are required' },
        { status: 400 }
      );
    }

    let result: any = {};

    switch (operation) {
      case 'adjust_price':
        {
          const { percentage, operation: priceOp } = params;
          if (!percentage || !priceOp) {
            return NextResponse.json(
              { error: 'Percentage and operation are required' },
              { status: 400 }
            );
          }

          const multiplier = priceOp === 'increase' ? 1 + percentage / 100 : 1 - percentage / 100;

          const products = await prisma.product.findMany({
            where: withoutDeleted({ id: { in: productIds } }),
          });

          const updatePromises = products.map((product) =>
            prisma.product.update({
              where: { id: product.id },
              data: {
                salePrice: parseFloat((product.salePrice * multiplier).toFixed(2)),
                priceLastUpdatedAt: new Date(),
              },
            })
          );

          await Promise.all(updatePromises);

          result = {
            updated: productIds.length,
            operation: priceOp,
            percentage,
          };
        }
        break;

      case 'transfer':
        {
          const { fromLocation, toLocation, quantity } = params;
          if (!fromLocation || !toLocation || !quantity) {
            return NextResponse.json(
              { error: 'fromLocation, toLocation, and quantity are required' },
              { status: 400 }
            );
          }

          // Mapear locations para campos do schema
          const locationFieldMap: Record<string, 'coldRoomQuantity' | 'houseQuantity' | 'salePointQuantity'> = {
            coldRoom: 'coldRoomQuantity',
            house: 'houseQuantity',
            salePoint: 'salePointQuantity',
            COLD_ROOM: 'coldRoomQuantity',
            HOUSE: 'houseQuantity',
            SALE_POINT: 'salePointQuantity',
          };

          const fromField = locationFieldMap[fromLocation];
          const toField = locationFieldMap[toLocation];

          if (!fromField || !toField) {
            return NextResponse.json(
              { error: 'Invalid location' },
              { status: 400 }
            );
          }

          const transferPromises = productIds.map(async (productId) => {
            // Verificar estoque suficiente
            const inventory = await prisma.inventory.findUnique({
              where: { productId },
            });

            if (!inventory || (inventory[fromField] as number) < quantity) {
              return { productId, success: false, reason: 'Insufficient stock' };
            }

            // Realizar transferência
            await prisma.inventory.update({
              where: { productId },
              data: {
                [fromField]: { decrement: quantity },
                [toField]: { increment: quantity },
              },
            });

            // Mapear location para formato UPPER_CASE para o enum
            const locationToEnum: Record<string, string> = {
              coldRoom: 'COLD_ROOM',
              house: 'HOUSE',
              salePoint: 'SALE_POINT',
              COLD_ROOM: 'COLD_ROOM',
              HOUSE: 'HOUSE',
              SALE_POINT: 'SALE_POINT',
            };

            // Registrar movimentação
            await prisma.inventoryMovement.create({
              data: {
                productId,
                type: 'TRANSFER',
                quantity,
                fromLocation: locationToEnum[fromLocation] as any,
                toLocation: locationToEnum[toLocation] as any,
                notes: `Transferência em massa: ${quantity} unidades`,
                performedBy: session.user?.email || 'system',
              },
            });

            return { productId, success: true };
          });

          const results = await Promise.all(transferPromises);
          const successful = results.filter((r) => r.success).length;

          result = {
            total: productIds.length,
            successful,
            failed: productIds.length - successful,
            results,
          };
        }
        break;

      case 'activate':
        {
          await prisma.product.updateMany({
            where: withoutDeleted({ id: { in: productIds } }),
            data: { isActive: true },
          });

          result = { activated: productIds.length };
        }
        break;

      case 'deactivate':
        {
          await prisma.product.updateMany({
            where: withoutDeleted({ id: { in: productIds } }),
            data: { isActive: false },
          });

          result = { deactivated: productIds.length };
        }
        break;

      case 'add_tags':
        {
          const { tags } = params;
          if (!tags || !Array.isArray(tags)) {
            return NextResponse.json(
              { error: 'Tags array is required' },
              { status: 400 }
            );
          }

          const updatePromises = productIds.map(async (productId) => {
            const product = await prisma.product.findFirst({
              where: withoutDeleted({ id: productId }),
            });

            if (!product) return;

            const existingTags = product.tags || [];
            const newTags = [...new Set([...existingTags, ...tags])];

            return prisma.product.update({
              where: { id: productId },
              data: { tags: newTags },
            });
          });

          await Promise.all(updatePromises);

          result = {
            updated: productIds.length,
            tagsAdded: tags,
          };
        }
        break;

      case 'delete':
        {
          // Apenas ADMIN pode deletar
          if (!session.user?.isAdmin) {
            return NextResponse.json(
              { error: 'Only admins can delete products' },
              { status: 403 }
            );
          }

          await prisma.$transaction(async (tx) => {
            for (const productId of productIds) {
              await softDelete('product', productId, {
                transaction: tx,
                data: { isActive: false },
                sessionUserId: session.user?.id,
              });
            }
          });

          result = { deleted: productIds.length };
        }
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid operation' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      operation,
      result,
      performedBy: session.user?.email,
      performedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error performing bulk operation:', error);
    return NextResponse.json(
      { error: 'Failed to perform bulk operation' },
      { status: 500 }
    );
  }
}
