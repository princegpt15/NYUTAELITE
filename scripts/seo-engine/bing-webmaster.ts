// scripts/seo-engine/bing-webmaster.ts
import { CONFIG, redactSecrets } from './config';

export interface BingSiteDetail {
  Url: string;
  AuthenticationCode?: string;
  IsVerified?: boolean;
}

export interface BingFeedDetail {
  Url: string;
  Status: string;
  SubmittedDate?: string;
  LastCrawledDate?: string;
  UrlCount?: number;
}

export interface BingClientResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  missingConfigInstructions?: string;
}

export class BingWebmasterClient {
  private apiKey: string | null = null;
  private siteUrl: string;

  constructor() {
    this.apiKey = CONFIG.bingApiKey || null;
    this.siteUrl = CONFIG.bingSiteUrl || CONFIG.origin;
  }

  public isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.length > 5);
  }

  public getMissingConfigInstructions(): string {
    return [
      'Bing Webmaster Tools API is not configured.',
      '',
      'Setup Steps:',
      '  1. Log in to Bing Webmaster Tools (https://www.bing.com/webmasters).',
      '  2. Ensure https://nyutaelite.com is verified (can import from Google Search Console in 1 click).',
      '  3. Navigate to Settings (gear icon) -> API Access -> API Key.',
      '  4. Generate or copy your Bing Webmaster API Key.',
      '  5. Set BING_API_KEY=<your_api_key> in your .env or environment.',
    ].join('\n');
  }

  private async callBingApi<T>(endpoint: string, method = 'GET', body?: any): Promise<T> {
    if (!this.isConfigured()) {
      throw new Error('BING_API_KEY_MISSING');
    }

    const base = 'https://ssl.bing.com/webmaster/api.svc/json';
    const separator = endpoint.includes('?') ? '&' : '?';
    const fullUrl = `${base}/${endpoint}${separator}apikey=${encodeURIComponent(this.apiKey!)}`;

    const res = await fetch(fullUrl, {
      method,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        Accept: 'application/json',
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Bing Webmaster API error (${res.status}): ${redactSecrets(errText)}`);
    }

    const json = await res.json();
    return json?.d !== undefined ? json.d : json;
  }

  public async getSites(): Promise<BingClientResult<BingSiteDetail[]>> {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'Bing API key not configured',
        missingConfigInstructions: this.getMissingConfigInstructions(),
      };
    }
    try {
      const data = await this.callBingApi<BingSiteDetail[]>('GetUserSites');
      return { success: true, data: Array.isArray(data) ? data : [] };
    } catch (err: any) {
      return { success: false, error: redactSecrets(err.message) };
    }
  }

  public async getFeeds(): Promise<BingClientResult<BingFeedDetail[]>> {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'Bing API key not configured',
        missingConfigInstructions: this.getMissingConfigInstructions(),
      };
    }
    try {
      const endpoint = `GetFeeds?siteUrl=${encodeURIComponent(this.siteUrl)}`;
      const data = await this.callBingApi<BingFeedDetail[]>(endpoint);
      return { success: true, data: Array.isArray(data) ? data : [] };
    } catch (err: any) {
      return { success: false, error: redactSecrets(err.message) };
    }
  }

  public async submitFeed(feedUrl: string): Promise<BingClientResult<boolean>> {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'Bing API key not configured',
        missingConfigInstructions: this.getMissingConfigInstructions(),
      };
    }
    try {
      const endpoint = `SubmitFeed?siteUrl=${encodeURIComponent(this.siteUrl)}&feedUrl=${encodeURIComponent(feedUrl)}`;
      await this.callBingApi(endpoint);
      return { success: true, data: true };
    } catch (err: any) {
      return { success: false, error: redactSecrets(err.message) };
    }
  }

  public async submitUrlBatch(urls: string[]): Promise<BingClientResult<number>> {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'Bing API key not configured',
        missingConfigInstructions: this.getMissingConfigInstructions(),
      };
    }
    try {
      const endpoint = 'SubmitUrlbatch';
      const body = {
        siteUrl: this.siteUrl,
        urlList: urls,
      };
      await this.callBingApi(endpoint, 'POST', body);
      return { success: true, data: urls.length };
    } catch (err: any) {
      return { success: false, error: redactSecrets(err.message) };
    }
  }
}
