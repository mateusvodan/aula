export declare class CreatePublicLeadDto {
    quizId: string;
    sessionId?: string;
    data?: Record<string, unknown>;
}
export declare class CreatePublicEventDto {
    quizId: string;
    type: string;
    metadata?: Record<string, unknown>;
    sessionId?: string;
}
export declare class ResponseEntryDto {
    stepId: string;
    answer: unknown;
}
export declare class SavePublicResponsesDto {
    leadId: string;
    entries: ResponseEntryDto[];
}
export declare class CompleteQuizDto {
    leadId: string;
    sessionId?: string;
    answers: Record<string, unknown>;
    score?: number;
}
