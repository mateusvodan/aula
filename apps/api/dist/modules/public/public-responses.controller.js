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
exports.PublicResponsesController = void 0;
const common_1 = require("@nestjs/common");
const throttler_1 = require("@nestjs/throttler");
const quizzes_service_js_1 = require("../quizzes/quizzes.service.js");
const public_dto_js_1 = require("./public.dto.js");
const common_2 = require("@nestjs/common");
const tokens_js_1 = require("../../database/tokens.js");
const schema_js_1 = require("../../database/schema.js");
const drizzle_orm_1 = require("drizzle-orm");
let PublicResponsesController = class PublicResponsesController {
    quizzesService;
    db;
    constructor(quizzesService, db) {
        this.quizzesService = quizzesService;
        this.db = db;
    }
    async save(dto) {
        const [lead] = await this.db
            .select()
            .from(schema_js_1.leads)
            .where((0, drizzle_orm_1.eq)(schema_js_1.leads.id, dto.leadId))
            .limit(1);
        if (!lead)
            throw new common_1.NotFoundException('Lead não encontrado');
        const [q] = await this.db
            .select()
            .from(schema_js_1.quizzes)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_js_1.quizzes.id, lead.quizId), (0, drizzle_orm_1.eq)(schema_js_1.quizzes.status, 'published')))
            .limit(1);
        if (!q)
            throw new common_1.NotFoundException('Quiz não publicado');
        await this.quizzesService.saveResponses(dto.leadId, dto.entries);
        return { ok: true };
    }
};
exports.PublicResponsesController = PublicResponsesController;
__decorate([
    (0, throttler_1.Throttle)({ default: { ttl: 60000, limit: 300 } }),
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [public_dto_js_1.SavePublicResponsesDto]),
    __metadata("design:returntype", Promise)
], PublicResponsesController.prototype, "save", null);
exports.PublicResponsesController = PublicResponsesController = __decorate([
    (0, common_1.Controller)('public/responses'),
    __param(1, (0, common_2.Inject)(tokens_js_1.DRIZZLE)),
    __metadata("design:paramtypes", [quizzes_service_js_1.QuizzesService, Object])
], PublicResponsesController);
//# sourceMappingURL=public-responses.controller.js.map