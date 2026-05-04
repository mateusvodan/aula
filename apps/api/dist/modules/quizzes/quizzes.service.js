"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuizzesService = void 0;
const common_1 = require("@nestjs/common");
const drizzle_orm_1 = require("drizzle-orm");
const tokens_js_1 = require("../../database/tokens.js");
const schema_js_1 = require("../../database/schema.js");
const quiz_engine_service_js_1 = require("./quiz-engine.service.js");
function slugify(input) {
    return input
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 80);
}
let QuizzesService = class QuizzesService {
    db;
    engine;
    constructor(db, engine) {
        this.db = db;
        this.engine = engine;
    }
    async ensureQuiz(quizId, userId) {
        const [row] = await this.db
            .select()
            .from(schema_js_1.quizzes)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_js_1.quizzes.id, quizId), (0, drizzle_orm_1.eq)(schema_js_1.quizzes.userId, userId)))
            .limit(1);
        if (!row)
            throw new common_1.NotFoundException('Quiz não encontrado');
        return row;
    }
    async ensureStep(quizId, stepId, userId) {
        await this.ensureQuiz(quizId, userId);
        const [s] = await this.db
            .select()
            .from(schema_js_1.steps)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_js_1.steps.id, stepId), (0, drizzle_orm_1.eq)(schema_js_1.steps.quizId, quizId)))
            .limit(1);
        if (!s)
            throw new common_1.NotFoundException('Etapa não encontrada');
        return s;
    }
    async createQuiz(userId, name, slug) {
        let base = slug?.trim() ? slugify(slug) : slugify(name);
        if (!base)
            base = `quiz-${randomSuffix()}`;
        for (let i = 0; i < 50; i++) {
            const candidate = i === 0 ? base : `${base}-${i}`;
            const taken = await this.db
                .select({ id: schema_js_1.quizzes.id })
                .from(schema_js_1.quizzes)
                .where((0, drizzle_orm_1.eq)(schema_js_1.quizzes.slug, candidate))
                .limit(1);
            if (taken.length)
                continue;
            const [row] = await this.db
                .insert(schema_js_1.quizzes)
                .values({
                userId,
                name,
                slug: candidate,
                status: 'draft',
            })
                .returning();
            return row;
        }
        throw new common_1.ConflictException('Não foi possível gerar slug único');
    }
    async listQuizzes(userId) {
        return this.db
            .select()
            .from(schema_js_1.quizzes)
            .where((0, drizzle_orm_1.eq)(schema_js_1.quizzes.userId, userId))
            .orderBy((0, drizzle_orm_1.asc)(schema_js_1.quizzes.createdAt));
    }
    async getQuizForOwner(quizId, userId) {
        return this.ensureQuiz(quizId, userId);
    }
    async updateQuiz(quizId, userId, patch) {
        await this.ensureQuiz(quizId, userId);
        const update = { ...patch };
        if (patch.slug)
            update.slug = slugify(patch.slug);
        const [row] = await this.db
            .update(schema_js_1.quizzes)
            .set(update)
            .where((0, drizzle_orm_1.eq)(schema_js_1.quizzes.id, quizId))
            .returning();
        return row;
    }
    async deleteQuiz(quizId, userId) {
        await this.ensureQuiz(quizId, userId);
        await this.db.delete(schema_js_1.quizzes).where((0, drizzle_orm_1.eq)(schema_js_1.quizzes.id, quizId));
        return { ok: true };
    }
    async getEditorGraph(quizId, userId) {
        await this.ensureQuiz(quizId, userId);
        const stepsRows = await this.db
            .select()
            .from(schema_js_1.steps)
            .where((0, drizzle_orm_1.eq)(schema_js_1.steps.quizId, quizId))
            .orderBy((0, drizzle_orm_1.asc)(schema_js_1.steps.orderIndex));
        const stepIds = stepsRows.map((s) => s.id);
        const optRows = stepIds.length > 0
            ? await this.db
                .select()
                .from(schema_js_1.options)
                .where((0, drizzle_orm_1.inArray)(schema_js_1.options.stepId, stepIds))
                .orderBy((0, drizzle_orm_1.asc)(schema_js_1.options.orderIndex))
            : [];
        const resultsRows = await this.db
            .select()
            .from(schema_js_1.results)
            .where((0, drizzle_orm_1.eq)(schema_js_1.results.quizId, quizId))
            .orderBy((0, drizzle_orm_1.asc)(schema_js_1.results.orderIndex));
        return {
            steps: stepsRows,
            options: optRows,
            results: resultsRows,
        };
    }
    async createStep(quizId, userId, body) {
        await this.ensureQuiz(quizId, userId);
        const countRows = await this.db
            .select({ orderIndex: schema_js_1.steps.orderIndex })
            .from(schema_js_1.steps)
            .where((0, drizzle_orm_1.eq)(schema_js_1.steps.quizId, quizId));
        const orderIndex = countRows.length === 0
            ? 0
            : Math.max(...countRows.map((r) => r.orderIndex)) + 1;
        const [row] = await this.db
            .insert(schema_js_1.steps)
            .values({
            quizId,
            type: body.type,
            orderIndex,
            metadata: body.metadata ?? {},
        })
            .returning();
        return row;
    }
    async updateStep(quizId, stepId, userId, patch) {
        await this.ensureStep(quizId, stepId, userId);
        const [row] = await this.db
            .update(schema_js_1.steps)
            .set(patch)
            .where((0, drizzle_orm_1.eq)(schema_js_1.steps.id, stepId))
            .returning();
        return row;
    }
    async deleteStep(quizId, stepId, userId) {
        await this.ensureStep(quizId, stepId, userId);
        await this.db.delete(schema_js_1.steps).where((0, drizzle_orm_1.eq)(schema_js_1.steps.id, stepId));
        return { ok: true };
    }
    async reorderSteps(quizId, userId, orderedStepIds) {
        await this.ensureQuiz(quizId, userId);
        const existing = await this.db
            .select({ id: schema_js_1.steps.id })
            .from(schema_js_1.steps)
            .where((0, drizzle_orm_1.eq)(schema_js_1.steps.quizId, quizId));
        const ids = new Set(existing.map((e) => e.id));
        if (orderedStepIds.length !== existing.length ||
            new Set(orderedStepIds).size !== orderedStepIds.length ||
            orderedStepIds.some((id) => !ids.has(id)))
            throw new common_1.BadRequestException('Lista de etapas inválida');
        for (let i = 0; i < orderedStepIds.length; i++) {
            await this.db
                .update(schema_js_1.steps)
                .set({ orderIndex: i })
                .where((0, drizzle_orm_1.eq)(schema_js_1.steps.id, orderedStepIds[i]));
        }
        return this.getEditorGraph(quizId, userId);
    }
    async createOption(quizId, stepId, userId, body) {
        await this.ensureStep(quizId, stepId, userId);
        const opts = await this.db
            .select({ orderIndex: schema_js_1.options.orderIndex })
            .from(schema_js_1.options)
            .where((0, drizzle_orm_1.eq)(schema_js_1.options.stepId, stepId));
        const orderIndex = opts.length === 0 ? 0 : Math.max(...opts.map((o) => o.orderIndex)) + 1;
        const [row] = await this.db
            .insert(schema_js_1.options)
            .values({
            stepId,
            label: body.label,
            value: body.value,
            nextStepId: body.nextStepId ?? null,
            orderIndex,
        })
            .returning();
        return row;
    }
    async updateOption(quizId, optionId, userId, patch) {
        const [opt] = await this.db
            .select({ stepId: schema_js_1.options.stepId })
            .from(schema_js_1.options)
            .where((0, drizzle_orm_1.eq)(schema_js_1.options.id, optionId))
            .limit(1);
        if (!opt)
            throw new common_1.NotFoundException('Opção não encontrada');
        await this.ensureStep(quizId, opt.stepId, userId);
        const [row] = await this.db
            .update(schema_js_1.options)
            .set(patch)
            .where((0, drizzle_orm_1.eq)(schema_js_1.options.id, optionId))
            .returning();
        return row;
    }
    async deleteOption(quizId, optionId, userId) {
        const [opt] = await this.db
            .select({ stepId: schema_js_1.options.stepId })
            .from(schema_js_1.options)
            .where((0, drizzle_orm_1.eq)(schema_js_1.options.id, optionId))
            .limit(1);
        if (!opt)
            throw new common_1.NotFoundException('Opção não encontrada');
        await this.ensureStep(quizId, opt.stepId, userId);
        await this.db.delete(schema_js_1.options).where((0, drizzle_orm_1.eq)(schema_js_1.options.id, optionId));
        return { ok: true };
    }
    async createResult(quizId, userId, body) {
        await this.ensureQuiz(quizId, userId);
        const rs = await this.db
            .select({ orderIndex: schema_js_1.results.orderIndex })
            .from(schema_js_1.results)
            .where((0, drizzle_orm_1.eq)(schema_js_1.results.quizId, quizId));
        const orderIndex = rs.length === 0 ? 0 : Math.max(...rs.map((r) => r.orderIndex)) + 1;
        const [row] = await this.db
            .insert(schema_js_1.results)
            .values({
            quizId,
            name: body.name,
            conditions: body.conditions ?? {},
            redirectUrl: body.redirectUrl ?? null,
            orderIndex,
        })
            .returning();
        return row;
    }
    async updateResult(quizId, resultId, userId, patch) {
        await this.ensureQuiz(quizId, userId);
        const [r] = await this.db
            .select()
            .from(schema_js_1.results)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_js_1.results.id, resultId), (0, drizzle_orm_1.eq)(schema_js_1.results.quizId, quizId)))
            .limit(1);
        if (!r)
            throw new common_1.NotFoundException('Resultado não encontrado');
        const [row] = await this.db
            .update(schema_js_1.results)
            .set(patch)
            .where((0, drizzle_orm_1.eq)(schema_js_1.results.id, resultId))
            .returning();
        return row;
    }
    async deleteResult(quizId, resultId, userId) {
        await this.ensureQuiz(quizId, userId);
        const deleted = await this.db
            .delete(schema_js_1.results)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_js_1.results.id, resultId), (0, drizzle_orm_1.eq)(schema_js_1.results.quizId, quizId)))
            .returning({ id: schema_js_1.results.id });
        if (!deleted.length)
            throw new common_1.NotFoundException('Resultado não encontrado');
        return { ok: true };
    }
    async getPublishedPayload(slug) {
        const [quiz] = await this.db
            .select()
            .from(schema_js_1.quizzes)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_js_1.quizzes.slug, slug), (0, drizzle_orm_1.eq)(schema_js_1.quizzes.status, 'published')))
            .limit(1);
        if (!quiz)
            throw new common_1.NotFoundException('Quiz não encontrado');
        const stepsRows = await this.db
            .select()
            .from(schema_js_1.steps)
            .where((0, drizzle_orm_1.eq)(schema_js_1.steps.quizId, quiz.id))
            .orderBy((0, drizzle_orm_1.asc)(schema_js_1.steps.orderIndex));
        const stepIds = stepsRows.map((s) => s.id);
        const optRows = stepIds.length > 0
            ? await this.db
                .select()
                .from(schema_js_1.options)
                .where((0, drizzle_orm_1.inArray)(schema_js_1.options.stepId, stepIds))
                .orderBy((0, drizzle_orm_1.asc)(schema_js_1.options.orderIndex))
            : [];
        const resultsRows = await this.db
            .select()
            .from(schema_js_1.results)
            .where((0, drizzle_orm_1.eq)(schema_js_1.results.quizId, quiz.id))
            .orderBy((0, drizzle_orm_1.asc)(schema_js_1.results.orderIndex));
        const { webhookUrl: _w, domainId: _d, userId: _u, ...publicQuiz } = quiz;
        const optionsByStep = {};
        for (const sid of stepIds)
            optionsByStep[sid] = [];
        for (const o of optRows) {
            (optionsByStep[o.stepId] ??= []).push(o);
        }
        return {
            quiz: publicQuiz,
            steps: stepsRows,
            optionsByStep,
            results: resultsRows,
        };
    }
    evaluateNextStep(payload, currentStepId, answerValue) {
        const orderedIds = payload.steps.map((s) => s.id);
        const opts = payload.optionsByStep[currentStepId] ?? [];
        return this.engine.resolveNextStepId(opts.map((o) => ({ value: o.value, nextStepId: o.nextStepId })), answerValue, orderedIds, currentStepId);
    }
    evaluateFinalResult(payload, answersByStepId, score) {
        const sorted = [...payload.results].sort((a, b) => a.orderIndex - b.orderIndex);
        return this.engine.pickResult(sorted, answersByStepId, score);
    }
    async saveResponses(leadId, entries) {
        await this.db.delete(schema_js_1.responses).where((0, drizzle_orm_1.eq)(schema_js_1.responses.leadId, leadId));
        if (!entries.length)
            return;
        await this.db.insert(schema_js_1.responses).values(entries.map((e) => ({
            leadId,
            stepId: e.stepId,
            answer: e.answer,
        })));
    }
};
exports.QuizzesService = QuizzesService;
exports.QuizzesService = QuizzesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(tokens_js_1.DRIZZLE)),
    __metadata("design:paramtypes", [Object, quiz_engine_service_js_1.QuizEngineService])
], QuizzesService);
function randomSuffix() {
    return Math.random().toString(36).slice(2, 10);
}
//# sourceMappingURL=quizzes.service.js.map