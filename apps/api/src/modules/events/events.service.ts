import { Injectable } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import type { Database } from '../../database/drizzle.factory.js';
import { DRIZZLE } from '../../database/tokens.js';
import { events } from '../../database/schema.js';

@Injectable()
export class EventsService {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async logEvent(input: {
    quizId: string;
    type: string;
    metadata?: Record<string, unknown>;
    sessionId?: string | null;
  }) {
    await this.db.insert(events).values({
      quizId: input.quizId,
      type: input.type,
      metadata: input.metadata ?? {},
      sessionId: input.sessionId ?? null,
    });
  }
}
