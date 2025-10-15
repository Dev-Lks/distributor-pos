import { getServerSession } from 'next-auth'
import type { Prisma } from '@prisma/client'
import { prisma } from './prisma'
import { authOptions } from './auth'

const SOFT_DELETABLE_MODELS = [
  'product',
  'customer',
  'user',
  'sale',
  'pointOfSale',
  'batch',
  'order',
  'delivery',
] as const

type SoftDeletableModel = (typeof SOFT_DELETABLE_MODELS)[number]
type PrismaClientWithModels = Pick<typeof prisma, SoftDeletableModel>
type PrismaDelegate = PrismaClientWithModels[SoftDeletableModel]

interface SoftDeleteOptions {
  reason?: string
  data?: Record<string, unknown>
  transaction?: Prisma.TransactionClient
  sessionUserId?: string
}

function getClient(model: SoftDeletableModel, transaction?: Prisma.TransactionClient) {
  if (transaction) {
    const tx = transaction as unknown as PrismaClientWithModels
    const delegate = tx[model]

    if (!delegate) {
      throw new Error(`Model "${model}" not available on transaction client`)
    }

    return delegate
  }

  return prisma[model]
}

export async function softDelete(
  model: SoftDeletableModel,
  id: string,
  options: SoftDeleteOptions = {}
) {
  const { reason, data, transaction, sessionUserId } = options

  const session = sessionUserId
    ? { user: { id: sessionUserId } }
    : await getServerSession(authOptions)

  if (!session || !session.user?.id) {
    throw new Error('Not authenticated')
  }

  const client = getClient(model, transaction)

  const updateData: Record<string, unknown> = {
    deletedAt: new Date(),
    deletedBy: session.user.id,
    ...(data ?? {}),
  }

  if (reason && model === 'sale') {
    updateData.voidReason = reason
  }

  return (client as any).update({
    where: { id },
    data: updateData,
  })
}

export function withoutDeleted<T extends Record<string, unknown> | undefined | null>(where?: T) {
  if (!where) {
    return { deletedAt: null } as T extends undefined | null ? { deletedAt: null } : T & { deletedAt: null }
  }

  return { ...where, deletedAt: null }
}
