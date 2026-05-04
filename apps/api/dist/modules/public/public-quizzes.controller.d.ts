import { QuizzesService } from '../quizzes/quizzes.service.js';
import { CompleteQuizDto } from './public.dto.js';
import { LeadsService } from '../leads/leads.service.js';
import { EventsService } from '../events/events.service.js';
import { WebhooksService } from '../webhooks/webhooks.service.js';
import type { Database } from '../../database/drizzle.factory.js';
export declare class PublicQuizzesController {
    private readonly quizzesService;
    private readonly leads;
    private readonly events;
    private readonly webhooks;
    private readonly db;
    constructor(quizzesService: QuizzesService, leads: LeadsService, events: EventsService, webhooks: WebhooksService, db: Database);
    getBySlug(slug: string): Promise<{
        quiz: any;
        steps: any;
        optionsByStep: Record<string, any>;
        results: any;
    }>;
    complete(slug: string, dto: CompleteQuizDto): Promise<{
        result: {
            resultId: string;
            redirectUrl: string | null;
        } | null;
    }>;
}
