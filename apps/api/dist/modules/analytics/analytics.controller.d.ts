import { AnalyticsService } from './analytics.service.js';
export declare class AnalyticsController {
    private readonly analytics;
    constructor(analytics: AnalyticsService);
    summary(user: {
        userId: string;
    }, quizId: string): Promise<{
        leadsTotal: any;
        quizStarts: any;
        quizCompleted: any;
        completionRatePercent: number;
    }>;
    funnel(user: {
        userId: string;
    }, quizId: string): Promise<{
        stepId: string;
        views: number;
    }[]>;
    answers(user: {
        userId: string;
    }, quizId: string): Promise<{
        stepId: string;
        value: string;
        hits: number;
    }[]>;
    leads(user: {
        userId: string;
    }, quizId: string): Promise<any>;
}
