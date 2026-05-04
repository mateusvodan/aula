"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PublicModule = void 0;
const common_1 = require("@nestjs/common");
const public_quizzes_controller_js_1 = require("./public-quizzes.controller.js");
const public_leads_controller_js_1 = require("./public-leads.controller.js");
const public_events_controller_js_1 = require("./public-events.controller.js");
const public_responses_controller_js_1 = require("./public-responses.controller.js");
const quizzes_module_js_1 = require("../quizzes/quizzes.module.js");
const leads_module_js_1 = require("../leads/leads.module.js");
const events_module_js_1 = require("../events/events.module.js");
const webhooks_module_js_1 = require("../webhooks/webhooks.module.js");
let PublicModule = class PublicModule {
};
exports.PublicModule = PublicModule;
exports.PublicModule = PublicModule = __decorate([
    (0, common_1.Module)({
        imports: [quizzes_module_js_1.QuizzesModule, leads_module_js_1.LeadsModule, events_module_js_1.EventsModule, webhooks_module_js_1.WebhooksModule],
        controllers: [
            public_quizzes_controller_js_1.PublicQuizzesController,
            public_leads_controller_js_1.PublicLeadsController,
            public_events_controller_js_1.PublicEventsController,
            public_responses_controller_js_1.PublicResponsesController,
        ],
    })
], PublicModule);
//# sourceMappingURL=public.module.js.map