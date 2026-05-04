import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { QuizzesService } from './quizzes.service.js';
import {
  CreateOptionDto,
  CreateQuizDto,
  CreateResultDto,
  CreateStepDto,
  ReorderStepsDto,
  UpdateOptionDto,
  UpdateQuizDto,
  UpdateResultDto,
  UpdateStepDto,
} from './dto/quiz.dto.js';

@Controller('quizzes')
@UseGuards(AuthGuard('jwt'))
export class QuizzesController {
  constructor(private readonly quizzes: QuizzesService) {}

  @Post()
  create(@CurrentUser() user: { userId: string }, @Body() dto: CreateQuizDto) {
    return this.quizzes.createQuiz(user.userId, dto.name, dto.slug);
  }

  @Get()
  list(@CurrentUser() user: { userId: string }) {
    return this.quizzes.listQuizzes(user.userId);
  }

  @Get(':quizId')
  getOne(
    @CurrentUser() user: { userId: string },
    @Param('quizId') quizId: string,
  ) {
    return this.quizzes.getQuizForOwner(quizId, user.userId);
  }

  @Patch(':quizId')
  update(
    @CurrentUser() user: { userId: string },
    @Param('quizId') quizId: string,
    @Body() dto: UpdateQuizDto,
  ) {
    return this.quizzes.updateQuiz(quizId, user.userId, dto);
  }

  @Delete(':quizId')
  remove(
    @CurrentUser() user: { userId: string },
    @Param('quizId') quizId: string,
  ) {
    return this.quizzes.deleteQuiz(quizId, user.userId);
  }

  @Get(':quizId/graph')
  graph(
    @CurrentUser() user: { userId: string },
    @Param('quizId') quizId: string,
  ) {
    return this.quizzes.getEditorGraph(quizId, user.userId);
  }

  @Post(':quizId/steps/reorder')
  reorder(
    @CurrentUser() user: { userId: string },
    @Param('quizId') quizId: string,
    @Body() dto: ReorderStepsDto,
  ) {
    return this.quizzes.reorderSteps(quizId, user.userId, dto.orderedStepIds);
  }

  @Post(':quizId/steps')
  addStep(
    @CurrentUser() user: { userId: string },
    @Param('quizId') quizId: string,
    @Body() dto: CreateStepDto,
  ) {
    return this.quizzes.createStep(quizId, user.userId, dto);
  }

  @Patch(':quizId/steps/:stepId')
  patchStep(
    @CurrentUser() user: { userId: string },
    @Param('quizId') quizId: string,
    @Param('stepId') stepId: string,
    @Body() dto: UpdateStepDto,
  ) {
    return this.quizzes.updateStep(quizId, stepId, user.userId, dto);
  }

  @Delete(':quizId/steps/:stepId')
  deleteStep(
    @CurrentUser() user: { userId: string },
    @Param('quizId') quizId: string,
    @Param('stepId') stepId: string,
  ) {
    return this.quizzes.deleteStep(quizId, stepId, user.userId);
  }

  @Post(':quizId/steps/:stepId/options')
  addOption(
    @CurrentUser() user: { userId: string },
    @Param('quizId') quizId: string,
    @Param('stepId') stepId: string,
    @Body() dto: CreateOptionDto,
  ) {
    return this.quizzes.createOption(quizId, stepId, user.userId, dto);
  }

  @Patch(':quizId/options/:optionId')
  patchOption(
    @CurrentUser() user: { userId: string },
    @Param('quizId') quizId: string,
    @Param('optionId') optionId: string,
    @Body() dto: UpdateOptionDto,
  ) {
    return this.quizzes.updateOption(quizId, optionId, user.userId, dto);
  }

  @Delete(':quizId/options/:optionId')
  deleteOption(
    @CurrentUser() user: { userId: string },
    @Param('quizId') quizId: string,
    @Param('optionId') optionId: string,
  ) {
    return this.quizzes.deleteOption(quizId, optionId, user.userId);
  }

  @Post(':quizId/results')
  addResult(
    @CurrentUser() user: { userId: string },
    @Param('quizId') quizId: string,
    @Body() dto: CreateResultDto,
  ) {
    return this.quizzes.createResult(quizId, user.userId, dto);
  }

  @Patch(':quizId/results/:resultId')
  patchResult(
    @CurrentUser() user: { userId: string },
    @Param('quizId') quizId: string,
    @Param('resultId') resultId: string,
    @Body() dto: UpdateResultDto,
  ) {
    return this.quizzes.updateResult(quizId, resultId, user.userId, dto);
  }

  @Delete(':quizId/results/:resultId')
  deleteResult(
    @CurrentUser() user: { userId: string },
    @Param('quizId') quizId: string,
    @Param('resultId') resultId: string,
  ) {
    return this.quizzes.deleteResult(quizId, resultId, user.userId);
  }
}
