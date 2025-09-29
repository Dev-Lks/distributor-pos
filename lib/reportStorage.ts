import { promises as fs } from "fs"
import path from "path"
import { randomUUID } from "crypto"

export type SaveReportFileInput = {
  buffer: Buffer
  filename: string
  contentType: string
}

export type SavedReportFile = {
  storageKey: string
  url: string | null
  absolutePath: string
  contentType: string
  filename: string
}

const DEFAULT_REPORTS_DIR = path.join(process.cwd(), "public", "reports")

function resolveBaseDirectory() {
  const configured = process.env.REPORTS_STORAGE_DIR
  if (configured && path.isAbsolute(configured)) {
    return configured
  }

  if (configured) {
    return path.join(process.cwd(), configured)
  }

  return DEFAULT_REPORTS_DIR
}

function sanitizeFilename(filename: string) {
  return filename
    .normalize("NFD")
    .replace(/[^\w.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase()
}

export async function saveReportFile(input: SaveReportFileInput): Promise<SavedReportFile> {
  const baseDir = resolveBaseDirectory()
  const dateSegment = new Date().toISOString().slice(0, 10)
  const targetDir = path.join(baseDir, dateSegment)

  await fs.mkdir(targetDir, { recursive: true })

  const fileId = randomUUID()
  const sanitized = sanitizeFilename(input.filename)
  const storedFilename = `${fileId}-${sanitized}`
  const absolutePath = path.join(targetDir, storedFilename)

  await fs.writeFile(absolutePath, input.buffer)

  const publicDir = path.join(process.cwd(), "public")
  let url: string | null = null

  if (absolutePath.startsWith(publicDir)) {
    const relative = path.relative(publicDir, absolutePath)
    url = `/${relative.replace(/\\/g, "/")}`
  }

  const storageKey = path.relative(baseDir, absolutePath).replace(/\\/g, "/")

  return {
    storageKey,
    url,
    absolutePath,
    contentType: input.contentType,
    filename: storedFilename,
  }
}

export async function readReportFile(storageKey: string): Promise<{ buffer: Buffer; contentType: string; filename: string; absolutePath: string }> {
  const baseDir = resolveBaseDirectory()
  const absolutePath = path.join(baseDir, storageKey)
  const buffer = await fs.readFile(absolutePath)

  return {
    buffer,
    contentType: inferContentType(storageKey),
    filename: path.basename(absolutePath),
    absolutePath,
  }
}

function inferContentType(storageKey: string): string {
  const extension = path.extname(storageKey).toLowerCase()
  switch (extension) {
    case ".pdf":
      return "application/pdf"
    case ".csv":
      return "text/csv"
    default:
      return "application/octet-stream"
  }
}
