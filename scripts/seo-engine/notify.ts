// scripts/seo-engine/notify.ts
import { CONFIG, redactSecrets } from './config';

export interface AlertNotification {
  level: 'CRITICAL' | 'HIGH' | 'INFO';
  title: string;
  summary: string;
  issues: string[];
  resolvedIssues?: string[];
  timestamp: string;
}

export async function sendNotification(alert: AlertNotification): Promise<{ sent: boolean; channel?: string; error?: string }> {
  // Only alert on CRITICAL, HIGH, or when high-severity issues are resolved
  if (alert.level !== 'CRITICAL' && alert.level !== 'HIGH' && (!alert.resolvedIssues || alert.resolvedIssues.length === 0)) {
    return { sent: false };
  }

  const payload = {
    text: `*[NYUTAELITE SEO Alert — ${alert.level}]* ${alert.title}\n\n${alert.summary}\n` +
      (alert.issues.length > 0 ? `\n*Active Issues:*\n${alert.issues.map((i) => `• ${i}`).join('\n')}` : '') +
      (alert.resolvedIssues && alert.resolvedIssues.length > 0 ? `\n\n*Resolved Issues:*\n${alert.resolvedIssues.map((i) => `✓ ${i}`).join('\n')}` : ''),
    level: alert.level,
    timestamp: alert.timestamp,
    site: CONFIG.origin,
  };

  if (CONFIG.alertWebhookUrl) {
    try {
      const res = await fetch(CONFIG.alertWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        return { sent: true, channel: 'WEBHOOK' };
      }
      return { sent: false, error: `Webhook returned status ${res.status}` };
    } catch (err: any) {
      return { sent: false, error: redactSecrets(err.message) };
    }
  }

  // Fallback: logged to console/log file
  console.log(`\n[SEO Notification ${alert.level}]: ${alert.title}`);
  return { sent: true, channel: 'CONSOLE' };
}
