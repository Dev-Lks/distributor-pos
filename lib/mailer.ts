import nodemailer, { type Transporter } from "nodemailer"

export type MailAttachment = {
  filename: string
  content: Buffer
  contentType?: string
}

export type SendMailOptions = {
  to: string[]
  subject: string
  text?: string
  html?: string
  attachments?: MailAttachment[]
}

let cachedTransporter: Transporter | null = null

function getConfiguredRecipients(): string[] {
  const recipients = process.env.DAILY_REPORT_RECIPIENTS ?? ""
  return recipients
    .split(",")
    .map((recipient) => recipient.trim())
    .filter(Boolean)
}

export function resolveDailyReportRecipients(explicit?: string[]): string[] {
  const deduped = new Set<string>()

  for (const address of explicit ?? []) {
    if (address) deduped.add(address)
  }

  for (const address of getConfiguredRecipients()) {
    if (address) deduped.add(address)
  }

  return Array.from(deduped)
}

async function getTransporter(): Promise<Transporter | null> {
  if (cachedTransporter) {
    return cachedTransporter
  }

  const host = process.env.SMTP_HOST
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS

  if (!host || !port || !user || !pass) {
    console.warn("Daily report mailer skipped: SMTP_* environment variables missing")
    return null
  }

  cachedTransporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  })

  return cachedTransporter
}

export async function sendMail(options: SendMailOptions): Promise<{ messageId?: string; skipped: boolean }> {
  const transporter = await getTransporter()

  if (!transporter) {
    return { skipped: true }
  }

  const from = process.env.REPORT_SENDER_EMAIL || process.env.SMTP_USER

  const info = await transporter.sendMail({
    from,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
    attachments: options.attachments?.map((attachment) => ({
      filename: attachment.filename,
      content: attachment.content,
      contentType: attachment.contentType,
    })),
  })

  return {
    messageId: info.messageId,
    skipped: false,
  }
}
