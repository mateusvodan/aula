import type { Database } from '../../database/drizzle.factory.js';
import { WebhooksService } from '../webhooks/webhooks.service.js';
export declare class LeadsService {
    private readonly db;
    private readonly webhooks;
    constructor(db: Database, webhooks: WebhooksService);
    assertPublishedQuiz(quizId: string): Promise<any>;
    createLead(input: {
        quizId: string;
        sessionId?: string | null;
        data?: Record<string, unknown>;
    }): Promise<any>;
    getLeadForQuiz(leadId: string, quizId: string): Promise<any>;
}
