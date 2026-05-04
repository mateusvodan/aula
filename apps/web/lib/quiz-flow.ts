/** Alinha com QuizEngineService.resolveNextStepId no backend */
export function resolveNextStepId(
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
