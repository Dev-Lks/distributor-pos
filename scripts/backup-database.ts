import { backupDatabase, isBackupEnabled } from '@/lib/backup'

if (!isBackupEnabled()) {
  console.error('Backup is disabled. Set BACKUP_ENABLED=true to run this script.')
  process.exit(0)
}

backupDatabase().catch((error) => {
  console.error('❌  Failed to create database backup', error)
  process.exitCode = 1
})
