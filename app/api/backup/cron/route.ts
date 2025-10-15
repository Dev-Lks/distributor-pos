import { NextRequest, NextResponse } from 'next/server'
import { backupDatabase, isBackupEnabled } from '@/lib/backup'

export async function GET(request: NextRequest) {
  if (!isBackupEnabled()) {
    return NextResponse.json(
      { error: 'Backup job temporarily disabled' },
      { status: 503 },
    )
  }

  const authHeader = request.headers.get('authorization')
  const expectedToken = process.env.CRON_SECRET

  if (!expectedToken) {
    return NextResponse.json(
      { error: 'CRON_SECRET is not configured' },
      { status: 500 },
    )
  }

  if (authHeader !== `Bearer ${expectedToken}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const backupPath = await backupDatabase({ logger: console })
    return NextResponse.json({ success: true, backupPath })
  } catch (error) {
    console.error('❌  Failed to execute scheduled backup', error)
    return NextResponse.json(
      { error: 'Failed to execute backup job' },
      { status: 500 },
    )
  }
}
