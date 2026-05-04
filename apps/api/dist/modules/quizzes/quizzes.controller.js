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
exports.QuizzesController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const current_user_decorator_js_1 = require("../../common/decorators/current-user.decorator.js");
const quizzes_service_js_1 = require("./quizzes.service.js");
const quiz_dto_js_1 = require("./dto/quiz.dto.js");
let QuizzesController = class QuizzesController {
    quizzes;
    constructor(quizzes) {
        this.quizzes = quizzes;
    }
    create(user, dto) {
        return this.quizzes.createQuiz(user.userId, dto.name, dto.slug);
    }
    list(user) {
        return this.quizzes.listQuizzes(user.userId);
    }
    getOne(user, quizId) {
        return this.quizzes.getQuizForOwner(quizId, user.userId);
    }
    update(user, quizId, dto) {
        return this.quizzes.updateQuiz(quizId, user.userId, dto);
    }
    remove(user, quizId) {
        return this.quizzes.deleteQuiz(quizId, user.userId);
    }
    graph(user, quizId) {
        return this.quizzes.getEditorGraph(quizId, user.userId);
    }
    reorder(user, quizId, dto) {
        return this.quizzes.reorderSteps(quizId, user.userId, dto.orderedStepIds);
    }
    addStep(user, quizId, dto) {
        return this.quizzes.createStep(quizId, user.userId, dto);
    }
    patchStep(user, quizId, stepId, dto) {
        return this.quizzes.updateStep(quizId, stepId, user.userId, dto);
    }
    deleteStep(user, quizId, stepId) {
        return this.quizzes.deleteStep(quizId, stepId, user.userId);
    }
    addOption(user, quizId, stepId, dto) {
        return this.quizzes.createOption(quizId, stepId, user.userId, dto);
    }
    patchOption(user, quizId, optionId, dto) {
        return this.quizzes.updateOption(quizId, optionId, user.userId, dto);
    }
    deleteOption(user, quizId, optionId) {
        return this.quizzes.deleteOption(quizId, optionId, user.userId);
    }
    addResult(user, quizId, dto) {
        return this.quizzes.createResult(quizId, user.userId, dto);
    }
    patchResult(user, quizId, resultId, dto) {
        return this.quizzes.updateResult(quizId, resultId, user.userId, dto);
    }
    deleteResult(user, quizId, resultId) {
        return this.quizzes.deleteResult(quizId, resultId, user.userId);
    }
};
exports.QuizzesController = QuizzesController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, current_user_decorator_js_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, quiz_dto_js_1.CreateQuizDto]),
    __metadata("design:returntype", void 0)
], QuizzesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, current_user_decorator_js_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], QuizzesController.prototype, "list", null);
__decorate([
    (0, common_1.Get)(':quizId'),
    __param(0, (0, current_user_decorator_js_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('quizId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], QuizzesController.prototype, "getOne", null);
__decorate([
    (0, common_1.Patch)(':quizId'),
    __param(0, (0, current_user_decorator_js_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('quizId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, quiz_dto_js_1.UpdateQuizDto]),
    __metadata("design:returntype", void 0)
], QuizzesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':quizId'),
    __param(0, (0, current_user_decorator_js_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('quizId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], QuizzesController.prototype, "remove", null);
__decorate([
    (0, common_1.Get)(':quizId/graph'),
    __param(0, (0, current_user_decorator_js_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('quizId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], QuizzesController.prototype, "graph", null);
__decorate([
    (0, common_1.Post)(':quizId/steps/reorder'),
    __param(0, (0, current_user_decorator_js_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('quizId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, quiz_dto_js_1.ReorderStepsDto]),
    __metadata("design:returntype", void 0)
], QuizzesController.prototype, "reorder", null);
__decorate([
    (0, common_1.Post)(':quizId/steps'),
    __param(0, (0, current_user_decorator_js_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('quizId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, quiz_dto_js_1.CreateStepDto]),
    __metadata("design:returntype", void 0)
], QuizzesController.prototype, "addStep", null);
__decorate([
    (0, common_1.Patch)(':quizId/steps/:stepId'),
    __param(0, (0, current_user_decorator_js_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('quizId')),
    __param(2, (0, common_1.Param)('stepId')),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, quiz_dto_js_1.UpdateStepDto]),
    __metadata("design:returntype", void 0)
], QuizzesController.prototype, "patchStep", null);
__decorate([
    (0, common_1.Delete)(':quizId/steps/:stepId'),
    __param(0, (0, current_user_decorator_js_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('quizId')),
    __param(2, (0, common_1.Param)('stepId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], QuizzesController.prototype, "deleteStep", null);
__decorate([
    (0, common_1.Post)(':quizId/steps/:stepId/options'),
    __param(0, (0, current_user_decorator_js_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('quizId')),
    __param(2, (0, common_1.Param)('stepId')),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, quiz_dto_js_1.CreateOptionDto]),
    __metadata("design:returntype", void 0)
], QuizzesController.prototype, "addOption", null);
__decorate([
    (0, common_1.Patch)(':quizId/options/:optionId'),
    __param(0, (0, current_user_decorator_js_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('quizId')),
    __param(2, (0, common_1.Param)('optionId')),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, quiz_dto_js_1.UpdateOptionDto]),
    __metadata("design:returntype", void 0)
], QuizzesController.prototype, "patchOption", null);
__decorate([
    (0, common_1.Delete)(':quizId/options/:optionId'),
    __param(0, (0, current_user_decorator_js_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('quizId')),
    __param(2, (0, common_1.Param)('optionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], QuizzesController.prototype, "deleteOption", null);
__decorate([
    (0, common_1.Post)(':quizId/results'),
    __param(0, (0, current_user_decorator_js_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('quizId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, quiz_dto_js_1.CreateResultDto]),
    __metadata("design:returntype", void 0)
], QuizzesController.prototype, "addResult", null);
__decorate([
    (0, common_1.Patch)(':quizId/results/:resultId'),
    __param(0, (0, current_user_decorator_js_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('quizId')),
    __param(2, (0, common_1.Param)('resultId')),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, quiz_dto_js_1.UpdateResultDto]),
    __metadata("design:returntype", void 0)
], QuizzesController.prototype, "patchResult", null);
__decorate([
    (0, common_1.Delete)(':quizId/results/:resultId'),
    __param(0, (0, current_user_decorator_js_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('quizId')),
    __param(2, (0, common_1.Param)('resultId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], QuizzesController.prototype, "deleteResult", null);
exports.QuizzesController = QuizzesController = __decorate([
    (0, common_1.Controller)('quizzes'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __metadata("design:paramtypes", [quizzes_service_js_1.QuizzesService])
], QuizzesController);
//# sourceMappingURL=quizzes.controller.js.map