import { Controller, Get, Param, Post, Body } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { QuizzesService } from '../quizzes/quizzes.service.js';
import { CompleteQuizDto } from './public.dto.js';
import { LeadsService } from '../leads/leads.service.js';
import { EventsService } from '../events/events.service.js';
import { WebhooksService } from '../webhooks/webhooks.service.js';
import { Inject } from '@nestjs/common';
import { DRIZZLE } from '../../database/tokens.js';
import type { Database } from '../../database/drizzle.factory.js';
import { quizzes } from '../../database/schema.js';
import { eq } from 'drizzle-orm';

@Controller('public/quizzes')
export class PublicQuizzesController {
  constructor(
    private readonly quizzesService: QuizzesService,
    private readonly leads: LeadsService,
    private readonly events: EventsService,
    private readonly webhooks: WebhooksService,
    @Inject(DRIZZLE) private readonly db: Database,
  ) {}

  @Throttle({ default: { ttl: 60000, limit: 300 } })
  @Get(':slug')
  getBySlug(@Param('slug') slug: string) {
    return this.quizzesService.getPublishedPayload(slug);
  }

  @Throttle({ default: { ttl: 60000, limit: 120 } })
  @Post(':slug/complete')
  async complete(@Param('slug') slug: string, @Body() dto: CompleteQuizDto) {
    const payload = await this.quizzesService.getPublishedPayload(slug);
    await this.leads.getLeadForQuiz(dto.leadId, payload.quiz.id);

    const entries = Object.entries(dto.answers).map(([stepId, answer]) => ({
      stepId,
      answer,
    }));
    await this.quizzesService.saveResponses(dto.leadId, entries);

    const picked = this.quizzesService.evaluateFinalResult(
      payload,
      dto.answers,
      dto.score ?? 0,
    );

    await this.events.logEvent({
      quizId: payload.quiz.id,
      type: 'quiz_completed',
      sessionId: dto.sessionId,
      metadata: {
        leadId: dto.leadId,
        resultId: picked?.resultId,
      },
    });

    const [qrow] = await this.db
      .select({ webhookUrl: quizzes.webhookUrl })
      .from(quizzes)
      .where(eq(quizzes.id, payload.quiz.id))
      .limit(1);

    await this.webhooks.dispatch(qrow?.webhookUrl, 'quiz.completed', {
      quizId: payload.quiz.id,
      slug,
      leadId: dto.leadId,
      result: picked,
      answers: dto.answers,
    });

    return {
      result: picked,
    };
  }
}
