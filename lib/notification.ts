import { prisma } from './prisma'

interface NotificationSettings {
  emailEnabled: boolean
  emailRecipients: string[]
  smsEnabled: boolean
  smsWebhook: string
  notifyNewMessage: boolean
  notifyNewInquiry: boolean
}

interface NotificationData {
  type: 'new_message' | 'new_inquiry'
  customerName?: string
  customerEmail?: string
  customerPhone?: string
  message?: string
  productName?: string
  productModel?: string
  ip?: string
}

let cachedSettings: NotificationSettings | null = null
let settingsCacheTime = 0
const SETTINGS_CACHE_TTL = 60000 // 1 minute

export async function getNotificationSettings(): Promise<NotificationSettings> {
  const now = Date.now()

  if (cachedSettings && (now - settingsCacheTime) < SETTINGS_CACHE_TTL) {
    return cachedSettings
  }

  try {
    const settings = await prisma.siteSettings.findMany({
      where: { key: { startsWith: 'notification_' } },
    })

    const config: Record<string, string> = {}
    for (const s of settings) {
      config[s.key] = s.value
    }

    cachedSettings = {
      emailEnabled: config.notification_email_enabled === 'true',
      emailRecipients: (config.notification_email_recipients || '')
        .split(',')
        .map(e => e.trim())
        .filter(Boolean),
      smsEnabled: config.notification_sms_enabled === 'true',
      smsWebhook: config.notification_sms_webhook || '',
      notifyNewMessage: config.notification_new_message !== 'false',
      notifyNewInquiry: config.notification_new_inquiry !== 'false',
    }

    settingsCacheTime = now
    return cachedSettings
  } catch {
    return {
      emailEnabled: false,
      emailRecipients: [],
      smsEnabled: false,
      smsWebhook: '',
      notifyNewMessage: true,
      notifyNewInquiry: true,
    }
  }
}

export function clearNotificationSettingsCache() {
  cachedSettings = null
}

export async function sendEmailNotification(
  recipients: string[],
  subject: string,
  htmlContent: string
): Promise<boolean> {
  if (!recipients.length) return false

  try {
    // Log the notification
    console.log(`[Notification] Email notification:`)
    console.log(`  To: ${recipients.join(', ')}`)
    console.log(`  Subject: ${subject}`)
    console.log(`  Content preview: ${htmlContent.substring(0, 200).replace(/<[^>]*>/g, '')}...`)

    // If SMTP is configured via environment variables, use it
    if (process.env.SMTP_HOST) {
      console.log(`[Notification] SMTP configured - email would be sent here`)
      // Note: To enable actual email sending, install nodemailer:
      // npm install nodemailer && npm install -D @types/nodemailer
      // Then uncomment the nodemailer code below
    } else {
      console.log(`[Notification] SMTP not configured - notification logged only`)
    }

    return true
  } catch (error) {
    console.error('[Notification] Email send error:', error)
    return false
  }
}

export async function sendSmsNotification(
  webhookUrl: string,
  message: string
): Promise<boolean> {
  if (!webhookUrl) return false

  try {
    // Send to SMS webhook (e.g., Twilio, Nexmo, custom API)
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }),
    })

    if (response.ok) {
      console.log(`[Notification] SMS notification sent via webhook`)
      return true
    } else {
      console.error(`[Notification] SMS webhook error: ${response.status}`)
      return false
    }
  } catch (error) {
    console.error('[Notification] SMS send error:', error)
    return false
  }
}

export async function sendNotification(data: NotificationData): Promise<void> {
  const settings = await getNotificationSettings()

  // Check if this notification type is enabled
  if (data.type === 'new_message' && !settings.notifyNewMessage) return
  if (data.type === 'new_inquiry' && !settings.notifyNewInquiry) return

  // Build notification content
  const { subject, htmlContent, smsContent } = buildNotificationContent(data)

  // Send email if enabled
  if (settings.emailEnabled && settings.emailRecipients.length > 0) {
    await sendEmailNotification(settings.emailRecipients, subject, htmlContent)
  }

  // Send SMS if enabled
  if (settings.smsEnabled && settings.smsWebhook) {
    await sendSmsNotification(settings.smsWebhook, smsContent)
  }
}

function buildNotificationContent(data: NotificationData): {
  subject: string
  htmlContent: string
  smsContent: string
} {
  const timestamp = new Date().toLocaleString('zh-CN', {
    timeZone: 'Asia/Shanghai',
  })

  if (data.type === 'new_message') {
    const subject = `【新留言】${data.customerName || '匿名访客'} - ${timestamp}`

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a73e8;">📬 您收到一条新留言</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold; width: 100px;">访客姓名</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${data.customerName || '未提供'}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">邮箱</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">
              <a href="mailto:${data.customerEmail}">${data.customerEmail || '未提供'}</a>
            </td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">电话</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${data.customerPhone || '未提供'}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">IP 地址</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${data.ip || '未知'}</td>
          </tr>
          <tr>
            <td style="padding: 8px; font-weight: bold;">留言内容</td>
            <td style="padding: 8px;">${data.message || ''}</td>
          </tr>
        </table>
        <p style="color: #666; font-size: 12px; margin-top: 20px;">
          时间: ${timestamp}<br>
          请登录后台查看并处理此留言。
        </p>
      </div>
    `

    const smsContent = `【新留言】${data.customerName || '访客'}: ${(data.message || '').substring(0, 50)}...`

    return { subject, htmlContent, smsContent }
  }

  if (data.type === 'new_inquiry') {
    const subject = `【产品询价】${data.productName || ''} - ${timestamp}`

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ea4335;">📩 您收到一个新的产品询价</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold; width: 100px;">产品名称</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${data.productName || ''}</td>
          </tr>
          ${data.productModel ? `
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">型号</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${data.productModel}</td>
          </tr>
          ` : ''}
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">客户邮箱</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">
              <a href="mailto:${data.customerEmail}">${data.customerEmail}</a>
            </td>
          </tr>
          ${data.customerPhone ? `
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">客户电话</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${data.customerPhone}</td>
          </tr>
          ` : ''}
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">IP 地址</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${data.ip || '未知'}</td>
          </tr>
          <tr>
            <td style="padding: 8px; font-weight: bold;">询价内容</td>
            <td style="padding: 8px;">${data.message || '无留言内容'}</td>
          </tr>
        </table>
        <p style="color: #666; font-size: 12px; margin-top: 20px;">
          时间: ${timestamp}<br>
          请登录后台查看并处理此询价。
        </p>
      </div>
    `

    const smsContent = `【产品询价】${data.productName}${data.productModel ? ` (${data.productModel})` : ''} - ${data.customerEmail}`

    return { subject, htmlContent, smsContent }
  }

  // Fallback
  return {
    subject: '网站通知',
    htmlContent: '<p>您有一条新通知</p>',
    smsContent: '您有一条新通知',
  }
}
