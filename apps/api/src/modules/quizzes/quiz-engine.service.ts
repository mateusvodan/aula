import { Injectable } from '@nestjs/common';

@Injectable()
export class QuizEngineService {
  resolveNextStepId(
    optionsList: { value: string; nextStepId: string | null }[],
    selectedValue: string,
    orderedStepIds: string[],
    currentStepId: string,
  ): string | null {
    const opt = optionsList.find((o) => o.value === selectedValue);
    if (opt?.nextStepId) return opt.nextStepId;
    const idx = orderedStepIds.indexOf(currentStepId);
    if (idx >= 0 && idx < orderedStepIds.length - 1) {
      return orderedStepIds[idx + 1] ?? null;
    }
    return null;
  }

  pickResult(
    resultsSorted: Array<{
      id: string;
      conditions: Record<string, unknown>;
      redirectUrl: string | null;
    }>,
    answersByStepId: Record<string, unknown>,
    score: number,
  ): { resultId: string; redirectUrl: string | null } | null {
    for (const r of resultsSorted) {
      if (this.matchesConditions(r.conditions, answersByStepId, score)) {
        return { resultId: r.id, redirectUrl: r.redirectUrl ?? null };
      }
    }
    const fallback = resultsSorted[0];
    return fallback
      ? {
          resultId: fallback.id,
          redirectUrl: fallback.redirectUrl ?? null,
        }
      : null;
  }

  private matchesConditions(
    conditions: Record<string, unknown>,
    answersByStepId: Record<string, unknown>,
    score: number,
  ): boolean {
    if (!conditions || Object.keys(conditions).length === 0) return true;
    const scoreAtLeast = conditions.scoreAtLeast;
    if (typeof scoreAtLeast === 'number') return score >= scoreAtLeast;
    const answers = conditions.answers as Record<string, string> | undefined;
    if (answers) {
      for (const [stepId, expected] of Object.entries(answers)) {
        if (String(answersByStepId[stepId]) !== String(expected)) return false;
      }
      return true;
    }
    const all = conditions.all as
      | Array<{ stepId: string; equals?: string; includes?: string }>
      | undefined;
    if (all?.length) {
      return all.every((rule) => {
        const actual = answersByStepId[rule.stepId];
        if (rule.equals !== undefined) return String(actual) === String(rule.equals);
        if (rule.includes !== undefined)
          return String(actual).includes(String(rule.includes));
        return false;
      });
    }
    return true;
  }
}
