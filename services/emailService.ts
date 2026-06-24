import nodemailer, { type Transporter } from "nodemailer"

/**
 * SMTP email service. All configuration comes from environment variables; no
 * credentials are committed. The transport is created lazily and reused.
 */

let cachedTransporter: Transporter | null = null

const getTransporter = (): Transporter => {
  if (cachedTransporter) {
    return cachedTransporter
  }

  const host = process.env.SMTP_HOST
  const portValue = process.env.SMTP_PORT
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASSWORD

  if (!host || !portValue || !user || !pass) {
    throw new Error("Missing SMTP configuration in environment.")
  }

  const port = Number(portValue)
  if (!Number.isFinite(port)) {
    throw new Error("Invalid SMTP_PORT in environment.")
  }

  cachedTransporter = nodemailer.createTransport({
    host,
    port,
    // 465 = implicit TLS; 587/25 = STARTTLS (secure: false, upgraded automatically)
    secure: port === 465,
    auth: { user, pass },
  })

  return cachedTransporter
}

export type EmailAttachment = {
  filename: string
  content: Buffer
  contentType?: string
}

export type SendEmailOptions = {
  to: string | string[]
  cc?: string | string[]
  replyTo?: string
  fromName?: string
  subject: string
  text: string
  html: string
  attachments?: EmailAttachment[]
}

/**
 * Send an email through the configured SMTP transport. Throws on failure so the
 * caller can surface a real error (and avoid claiming success).
 */
export const sendEmail = async (options: SendEmailOptions): Promise<void> => {
  const transporter = getTransporter()

  const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || ""
  if (!fromEmail) {
    throw new Error("Missing SMTP_FROM_EMAIL in environment.")
  }

  const from = options.fromName
    ? { name: options.fromName, address: fromEmail }
    : fromEmail

  await transporter.sendMail({
    from,
    to: options.to,
    cc: options.cc && options.cc.length > 0 ? options.cc : undefined,
    replyTo: options.replyTo,
    subject: options.subject,
    text: options.text,
    html: options.html,
    attachments: options.attachments?.map((attachment) => ({
      filename: attachment.filename,
      content: attachment.content,
      contentType: attachment.contentType,
    })),
  })
}

/** Recipients configured for invoice emails (comma-separated env values). */
export const getInvoiceRecipients = () => {
  const parse = (value: string | undefined) =>
    (value || "")
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean)

  return {
    to: parse(process.env.SMTP_TO_EMAILS),
    cc: parse(process.env.SMTP_CC_EMAILS),
  }
}
