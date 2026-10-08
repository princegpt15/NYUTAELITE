// backend/src/services/notification/providers/email.provider.ts
import crypto from 'crypto';
import { env } from '../../../config/env.js';
import type {
  NotificationProvider,
  ProviderDeliveryResult,
  ProviderSendRequest,
} from '../notification.types.js';

export type EmailTestSimulator = (
  request: ProviderSendRequest,
  attemptNumber: number
) => ProviderDeliveryResult | null;

let testSimulator: EmailTestSimulator | null = null;
const attemptCounterByNotificationId = new Map<string, number>();

/**
 * Configure deterministic fault injection for automated tests (never used in production traffic).
 */
export function setEmailProviderTestSimulator(simulator: EmailTestSimulator | null): void {
  testSimulator = simulator;
  attemptCounterByNotificationId.clear();
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class EmailNotificationProvider implements NotificationProvider {
  public readonly channel = 'EMAIL' as const;

  get providerName(): string {
    const raw = (env.EMAIL_PROVIDER || 'mock').trim().toLowerCase();
    return raw || 'mock';
  }

  isEnabled(): boolean {
    return this.providerName !== 'disabled';
  }

  async send(request: ProviderSendRequest): Promise<ProviderDeliveryResult> {
    const provider = this.providerName;

    if (!this.isEnabled()) {
      return {
        success: false,
        retryable: false,
        provider: 'email-disabled',
        providerMessageId: null,
        errorCode: 'EMAIL_PROVIDER_DISABLED',
        message: 'Email notification provider is disabled.',
      };
    }

    const recipient = (request.recipient || '').trim();
    if (!EMAIL_REGEX.test(recipient)) {
      return {
        success: false,
        retryable: false,
        provider,
        providerMessageId: null,
        errorCode: 'INVALID_EMAIL_RECIPIENT',
        message: 'Recipient email address is invalid.',
      };
    }

    const currentAttempt = (attemptCounterByNotificationId.get(request.notificationId) || 0) + 1;
    attemptCounterByNotificationId.set(request.notificationId, currentAttempt);

    if (testSimulator) {
      const simulated = testSimulator(request, currentAttempt);
      if (simulated) {
        return simulated;
      }
    }

    // Safe development / test mock provider (never sends real external emails)
    if (provider === 'mock' || (env.NODE_ENV !== 'production' && !env.EMAIL_API_KEY)) {
      const mockMessageId = `mock_email_${crypto.randomBytes(8).toString('hex')}`;
      return {
        success: true,
        retryable: false,
        provider: 'mock',
        providerMessageId: mockMessageId,
        errorCode: null,
        message: 'Delivered via mock email provider.',
      };
    }

    if (!env.EMAIL_API_KEY) {
      return {
        success: false,
        retryable: false,
        provider,
        providerMessageId: null,
        errorCode: 'EMAIL_CREDENTIALS_MISSING',
        message: 'Transactional email API credentials are not configured.',
      };
    }

    try {
      if (provider === 'resend') {
        const endpoint = env.EMAIL_API_URL || 'https://api.resend.com/emails';
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${env.EMAIL_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: env.EMAIL_FROM || 'NYUTA ELITE MAKHANA <orders@nutyaelite.com>',
            to: [recipient],
            subject: request.subject,
            html: request.html || request.text,
            text: request.text,
          }),
        });

        const body: any = await response.json().catch(() => ({}));
        if (response.ok) {
          return {
            success: true,
            retryable: false,
            provider: 'resend',
            providerMessageId: body?.id ? String(body.id) : `resend_${Date.now()}`,
            errorCode: null,
            message: 'Email accepted by Resend.',
          };
        }

        const retryable = response.status === 429 || response.status >= 500;
        return {
          success: false,
          retryable,
          provider: 'resend',
          providerMessageId: null,
          errorCode: `HTTP_${response.status}`,
          message: body?.message ? String(body.message).slice(0, 240) : `Email gateway HTTP ${response.status}`,
        };
      }

      if (provider === 'sendgrid') {
        const endpoint = env.EMAIL_API_URL || 'https://api.sendgrid.com/v3/mail/send';
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${env.EMAIL_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            personalizations: [{ to: [{ email: recipient }] }],
            from: { email: env.EMAIL_FROM || 'orders@nutyaelite.com', name: 'NYUTA ELITE MAKHANA' },
            subject: request.subject,
            content: [
              { type: 'text/plain', value: request.text },
              ...(request.html ? [{ type: 'text/html', value: request.html }] : []),
            ],
          }),
        });

        if (response.ok || response.status === 202) {
          const msgId = response.headers.get('x-message-id') || `sg_${Date.now()}`;
          return {
            success: true,
            retryable: false,
            provider: 'sendgrid',
            providerMessageId: msgId,
            errorCode: null,
            message: 'Email accepted by SendGrid.',
          };
        }

        const retryable = response.status === 429 || response.status >= 500;
        return {
          success: false,
          retryable,
          provider: 'sendgrid',
          providerMessageId: null,
          errorCode: `HTTP_${response.status}`,
          message: `SendGrid gateway HTTP ${response.status}`,
        };
      }

      return {
        success: false,
        retryable: false,
        provider,
        providerMessageId: null,
        errorCode: 'UNSUPPORTED_EMAIL_PROVIDER',
        message: `Unsupported email provider: ${provider}`,
      };
    } catch (err: any) {
      return {
        success: false,
        retryable: true,
        provider,
        providerMessageId: null,
        errorCode: 'NETWORK_ERROR',
        message: err?.message ? String(err.message).slice(0, 200) : 'Transient network error contacting email provider',
      };
    }
  }
}

export const emailNotificationProvider = new EmailNotificationProvider();
