import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { AnalyticsService } from './analytics.service.js';

@Controller('analytics')
@UseGuards(AuthGuard('jwt'))
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  @Get('quiz/:quizId/summary')
  summary(
    @CurrentUser() user: { userId: string },
    @Param('quizId') quizId: string,
  ) {
    return this.analytics.summary(quizId, user.userId);
  }

  @Get('quiz/:quizId/funnel')
  funnel(
    @CurrentUser() user: { userId: string },
    @Param('quizId') quizId: string,
  ) {
    return this.analytics.stepDropoff(quizId, user.userId);
  }

  @Get('quiz/:quizId/answers')
  answers(
    @CurrentUser() user: { userId: string },
    @Param('quizId') quizId: string,
  ) {
    return this.analytics.answerStats(quizId, user.userId);
  }

  @Get('quiz/:quizId/leads')
  leads(
    @CurrentUser() user: { userId: string },
    @Param('quizId') quizId: string,
  ) {
    return this.analytics.recentLeads(quizId, user.userId);
  }
}
