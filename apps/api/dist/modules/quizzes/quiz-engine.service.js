"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuizEngineService = void 0;
const common_1 = require("@nestjs/common");
let QuizEngineService = class QuizEngineService {
    resolveNextStepId(optionsList, selectedValue, orderedStepIds, currentStepId) {
        const opt = optionsList.find((o) => o.value === selectedValue);
        if (opt?.nextStepId)
            return opt.nextStepId;
        const idx = orderedStepIds.indexOf(currentStepId);
        if (idx >= 0 && idx < orderedStepIds.length - 1) {
            return orderedStepIds[idx + 1] ?? null;
        }
        return null;
    }
    pickResult(resultsSorted, answersByStepId, score) {
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
    matchesConditions(conditions, answersByStepId, score) {
        if (!conditions || Object.keys(conditions).length === 0)
            return true;
        const scoreAtLeast = conditions.scoreAtLeast;
        if (typeof scoreAtLeast === 'number')
            return score >= scoreAtLeast;
        const answers = conditions.answers;
        if (answers) {
            for (const [stepId, expected] of Object.entries(answers)) {
                if (String(answersByStepId[stepId]) !== String(expected))
                    return false;
            }
            return true;
        }
        const all = conditions.all;
        if (all?.length) {
            return all.every((rule) => {
                const actual = answersByStepId[rule.stepId];
                if (rule.equals !== undefined)
                    return String(actual) === String(rule.equals);
                if (rule.includes !== undefined)
                    return String(actual).includes(String(rule.includes));
                return false;
            });
        }
        return true;
    }
};
exports.QuizEngineService = QuizEngineService;
exports.QuizEngineService = QuizEngineService = __decorate([
    (0, common_1.Injectable)()
], QuizEngineService);
//# sourceMappingURL=quiz-engine.service.js.map