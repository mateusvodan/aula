import { Module } from '@nestjs/common';
import { LeadsService } from './leads.service.js';
import { WebhooksModule } from '../webhooks/webhooks.module.js';

@Module({
  imports: [WebhooksModule],
  providers: [LeadsService],
  exports: [LeadsService],
})
export class LeadsModule {}
