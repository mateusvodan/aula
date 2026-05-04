import type { Database } from '../../database/drizzle.factory.js';
export declare class EventsService {
    private readonly db;
    constructor(db: Database);
    logEvent(input: {
        quizId: string;
        type: string;
        metadata?: Record<string, unknown>;
        sessionId?: string | null;
    }): Promise<void>;
}
