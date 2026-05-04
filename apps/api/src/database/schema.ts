import {
  pgTable,
  uuid,
  text,
  timestamp,
  jsonb,
  integer,
  pgEnum,
} from 'drizzle-orm/pg-core';

export const planTypeEnum = pgEnum('plan_type', ['free', 'pro', 'premium']);
export const quizStatusEnum = pgEnum('quiz_status', ['draft', 'published']);
export const stepTypeEnum = pgEnum('step_type', [
  'question',
  'input',
  'content',
  'result',
]);
export const domainStatusEnum = pgEnum('domain_status', ['pending', 'active']);

export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey(),
  name: text('name'),
  email: text('email'),
  plan: planTypeEnum('plan').notNull().default('free'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const domains = pgTable('domains', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),
  domain: text('domain').notNull(),
  status: domainStatusEnum('status').notNull().default('pending'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const quizzes = pgTable('quizzes', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  status: quizStatusEnum('status').notNull().default('draft'),
  domainId: uuid('domain_id').references(() => domains.id, {
    onDelete: 'set null',
  }),
  theme: jsonb('theme').$type<Record<string, unknown>>().default({}),
  facebookPixelId: text('facebook_pixel_id'),
  googleAnalyticsId: text('google_analytics_id'),
  googleTagManagerId: text('google_tag_manager_id'),
  tiktokPixelId: text('tiktok_pixel_id'),
  webhookUrl: text('webhook_url'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const steps = pgTable('steps', {
  id: uuid('id').primaryKey().defaultRandom(),
  quizId: uuid('quiz_id')
    .notNull()
    .references(() => quizzes.id, { onDelete: 'cascade' }),
  type: stepTypeEnum('type').notNull(),
  orderIndex: integer('order_index').notNull().default(0),
  metadata: jsonb('metadata').$type<Record<string, unknown>>().notNull().default({}),
});

export const options = pgTable('options', {
  id: uuid('id').primaryKey().defaultRandom(),
  stepId: uuid('step_id')
    .notNull()
    .references(() => steps.id, { onDelete: 'cascade' }),
  label: text('label').notNull(),
  value: text('value').notNull(),
  nextStepId: uuid('next_step_id').references(() => steps.id, {
    onDelete: 'set null',
  }),
  orderIndex: integer('order_index').notNull().default(0),
});

export const results = pgTable('results', {
  id: uuid('id').primaryKey().defaultRandom(),
  quizId: uuid('quiz_id')
    .notNull()
    .references(() => quizzes.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  conditions: jsonb('conditions').$type<Record<string, unknown>>().notNull().default({}),
  redirectUrl: text('redirect_url'),
  orderIndex: integer('order_index').notNull().default(0),
});

export const leads = pgTable('leads', {
  id: uuid('id').primaryKey().defaultRandom(),
  quizId: uuid('quiz_id')
    .notNull()
    .references(() => quizzes.id, { onDelete: 'cascade' }),
  sessionId: text('session_id'),
  data: jsonb('data').$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const responses = pgTable('responses', {
  id: uuid('id').primaryKey().defaultRandom(),
  leadId: uuid('lead_id')
    .notNull()
    .references(() => leads.id, { onDelete: 'cascade' }),
  stepId: uuid('step_id')
    .notNull()
    .references(() => steps.id, { onDelete: 'cascade' }),
  answer: jsonb('answer').$type<unknown>().notNull(),
});

export const events = pgTable('events', {
  id: uuid('id').primaryKey().defaultRandom(),
  quizId: uuid('quiz_id')
    .notNull()
    .references(() => quizzes.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  metadata: jsonb('metadata').$type<Record<string, unknown>>().notNull().default({}),
  sessionId: text('session_id'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type QuizRow = typeof quizzes.$inferSelect;
export type StepRow = typeof steps.$inferSelect;
export type OptionRow = typeof options.$inferSelect;
export type ResultRow = typeof results.$inferSelect;
export type LeadRow = typeof leads.$inferSelect;
