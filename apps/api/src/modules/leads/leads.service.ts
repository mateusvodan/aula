import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import type { Database } from '../../database/drizzle.factory.js';
import { DRIZZLE } from '../../database/tokens.js';
import { leads, quizzes } from '../../database/schema.js';
import { WebhooksService } from '../webhooks/webhooks.service.js';

@Injectable()
export class LeadsService {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly webhooks: WebhooksService,
  ) {}

  async assertPublishedQuiz(quizId: string) {
    const [q] = await this.db
      .select()
      .from(quizzes)
      .where(and(eq(quizzes.id, quizId), eq(quizzes.status, 'published')))
      .limit(1);
    if (!q) throw new NotFoundException('Quiz não disponível');
    return q;
  }

  async createLead(input: {
    quizId: string;
    sessionId?: string | null;
    data?: Record<string, unknown>;
  }) {
    const quiz = await this.assertPublishedQuiz(input.quizId);
    const [lead] = await this.db
      .insert(leads)
      .values({
        quizId: input.quizId,
        sessionId: input.sessionId ?? null,
        data: input.data ?? {},
      })
      .returning();
    await this.webhooks.dispatch(quiz.webhookUrl, 'lead.created', {
      quizId: quiz.id,
      slug: quiz.slug,
      lead,
    });
    return lead;
  }

  async getLeadForQuiz(leadId: string, quizId: string) {
    const [row] = await this.db
      .select()
      .from(leads)
      .where(and(eq(leads.id, leadId), eq(leads.quizId, quizId)))
      .limit(1);
    if (!row) throw new NotFoundException('Lead não encontrado');
    return row;
  }
}
