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
exports.PublicEventsController = void 0;
const common_1 = require("@nestjs/common");
const throttler_1 = require("@nestjs/throttler");
const events_service_js_1 = require("../events/events.service.js");
const leads_service_js_1 = require("../leads/leads.service.js");
const public_dto_js_1 = require("./public.dto.js");
let PublicEventsController = class PublicEventsController {
    events;
    leads;
    constructor(events, leads) {
        this.events = events;
        this.leads = leads;
    }
    async create(dto) {
        await this.leads.assertPublishedQuiz(dto.quizId);
        await this.events.logEvent({
            quizId: dto.quizId,
            type: dto.type,
            metadata: dto.metadata ?? {},
            sessionId: dto.sessionId,
        });
        return { ok: true };
    }
};
exports.PublicEventsController = PublicEventsController;
__decorate([
    (0, throttler_1.Throttle)({ default: { ttl: 60000, limit: 600 } }),
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [public_dto_js_1.CreatePublicEventDto]),
    __metadata("design:returntype", Promise)
], PublicEventsController.prototype, "create", null);
exports.PublicEventsController = PublicEventsController = __decorate([
    (0, common_1.Controller)('public/events'),
    __metadata("design:paramtypes", [events_service_js_1.EventsService,
        leads_service_js_1.LeadsService])
], PublicEventsController);
//# sourceMappingURL=public-events.controller.js.map