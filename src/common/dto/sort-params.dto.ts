// sort-params.dto.ts

import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum StatsSortBy {
  VOLUME = 'VOLUME',
  LIQUIDITY = 'LIQUIDITY',
  FLOOR = 'FLOOR',
  SALES = 'SALES',
  ITEMS = 'ITEMS',
  LISTED = 'LISTED',
  OWNERS = 'OWNERS',
}

export class SortParams {
  @IsOptional()
  @IsString()
  sortAscending?: string;

  @IsOptional()
  @IsEnum(StatsSortBy)
  sortBy?: StatsSortBy;
}
