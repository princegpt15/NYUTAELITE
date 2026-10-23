// backend/src/services/notification/providers/email.provider.ts
import crypto from 'crypto';
import nodemailer, { type Transporter, type SendMailOptions } from 'nodemailer';
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

export type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

let testSimulator: EmailTestSimulator | null = null;
let customSmtpTransporter: Transporter | null = null;
let customFetch: FetchLike | null = null;
const attemptCounterByNotificationId = new Map<string, number>();

/**
 * Configure deterministic fault injection for automated tests (never used in production traffic).
 */
export function setEmailProviderTestSimulator(simulator: EmailTestSimulator | null): void {
  testSimulator = simulator;
  attemptCounterByNotificationId.clear();
}

/**
 * Inject a custom Nodemailer transporter for hermetic test execution (e.g. stream/json transport).
 */
export function setCustomSmtpTransporter(transporter: Transporter | null): void {
  customSmtpTransporter = transporter;
}

/**
 * Inject a custom HTTP fetch client for hermetic testing of HTTPS providers (Resend, SendGrid).
 */
export function setCustomEmailFetch(fetchFn: FetchLike | null): void {
  customFetch = fetchFn;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class EmailNotificationProvider implements NotificationProvider {
  public readonly channel = 'EMAIL' as const;

  get providerName(): string {
    const raw = (env.EMAIL_PROVIDER || 'mock').trim().toLowerCase();
    return raw || 'mock';
  }

  isEnabled(): boolean {
    if (this.providerName === 'disabled') {
      return false;
    }
    // Require EMAIL_ENABLED=true for all live external providers (smtp, resend, sendgrid)
    if (!env.EMAIL_ENABLED && this.providerName !== 'mock') {
      return false;
    }
    return true;
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
        message: 'Email notification provider is disabled via configuration (EMAIL_ENABLED=false).',
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

    // Safety interceptor: In test mode, rewrite recipient to authorized test mailbox
    const originalRecipient = recipient;
    const effectiveRecipient = env.EMAIL_TEST_MODE
      ? (env.EMAIL_TEST_RECIPIENT || 'enterprisesp0r@gmail.com').trim()
      : originalRecipient;

    const effectiveSubject = env.EMAIL_TEST_MODE
      ? `[TEST to ${originalRecipient}] ${request.subject}`
      : request.subject;

    // Safe development / test mock provider (never sends real external emails)
    if (provider === 'mock' || (env.NODE_ENV !== 'production' && provider !== 'smtp' && !env.EMAIL_API_KEY)) {
      const mockMessageId = `mock_email_${crypto.randomBytes(8).toString('hex')}`;
      return {
        success: true,
        retryable: false,
        provider: 'mock',
        providerMessageId: mockMessageId,
        errorCode: null,
        message: `Delivered via mock email provider (target: ${effectiveRecipient}${
          env.EMAIL_TEST_MODE ? ` [redirected from ${originalRecipient}]` : ''
        }).`,
      };
    }

    // GoDaddy Workspace / Professional SMTP Provider
    if (provider === 'smtp') {
      try {
        const transporter =
          customSmtpTransporter ||
          nodemailer.createTransport({
            host: env.SMTP_HOST || 'smtpout.secureserver.net',
            port: env.SMTP_PORT || 465,
            secure: env.SMTP_SECURE, // true for 465, false for 587
            auth: {
              user: env.SMTP_USER,
              pass: env.SMTP_PASS,
            },
            connectionTimeout: 15000,
            greetingTimeout: 15000,
            socketTimeout: 15000,
          });

        if (!customSmtpTransporter && (!env.SMTP_USER || !env.SMTP_PASS)) {
          return {
            success: false,
            retryable: false,
            provider: 'smtp',
            providerMessageId: null,
            errorCode: 'SMTP_CREDENTIALS_MISSING',
            message: 'SMTP credentials (SMTP_USER or SMTP_PASS) are not configured in environment.',
          };
        }

        const mailOptions: SendMailOptions = {
          from: `"${env.EMAIL_FROM_NAME}" <${env.EMAIL_FROM_ADDRESS}>`,
          to: effectiveRecipient,
          cc: undefined,
          bcc: undefined,
          replyTo: env.EMAIL_FROM_ADDRESS,
          subject: effectiveSubject,
          text: request.text,
          ...(request.html ? { html: request.html } : {}),
          headers: env.EMAIL_TEST_MODE
            ? {
                'X-Original-Recipient': originalRecipient,
                'X-Delivery-Environment': env.NODE_ENV,
                'X-Test-Mode': 'true',
              }
            : undefined,
        };

        const info = await transporter.sendMail(mailOptions);
        const providerMessageId = info.messageId || `smtp_${Date.now()}`;

        return {
          success: true,
          retryable: false,
          provider: 'smtp',
          providerMessageId,
          errorCode: null,
          message: `Delivered via SMTP (${info.response || 'OK'}) to ${effectiveRecipient}`,
        };
      } catch (err: any) {
        const isNetworkTimeout =
          ['ECONNREFUSED', 'ETIMEDOUT', 'ESOCKETTIMEDOUT', 'ENOTFOUND', 'EHOSTUNREACH', 'ECONNRESET'].includes(
            err?.code
          ) || String(err?.message || '').toLowerCase().includes('timeout');

        // Sanitize error message to prevent accidental credential leakage in logs or database records
        const rawMsg = err?.message ? String(err.message) : 'SMTP transmission failure';
        const sanitizedMsg = rawMsg
          .replace(/(password|pass|secret|token)\s*[:=]\s*\S+/gi, '$1=***')
          .slice(0, 240);

        return {
          success: false,
          retryable: isNetworkTimeout,
          provider: 'smtp',
          providerMessageId: null,
          errorCode: err?.code || 'SMTP_ERROR',
          message: sanitizedMsg,
        };
      }
    }

    const apiKey = (env.EMAIL_API_KEY || '').trim();
    if (!apiKey) {
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
      const fetchFn = customFetch || globalThis.fetch;

      if (provider === 'resend') {
        const endpoint = env.EMAIL_API_URL || 'https://api.resend.com/emails';
        const response = await fetchFn(endpoint, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: env.EMAIL_FROM || 'NYUTA ELITE MAKHANA <info@nutyaelite.com>',
            to: [effectiveRecipient],
            reply_to: env.EMAIL_FROM_ADDRESS || 'info@nutyaelite.com',
            subject: effectiveSubject,
            html: request.html || request.text,
            text: request.text,
            headers: env.EMAIL_TEST_MODE
              ? {
                  'X-Original-Recipient': originalRecipient,
                  'X-Test-Mode': 'true',
                }
              : undefined,
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
        const response = await fetchFn(endpoint, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            personalizations: [{ to: [{ email: effectiveRecipient }] }],
            from: { email: env.EMAIL_FROM_ADDRESS || 'info@nutyaelite.com', name: env.EMAIL_FROM_NAME || 'NYUTA ELITE MAKHANA' },
            subject: effectiveSubject,
            content: [
              { type: 'text/plain', value: request.text },
              ...(request.html ? [{ type: 'text/html', value: request.html }] : []),
            ],
            headers: env.EMAIL_TEST_MODE
              ? {
                  'X-Original-Recipient': originalRecipient,
                  'X-Test-Mode': 'true',
                }
              : undefined,
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
      const rawMsg = err?.message ? String(err.message) : 'Transient network error contacting email provider';
      const sanitizedMsg = rawMsg
        .replace(/(bearer|key|token|password|pass|secret)\s*[:=]\s*\S+/gi, '$1=***')
        .slice(0, 240);

      return {
        success: false,
        retryable: true,
        provider,
        providerMessageId: null,
        errorCode: 'NETWORK_ERROR',
        message: sanitizedMsg,
      };
    }
  }
}

export const emailNotificationProvider = new EmailNotificationProvider();
