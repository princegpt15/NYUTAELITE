// backend/src/services/notification/providers/whatsapp.provider.ts
import crypto from 'crypto';
import { env } from '../../../config/env.js';
import type {
  NotificationProvider,
  ProviderDeliveryResult,
  ProviderSendRequest,
} from '../notification.types.js';

const PHONE_REGEX = /^\+?[0-9]{10,15}$/;

export class WhatsAppNotificationProvider implements NotificationProvider {
  public readonly channel = 'WHATSAPP' as const;

  get providerName(): string {
    const raw = (env.WHATSAPP_PROVIDER || 'disabled').trim().toLowerCase();
    return raw || 'disabled';
  }

  /**
   * Returns true only when WhatsApp is explicitly enabled ('mock', or 'meta_cloud' with credentials).
   * When WHATSAPP_PROVIDER is 'disabled' or credentials are absent, returns false cleanly so
   * application startup and email notifications are unaffected.
   */
  isEnabled(): boolean {
    const mode = this.providerName;
    if (mode === 'disabled' || !mode) return false;
    if (mode === 'mock') return true;
    if (mode === 'meta_cloud') {
      return Boolean(env.WHATSAPP_ACCESS_TOKEN && env.WHATSAPP_PHONE_NUMBER_ID);
    }
    return false;
  }

  async send(request: ProviderSendRequest): Promise<ProviderDeliveryResult> {
    const mode = this.providerName;

    if (!this.isEnabled()) {
      return {
        success: false,
        retryable: false,
        provider: 'whatsapp-disabled',
        providerMessageId: null,
        errorCode: 'WHATSAPP_PROVIDER_DISABLED',
        message: 'WhatsApp provider is disabled or credentials are not configured.',
      };
    }

    const normalizedPhone = (request.recipient || '').replace(/[\s\-()]/g, '');
    if (!PHONE_REGEX.test(normalizedPhone)) {
      return {
        success: false,
        retryable: false,
        provider: mode,
        providerMessageId: null,
        errorCode: 'INVALID_WHATSAPP_RECIPIENT',
        message: 'Recipient phone number is missing or invalid for WhatsApp delivery.',
      };
    }

    // Safe development / test mock mode (never sends real WhatsApp messages to customers)
    if (mode === 'mock') {
      return {
        success: true,
        retryable: false,
        provider: 'whatsapp-mock',
        providerMessageId: `mock_wa_${crypto.randomBytes(8).toString('hex')}`,
        errorCode: null,
        message: 'Delivered via mock WhatsApp provider.',
      };
    }

    if (mode === 'meta_cloud') {
      if (!env.WHATSAPP_ACCESS_TOKEN || !env.WHATSAPP_PHONE_NUMBER_ID) {
        return {
          success: false,
          retryable: false,
          provider: 'meta_cloud',
          providerMessageId: null,
          errorCode: 'WHATSAPP_CREDENTIALS_MISSING',
          message: 'Meta WhatsApp Cloud API credentials are not configured.',
        };
      }

      try {
        const endpoint = `https://graph.facebook.com/v20.0/${encodeURIComponent(
          env.WHATSAPP_PHONE_NUMBER_ID
        )}/messages`;
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${env.WHATSAPP_ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: normalizedPhone.startsWith('+') ? normalizedPhone.slice(1) : normalizedPhone,
            type: 'text',
            text: {
              preview_url: false,
              body: request.text,
            },
          }),
        });

        const body: any = await response.json().catch(() => ({}));
        if (response.ok) {
          const waId = body?.messages?.[0]?.id || `wa_${Date.now()}`;
          return {
            success: true,
            retryable: false,
            provider: 'meta_cloud',
            providerMessageId: String(waId),
            errorCode: null,
            message: 'WhatsApp message accepted by Meta Cloud API.',
          };
        }

        const retryable = response.status === 429 || response.status >= 500;
        return {
          success: false,
          retryable,
          provider: 'meta_cloud',
          providerMessageId: null,
          errorCode: `HTTP_${response.status}`,
          message: body?.error?.message
            ? String(body.error.message).slice(0, 240)
            : `WhatsApp gateway HTTP ${response.status}`,
        };
      } catch (err: any) {
        return {
          success: false,
          retryable: true,
          provider: 'meta_cloud',
          providerMessageId: null,
          errorCode: 'NETWORK_ERROR',
          message: err?.message ? String(err.message).slice(0, 200) : 'Transient network error contacting WhatsApp API',
        };
      }
    }

    return {
      success: false,
      retryable: false,
      provider: mode,
      providerMessageId: null,
      errorCode: 'UNSUPPORTED_WHATSAPP_PROVIDER',
      message: `Unsupported WhatsApp provider: ${mode}`,
    };
  }
}

export const whatsAppNotificationProvider = new WhatsAppNotificationProvider();
