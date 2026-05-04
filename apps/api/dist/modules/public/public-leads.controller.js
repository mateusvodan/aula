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
exports.PublicLeadsController = void 0;
const common_1 = require("@nestjs/common");
const throttler_1 = require("@nestjs/throttler");
const leads_service_js_1 = require("../leads/leads.service.js");
const public_dto_js_1 = require("./public.dto.js");
let PublicLeadsController = class PublicLeadsController {
    leads;
    constructor(leads) {
        this.leads = leads;
    }
    create(dto) {
        return this.leads.createLead({
            quizId: dto.quizId,
            sessionId: dto.sessionId,
            data: dto.data,
        });
    }
};
exports.PublicLeadsController = PublicLeadsController;
__decorate([
    (0, throttler_1.Throttle)({ default: { ttl: 60000, limit: 60 } }),
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [public_dto_js_1.CreatePublicLeadDto]),
    __metadata("design:returntype", void 0)
], PublicLeadsController.prototype, "create", null);
exports.PublicLeadsController = PublicLeadsController = __decorate([
    (0, common_1.Controller)('public/leads'),
    __metadata("design:paramtypes", [leads_service_js_1.LeadsService])
], PublicLeadsController);
//# sourceMappingURL=public-leads.controller.js.map