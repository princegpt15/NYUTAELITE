// scripts/seo-engine/search-console.ts
import fs from 'node:fs';
import crypto from 'node:crypto';
import { CONFIG, redactSecrets } from './config';

export interface GscSiteItem {
  siteUrl: string;
  permissionLevel: string;
}

export interface GscSearchAnalyticsRow {
  keys: string[];
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface GscUrlInspectionResult {
  inspectionUrl: string;
  verdict: 'PASS' | 'PARTIAL' | 'FAIL' | 'NEUTRAL' | 'UNSPECIFIED';
  coverageState: string;
  robotsTxtState: string;
  indexingState: string;
  lastCrawlTime?: string;
  pageFetchState?: string;
  googleCanonical?: string;
  userCanonical?: string;
  mobileUsabilityResult?: string;
  richResults?: string[];
  raw?: any;
}

export interface GscClientResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  authMethod: 'OAUTH2' | 'SERVICE_ACCOUNT' | 'NONE';
  missingConfigInstructions?: string;
}

export class GoogleSearchConsoleClient {
  private accessToken: string | null = null;
  private tokenExpiresAt = 0;

  public getAuthMethod(): 'OAUTH2' | 'SERVICE_ACCOUNT' | 'NONE' {
    if (CONFIG.googleClientId && CONFIG.googleClientSecret && CONFIG.googleRefreshToken) {
      return 'OAUTH2';
    }
    if (CONFIG.googleApplicationCredentials) {
      return 'SERVICE_ACCOUNT';
    }
    return 'NONE';
  }

  public getMissingConfigInstructions(): string {
    return [
      'Google Search Console API Authentication is not configured.',
      '',
      'Option A (Recommended for Automated Jobs: Service Account):',
      '  1. Create a Google Cloud Project & enable Google Search Console API.',
      '  2. Create a Service Account, download the JSON key file.',
      '  3. Add the service account email as a "Full" user in Google Search Console for https://nyutaelite.com/.',
      '  4. Set GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json in your .env or environment.',
      '',
      'Option B (OAuth 2.0 Web/App):',
      '  1. Configure OAuth 2.0 Client credentials in Google Cloud Console.',
      '  2. Generate a Refresh Token with scope: https://www.googleapis.com/auth/webmasters.readonly',
      '  3. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REFRESH_TOKEN in your .env.',
    ].join('\n');
  }

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiresAt - 60000) {
      return this.accessToken;
    }

    const authMethod = this.getAuthMethod();

    if (authMethod === 'OAUTH2') {
      const tokenUrl = 'https://oauth2.googleapis.com/token';
      const body = new URLSearchParams({
        client_id: CONFIG.googleClientId!,
        client_secret: CONFIG.googleClientSecret!,
        refresh_token: CONFIG.googleRefreshToken!,
        grant_type: 'refresh_token',
      });

      const res = await fetch(tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`GSC OAuth token refresh failed (${res.status}): ${redactSecrets(errText)}`);
      }

      const json = (await res.json()) as any;
      this.accessToken = json.access_token;
      this.tokenExpiresAt = Date.now() + (json.expires_in || 3600) * 1000;
      return this.accessToken!;
    }

    if (authMethod === 'SERVICE_ACCOUNT') {
      const credPath = CONFIG.googleApplicationCredentials!;
      if (!fs.existsSync(credPath)) {
        throw new Error(`Service account credentials file not found: ${credPath}`);
      }
      const creds = JSON.parse(fs.readFileSync(credPath, 'utf8'));

      // Generate signed JWT for Service Account
      const now = Math.floor(Date.now() / 1000);
      const header = { alg: 'RS256', typ: 'JWT' };
      const claimSet = {
        iss: creds.client_email,
        scope: 'https://www.googleapis.com/auth/webmasters.readonly https://www.googleapis.com/auth/webmasters',
        aud: 'https://oauth2.googleapis.com/token',
        exp: now + 3600,
        iat: now,
      };

      const b64Header = Buffer.from(JSON.stringify(header)).toString('base64url');
      const b64Claim = Buffer.from(JSON.stringify(claimSet)).toString('base64url');
      const signInput = `${b64Header}.${b64Claim}`;

      const sign = crypto.createSign('RSA-SHA256');
      sign.update(signInput);
      sign.end();
      const signature = sign.sign(creds.private_key, 'base64url');
      const jwt = `${signInput}.${signature}`;

      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
          assertion: jwt,
        }).toString(),
      });

      if (!tokenRes.ok) {
        const errText = await tokenRes.text();
        throw new Error(`GSC Service Account JWT token exchange failed (${tokenRes.status}): ${redactSecrets(errText)}`);
      }

      const json = (await tokenRes.json()) as any;
      this.accessToken = json.access_token;
      this.tokenExpiresAt = Date.now() + (json.expires_in || 3600) * 1000;
      return this.accessToken!;
    }

    throw new Error('NO_CREDENTIALS');
  }

  public async listSites(): Promise<GscClientResult<GscSiteItem[]>> {
    const authMethod = this.getAuthMethod();
    if (authMethod === 'NONE') {
      return {
        success: false,
        authMethod: 'NONE',
        error: 'Authentication not configured',
        missingConfigInstructions: this.getMissingConfigInstructions(),
      };
    }

    try {
      const token = await this.getAccessToken();
      const res = await fetch('https://www.googleapis.com/webmasters/v3/sites', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const text = await res.text();
        return { success: false, authMethod, error: `GSC sites.list failed (${res.status}): ${redactSecrets(text)}` };
      }

      const json = (await res.json()) as any;
      const entries = (json.siteEntry || []).map((e: any) => ({
        siteUrl: e.siteUrl,
        permissionLevel: e.permissionLevel,
      }));

      return { success: true, authMethod, data: entries };
    } catch (err: any) {
      return { success: false, authMethod, error: redactSecrets(err.message) };
    }
  }

  public async querySearchAnalytics(params: {
    startDate: string;
    endDate: string;
    dimensions?: Array<'date' | 'query' | 'page' | 'country' | 'device'>;
    rowLimit?: number;
  }): Promise<GscClientResult<GscSearchAnalyticsRow[]>> {
    const authMethod = this.getAuthMethod();
    if (authMethod === 'NONE') {
      return {
        success: false,
        authMethod: 'NONE',
        error: 'Authentication not configured',
        missingConfigInstructions: this.getMissingConfigInstructions(),
      };
    }

    try {
      const token = await this.getAccessToken();
      const siteUrlParam = encodeURIComponent(CONFIG.gscSiteUrl);
      const url = `https://www.googleapis.com/webmasters/v3/sites/${siteUrlParam}/searchAnalytics/query`;

      const body = {
        startDate: params.startDate,
        endDate: params.endDate,
        dimensions: params.dimensions || ['query', 'page'],
        rowLimit: params.rowLimit || 250,
      };

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const text = await res.text();
        return { success: false, authMethod, error: `GSC searchAnalytics.query failed (${res.status}): ${redactSecrets(text)}` };
      }

      const json = (await res.json()) as any;
      const rows: GscSearchAnalyticsRow[] = (json.rows || []).map((r: any) => ({
        keys: r.keys || [],
        clicks: r.clicks || 0,
        impressions: r.impressions || 0,
        ctr: r.ctr || 0,
        position: r.position || 0,
      }));

      return { success: true, authMethod, data: rows };
    } catch (err: any) {
      return { success: false, authMethod, error: redactSecrets(err.message) };
    }
  }

  public async inspectUrl(inspectionUrl: string): Promise<GscClientResult<GscUrlInspectionResult>> {
    const authMethod = this.getAuthMethod();
    if (authMethod === 'NONE') {
      return {
        success: false,
        authMethod: 'NONE',
        error: 'Authentication not configured',
        missingConfigInstructions: this.getMissingConfigInstructions(),
      };
    }

    try {
      const token = await this.getAccessToken();
      const url = 'https://searchconsole.googleapis.com/v1/urlInspection/index:inspect';

      const body = {
        inspectionUrl,
        siteUrl: CONFIG.gscSiteUrl,
      };

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const text = await res.text();
        return { success: false, authMethod, error: `GSC urlInspection failed (${res.status}): ${redactSecrets(text)}` };
      }

      const json = (await res.json()) as any;
      const inspectRes = json.inspectionResult || {};
      const indexStatus = inspectRes.indexStatusResult || {};

      const result: GscUrlInspectionResult = {
        inspectionUrl,
        verdict: indexStatus.verdict || 'UNSPECIFIED',
        coverageState: indexStatus.coverageState || 'UNKNOWN',
        robotsTxtState: indexStatus.robotsTxtState || 'ALLOWED',
        indexingState: indexStatus.indexingState || 'UNKNOWN',
        lastCrawlTime: indexStatus.lastCrawlTime,
        pageFetchState: indexStatus.pageFetchState,
        googleCanonical: indexStatus.googleCanonical,
        userCanonical: indexStatus.userCanonical,
        mobileUsabilityResult: inspectRes.mobileUsabilityResult?.verdict,
        richResults: inspectRes.richResultsResult?.detectedItems?.map((i: any) => i.richResultType) || [],
        raw: inspectRes,
      };

      return { success: true, authMethod, data: result };
    } catch (err: any) {
      return { success: false, authMethod, error: redactSecrets(err.message) };
    }
  }
}
