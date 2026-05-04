"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const app_module_js_1 = require("./app.module.js");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_js_1.AppModule);
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
        forbidUnknownValues: false,
    }));
    const origin = process.env.WEB_ORIGIN ?? 'http://localhost:3000';
    app.enableCors({
        origin,
        credentials: true,
    });
    const port = Number(process.env.PORT ?? 4000);
    await app.listen(port);
}
bootstrap();
//# sourceMappingURL=main.js.map