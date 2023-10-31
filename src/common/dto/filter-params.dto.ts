// filter-params.dto.ts

import { PeriodType } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';

export class FilterParams {
  @IsOptional()
  @IsEnum(PeriodType)
  period?: PeriodType;
}
