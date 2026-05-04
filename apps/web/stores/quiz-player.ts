import { create } from "zustand";

export type QuizPlayerAnswers = Record<string, unknown>;

type State = {
  answers: QuizPlayerAnswers;
  sessionId: string;
  leadId: string | null;
  setAnswer: (stepId: string, value: unknown) => void;
  setLeadId: (id: string | null) => void;
  resetSession: () => void;
};

export const useQuizPlayerStore = create<State>((set) => ({
  answers: {},
  sessionId:
    typeof crypto !== "undefined" ? crypto.randomUUID() : `sess_${Date.now()}`,
  leadId: null,
  setAnswer: (stepId, value) =>
    set((s) => ({
      answers: { ...s.answers, [stepId]: value },
    })),
  setLeadId: (leadId) => set({ leadId }),
  resetSession: () =>
    set({
      answers: {},
      leadId: null,
      sessionId:
        typeof crypto !== "undefined"
          ? crypto.randomUUID()
          : `sess_${Date.now()}`,
    }),
}));
