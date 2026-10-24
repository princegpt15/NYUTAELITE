// src/utils/phone.ts

export interface NormalizedPhoneResult {
  isValid: boolean;
  normalized: string;
  nationalNumber: string;
  countryCode: string;
  formatted: string;
  error?: string;
}

/**
 * Normalizes and validates a mobile phone number.
 * Defaults to Indian mobile standards (+91), extensible to international E.164.
 */
export function normalizePhoneNumber(
  rawPhone: string,
  defaultCountryCode = '+91'
): NormalizedPhoneResult {
  if (!rawPhone || typeof rawPhone !== 'string') {
    return {
      isValid: false,
      normalized: '',
      nationalNumber: '',
      countryCode: defaultCountryCode,
      formatted: '',
      error: 'Phone number is required.',
    };
  }

  // Remove whitespace, hyphens, brackets, dots
  let cleaned = rawPhone.trim().replace(/[\s\-\(\)\.]/g, '');

  let countryCode = defaultCountryCode.startsWith('+') ? defaultCountryCode : `+${defaultCountryCode}`;
  let nationalNumber = cleaned;

  if (cleaned.startsWith('+')) {
    if (cleaned.startsWith('+91')) {
      countryCode = '+91';
      nationalNumber = cleaned.slice(3);
    } else {
      // General international number
      const match = cleaned.match(/^(\+\d{1,4})(\d{6,14})$/);
      if (match) {
        countryCode = match[1];
        nationalNumber = match[2];
      }
    }
  } else if (cleaned.startsWith('0091')) {
    countryCode = '+91';
    nationalNumber = cleaned.slice(4);
  } else if (cleaned.startsWith('0') && cleaned.length === 11) {
    // E.g. Indian standard trunk prefix "09876543210"
    countryCode = '+91';
    nationalNumber = cleaned.slice(1);
  } else if (cleaned.startsWith('91') && cleaned.length === 12) {
    countryCode = '+91';
    nationalNumber = cleaned.slice(2);
  }

  // Strip any accidental leading zero on national number
  if (countryCode === '+91' && nationalNumber.startsWith('0')) {
    nationalNumber = nationalNumber.replace(/^0+/, '');
  }

  // Indian validation: exactly 10 digits starting with 6, 7, 8, or 9
  if (countryCode === '+91') {
    const isIndianValid = /^[6-9]\d{9}$/.test(nationalNumber);
    if (!isIndianValid) {
      return {
        isValid: false,
        normalized: `+91${nationalNumber}`,
        nationalNumber,
        countryCode: '+91',
        formatted: `+91 ${nationalNumber}`,
        error: 'Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.',
      };
    }

    const normalized = `+91${nationalNumber}`;
    const formatted = `+91 ${nationalNumber.slice(0, 5)} ${nationalNumber.slice(5)}`;
    return {
      isValid: true,
      normalized,
      nationalNumber,
      countryCode: '+91',
      formatted,
    };
  }

  // General international E.164 validation: 7 to 15 digits total
  const fullE164 = `${countryCode}${nationalNumber}`;
  const isE164 = /^\+[1-9]\d{6,14}$/.test(fullE164);
  if (!isE164) {
    return {
      isValid: false,
      normalized: fullE164,
      nationalNumber,
      countryCode,
      formatted: fullE164,
      error: 'Please enter a valid international mobile number.',
    };
  }

  return {
    isValid: true,
    normalized: fullE164,
    nationalNumber,
    countryCode,
    formatted: fullE164,
  };
}

/**
 * Mask phone number for display/logging without exposing sensitive digits.
 * E.g., "+919876543210" -> "+91 ******3210"
 */
export function maskPhoneNumber(phone: string): string {
  if (!phone || phone.length < 7) return '******';
  const last4 = phone.slice(-4);
  const prefix = phone.startsWith('+') ? phone.slice(0, 3) : '';
  return `${prefix} ******${last4}`;
}
