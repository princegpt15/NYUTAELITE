// scripts/seo-engine/search-console.ts
import fs from 'node:fs';
import path from 'node:path';
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

export interface GscSitemapItem {
  path: string;
  lastSubmitted?: string;
  isPending?: boolean;
  isSitemapsIndex?: boolean;
  type?: string;
  lastDownloaded?: string;
  warnings?: string;
  errors?: string;
  contents?: Array<{ type: string; submitted: string; indexed: string }>;
}

export interface ServiceAccountCredentials {
  type?: string;
  project_id?: string;
  private_key_id?: string;
  private_key: string;
  client_email: string;
  client_id?: string;
  auth_uri?: string;
  token_uri?: string;
  auth_provider_x509_cert_url?: string;
  client_x509_cert_url?: string;
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
  private config = { ...CONFIG };

  constructor(configOverride?: Partial<typeof CONFIG>) {
    if (configOverride) {
      this.config = { ...this.config, ...configOverride };
    }
  }

  public getAuthMethod(): 'OAUTH2' | 'SERVICE_ACCOUNT' | 'NONE' {
    if (this.config.googleClientId && this.config.googleClientSecret && this.config.googleRefreshToken) {
      return 'OAUTH2';
    }
    if (this.config.googleApplicationCredentials || this.config.googleApplicationCredentialsJson) {
      return 'SERVICE_ACCOUNT';
    }
    return 'NONE';
  }

  public parseServiceAccountCredentials(): { creds?: ServiceAccountCredentials; error?: string } {
    // 1. Direct JSON string or Base64 in this.config.googleApplicationCredentialsJson
    if (this.config.googleApplicationCredentialsJson) {
      let raw = this.config.googleApplicationCredentialsJson.trim();
      if (!raw.startsWith('{') && !raw.startsWith('[')) {
        try {
          raw = Buffer.from(raw, 'base64').toString('utf8').trim();
        } catch {
          // continue
        }
      }
      try {
        const parsed = JSON.parse(raw);
        if (!parsed.client_email) return { error: 'Service account JSON missing "client_email"' };
        if (!parsed.private_key) return { error: 'Service account JSON missing "private_key"' };
        if (typeof parsed.private_key === 'string' && parsed.private_key.includes('\\n')) {
          parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
        }
        return { creds: parsed };
      } catch (err: any) {
        return { error: `Failed to parse service account JSON from environment: ${err.message}` };
      }
    }

    // 2. this.config.googleApplicationCredentials (can be file path OR inline JSON)
    if (this.config.googleApplicationCredentials) {
      const raw = this.config.googleApplicationCredentials.trim();
      if (raw.startsWith('{')) {
        try {
          const parsed = JSON.parse(raw);
          if (!parsed.client_email) return { error: 'Service account JSON missing "client_email"' };
          if (!parsed.private_key) return { error: 'Service account JSON missing "private_key"' };
          if (typeof parsed.private_key === 'string' && parsed.private_key.includes('\\n')) {
            parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
          }
          return { creds: parsed };
        } catch (err: any) {
          return { error: `Failed to parse inline service account JSON: ${err.message}` };
        }
      }

      // Check file path
      const resolved = path.isAbsolute(raw) ? raw : path.resolve(process.cwd(), raw);
      if (!fs.existsSync(resolved)) {
        return { error: `Service account credentials file not found: ${resolved}` };
      }

      try {
        const fileContent = fs.readFileSync(resolved, 'utf8').trim();
        const parsed = JSON.parse(fileContent);
        if (!parsed.client_email) return { error: `Service account file '${resolved}' missing "client_email"` };
        if (!parsed.private_key) return { error: `Service account file '${resolved}' missing "private_key"` };
        if (typeof parsed.private_key === 'string' && parsed.private_key.includes('\\n')) {
          parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
        }
        return { creds: parsed };
      } catch (err: any) {
        return { error: `Failed to read or parse service account file '${resolved}': ${err.message}` };
      }
    }

    return { error: 'No service account credentials provided' };
  }

  public getMissingConfigInstructions(): string {
    return [
      'Google Search Console API Authentication is not configured.',
      '',
      'Option A (Recommended for Automated Jobs: Service Account):',
      '  1. Create a Google Cloud Project & enable Google Search Console API.',
      '  2. Create a Service Account, download the JSON key file.',
      '  3. Add the service account email as a "Full" user in Google Search Console for https://nyutaelite.com/.',
      '  4. Set GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json in your .env or environment,',
      '     OR set GOOGLE_APPLICATION_CREDENTIALS_JSON with the JSON content in GitHub Actions Secrets.',
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
        client_id: this.config.googleClientId!,
        client_secret: this.config.googleClientSecret!,
        refresh_token: this.config.googleRefreshToken!,
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
      const { creds, error } = this.parseServiceAccountCredentials();
      if (!creds || error) {
        throw new Error(`Service account error: ${error || 'Invalid credentials'}`);
      }

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
        throw new Error(`GSC Service Account JWT exchange failed (${tokenRes.status}): ${redactSecrets(errText)}`);
      }

      const tokenJson = (await tokenRes.json()) as any;
      this.accessToken = tokenJson.access_token;
      this.tokenExpiresAt = Date.now() + (tokenJson.expires_in || 3600) * 1000;
      return this.accessToken!;
    }

    throw new Error('Google Search Console API authentication is not configured.');
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
        let errMsg = `GSC sites.list failed (${res.status}): ${redactSecrets(text)}`;
        if (res.status === 403) {
          errMsg = `GSC Permission Denied (403): The authenticated service identity is valid, but has not been added to any Search Console property. Please add the Service Account email to your property under Settings -> Users and Permissions in Google Search Console.`;
        }
        return { success: false, authMethod, error: errMsg };
      }

      const json = (await res.json()) as any;
      const entries: GscSiteItem[] = (json.siteEntry || []).map((e: any) => ({
        siteUrl: e.siteUrl,
        permissionLevel: e.permissionLevel,
      }));

      return { success: true, authMethod, data: entries };
    } catch (err: any) {
      return { success: false, authMethod, error: redactSecrets(err.message) };
    }
  }

  public async findMatchingSiteUrl(preferredSite?: string): Promise<string | null> {
    const sitesRes = await this.listSites();
    if (!sitesRes.success || !sitesRes.data || sitesRes.data.length === 0) {
      return null;
    }

    const preferred = preferredSite || this.config.gscSiteUrl;
    // 1. Exact match
    const exact = sitesRes.data.find((s) => s.siteUrl === preferred);
    if (exact) return exact.siteUrl;

    // 2. Normalized trailing slash match
    const normPreferred = preferred.replace(/\/+$/, '');
    const normMatch = sitesRes.data.find((s) => s.siteUrl.replace(/\/+$/, '') === normPreferred);
    if (normMatch) return normMatch.siteUrl;

    // 3. Domain property match
    const domainMatch = sitesRes.data.find((s) => s.siteUrl === 'sc-domain:nyutaelite.com' || s.siteUrl.includes('nyutaelite.com'));
    if (domainMatch) return domainMatch.siteUrl;

    return null;
  }

  public async querySearchAnalytics(params: {
    startDate: string;
    endDate: string;
    dimensions?: Array<'date' | 'query' | 'page' | 'country' | 'device'>;
    rowLimit?: number;
    siteUrl?: string;
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
      const targetSite = params.siteUrl || this.config.gscSiteUrl;
      const siteUrlParam = encodeURIComponent(targetSite);
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
        let errMsg = `GSC searchAnalytics.query failed (${res.status}): ${redactSecrets(text)}`;
        if (res.status === 403) {
          errMsg = `GSC Permission Denied (403): The authenticated identity does not have permission for '${targetSite}'. Go to Google Search Console -> Settings -> Users and Permissions, and add the Service Account email as a 'Full' user.`;
        }
        return { success: false, authMethod, error: errMsg };
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

  public async inspectUrl(inspectionUrl: string, siteUrl?: string): Promise<GscClientResult<GscUrlInspectionResult>> {
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
      const targetSite = siteUrl || this.config.gscSiteUrl;
      const url = 'https://searchconsole.googleapis.com/v1/urlInspection/index:inspect';

      const body = {
        inspectionUrl,
        siteUrl: targetSite,
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
        let errMsg = `GSC urlInspection failed (${res.status}): ${redactSecrets(text)}`;
        if (res.status === 403) {
          errMsg = `GSC Permission Denied (403): Cannot inspect '${inspectionUrl}' on '${targetSite}'. Please check property permissions in Search Console.`;
        }
        return { success: false, authMethod, error: errMsg };
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

  public async listSitemaps(siteUrl?: string): Promise<GscClientResult<GscSitemapItem[]>> {
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
      const targetSite = siteUrl || this.config.gscSiteUrl;
      const encodedSite = encodeURIComponent(targetSite);
      const url = `https://www.googleapis.com/webmasters/v3/sites/${encodedSite}/sitemaps`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const text = await res.text();
        let errMsg = `GSC sitemaps.list failed (${res.status}): ${redactSecrets(text)}`;
        if (res.status === 403) {
          errMsg = `GSC Permission Denied (403): The authenticated identity does not have permission for '${targetSite}'.`;
        }
        return { success: false, authMethod, error: errMsg };
      }

      const json = (await res.json()) as any;
      const sitemaps: GscSitemapItem[] = (json.sitemap || []).map((s: any) => ({
        path: s.path,
        lastSubmitted: s.lastSubmitted,
        isPending: s.isPending,
        isSitemapsIndex: s.isSitemapsIndex,
        type: s.type,
        lastDownloaded: s.lastDownloaded,
        warnings: s.warnings,
        errors: s.errors,
        contents: s.contents,
      }));

      return { success: true, authMethod, data: sitemaps };
    } catch (err: any) {
      return { success: false, authMethod, error: redactSecrets(err.message) };
    }
  }

  public async submitSitemap(feedpath: string, siteUrl?: string): Promise<GscClientResult<boolean>> {
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
      const targetSite = siteUrl || this.config.gscSiteUrl;
      const encodedSite = encodeURIComponent(targetSite);
      const encodedFeed = encodeURIComponent(feedpath);
      const url = `https://www.googleapis.com/webmasters/v3/sites/${encodedSite}/sitemaps/${encodedFeed}`;

      const res = await fetch(url, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const text = await res.text();
        return { success: false, authMethod, error: `GSC sitemaps.submit failed (${res.status}): ${redactSecrets(text)}` };
      }

      return { success: true, authMethod, data: true };
    } catch (err: any) {
      return { success: false, authMethod, error: redactSecrets(err.message) };
    }
  }
}
