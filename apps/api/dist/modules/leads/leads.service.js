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
exports.LeadsService = void 0;
const common_1 = require("@nestjs/common");
const drizzle_orm_1 = require("drizzle-orm");
const tokens_js_1 = require("../../database/tokens.js");
const schema_js_1 = require("../../database/schema.js");
const webhooks_service_js_1 = require("../webhooks/webhooks.service.js");
let LeadsService = class LeadsService {
    db;
    webhooks;
    constructor(db, webhooks) {
        this.db = db;
        this.webhooks = webhooks;
    }
    async assertPublishedQuiz(quizId) {
        const [q] = await this.db
            .select()
            .from(schema_js_1.quizzes)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_js_1.quizzes.id, quizId), (0, drizzle_orm_1.eq)(schema_js_1.quizzes.status, 'published')))
            .limit(1);
        if (!q)
            throw new common_1.NotFoundException('Quiz não disponível');
        return q;
    }
    async createLead(input) {
        const quiz = await this.assertPublishedQuiz(input.quizId);
        const [lead] = await this.db
            .insert(schema_js_1.leads)
            .values({
            quizId: input.quizId,
            sessionId: input.sessionId ?? null,
            data: input.data ?? {},
        })
            .returning();
        await this.webhooks.dispatch(quiz.webhookUrl, 'lead.created', {
            quizId: quiz.id,
            slug: quiz.slug,
            lead,
        });
        return lead;
    }
    async getLeadForQuiz(leadId, quizId) {
        const [row] = await this.db
            .select()
            .from(schema_js_1.leads)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_js_1.leads.id, leadId), (0, drizzle_orm_1.eq)(schema_js_1.leads.quizId, quizId)))
            .limit(1);
        if (!row)
            throw new common_1.NotFoundException('Lead não encontrado');
        return row;
    }
};
exports.LeadsService = LeadsService;
exports.LeadsService = LeadsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(tokens_js_1.DRIZZLE)),
    __metadata("design:paramtypes", [Object, webhooks_service_js_1.WebhooksService])
], LeadsService);
//# sourceMappingURL=leads.service.js.map