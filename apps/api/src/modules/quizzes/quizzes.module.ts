import { Module } from '@nestjs/common';
import { QuizzesController } from './quizzes.controller.js';
import { QuizzesService } from './quizzes.service.js';
import { QuizEngineService } from './quiz-engine.service.js';

@Module({
  controllers: [QuizzesController],
  providers: [QuizzesService, QuizEngineService],
  exports: [QuizzesService, QuizEngineService],
})
export class QuizzesModule {}
