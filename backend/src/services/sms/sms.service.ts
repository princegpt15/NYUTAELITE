// src/services/sms/sms.service.ts
import { env } from '../../config/env.js';
import { maskPhoneNumber } from '../../utils/phone.js';

export interface SmsSendResult {
  success: boolean;
  messageId?: string;
  provider: string;
  error?: string;
}

export interface SmsProviderAdapter {
  name: string;
  sendOtp(normalizedPhone: string, otp: string): Promise<SmsSendResult>;
}

/**
 * 2Factor.in SMS Provider (India)
 * Specializes in fast transactional OTP delivery across Indian telecom operators.
 */
class TwoFactorProvider implements SmsProviderAdapter {
  name = '2factor';

  async sendOtp(normalizedPhone: string, otp: string): Promise<SmsSendResult> {
    if (!env.OTP_API_KEY) {
      throw new Error('2Factor API key is not configured (OTP_API_KEY).');
    }

    // Strip leading '+' for 2Factor Indian format
    const cleanNumber = normalizedPhone.replace(/^\+/, '');
    const template = env.OTP_TEMPLATE_ID || 'AUTOGEN';
    const url = `https://2factor.in/API/V1/${encodeURIComponent(env.OTP_API_KEY)}/SMS/${encodeURIComponent(cleanNumber)}/${encodeURIComponent(otp)}/${encodeURIComponent(template)}`;

    try {
      const res = await fetch(url, { method: 'GET' });
      const data: any = await res.json().catch(() => ({}));
      if (res.ok && data.Status === 'Success') {
        return { success: true, messageId: data.Details, provider: this.name };
      }
      return {
        success: false,
        provider: this.name,
        error: data.Details || `2Factor responded with HTTP ${res.status}`,
      };
    } catch (err: any) {
      return { success: false, provider: this.name, error: err.message || 'Network error' };
    }
  }
}

/**
 * MSG91 SMS Provider (India)
 * DLT compliant, uses template ID registered with Indian telecom operators.
 */
class Msg91Provider implements SmsProviderAdapter {
  name = 'msg91';

  async sendOtp(normalizedPhone: string, otp: string): Promise<SmsSendResult> {
    if (!env.OTP_API_KEY) {
      throw new Error('MSG91 AuthKey is not configured (OTP_API_KEY).');
    }
    if (!env.OTP_TEMPLATE_ID) {
      throw new Error('MSG91 DLT Template ID is not configured (OTP_TEMPLATE_ID).');
    }

    const cleanNumber = normalizedPhone.replace(/^\+/, '');
    const url = `https://control.msg91.com/api/v5/otp?template_id=${encodeURIComponent(env.OTP_TEMPLATE_ID)}&mobile=${encodeURIComponent(cleanNumber)}&authkey=${encodeURIComponent(env.OTP_API_KEY)}&otp=${encodeURIComponent(otp)}`;

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data: any = await res.json().catch(() => ({}));
      if (res.ok && (data.type === 'success' || data.type === 'default')) {
        return { success: true, messageId: data.message, provider: this.name };
      }
      return {
        success: false,
        provider: this.name,
        error: data.message || `MSG91 responded with HTTP ${res.status}`,
      };
    } catch (err: any) {
      return { success: false, provider: this.name, error: err.message || 'Network error' };
    }
  }
}

/**
 * Fast2SMS Provider (India)
 * Simple Quick OTP route for Indian phone numbers.
 */
class Fast2SmsProvider implements SmsProviderAdapter {
  name = 'fast2sms';

  async sendOtp(normalizedPhone: string, otp: string): Promise<SmsSendResult> {
    if (!env.OTP_API_KEY) {
      throw new Error('Fast2SMS API authorization key is not configured (OTP_API_KEY).');
    }

    // Fast2SMS expects 10-digit number for Indian numbers
    const cleanNumber = normalizedPhone.replace(/^\+91/, '').replace(/^\+/, '');
    const url = 'https://www.fast2sms.com/dev/bulkV2';

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          authorization: env.OTP_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          route: 'otp',
          variables_values: otp,
          numbers: cleanNumber,
        }),
      });

      const data: any = await res.json().catch(() => ({}));
      if (res.ok && data.return === true) {
        return {
          success: true,
          messageId: Array.isArray(data.request_id) ? data.request_id[0] : data.request_id,
          provider: this.name,
        };
      }
      return {
        success: false,
        provider: this.name,
        error: data.message?.[0] || data.message || `Fast2SMS returned HTTP ${res.status}`,
      };
    } catch (err: any) {
      return { success: false, provider: this.name, error: err.message || 'Network error' };
    }
  }
}

/**
 * Twilio SMS Provider (Global / India)
 */
class TwilioProvider implements SmsProviderAdapter {
  name = 'twilio';

  async sendOtp(normalizedPhone: string, otp: string): Promise<SmsSendResult> {
    if (!env.TWILIO_ACCOUNT_SID || !env.TWILIO_AUTH_TOKEN || !env.TWILIO_FROM_PHONE) {
      throw new Error(
        'Twilio configuration is incomplete (requires TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_PHONE).'
      );
    }

    const url = `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(env.TWILIO_ACCOUNT_SID)}/Messages.json`;
    const basicAuth = Buffer.from(`${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`).toString('base64');

    const bodyParams = new URLSearchParams({
      From: env.TWILIO_FROM_PHONE,
      To: normalizedPhone,
      Body: `Your NYUTA ELITE verification code is ${otp}. Valid for 5 minutes. Do not share this OTP with anyone.`,
    });

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${basicAuth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: bodyParams.toString(),
      });

      const data: any = await res.json().catch(() => ({}));
      if (res.ok && data.sid) {
        return { success: true, messageId: data.sid, provider: this.name };
      }
      return {
        success: false,
        provider: this.name,
        error: data.message || `Twilio returned HTTP ${res.status}`,
      };
    } catch (err: any) {
      return { success: false, provider: this.name, error: err.message || 'Network error' };
    }
  }
}

/**
 * Dev / Console Provider (Safe for local development & automated testing)
 * Explicitly prohibited in production.
 */
class DevConsoleProvider implements SmsProviderAdapter {
  name = 'dev-console';

  async sendOtp(normalizedPhone: string, otp: string): Promise<SmsSendResult> {
    if (env.NODE_ENV === 'production') {
      throw new Error('Dev console SMS provider is strictly disabled in production.');
    }

    console.log('\n[NYUTA ELITE OTP SERVICE - DEV MODE]');
    console.log('──────────────────────────────────────────────────────');
    console.log(`📱 Recipient Phone: ${maskPhoneNumber(normalizedPhone)} (${normalizedPhone})`);
    console.log(`🔑 Verification OTP: ${otp}`);
    console.log('⏳ Expiration: 5 minutes');
    console.log('──────────────────────────────────────────────────────\n');

    return {
      success: true,
      messageId: `dev-mock-${Date.now()}`,
      provider: this.name,
    };
  }
}

export function getSmsProvider(): SmsProviderAdapter {
  const providerKey = (env.OTP_PROVIDER || 'disabled').toLowerCase().trim();

  switch (providerKey) {
    case '2factor':
      return new TwoFactorProvider();
    case 'msg91':
      return new Msg91Provider();
    case 'fast2sms':
      return new Fast2SmsProvider();
    case 'twilio':
      return new TwilioProvider();
    case 'console':
    case 'dev':
      return new DevConsoleProvider();
    default: {
      const err: any = new Error(
        'SMS OTP service is not configured. Please configure OTP_PROVIDER and credentials in backend/.env (supported: 2factor, msg91, twilio, fast2sms, or dev for local testing).'
      );
      err.statusCode = 503;
      err.code = 'OTP_PROVIDER_NOT_CONFIGURED';
      throw err;
    }
  }
}
