export declare class QuizEngineService {
    resolveNextStepId(optionsList: {
        value: string;
        nextStepId: string | null;
    }[], selectedValue: string, orderedStepIds: string[], currentStepId: string): string | null;
    pickResult(resultsSorted: Array<{
        id: string;
        conditions: Record<string, unknown>;
        redirectUrl: string | null;
    }>, answersByStepId: Record<string, unknown>, score: number): {
        resultId: string;
        redirectUrl: string | null;
    } | null;
    private matchesConditions;
}
