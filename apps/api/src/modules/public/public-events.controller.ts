import { Body, Controller, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { EventsService } from '../events/events.service.js';
import { LeadsService } from '../leads/leads.service.js';
import { CreatePublicEventDto } from './public.dto.js';

@Controller('public/events')
export class PublicEventsController {
  constructor(
    private readonly events: EventsService,
    private readonly leads: LeadsService,
  ) {}

  @Throttle({ default: { ttl: 60000, limit: 600 } })
  @Post()
  async create(@Body() dto: CreatePublicEventDto) {
    await this.leads.assertPublishedQuiz(dto.quizId);
    await this.events.logEvent({
      quizId: dto.quizId,
      type: dto.type,
      metadata: dto.metadata ?? {},
      sessionId: dto.sessionId,
    });
    return { ok: true };
  }
}
