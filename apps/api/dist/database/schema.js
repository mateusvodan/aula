"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.events = exports.responses = exports.leads = exports.results = exports.options = exports.steps = exports.quizzes = exports.domains = exports.profiles = exports.domainStatusEnum = exports.stepTypeEnum = exports.quizStatusEnum = exports.planTypeEnum = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
exports.planTypeEnum = (0, pg_core_1.pgEnum)('plan_type', ['free', 'pro', 'premium']);
exports.quizStatusEnum = (0, pg_core_1.pgEnum)('quiz_status', ['draft', 'published']);
exports.stepTypeEnum = (0, pg_core_1.pgEnum)('step_type', [
    'question',
    'input',
    'content',
    'result',
]);
exports.domainStatusEnum = (0, pg_core_1.pgEnum)('domain_status', ['pending', 'active']);
exports.profiles = (0, pg_core_1.pgTable)('profiles', {
    id: (0, pg_core_1.uuid)('id').primaryKey(),
    name: (0, pg_core_1.text)('name'),
    email: (0, pg_core_1.text)('email'),
    plan: (0, exports.planTypeEnum)('plan').notNull().default('free'),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true })
        .notNull()
        .defaultNow(),
});
exports.domains = (0, pg_core_1.pgTable)('domains', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    userId: (0, pg_core_1.uuid)('user_id')
        .notNull()
        .references(() => exports.profiles.id, { onDelete: 'cascade' }),
    domain: (0, pg_core_1.text)('domain').notNull(),
    status: (0, exports.domainStatusEnum)('status').notNull().default('pending'),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true })
        .notNull()
        .defaultNow(),
});
exports.quizzes = (0, pg_core_1.pgTable)('quizzes', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    userId: (0, pg_core_1.uuid)('user_id')
        .notNull()
        .references(() => exports.profiles.id, { onDelete: 'cascade' }),
    name: (0, pg_core_1.text)('name').notNull(),
    slug: (0, pg_core_1.text)('slug').notNull(),
    status: (0, exports.quizStatusEnum)('status').notNull().default('draft'),
    domainId: (0, pg_core_1.uuid)('domain_id').references(() => exports.domains.id, {
        onDelete: 'set null',
    }),
    theme: (0, pg_core_1.jsonb)('theme').$type().default({}),
    facebookPixelId: (0, pg_core_1.text)('facebook_pixel_id'),
    googleAnalyticsId: (0, pg_core_1.text)('google_analytics_id'),
    googleTagManagerId: (0, pg_core_1.text)('google_tag_manager_id'),
    tiktokPixelId: (0, pg_core_1.text)('tiktok_pixel_id'),
    webhookUrl: (0, pg_core_1.text)('webhook_url'),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true })
        .notNull()
        .defaultNow(),
});
exports.steps = (0, pg_core_1.pgTable)('steps', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    quizId: (0, pg_core_1.uuid)('quiz_id')
        .notNull()
        .references(() => exports.quizzes.id, { onDelete: 'cascade' }),
    type: (0, exports.stepTypeEnum)('type').notNull(),
    orderIndex: (0, pg_core_1.integer)('order_index').notNull().default(0),
    metadata: (0, pg_core_1.jsonb)('metadata').$type().notNull().default({}),
});
exports.options = (0, pg_core_1.pgTable)('options', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    stepId: (0, pg_core_1.uuid)('step_id')
        .notNull()
        .references(() => exports.steps.id, { onDelete: 'cascade' }),
    label: (0, pg_core_1.text)('label').notNull(),
    value: (0, pg_core_1.text)('value').notNull(),
    nextStepId: (0, pg_core_1.uuid)('next_step_id').references(() => exports.steps.id, {
        onDelete: 'set null',
    }),
    orderIndex: (0, pg_core_1.integer)('order_index').notNull().default(0),
});
exports.results = (0, pg_core_1.pgTable)('results', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    quizId: (0, pg_core_1.uuid)('quiz_id')
        .notNull()
        .references(() => exports.quizzes.id, { onDelete: 'cascade' }),
    name: (0, pg_core_1.text)('name').notNull(),
    conditions: (0, pg_core_1.jsonb)('conditions').$type().notNull().default({}),
    redirectUrl: (0, pg_core_1.text)('redirect_url'),
    orderIndex: (0, pg_core_1.integer)('order_index').notNull().default(0),
});
exports.leads = (0, pg_core_1.pgTable)('leads', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    quizId: (0, pg_core_1.uuid)('quiz_id')
        .notNull()
        .references(() => exports.quizzes.id, { onDelete: 'cascade' }),
    sessionId: (0, pg_core_1.text)('session_id'),
    data: (0, pg_core_1.jsonb)('data').$type().notNull().default({}),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true })
        .notNull()
        .defaultNow(),
});
exports.responses = (0, pg_core_1.pgTable)('responses', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    leadId: (0, pg_core_1.uuid)('lead_id')
        .notNull()
        .references(() => exports.leads.id, { onDelete: 'cascade' }),
    stepId: (0, pg_core_1.uuid)('step_id')
        .notNull()
        .references(() => exports.steps.id, { onDelete: 'cascade' }),
    answer: (0, pg_core_1.jsonb)('answer').$type().notNull(),
});
exports.events = (0, pg_core_1.pgTable)('events', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    quizId: (0, pg_core_1.uuid)('quiz_id')
        .notNull()
        .references(() => exports.quizzes.id, { onDelete: 'cascade' }),
    type: (0, pg_core_1.text)('type').notNull(),
    metadata: (0, pg_core_1.jsonb)('metadata').$type().notNull().default({}),
    sessionId: (0, pg_core_1.text)('session_id'),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true })
        .notNull()
        .defaultNow(),
});
//# sourceMappingURL=schema.js.map