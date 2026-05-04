import { Module } from '@nestjs/common';
import { PublicQuizzesController } from './public-quizzes.controller.js';
import { PublicLeadsController } from './public-leads.controller.js';
import { PublicEventsController } from './public-events.controller.js';
import { PublicResponsesController } from './public-responses.controller.js';
import { QuizzesModule } from '../quizzes/quizzes.module.js';
import { LeadsModule } from '../leads/leads.module.js';
import { EventsModule } from '../events/events.module.js';
import { WebhooksModule } from '../webhooks/webhooks.module.js';

@Module({
  imports: [QuizzesModule, LeadsModule, EventsModule, WebhooksModule],
  controllers: [
    PublicQuizzesController,
    PublicLeadsController,
    PublicEventsController,
    PublicResponsesController,
  ],
})
export class PublicModule {}
