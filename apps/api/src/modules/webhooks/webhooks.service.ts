import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'node:crypto';

@Injectable()
export class WebhooksService {
  private readonly log = new Logger(WebhooksService.name);

  constructor(private readonly config: ConfigService) {}

  async dispatch(
    url: string | null | undefined,
    event: string,
    payload: Record<string, unknown>,
  ): Promise<void> {
    if (!url?.trim()) return;
    const secret = this.config.get<string>('WEBHOOK_SIGNING_SECRET') ?? '';
    const body = JSON.stringify({ event, payload, ts: Date.now() });
    const signature = secret
      ? crypto.createHmac('sha256', secret).update(body).digest('hex')
      : '';
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(signature ? { 'X-Webhook-Signature': signature } : {}),
        },
        body,
      });
      if (!res.ok) this.log.warn(`Webhook ${event} → HTTP ${res.status}`);
    } catch (e) {
      this.log.warn(`Webhook ${event} erro: ${String(e)}`);
    }
  }
}
