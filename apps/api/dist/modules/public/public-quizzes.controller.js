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
exports.PublicQuizzesController = void 0;
const common_1 = require("@nestjs/common");
const throttler_1 = require("@nestjs/throttler");
const quizzes_service_js_1 = require("../quizzes/quizzes.service.js");
const public_dto_js_1 = require("./public.dto.js");
const leads_service_js_1 = require("../leads/leads.service.js");
const events_service_js_1 = require("../events/events.service.js");
const webhooks_service_js_1 = require("../webhooks/webhooks.service.js");
const common_2 = require("@nestjs/common");
const tokens_js_1 = require("../../database/tokens.js");
const schema_js_1 = require("../../database/schema.js");
const drizzle_orm_1 = require("drizzle-orm");
let PublicQuizzesController = class PublicQuizzesController {
    quizzesService;
    leads;
    events;
    webhooks;
    db;
    constructor(quizzesService, leads, events, webhooks, db) {
        this.quizzesService = quizzesService;
        this.leads = leads;
        this.events = events;
        this.webhooks = webhooks;
        this.db = db;
    }
    getBySlug(slug) {
        return this.quizzesService.getPublishedPayload(slug);
    }
    async complete(slug, dto) {
        const payload = await this.quizzesService.getPublishedPayload(slug);
        await this.leads.getLeadForQuiz(dto.leadId, payload.quiz.id);
        const entries = Object.entries(dto.answers).map(([stepId, answer]) => ({
            stepId,
            answer,
        }));
        await this.quizzesService.saveResponses(dto.leadId, entries);
        const picked = this.quizzesService.evaluateFinalResult(payload, dto.answers, dto.score ?? 0);
        await this.events.logEvent({
            quizId: payload.quiz.id,
            type: 'quiz_completed',
            sessionId: dto.sessionId,
            metadata: {
                leadId: dto.leadId,
                resultId: picked?.resultId,
            },
        });
        const [qrow] = await this.db
            .select({ webhookUrl: schema_js_1.quizzes.webhookUrl })
            .from(schema_js_1.quizzes)
            .where((0, drizzle_orm_1.eq)(schema_js_1.quizzes.id, payload.quiz.id))
            .limit(1);
        await this.webhooks.dispatch(qrow?.webhookUrl, 'quiz.completed', {
            quizId: payload.quiz.id,
            slug,
            leadId: dto.leadId,
            result: picked,
            answers: dto.answers,
        });
        return {
            result: picked,
        };
    }
};
exports.PublicQuizzesController = PublicQuizzesController;
__decorate([
    (0, throttler_1.Throttle)({ default: { ttl: 60000, limit: 300 } }),
    (0, common_1.Get)(':slug'),
    __param(0, (0, common_1.Param)('slug')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PublicQuizzesController.prototype, "getBySlug", null);
__decorate([
    (0, throttler_1.Throttle)({ default: { ttl: 60000, limit: 120 } }),
    (0, common_1.Post)(':slug/complete'),
    __param(0, (0, common_1.Param)('slug')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, public_dto_js_1.CompleteQuizDto]),
    __metadata("design:returntype", Promise)
], PublicQuizzesController.prototype, "complete", null);
exports.PublicQuizzesController = PublicQuizzesController = __decorate([
    (0, common_1.Controller)('public/quizzes'),
    __param(4, (0, common_2.Inject)(tokens_js_1.DRIZZLE)),
    __metadata("design:paramtypes", [quizzes_service_js_1.QuizzesService,
        leads_service_js_1.LeadsService,
        events_service_js_1.EventsService,
        webhooks_service_js_1.WebhooksService, Object])
], PublicQuizzesController);
//# sourceMappingURL=public-quizzes.controller.js.map