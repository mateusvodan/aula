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
exports.AnalyticsService = void 0;
const common_1 = require("@nestjs/common");
const drizzle_orm_1 = require("drizzle-orm");
const tokens_js_1 = require("../../database/tokens.js");
const schema_js_1 = require("../../database/schema.js");
let AnalyticsService = class AnalyticsService {
    db;
    constructor(db) {
        this.db = db;
    }
    async ensureOwner(quizId, userId) {
        const [q] = await this.db
            .select()
            .from(schema_js_1.quizzes)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_js_1.quizzes.id, quizId), (0, drizzle_orm_1.eq)(schema_js_1.quizzes.userId, userId)))
            .limit(1);
        if (!q)
            throw new common_1.NotFoundException('Quiz não encontrado');
        return q;
    }
    async summary(quizId, userId) {
        await this.ensureOwner(quizId, userId);
        const [{ leadsTotal }] = await this.db
            .select({ leadsTotal: (0, drizzle_orm_1.count)() })
            .from(schema_js_1.leads)
            .where((0, drizzle_orm_1.eq)(schema_js_1.leads.quizId, quizId));
        const [{ starts }] = await this.db
            .select({ starts: (0, drizzle_orm_1.count)() })
            .from(schema_js_1.events)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_js_1.events.quizId, quizId), (0, drizzle_orm_1.eq)(schema_js_1.events.type, 'quiz_start')));
        const [{ completed }] = await this.db
            .select({ completed: (0, drizzle_orm_1.count)() })
            .from(schema_js_1.events)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_js_1.events.quizId, quizId), (0, drizzle_orm_1.eq)(schema_js_1.events.type, 'quiz_completed')));
        const rate = starts > 0 ? Math.round((completed / starts) * 10000) / 100 : 0;
        return {
            leadsTotal,
            quizStarts: starts,
            quizCompleted: completed,
            completionRatePercent: rate,
        };
    }
    async stepDropoff(quizId, userId) {
        await this.ensureOwner(quizId, userId);
        const rows = await this.db
            .select()
            .from(schema_js_1.events)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_js_1.events.quizId, quizId), (0, drizzle_orm_1.eq)(schema_js_1.events.type, 'step_view')));
        const map = new Map();
        for (const e of rows) {
            const sid = e.metadata.stepId;
            if (!sid)
                continue;
            map.set(sid, (map.get(sid) ?? 0) + 1);
        }
        return [...map.entries()].map(([stepId, views]) => ({ stepId, views }));
    }
    async answerStats(quizId, userId) {
        await this.ensureOwner(quizId, userId);
        const rows = await this.db
            .select()
            .from(schema_js_1.events)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_js_1.events.quizId, quizId), (0, drizzle_orm_1.eq)(schema_js_1.events.type, 'answer_selected')));
        const map = new Map();
        for (const e of rows) {
            const meta = e.metadata;
            if (!meta.stepId || meta.value === undefined)
                continue;
            const key = `${meta.stepId}::${meta.value}`;
            map.set(key, (map.get(key) ?? 0) + 1);
        }
        return [...map.entries()].map(([key, hits]) => {
            const [stepId, value] = key.split('::');
            return { stepId, value, hits };
        });
    }
    async recentLeads(quizId, userId, limit = 50) {
        await this.ensureOwner(quizId, userId);
        return this.db
            .select()
            .from(schema_js_1.leads)
            .where((0, drizzle_orm_1.eq)(schema_js_1.leads.quizId, quizId))
            .orderBy((0, drizzle_orm_1.desc)(schema_js_1.leads.createdAt))
            .limit(limit);
    }
};
exports.AnalyticsService = AnalyticsService;
exports.AnalyticsService = AnalyticsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(tokens_js_1.DRIZZLE)),
    __metadata("design:paramtypes", [Object])
], AnalyticsService);
//# sourceMappingURL=analytics.service.js.map