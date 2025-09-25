import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const saleId = params.id

    // Get the sale to restore inventory
    const sale = await prisma.sale.findUnique({
      where: { id: saleId },
      include: {
        items: true,
      },
    })

    if (!sale) {
      return NextResponse.json({ error: 'Sale not found' }, { status: 404 })
    }

    const saleWithRelations = sale as unknown as {
      items: Array<{ productId: string; quantity: number; unitCost: number | null }>
      pointOfSale?: { id?: string | null } | null
      pointOfSaleId?: string | null
    }

    const saleItems = saleWithRelations.items ?? []
    const pointOfSaleId = saleWithRelations.pointOfSaleId ?? saleWithRelations.pointOfSale?.id ?? undefined

    type ProductPointOfSaleDelegate = {
      findUnique: (args: unknown) => Promise<{ quantity: number } | null>
      update: (args: unknown) => Promise<unknown>
    }

    type InventoryMovementDelegate = {
      create: (args: unknown) => Promise<unknown>
    }

    type PrismaWithDelegates = typeof prisma & {
      productPointOfSale: ProductPointOfSaleDelegate
      inventoryMovement: InventoryMovementDelegate
    }

    // Use transaction to ensure data consistency
    await prisma.$transaction(async (tx) => {
      const transactionalClient = tx as PrismaWithDelegates
      // Restore inventory for each item
      for (const item of saleItems) {
        // Update point of sale inventory when applicable
        if (pointOfSaleId) {
          const pointStock = await transactionalClient.productPointOfSale.findUnique({
            where: {
              productId_pointOfSaleId: {
                productId: item.productId,
                pointOfSaleId,
              },
            },
            select: {
              quantity: true,
            },
          })

          if (pointStock) {
            await transactionalClient.productPointOfSale.update({
              where: {
                productId_pointOfSaleId: {
                  productId: item.productId,
                  pointOfSaleId,
                },
              },
              data: {
                quantity: {
                  increment: item.quantity,
                },
              },
            })
          }
        }

        // Update general inventory
        await tx.inventory.upsert({
          where: { productId: item.productId },
          update: { salePointQuantity: { increment: item.quantity } },
          create: { productId: item.productId, salePointQuantity: item.quantity },
        })

        await transactionalClient.inventoryMovement.create({
          data: {
            productId: item.productId,
            saleId,
            pointOfSaleId,
            type: 'RETURN',
            quantity: item.quantity,
            unitCost: item.unitCost ?? 0,
            toLocation: pointOfSaleId ? 'SALE_POINT' : 'HOUSE',
            notes: 'Venda cancelada',
            performedBy: 'dashboard-pos',
            occurredAt: new Date(),
          },
        })
      }

      // Delete the sale
      await tx.sale.delete({
        where: { id: saleId }
      })
    })

    return NextResponse.json({ message: 'Sale cancelled successfully' })
  } catch (error) {
    console.error('Error cancelling sale:', error)
    return NextResponse.json({ error: 'Failed to cancel sale' }, { status: 500 })
  }
}