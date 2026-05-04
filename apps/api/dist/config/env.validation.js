"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.envSchema = void 0;
exports.validateEnv = validateEnv;
const zod_1 = require("zod");
exports.envSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('development'),
    PORT: zod_1.z.coerce.number().default(4000),
    DATABASE_URL: zod_1.z.string().min(1),
    WEB_ORIGIN: zod_1.z.string().url().default('http://localhost:3000'),
    SUPABASE_JWT_SECRET: zod_1.z.string().min(1),
    WEBHOOK_SIGNING_SECRET: zod_1.z.string().optional(),
});
function validateEnv(config) {
    const parsed = exports.envSchema.safeParse(config);
    if (!parsed.success) {
        throw new Error(`Invalid env: ${parsed.error.message}`);
    }
    return parsed.data;
}
//# sourceMappingURL=env.validation.js.map