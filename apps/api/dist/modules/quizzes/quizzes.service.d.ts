import type { Database } from '../../database/drizzle.factory.js';
import { QuizEngineService } from './quiz-engine.service.js';
export declare class QuizzesService {
    private readonly db;
    private readonly engine;
    constructor(db: Database, engine: QuizEngineService);
    private ensureQuiz;
    private ensureStep;
    createQuiz(userId: string, name: string, slug?: string): Promise<any>;
    listQuizzes(userId: string): Promise<any>;
    getQuizForOwner(quizId: string, userId: string): Promise<any>;
    updateQuiz(quizId: string, userId: string, patch: Partial<{
        name: string;
        slug: string;
        status: 'draft' | 'published';
        theme: Record<string, unknown>;
        facebookPixelId: string | null;
        googleAnalyticsId: string | null;
        googleTagManagerId: string | null;
        tiktokPixelId: string | null;
        webhookUrl: string | null;
    }>): Promise<any>;
    deleteQuiz(quizId: string, userId: string): Promise<{
        ok: boolean;
    }>;
    getEditorGraph(quizId: string, userId: string): Promise<{
        steps: any;
        options: any;
        results: any;
    }>;
    createStep(quizId: string, userId: string, body: {
        type: 'question' | 'input' | 'content' | 'result';
        metadata?: Record<string, unknown>;
    }): Promise<any>;
    updateStep(quizId: string, stepId: string, userId: string, patch: Partial<{
        type: 'question' | 'input' | 'content' | 'result';
        metadata: Record<string, unknown>;
        orderIndex: number;
    }>): Promise<any>;
    deleteStep(quizId: string, stepId: string, userId: string): Promise<{
        ok: boolean;
    }>;
    reorderSteps(quizId: string, userId: string, orderedStepIds: string[]): Promise<{
        steps: any;
        options: any;
        results: any;
    }>;
    createOption(quizId: string, stepId: string, userId: string, body: {
        label: string;
        value: string;
        nextStepId?: string | null;
    }): Promise<any>;
    updateOption(quizId: string, optionId: string, userId: string, patch: Partial<{
        label: string;
        value: string;
        nextStepId: string | null;
        orderIndex: number;
    }>): Promise<any>;
    deleteOption(quizId: string, optionId: string, userId: string): Promise<{
        ok: boolean;
    }>;
    createResult(quizId: string, userId: string, body: {
        name: string;
        conditions?: Record<string, unknown>;
        redirectUrl?: string | null;
    }): Promise<any>;
    updateResult(quizId: string, resultId: string, userId: string, patch: Partial<{
        name: string;
        conditions: Record<string, unknown>;
        redirectUrl: string | null;
        orderIndex: number;
    }>): Promise<any>;
    deleteResult(quizId: string, resultId: string, userId: string): Promise<{
        ok: boolean;
    }>;
    getPublishedPayload(slug: string): Promise<{
        quiz: any;
        steps: any;
        optionsByStep: Record<string, any>;
        results: any;
    }>;
    evaluateNextStep(payload: Awaited<ReturnType<QuizzesService['getPublishedPayload']>>, currentStepId: string, answerValue: string): string | null;
    evaluateFinalResult(payload: Awaited<ReturnType<QuizzesService['getPublishedPayload']>>, answersByStepId: Record<string, unknown>, score: number): {
        resultId: string;
        redirectUrl: string | null;
    } | null;
    saveResponses(leadId: string, entries: Array<{
        stepId: string;
        answer: unknown;
    }>): Promise<void>;
}
