import { z } from 'zod'

const printerTypeValues = ['USB', 'Network', 'Serial'] as const
const printerEncodingValues = ['UTF-8', 'GB18030', 'ISO-8859-1'] as const

export const hardwareConfigUpsertSchema = z
  .object({
    pointOfSaleId: z.string().min(1, 'pointOfSaleId é obrigatório'),
    scannerEnabled: z.boolean().optional(),
    scannerAutoAdd: z.boolean().optional(),
    scannerPrefix: z
      .string()
      .trim()
      .max(32, 'scannerPrefix deve ter no máximo 32 caracteres')
      .optional()
      .nullable(),
    scannerSuffix: z
      .string()
      .trim()
      .max(32, 'scannerSuffix deve ter no máximo 32 caracteres')
      .optional()
      .nullable(),
    printerEnabled: z.boolean().optional(),
    printerType: z
      .enum(printerTypeValues)
      .optional(),
    printerConnection: z
      .string()
      .trim()
      .max(255, 'printerConnection deve ter no máximo 255 caracteres')
      .optional()
      .nullable(),
    printerWidth: z
      .union([z.literal(32), z.literal(48), z.literal(58), z.literal(80)])
      .optional(),
    printerEncoding: z
      .enum(printerEncodingValues)
      .optional(),
    autoPrint: z.boolean().optional(),
    logoUrl: z
      .string()
      .trim()
      .url('logoUrl deve ser uma URL válida')
      .optional()
      .nullable(),
    footerMessage: z
      .string()
      .max(512, 'footerMessage deve ter no máximo 512 caracteres')
      .optional()
      .nullable(),
  })
  .strict()

export const hardwareConfigParamsSchema = z.object({
  pointOfSaleId: z.string().min(1, 'pointOfSaleId é obrigatório'),
})

export const receiptTypeSchema = z.enum([
  'sale',
  'cash-transaction',
  'cash-opening',
  'cash-closing',
  'report',
  'delivery',
  'delivery-driver',
  'delivery-customer',
  'delivery-organizer',
])

const jsonValue: z.ZodType<unknown> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(jsonValue),
    z.record(jsonValue),
  ])
)

const jsonObject = z.record(jsonValue)

export const printerPrintSchema = z
  .object({
    type: receiptTypeSchema,
    data: jsonObject,
  })
  .refine((value) => value.data !== null && value.data !== undefined, {
    message: 'Dados obrigatórios',
    path: ['data'],
  })

export type HardwareConfigUpsertInput = z.infer<typeof hardwareConfigUpsertSchema>
export type PrinterPrintInput = z.infer<typeof printerPrintSchema>
