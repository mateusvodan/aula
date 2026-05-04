"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CurrentUser = void 0;
const common_1 = require("@nestjs/common");
exports.CurrentUser = (0, common_1.createParamDecorator)((_data, ctx) => {
    const req = ctx.switchToHttp().getRequest();
    const user = req.user;
    if (!user?.userId)
        throw new Error('Missing user on request');
    return user;
});
//# sourceMappingURL=current-user.decorator.js.map