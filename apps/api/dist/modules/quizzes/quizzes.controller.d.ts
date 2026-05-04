import { QuizzesService } from './quizzes.service.js';
import { CreateOptionDto, CreateQuizDto, CreateResultDto, CreateStepDto, ReorderStepsDto, UpdateOptionDto, UpdateQuizDto, UpdateResultDto, UpdateStepDto } from './dto/quiz.dto.js';
export declare class QuizzesController {
    private readonly quizzes;
    constructor(quizzes: QuizzesService);
    create(user: {
        userId: string;
    }, dto: CreateQuizDto): Promise<any>;
    list(user: {
        userId: string;
    }): Promise<any>;
    getOne(user: {
        userId: string;
    }, quizId: string): Promise<any>;
    update(user: {
        userId: string;
    }, quizId: string, dto: UpdateQuizDto): Promise<any>;
    remove(user: {
        userId: string;
    }, quizId: string): Promise<{
        ok: boolean;
    }>;
    graph(user: {
        userId: string;
    }, quizId: string): Promise<{
        steps: any;
        options: any;
        results: any;
    }>;
    reorder(user: {
        userId: string;
    }, quizId: string, dto: ReorderStepsDto): Promise<{
        steps: any;
        options: any;
        results: any;
    }>;
    addStep(user: {
        userId: string;
    }, quizId: string, dto: CreateStepDto): Promise<any>;
    patchStep(user: {
        userId: string;
    }, quizId: string, stepId: string, dto: UpdateStepDto): Promise<any>;
    deleteStep(user: {
        userId: string;
    }, quizId: string, stepId: string): Promise<{
        ok: boolean;
    }>;
    addOption(user: {
        userId: string;
    }, quizId: string, stepId: string, dto: CreateOptionDto): Promise<any>;
    patchOption(user: {
        userId: string;
    }, quizId: string, optionId: string, dto: UpdateOptionDto): Promise<any>;
    deleteOption(user: {
        userId: string;
    }, quizId: string, optionId: string): Promise<{
        ok: boolean;
    }>;
    addResult(user: {
        userId: string;
    }, quizId: string, dto: CreateResultDto): Promise<any>;
    patchResult(user: {
        userId: string;
    }, quizId: string, resultId: string, dto: UpdateResultDto): Promise<any>;
    deleteResult(user: {
        userId: string;
    }, quizId: string, resultId: string): Promise<{
        ok: boolean;
    }>;
}
