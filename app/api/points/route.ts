import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'
import {
  createPointOfSaleSchema,
  updatePointOfSaleSchema,
  deletePointOfSaleSchema,
} from '@/lib/validations'
import { softDelete, withoutDeleted } from '@/lib/soft-delete'
import type { Prisma } from '@prisma/client'

// Force dynamic rendering - critical for real-time updates
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const points = await prisma.pointOfSale.findMany({
      where: withoutDeleted({}),
      orderBy: { createdAt: 'asc' }
    })
    
    const response = NextResponse.json(points)
    // No cache - real-time updates critical for sales/inventory/products
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    return response
  } catch (error) {
    logger.error('Failed to fetch points of sale', { error })
    return NextResponse.json({ error: 'Erro ao buscar pontos de venda' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const body = await request.json()
    const validated = createPointOfSaleSchema.parse(body)

    const point = await prisma.pointOfSale.create({
      data: { 
        name: validated.name, 
        isActive: validated.isActive,
        address: validated.address,
        city: validated.city,
        state: validated.state,
      }
    })

    logger.audit('point_of_sale_created', session.user.email || 'unknown', {
      pointId: point.id,
      pointName: point.name,
    })

    return NextResponse.json(point, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }
    logger.error('Failed to create point of sale', { error })
    return NextResponse.json({ error: 'Erro ao criar ponto de venda' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const body = await request.json()
    const validated = updatePointOfSaleSchema.parse(body)

    const updateData: Prisma.PointOfSaleUpdateInput = {}
    if (validated.name !== undefined) updateData.name = validated.name
    if (validated.isActive !== undefined) updateData.isActive = validated.isActive
    if (validated.address !== undefined) updateData.address = validated.address
    if (validated.city !== undefined) updateData.city = validated.city
    if (validated.state !== undefined) updateData.state = validated.state

    const existingPoint = await prisma.pointOfSale.findFirst({
      where: withoutDeleted({ id: validated.id }),
    })

    if (!existingPoint) {
      return NextResponse.json({ error: 'Ponto de venda não encontrado' }, { status: 404 })
    }

    const point = await prisma.pointOfSale.update({
      where: { id: validated.id },
      data: updateData
    })

    logger.audit('point_of_sale_updated', session.user.email || 'unknown', {
      pointId: point.id,
      pointName: point.name,
    })

    return NextResponse.json(point)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }
    logger.error('Failed to update point of sale', { error })
    return NextResponse.json({ error: 'Erro ao atualizar ponto de venda' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    const validated = deletePointOfSaleSchema.parse({ id })

    const existing = await prisma.pointOfSale.findFirst({
      where: withoutDeleted({ id: validated.id }),
      select: { id: true, name: true },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Ponto de venda não encontrado' }, { status: 404 })
    }

    await softDelete('pointOfSale', validated.id, {
      data: { isActive: false },
      sessionUserId: session.user?.id,
    })

    logger.audit('point_of_sale_deleted', session.user.email || 'unknown', {
      pointId: validated.id,
      pointName: existing.name,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }
    logger.error('Failed to delete point of sale', { error })
    return NextResponse.json({ error: 'Erro ao deletar ponto de venda' }, { status: 500 })
  }
}
