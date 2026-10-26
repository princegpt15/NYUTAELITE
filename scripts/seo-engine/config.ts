// scripts/seo-engine/config.ts
import path from 'node:path';
import fs from 'node:fs';

export interface SeoEngineConfig {
  origin: string;
  apiOrigin: string;
  siteName: string;
  brand: string;
  sitemapUrl: string;
  robotsUrl: string;
  feedUrl: string;
  buyerGuideUrl: string;
  gscSiteUrl: string;
  googleClientId?: string;
  googleClientSecret?: string;
  googleRefreshToken?: string;
  googleApplicationCredentials?: string;
  bingApiKey?: string;
  bingSiteUrl?: string;
  alertWebhookUrl?: string;
  alertEmail?: string;
  reportsDir: string;
  reportsHistoryDir: string;
  dataDir: string;
  stateFile: string;
  historyFile: string;
}

function loadEnvFile(filePath: string): Record<string, string> {
  const result: Record<string, string> = {};
  if (!fs.existsSync(filePath)) return result;
  const content = fs.readFileSync(filePath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx > 0) {
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      result[key] = val;
    }
  }
  return result;
}

const localEnv = {
  ...loadEnvFile('.env'),
  ...loadEnvFile('.env.production'),
  ...loadEnvFile('.env.local'),
  ...process.env,
};

const PROJECT_ROOT = process.cwd();
const REPORTS_DIR = path.join(PROJECT_ROOT, 'reports', 'seo');
const REPORTS_HISTORY_DIR = path.join(REPORTS_DIR, 'history');
const DATA_DIR = path.join(PROJECT_ROOT, 'data', 'seo');

export const CONFIG: SeoEngineConfig = {
  origin: 'https://nyutaelite.com',
  apiOrigin: 'https://api.nutyaelite.com',
  siteName: 'NYUTAELITE Makhana',
  brand: 'NYUTAELITE',
  sitemapUrl: 'https://nyutaelite.com/sitemap.xml',
  robotsUrl: 'https://nyutaelite.com/robots.txt',
  feedUrl: 'https://nyutaelite.com/feed.xml',
  buyerGuideUrl: 'https://nyutaelite.com/learn/how-to-choose-good-quality-makhana',
  gscSiteUrl: localEnv.GSC_SITE_URL || 'https://nyutaelite.com/',
  googleClientId: localEnv.GOOGLE_CLIENT_ID || undefined,
  googleClientSecret: localEnv.GOOGLE_CLIENT_SECRET || undefined,
  googleRefreshToken: localEnv.GOOGLE_REFRESH_TOKEN || undefined,
  googleApplicationCredentials: localEnv.GOOGLE_APPLICATION_CREDENTIALS || undefined,
  bingApiKey: localEnv.BING_API_KEY || undefined,
  bingSiteUrl: localEnv.BING_SITE_URL || 'https://nyutaelite.com/',
  alertWebhookUrl: localEnv.SEO_ALERT_WEBHOOK_URL || undefined,
  alertEmail: localEnv.SEO_ALERT_EMAIL || undefined,
  reportsDir: REPORTS_DIR,
  reportsHistoryDir: REPORTS_HISTORY_DIR,
  dataDir: DATA_DIR,
  stateFile: path.join(DATA_DIR, 'state.json'),
  historyFile: path.join(DATA_DIR, 'history.jsonl'),
};

export function ensureDirectories(): void {
  if (!fs.existsSync(REPORTS_DIR)) fs.mkdirSync(REPORTS_DIR, { recursive: true });
  if (!fs.existsSync(REPORTS_HISTORY_DIR)) fs.mkdirSync(REPORTS_HISTORY_DIR, { recursive: true });
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

export function redactSecrets(text: string): string {
  let cleaned = text;
  const secrets = [
    CONFIG.googleClientSecret,
    CONFIG.googleRefreshToken,
    CONFIG.bingApiKey,
    localEnv.VITE_RAZORPAY_KEY_ID,
  ].filter((s): s is string => Boolean(s) && s.length > 4);

  for (const s of secrets) {
    const escaped = s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    cleaned = cleaned.replace(new RegExp(escaped, 'g'), '[REDACTED]');
  }

  // Regex pattern redaction for common credential patterns
  cleaned = cleaned.replace(/rzp_(?:live|test)_[a-zA-Z0-9_]+/gi, '[REDACTED_RAZORPAY_KEY]');
  cleaned = cleaned.replace(/apikey=([^&\s]+)/gi, 'apikey=[REDACTED]');
  cleaned = cleaned.replace(/client_secret=([^&\s]+)/gi, 'client_secret=[REDACTED]');
  cleaned = cleaned.replace(/refresh_token=([^&\s]+)/gi, 'refresh_token=[REDACTED]');
  cleaned = cleaned.replace(/Bearer\s+([a-zA-Z0-9_.-]{12,})/gi, 'Bearer [REDACTED]');

  return cleaned;
}
