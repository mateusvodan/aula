export declare class CreateQuizDto {
    name: string;
    slug?: string;
}
export declare class UpdateQuizDto {
    name?: string;
    slug?: string;
    status?: 'draft' | 'published';
    theme?: Record<string, unknown>;
    facebookPixelId?: string | null;
    googleAnalyticsId?: string | null;
    googleTagManagerId?: string | null;
    tiktokPixelId?: string | null;
    webhookUrl?: string | null;
}
export declare class CreateStepDto {
    type: 'question' | 'input' | 'content' | 'result';
    metadata?: Record<string, unknown>;
}
export declare class UpdateStepDto {
    type?: 'question' | 'input' | 'content' | 'result';
    metadata?: Record<string, unknown>;
    orderIndex?: number;
}
export declare class ReorderStepsDto {
    orderedStepIds: string[];
}
export declare class CreateOptionDto {
    label: string;
    value: string;
    nextStepId?: string | null;
}
export declare class UpdateOptionDto {
    label?: string;
    value?: string;
    nextStepId?: string | null;
    orderIndex?: number;
}
export declare class CreateResultDto {
    name: string;
    conditions?: Record<string, unknown>;
    redirectUrl?: string | null;
}
export declare class UpdateResultDto {
    name?: string;
    conditions?: Record<string, unknown>;
    redirectUrl?: string | null;
    orderIndex?: number;
}
