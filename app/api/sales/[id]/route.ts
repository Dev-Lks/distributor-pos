import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'
import { z } from 'zod'
import { softDelete } from '@/lib/soft-delete'

const updateSaleSchema = z.object({
  status: z.enum(['completed', 'pending', 'processing', 'flagged']).optional(),
  paymentMethod: z.enum(['cash', 'card', 'pix', 'other']).nullish(),
  customerName: z.string().nullish(),
  customerEmail: z.string().email('E-mail inválido').nullish(),
  customerPhone: z.string().nullish(),
  customerDocument: z.string().nullish(),
  customerAddress: z.string().nullish(),
  channel: z.string().nullish(),
  notes: z.string().nullish(),
  syncCustomer: z.boolean().optional(),
})

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const saleId = id
    const body = await request.json().catch(() => ({})) as { reason?: string }
    const { reason } = body

    // Get the sale to restore inventory
    const sale = await prisma.sale.findFirst({
      where: {
        id: saleId,
        deletedAt: null,
      },
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

      await softDelete('sale', saleId, {
        transaction: tx,
        reason: reason ?? 'Venda cancelada',
        data: {
          status: 'cancelled',
        },
      })
    })

    return NextResponse.json({ message: 'Sale cancelled successfully' })
  } catch (error) {
    logger.error('Error cancelling sale:', { error })
    return NextResponse.json({ error: 'Failed to cancel sale' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const saleId = id
    const payload = await request.json()
    const parsed = updateSaleSchema.safeParse(payload)

    if (!parsed.success) {
      const issue = parsed.error.issues.at(0)
      return NextResponse.json(
        {
          error: 'Invalid payload',
          details: issue?.message,
        },
        { status: 400 }
      )
    }

    const sale = await prisma.sale.findUnique({
      where: { id: saleId },
      include: {
        customer: true,
      },
    })

    if (!sale) {
      return NextResponse.json({ error: 'Sale not found' }, { status: 404 })
    }

    const data = parsed.data

    const sanitize = (value: string | null | undefined) => {
      if (value === undefined) return undefined
      if (value === null) return null
      const trimmed = value.trim()
      return trimmed.length > 0 ? trimmed : null
    }

    const updateData: Prisma.SaleUpdateInput = {}

    if (data.status) {
      updateData.status = data.status
    }

    if (data.paymentMethod !== undefined) {
      updateData.paymentMethod = data.paymentMethod ?? null
    }

    const customerName = sanitize(data.customerName)
    if (customerName !== undefined) updateData.customerName = customerName

    const customerEmail = sanitize(data.customerEmail)
    if (customerEmail !== undefined) updateData.customerEmail = customerEmail

    const customerPhone = sanitize(data.customerPhone)
    if (customerPhone !== undefined) updateData.customerPhone = customerPhone

    const customerDocument = sanitize(data.customerDocument)
    if (customerDocument !== undefined) updateData.customerDocument = customerDocument

    const customerAddress = sanitize(data.customerAddress)
    if (customerAddress !== undefined) updateData.customerAddress = customerAddress

    const channel = sanitize(data.channel)
    if (channel !== undefined) updateData.channel = channel

    if (data.notes !== undefined) {
      const notes = data.notes === null ? null : data.notes.trim()
      updateData.notes = notes && notes.length > 0 ? notes : null
    }

    const updatedSale = await prisma.sale.update({
      where: { id: saleId },
      data: updateData,
      include: {
        items: {
          include: {
            product: true,
          },
        },
        pointOfSale: true,
        payments: true,
        customer: true,
      } as any,
    })

    if (data.syncCustomer && sale.customerId) {
      const customerUpdate: Prisma.CustomerUpdateInput = {}

      if (customerName !== undefined && customerName !== null) {
        customerUpdate.name = customerName
      }
      if (customerEmail !== undefined) customerUpdate.email = customerEmail
      if (customerPhone !== undefined) customerUpdate.phone = customerPhone
      if (customerAddress !== undefined) customerUpdate.address = customerAddress

      const hasCustomerChanges = Object.keys(customerUpdate).length > 0

      if (hasCustomerChanges) {
        await prisma.customer.update({
          where: { id: sale.customerId },
          data: customerUpdate,
        })
      }
    }

    return NextResponse.json(updatedSale as any)
  } catch (error) {
    logger.error('Failed to update sale:', { error })
    return NextResponse.json({ error: 'Failed to update sale' }, { status: 500 })
  }
}