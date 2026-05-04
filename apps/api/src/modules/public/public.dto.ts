import {
  Allow,
  IsArray,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePublicLeadDto {
  @IsUUID()
  quizId!: string;

  @IsOptional()
  @IsString()
  sessionId?: string;

  @IsOptional()
  @IsObject()
  data?: Record<string, unknown>;
}

export class CreatePublicEventDto {
  @IsUUID()
  quizId!: string;

  @IsString()
  type!: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  sessionId?: string;
}

export class ResponseEntryDto {
  @IsUUID()
  stepId!: string;

  @Allow()
  answer!: unknown;
}

export class SavePublicResponsesDto {
  @IsUUID()
  leadId!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ResponseEntryDto)
  entries!: ResponseEntryDto[];
}

export class CompleteQuizDto {
  @IsUUID()
  leadId!: string;

  @IsOptional()
  @IsString()
  sessionId?: string;

  @IsObject()
  answers!: Record<string, unknown>;

  @IsOptional()
  @IsNumber()
  score?: number;
}
