import { promisify } from 'node:util'
import { exec } from 'node:child_process'
import { existsSync } from 'node:fs'
import { mkdir, readdir, stat, unlink } from 'node:fs/promises'
import { join } from 'node:path'

const execAsync = promisify(exec)

export interface BackupOptions {
  outputDir?: string
  retentionDays?: number
  logger?: Pick<Console, 'log' | 'error'>
}

export function isBackupEnabled() {
  return process.env.BACKUP_ENABLED === 'true'
}

async function ensureDirectory(path: string) {
  if (!existsSync(path)) {
    await mkdir(path, { recursive: true })
  }
}

async function cleanOldBackups(directory: string, retentionDays: number, logger: BackupOptions['logger']) {
  const files = await readdir(directory)
  const now = Date.now()
  const maxAge = retentionDays * 24 * 60 * 60 * 1000

  await Promise.all(
    files.map(async (file) => {
      const filePath = join(directory, file)
      const fileStats = await stat(filePath)

      if (now - fileStats.mtimeMs > maxAge) {
        await unlink(filePath)
        logger?.log?.(`🗑️  Removed old backup: ${file}`)
      }
    }),
  )
}

function parseDatabaseUrl(urlString: string) {
  try {
    return new URL(urlString)
  } catch {
    throw new Error('DATABASE_URL is not a valid URL')
  }
}

export async function backupDatabase(options: BackupOptions = {}) {
  if (!isBackupEnabled()) {
    throw new Error('Database backup is disabled. Set BACKUP_ENABLED=true to re-enable it.')
  }

  const { outputDir, retentionDays = Number(process.env.BACKUP_RETENTION_DAYS ?? '30'), logger = console } = options
  const databaseUrl = process.env.DATABASE_URL

  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is not set')
  }

  const parsedUrl = parseDatabaseUrl(databaseUrl)
  const database = parsedUrl.pathname.slice(1)
  const host = parsedUrl.hostname
  const port = parsedUrl.port || '5432'
  const username = decodeURIComponent(parsedUrl.username)
  const password = decodeURIComponent(parsedUrl.password)

  const backupDir = outputDir ?? join(process.cwd(), 'backups')
  await ensureDirectory(backupDir)

  const timestamp = new Date().toISOString().replace(/[:]/g, '-').split('.')[0]
  const backupFile = `backup-${timestamp}.sqlc`
  const backupPath = join(backupDir, backupFile)

  const passwordPrefix = password ? `PGPASSWORD="${password}" ` : ''
  const command = `${passwordPrefix}pg_dump -h ${host} -p ${port} -U ${username} -d ${database} -F c -f "${backupPath}"`

  logger.log?.('💾  Starting database backup...')
  await execAsync(command)
  logger.log?.(`✅  Backup created at ${backupPath}`)

  if (retentionDays > 0) {
    await cleanOldBackups(backupDir, retentionDays, logger)
  }

  return backupPath
}
