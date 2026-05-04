import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, eq, inArray } from 'drizzle-orm';
import type { Database } from '../../database/drizzle.factory.js';
import { DRIZZLE } from '../../database/tokens.js';
import {
  options,
  quizzes,
  responses,
  results,
  steps,
} from '../../database/schema.js';
import { QuizEngineService } from './quiz-engine.service.js';

function slugify(input: string): string {
  return input
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

@Injectable()
export class QuizzesService {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly engine: QuizEngineService,
  ) {}

  private async ensureQuiz(quizId: string, userId: string) {
    const [row] = await this.db
      .select()
      .from(quizzes)
      .where(and(eq(quizzes.id, quizId), eq(quizzes.userId, userId)))
      .limit(1);
    if (!row) throw new NotFoundException('Quiz não encontrado');
    return row;
  }

  private async ensureStep(quizId: string, stepId: string, userId: string) {
    await this.ensureQuiz(quizId, userId);
    const [s] = await this.db
      .select()
      .from(steps)
      .where(and(eq(steps.id, stepId), eq(steps.quizId, quizId)))
      .limit(1);
    if (!s) throw new NotFoundException('Etapa não encontrada');
    return s;
  }

  async createQuiz(userId: string, name: string, slug?: string) {
    let base = slug?.trim() ? slugify(slug) : slugify(name);
    if (!base) base = `quiz-${randomSuffix()}`;
    for (let i = 0; i < 50; i++) {
      const candidate = i === 0 ? base : `${base}-${i}`;
      const taken = await this.db
        .select({ id: quizzes.id })
        .from(quizzes)
        .where(eq(quizzes.slug, candidate))
        .limit(1);
      if (taken.length) continue;
      const [row] = await this.db
        .insert(quizzes)
        .values({
          userId,
          name,
          slug: candidate,
          status: 'draft',
        })
        .returning();
      return row;
    }
    throw new ConflictException('Não foi possível gerar slug único');
  }

  async listQuizzes(userId: string) {
    return this.db
      .select()
      .from(quizzes)
      .where(eq(quizzes.userId, userId))
      .orderBy(asc(quizzes.createdAt));
  }

  async getQuizForOwner(quizId: string, userId: string) {
    return this.ensureQuiz(quizId, userId);
  }

  async updateQuiz(
    quizId: string,
    userId: string,
    patch: Partial<{
      name: string;
      slug: string;
      status: 'draft' | 'published';
      theme: Record<string, unknown>;
      facebookPixelId: string | null;
      googleAnalyticsId: string | null;
      googleTagManagerId: string | null;
      tiktokPixelId: string | null;
      webhookUrl: string | null;
    }>,
  ) {
    await this.ensureQuiz(quizId, userId);
    const update: Record<string, unknown> = { ...patch };
    if (patch.slug) update.slug = slugify(patch.slug);
    const [row] = await this.db
      .update(quizzes)
      .set(update as typeof quizzes.$inferInsert)
      .where(eq(quizzes.id, quizId))
      .returning();
    return row;
  }

  async deleteQuiz(quizId: string, userId: string) {
    await this.ensureQuiz(quizId, userId);
    await this.db.delete(quizzes).where(eq(quizzes.id, quizId));
    return { ok: true };
  }

  async getEditorGraph(quizId: string, userId: string) {
    await this.ensureQuiz(quizId, userId);
    const stepsRows = await this.db
      .select()
      .from(steps)
      .where(eq(steps.quizId, quizId))
      .orderBy(asc(steps.orderIndex));
    const stepIds = stepsRows.map((s) => s.id);
    const optRows =
      stepIds.length > 0
        ? await this.db
            .select()
            .from(options)
            .where(inArray(options.stepId, stepIds))
            .orderBy(asc(options.orderIndex))
        : [];
    const resultsRows = await this.db
      .select()
      .from(results)
      .where(eq(results.quizId, quizId))
      .orderBy(asc(results.orderIndex));
    return {
      steps: stepsRows,
      options: optRows,
      results: resultsRows,
    };
  }

  async createStep(
    quizId: string,
    userId: string,
    body: { type: 'question' | 'input' | 'content' | 'result'; metadata?: Record<string, unknown> },
  ) {
    await this.ensureQuiz(quizId, userId);
    const countRows = await this.db
      .select({ orderIndex: steps.orderIndex })
      .from(steps)
      .where(eq(steps.quizId, quizId));
    const orderIndex =
      countRows.length === 0
        ? 0
        : Math.max(...countRows.map((r) => r.orderIndex)) + 1;

    const [row] = await this.db
      .insert(steps)
      .values({
        quizId,
        type: body.type,
        orderIndex,
        metadata: body.metadata ?? {},
      })
      .returning();
    return row;
  }

  async updateStep(
    quizId: string,
    stepId: string,
    userId: string,
    patch: Partial<{ type: 'question' | 'input' | 'content' | 'result'; metadata: Record<string, unknown>; orderIndex: number }>,
  ) {
    await this.ensureStep(quizId, stepId, userId);
    const [row] = await this.db
      .update(steps)
      .set(patch as typeof steps.$inferInsert)
      .where(eq(steps.id, stepId))
      .returning();
    return row;
  }

  async deleteStep(quizId: string, stepId: string, userId: string) {
    await this.ensureStep(quizId, stepId, userId);
    await this.db.delete(steps).where(eq(steps.id, stepId));
    return { ok: true };
  }

  async reorderSteps(quizId: string, userId: string, orderedStepIds: string[]) {
    await this.ensureQuiz(quizId, userId);
    const existing = await this.db
      .select({ id: steps.id })
      .from(steps)
      .where(eq(steps.quizId, quizId));
    const ids = new Set(existing.map((e) => e.id));
    if (
      orderedStepIds.length !== existing.length ||
      new Set(orderedStepIds).size !== orderedStepIds.length ||
      orderedStepIds.some((id) => !ids.has(id))
    )
      throw new BadRequestException('Lista de etapas inválida');
    for (let i = 0; i < orderedStepIds.length; i++) {
      await this.db
        .update(steps)
        .set({ orderIndex: i })
        .where(eq(steps.id, orderedStepIds[i]!));
    }
    return this.getEditorGraph(quizId, userId);
  }

  async createOption(
    quizId: string,
    stepId: string,
    userId: string,
    body: { label: string; value: string; nextStepId?: string | null },
  ) {
    await this.ensureStep(quizId, stepId, userId);
    const opts = await this.db
      .select({ orderIndex: options.orderIndex })
      .from(options)
      .where(eq(options.stepId, stepId));
    const orderIndex =
      opts.length === 0 ? 0 : Math.max(...opts.map((o) => o.orderIndex)) + 1;
    const [row] = await this.db
      .insert(options)
      .values({
        stepId,
        label: body.label,
        value: body.value,
        nextStepId: body.nextStepId ?? null,
        orderIndex,
      })
      .returning();
    return row;
  }

  async updateOption(
    quizId: string,
    optionId: string,
    userId: string,
    patch: Partial<{ label: string; value: string; nextStepId: string | null; orderIndex: number }>,
  ) {
    const [opt] = await this.db
      .select({ stepId: options.stepId })
      .from(options)
      .where(eq(options.id, optionId))
      .limit(1);
    if (!opt) throw new NotFoundException('Opção não encontrada');
    await this.ensureStep(quizId, opt.stepId, userId);
    const [row] = await this.db
      .update(options)
      .set(patch as typeof options.$inferInsert)
      .where(eq(options.id, optionId))
      .returning();
    return row;
  }

  async deleteOption(quizId: string, optionId: string, userId: string) {
    const [opt] = await this.db
      .select({ stepId: options.stepId })
      .from(options)
      .where(eq(options.id, optionId))
      .limit(1);
    if (!opt) throw new NotFoundException('Opção não encontrada');
    await this.ensureStep(quizId, opt.stepId, userId);
    await this.db.delete(options).where(eq(options.id, optionId));
    return { ok: true };
  }

  async createResult(
    quizId: string,
    userId: string,
    body: {
      name: string;
      conditions?: Record<string, unknown>;
      redirectUrl?: string | null;
    },
  ) {
    await this.ensureQuiz(quizId, userId);
    const rs = await this.db
      .select({ orderIndex: results.orderIndex })
      .from(results)
      .where(eq(results.quizId, quizId));
    const orderIndex =
      rs.length === 0 ? 0 : Math.max(...rs.map((r) => r.orderIndex)) + 1;
    const [row] = await this.db
      .insert(results)
      .values({
        quizId,
        name: body.name,
        conditions: body.conditions ?? {},
        redirectUrl: body.redirectUrl ?? null,
        orderIndex,
      })
      .returning();
    return row;
  }

  async updateResult(
    quizId: string,
    resultId: string,
    userId: string,
    patch: Partial<{
      name: string;
      conditions: Record<string, unknown>;
      redirectUrl: string | null;
      orderIndex: number;
    }>,
  ) {
    await this.ensureQuiz(quizId, userId);
    const [r] = await this.db
      .select()
      .from(results)
      .where(and(eq(results.id, resultId), eq(results.quizId, quizId)))
      .limit(1);
    if (!r) throw new NotFoundException('Resultado não encontrado');
    const [row] = await this.db
      .update(results)
      .set(patch as typeof results.$inferInsert)
      .where(eq(results.id, resultId))
      .returning();
    return row;
  }

  async deleteResult(quizId: string, resultId: string, userId: string) {
    await this.ensureQuiz(quizId, userId);
    const deleted = await this.db
      .delete(results)
      .where(and(eq(results.id, resultId), eq(results.quizId, quizId)))
      .returning({ id: results.id });
    if (!deleted.length) throw new NotFoundException('Resultado não encontrado');
    return { ok: true };
  }

  /** Quiz publicado para player */
  async getPublishedPayload(slug: string) {
    const [quiz] = await this.db
      .select()
      .from(quizzes)
      .where(and(eq(quizzes.slug, slug), eq(quizzes.status, 'published')))
      .limit(1);
    if (!quiz) throw new NotFoundException('Quiz não encontrado');
    const stepsRows = await this.db
      .select()
      .from(steps)
      .where(eq(steps.quizId, quiz.id))
      .orderBy(asc(steps.orderIndex));
    const stepIds = stepsRows.map((s) => s.id);
    const optRows =
      stepIds.length > 0
        ? await this.db
            .select()
            .from(options)
            .where(inArray(options.stepId, stepIds))
            .orderBy(asc(options.orderIndex))
        : [];
    const resultsRows = await this.db
      .select()
      .from(results)
      .where(eq(results.quizId, quiz.id))
      .orderBy(asc(results.orderIndex));

    const {
      webhookUrl: _w,
      domainId: _d,
      userId: _u,
      ...publicQuiz
    } = quiz;

    const optionsByStep: Record<string, typeof optRows> = {};
    for (const sid of stepIds) optionsByStep[sid] = [];
    for (const o of optRows) {
      (optionsByStep[o.stepId] ??= []).push(o);
    }

    return {
      quiz: publicQuiz,
      steps: stepsRows,
      optionsByStep,
      results: resultsRows,
    };
  }

  evaluateNextStep(
    payload: Awaited<ReturnType<QuizzesService['getPublishedPayload']>>,
    currentStepId: string,
    answerValue: string,
  ) {
    const orderedIds = payload.steps.map((s) => s.id);
    const opts = payload.optionsByStep[currentStepId] ?? [];
    return this.engine.resolveNextStepId(
      opts.map((o) => ({ value: o.value, nextStepId: o.nextStepId })),
      answerValue,
      orderedIds,
      currentStepId,
    );
  }

  evaluateFinalResult(
    payload: Awaited<ReturnType<QuizzesService['getPublishedPayload']>>,
    answersByStepId: Record<string, unknown>,
    score: number,
  ) {
    const sorted = [...payload.results].sort((a, b) => a.orderIndex - b.orderIndex);
    return this.engine.pickResult(sorted, answersByStepId, score);
  }

  async saveResponses(
    leadId: string,
    entries: Array<{ stepId: string; answer: unknown }>,
  ) {
    await this.db.delete(responses).where(eq(responses.leadId, leadId));
    if (!entries.length) return;
    await this.db.insert(responses).values(
      entries.map((e) => ({
        leadId,
        stepId: e.stepId,
        answer: e.answer,
      })),
    );
  }
}

function randomSuffix(): string {
  return Math.random().toString(36).slice(2, 10);
}
