import type { Database } from '../../database/drizzle.factory.js';
export declare class AnalyticsService {
    private readonly db;
    constructor(db: Database);
    private ensureOwner;
    summary(quizId: string, userId: string): Promise<{
        leadsTotal: any;
        quizStarts: any;
        quizCompleted: any;
        completionRatePercent: number;
    }>;
    stepDropoff(quizId: string, userId: string): Promise<{
        stepId: string;
        views: number;
    }[]>;
    answerStats(quizId: string, userId: string): Promise<{
        stepId: string;
        value: string;
        hits: number;
    }[]>;
    recentLeads(quizId: string, userId: string, limit?: number): Promise<any>;
}
