import { QuizzesService } from '../quizzes/quizzes.service.js';
import { SavePublicResponsesDto } from './public.dto.js';
import type { Database } from '../../database/drizzle.factory.js';
export declare class PublicResponsesController {
    private readonly quizzesService;
    private readonly db;
    constructor(quizzesService: QuizzesService, db: Database);
    save(dto: SavePublicResponsesDto): Promise<{
        ok: boolean;
    }>;
}
