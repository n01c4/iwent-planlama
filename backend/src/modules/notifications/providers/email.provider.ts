import { env } from '../../../shared/config/index.js';

// =============================================================================
// EMAIL NOTIFICATION PROVIDER
// =============================================================================

interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// Email templates for different notification types
const EMAIL_TEMPLATES = {
  friend_request: (data: { senderName: string; actionUrl: string }) => ({
    subject: 'Yeni arkadaşlık isteği',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Merhaba!</h2>
        <p><strong>${data.senderName}</strong> size arkadaşlık isteği gönderdi.</p>
        <a href="${data.actionUrl}" style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">İsteği Görüntüle</a>
      </div>
    `,
  }),

  ticket_purchased: (data: { eventTitle: string; ticketCount: number; actionUrl: string }) => ({
    subject: `Bilet satın alma onayı - ${data.eventTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Bilet satın alma başarılı!</h2>
        <p><strong>${data.eventTitle}</strong> etkinliği için ${data.ticketCount} adet biletiniz hazır.</p>
        <a href="${data.actionUrl}" style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">Biletlerimi Görüntüle</a>
      </div>
    `,
  }),

  event_reminder: (data: { eventTitle: string; eventDate: string; venueName?: string; actionUrl: string }) => ({
    subject: `Hatırlatma: ${data.eventTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Etkinlik Hatırlatması</h2>
        <p><strong>${data.eventTitle}</strong> etkinliği yaklaşıyor!</p>
        <p>Tarih: ${data.eventDate}</p>
        ${data.venueName ? `<p>Mekan: ${data.venueName}</p>` : ''}
        <a href="${data.actionUrl}" style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">Detayları Görüntüle</a>
      </div>
    `,
  }),

  event_cancelled: (data: { eventTitle: string; actionUrl: string }) => ({
    subject: `Etkinlik İptali - ${data.eventTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Etkinlik İptal Edildi</h2>
        <p>Üzgünüz, <strong>${data.eventTitle}</strong> etkinliği iptal edilmiştir.</p>
        <p>İade işlemleri otomatik olarak başlatılacaktır.</p>
        <a href="${data.actionUrl}" style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">Detayları Görüntüle</a>
      </div>
    `,
  }),

  broadcast: (data: { title: string; body: string; actionUrl?: string }) => ({
    subject: data.title,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>${data.title}</h2>
        <p>${data.body}</p>
        ${data.actionUrl ? `<a href="${data.actionUrl}" style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">Detayları Görüntüle</a>` : ''}
      </div>
    `,
  }),

  default: (data: { title: string; body: string; actionUrl?: string }) => ({
    subject: data.title,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>${data.title}</h2>
        <p>${data.body}</p>
        ${data.actionUrl ? `<a href="${data.actionUrl}" style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">Görüntüle</a>` : ''}
      </div>
    `,
  }),
};

class EmailProvider {
  private provider: 'resend' | 'sendgrid' | 'mock';
  private resendClient: any = null;
  private sendgridClient: any = null;

  constructor() {
    this.provider = env.EMAIL_PROVIDER;
  }

  /**
   * Initialize the email provider (lazy)
   */
  private async initProvider(): Promise<boolean> {
    if (this.provider === 'mock') {
      return true;
    }

    if (this.provider === 'resend' && !this.resendClient) {
      if (!env.RESEND_API_KEY) {
        console.warn('[Email] Resend API key not configured. Email notifications disabled.');
        return false;
      }
      try {
        // @ts-ignore - resend is an optional dependency
        const resendModule = await import('resend').catch(() => null);
        if (!resendModule) {
          console.warn('[Email] resend not installed. Email notifications disabled.');
          return false;
        }
        this.resendClient = new resendModule.Resend(env.RESEND_API_KEY);
        return true;
      } catch (error) {
        console.error('[Email] Failed to initialize Resend:', error);
        return false;
      }
    }

    if (this.provider === 'sendgrid' && !this.sendgridClient) {
      if (!env.SENDGRID_API_KEY) {
        console.warn('[Email] SendGrid API key not configured. Email notifications disabled.');
        return false;
      }
      try {
        // @ts-ignore - @sendgrid/mail is an optional dependency
        const sgMail = await import('@sendgrid/mail').catch(() => null);
        if (!sgMail) {
          console.warn('[Email] @sendgrid/mail not installed. Email notifications disabled.');
          return false;
        }
        sgMail.default.setApiKey(env.SENDGRID_API_KEY);
        this.sendgridClient = sgMail.default;
        return true;
      } catch (error) {
        console.error('[Email] Failed to initialize SendGrid:', error);
        return false;
      }
    }

    return true;
  }

  /**
   * Send email notification
   */
  async sendEmail(message: EmailMessage): Promise<EmailResult> {
    const isReady = await this.initProvider();
    if (!isReady) {
      return { success: false, error: 'Email provider not initialized' };
    }

    // Mock provider - just log
    if (this.provider === 'mock') {
      console.log('[Email Mock] Would send email:', {
        to: message.to,
        subject: message.subject,
      });
      return { success: true, messageId: `mock-${Date.now()}` };
    }

    try {
      if (this.provider === 'resend' && this.resendClient) {
        const result = await this.resendClient.emails.send({
          from: env.EMAIL_FROM,
          to: message.to,
          subject: message.subject,
          html: message.html,
          text: message.text,
        });
        return { success: true, messageId: result.id };
      }

      if (this.provider === 'sendgrid' && this.sendgridClient) {
        const result = await this.sendgridClient.send({
          from: env.EMAIL_FROM,
          to: message.to,
          subject: message.subject,
          html: message.html,
          text: message.text,
        });
        return { success: true, messageId: result[0]?.headers?.['x-message-id'] };
      }

      return { success: false, error: 'No email provider configured' };
    } catch (error: any) {
      console.error('[Email] Failed to send:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send templated email notification
   */
  async sendTemplatedEmail(
    to: string,
    type: keyof typeof EMAIL_TEMPLATES,
    data: Record<string, any>
  ): Promise<EmailResult> {
    const templateFn = EMAIL_TEMPLATES[type] || EMAIL_TEMPLATES.default;
    const { subject, html } = templateFn(data as any);

    return this.sendEmail({
      to,
      subject,
      html,
    });
  }

  /**
   * Send bulk emails (async, batched)
   */
  async sendBulkEmails(
    recipients: Array<{ email: string; data: Record<string, any> }>,
    type: keyof typeof EMAIL_TEMPLATES
  ): Promise<{
    successCount: number;
    failureCount: number;
  }> {
    let successCount = 0;
    let failureCount = 0;

    // Process in batches of 10
    const batchSize = 10;
    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);

      const results = await Promise.allSettled(
        batch.map((r) => this.sendTemplatedEmail(r.email, type, r.data))
      );

      for (const result of results) {
        if (result.status === 'fulfilled' && result.value.success) {
          successCount++;
        } else {
          failureCount++;
        }
      }

      // Small delay between batches to avoid rate limits
      if (i + batchSize < recipients.length) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    return { successCount, failureCount };
  }
}

export const emailProvider = new EmailProvider();
export { EMAIL_TEMPLATES };
