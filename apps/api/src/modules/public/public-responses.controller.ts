import { Body, Controller, NotFoundException, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { QuizzesService } from '../quizzes/quizzes.service.js';
import { SavePublicResponsesDto } from './public.dto.js';
import { Inject } from '@nestjs/common';
import { DRIZZLE } from '../../database/tokens.js';
import type { Database } from '../../database/drizzle.factory.js';
import { leads, quizzes } from '../../database/schema.js';
import { and, eq } from 'drizzle-orm';

@Controller('public/responses')
export class PublicResponsesController {
  constructor(
    private readonly quizzesService: QuizzesService,
    @Inject(DRIZZLE) private readonly db: Database,
  ) {}

  @Throttle({ default: { ttl: 60000, limit: 300 } })
  @Post()
  async save(@Body() dto: SavePublicResponsesDto) {
    const [lead] = await this.db
      .select()
      .from(leads)
      .where(eq(leads.id, dto.leadId))
      .limit(1);
    if (!lead) throw new NotFoundException('Lead não encontrado');
    const [q] = await this.db
      .select()
      .from(quizzes)
      .where(
        and(eq(quizzes.id, lead.quizId), eq(quizzes.status, 'published')),
      )
      .limit(1);
    if (!q) throw new NotFoundException('Quiz não publicado');
    await this.quizzesService.saveResponses(dto.leadId, dto.entries);
    return { ok: true };
  }
}
