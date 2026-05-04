import {
  IsArray,
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateQuizDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  slug?: string;
}

export class UpdateQuizDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsIn(['draft', 'published'])
  status?: 'draft' | 'published';

  @IsOptional()
  @IsObject()
  theme?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  facebookPixelId?: string | null;

  @IsOptional()
  @IsString()
  googleAnalyticsId?: string | null;

  @IsOptional()
  @IsString()
  googleTagManagerId?: string | null;

  @IsOptional()
  @IsString()
  tiktokPixelId?: string | null;

  @IsOptional()
  @IsString()
  webhookUrl?: string | null;
}

export class CreateStepDto {
  @IsIn(['question', 'input', 'content', 'result'])
  type!: 'question' | 'input' | 'content' | 'result';

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

export class UpdateStepDto {
  @IsOptional()
  @IsIn(['question', 'input', 'content', 'result'])
  type?: 'question' | 'input' | 'content' | 'result';

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;

  @IsOptional()
  orderIndex?: number;
}

export class ReorderStepsDto {
  @IsArray()
  @IsUUID('4', { each: true })
  orderedStepIds!: string[];
}

export class CreateOptionDto {
  @IsString()
  label!: string;

  @IsString()
  value!: string;

  @IsOptional()
  @IsUUID()
  nextStepId?: string | null;
}

export class UpdateOptionDto {
  @IsOptional()
  @IsString()
  label?: string;

  @IsOptional()
  @IsString()
  value?: string;

  @IsOptional()
  @IsUUID()
  nextStepId?: string | null;

  @IsOptional()
  orderIndex?: number;
}

export class CreateResultDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsObject()
  conditions?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  redirectUrl?: string | null;
}

export class UpdateResultDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsObject()
  conditions?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  redirectUrl?: string | null;

  @IsOptional()
  orderIndex?: number;
}
