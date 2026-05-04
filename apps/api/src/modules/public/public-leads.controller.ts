import { Body, Controller, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { LeadsService } from '../leads/leads.service.js';
import { CreatePublicLeadDto } from './public.dto.js';

@Controller('public/leads')
export class PublicLeadsController {
  constructor(private readonly leads: LeadsService) {}

  @Throttle({ default: { ttl: 60000, limit: 60 } })
  @Post()
  create(@Body() dto: CreatePublicLeadDto) {
    return this.leads.createLead({
      quizId: dto.quizId,
      sessionId: dto.sessionId,
      data: dto.data,
    });
  }
}
