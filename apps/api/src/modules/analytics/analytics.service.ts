import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { and, count, desc, eq } from 'drizzle-orm';
import type { Database } from '../../database/drizzle.factory.js';
import { DRIZZLE } from '../../database/tokens.js';
import { events, leads, quizzes } from '../../database/schema.js';

@Injectable()
export class AnalyticsService {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  private async ensureOwner(quizId: string, userId: string) {
    const [q] = await this.db
      .select()
      .from(quizzes)
      .where(and(eq(quizzes.id, quizId), eq(quizzes.userId, userId)))
      .limit(1);
    if (!q) throw new NotFoundException('Quiz não encontrado');
    return q;
  }

  async summary(quizId: string, userId: string) {
    await this.ensureOwner(quizId, userId);

    const [{ leadsTotal }] = await this.db
      .select({ leadsTotal: count() })
      .from(leads)
      .where(eq(leads.quizId, quizId));

    const [{ starts }] = await this.db
      .select({ starts: count() })
      .from(events)
      .where(and(eq(events.quizId, quizId), eq(events.type, 'quiz_start')));

    const [{ completed }] = await this.db
      .select({ completed: count() })
      .from(events)
      .where(and(eq(events.quizId, quizId), eq(events.type, 'quiz_completed')));

    const rate =
      starts > 0 ? Math.round((completed / starts) * 10000) / 100 : 0;

    return {
      leadsTotal,
      quizStarts: starts,
      quizCompleted: completed,
      completionRatePercent: rate,
    };
  }

  async stepDropoff(quizId: string, userId: string) {
    await this.ensureOwner(quizId, userId);
    const rows = await this.db
      .select()
      .from(events)
      .where(and(eq(events.quizId, quizId), eq(events.type, 'step_view')));
    const map = new Map<string, number>();
    for (const e of rows) {
      const sid = (e.metadata as { stepId?: string }).stepId;
      if (!sid) continue;
      map.set(sid, (map.get(sid) ?? 0) + 1);
    }
    return [...map.entries()].map(([stepId, views]) => ({ stepId, views }));
  }

  async answerStats(quizId: string, userId: string) {
    await this.ensureOwner(quizId, userId);
    const rows = await this.db
      .select()
      .from(events)
      .where(
        and(eq(events.quizId, quizId), eq(events.type, 'answer_selected')),
      );
    const map = new Map<string, number>();
    for (const e of rows) {
      const meta = e.metadata as { stepId?: string; value?: string };
      if (!meta.stepId || meta.value === undefined) continue;
      const key = `${meta.stepId}::${meta.value}`;
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return [...map.entries()].map(([key, hits]) => {
      const [stepId, value] = key.split('::');
      return { stepId, value, hits };
    });
  }

  async recentLeads(quizId: string, userId: string, limit = 50) {
    await this.ensureOwner(quizId, userId);
    return this.db
      .select()
      .from(leads)
      .where(eq(leads.quizId, quizId))
      .orderBy(desc(leads.createdAt))
      .limit(limit);
  }
}
