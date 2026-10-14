import { promises as fs, constants as fsConstants } from "fs"
import os from "os"
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

const STORAGE_PERMISSION_ERRORS = new Set(["EACCES", "EPERM", "EROFS"])

function isPermissionError(error: unknown): error is NodeJS.ErrnoException {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof (error as NodeJS.ErrnoException).code === "string" &&
    STORAGE_PERMISSION_ERRORS.has((error as NodeJS.ErrnoException).code as string)
  )
}

function encodeAbsoluteStorageKey(filePath: string) {
  return `absolute:${Buffer.from(filePath, "utf-8").toString("base64")}`
}

function decodeAbsoluteStorageKey(storageKey: string) {
  return Buffer.from(storageKey.slice("absolute:".length), "base64").toString("utf-8")
}

async function writeToDirectory(
  baseDir: string,
  input: SaveReportFileInput,
  { absoluteStorageKey = false }: { absoluteStorageKey?: boolean } = {}
): Promise<SavedReportFile> {
  const dateSegment = new Date().toISOString().slice(0, 10)
  const targetDir = path.join(baseDir, dateSegment)

  await fs.mkdir(targetDir, { recursive: true })
  await fs.access(targetDir, fsConstants.W_OK)

  const fileId = randomUUID()
  const sanitized = sanitizeFilename(input.filename)
  const storedFilename = `${fileId}-${sanitized}`
  const absolutePath = path.join(targetDir, storedFilename)

  await fs.writeFile(absolutePath, input.buffer)

  const publicDir = path.join(process.cwd(), "public")
  let url: string | null = null

  if (!absoluteStorageKey && absolutePath.startsWith(publicDir)) {
    const relative = path.relative(publicDir, absolutePath)
    url = `/${relative.replace(/\\/g, "/")}`
  }

  const storageKey = absoluteStorageKey
    ? encodeAbsoluteStorageKey(absolutePath)
    : path.relative(baseDir, absolutePath).replace(/\\/g, "/")

  return {
    storageKey,
    url,
    absolutePath,
    contentType: input.contentType,
    filename: storedFilename,
  }
}

export async function saveReportFile(input: SaveReportFileInput): Promise<SavedReportFile> {
  const baseDir = resolveBaseDirectory()

  try {
    return await writeToDirectory(baseDir, input)
  } catch (error) {
    if (!isPermissionError(error)) {
      throw error
    }

    const fallbackDir = path.join(os.tmpdir(), "distribuidora-reports")
    console.warn(
      `Falling back to temporary daily report storage at "${fallbackDir}" due to insufficient permissions in "${baseDir}": ${error instanceof Error ? error.message : String(error)}`
    )
    return await writeToDirectory(fallbackDir, input, { absoluteStorageKey: true })
  }
}

function isAbsoluteStorage(storageKey: string) {
  return storageKey.startsWith("absolute:")
}

export async function readReportFile(storageKey: string): Promise<{ buffer: Buffer; contentType: string; filename: string; absolutePath: string }> {
  const absolutePath = isAbsoluteStorage(storageKey)
    ? decodeAbsoluteStorageKey(storageKey)
    : path.join(resolveBaseDirectory(), storageKey)

  const buffer = await fs.readFile(absolutePath)
  const contentKey = isAbsoluteStorage(storageKey) ? absolutePath : storageKey

  return {
    buffer,
    contentType: inferContentType(contentKey),
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
