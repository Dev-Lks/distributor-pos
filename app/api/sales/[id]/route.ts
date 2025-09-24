import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const saleId = params.id

    // Get the sale to restore inventory
    const sale = await prisma.sale.findUnique({
      where: { id: saleId },
      include: { items: true }
    })

    if (!sale) {
      return NextResponse.json({ error: 'Sale not found' }, { status: 404 })
    }

    // Use transaction to ensure data consistency
    await prisma.$transaction(async (tx) => {
      // Restore inventory for each item
      for (const item of sale.items) {
        // Update general inventory
        const inventory = await tx.inventory.findUnique({
          where: { productId: item.productId },
        })
        if (inventory) {
          await tx.inventory.update({
            where: { productId: item.productId },
            data: { salePointQuantity: inventory.salePointQuantity + item.quantity },
          })
        }
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