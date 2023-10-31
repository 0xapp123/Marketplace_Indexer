// stat.controller.ts

import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Cron, CronExpression } from '@nestjs/schedule';
import { StatService } from '../services/stat.service';
import { PaginationParams } from '@common/dto/pagenation-params.dto';
import { FilterParams } from '@common/dto/filter-params.dto';
import { SortParams } from '@common/dto/sort-params.dto';
import { SearchParams } from '@common/dto/search-params.dto';

const moduleName = 'stat';

@ApiTags(moduleName)
@Controller(moduleName)
export class StatController {
  constructor(private readonly statService: StatService) {}

  @Cron(CronExpression.EVERY_10_MINUTES)
  async updateAllStats() {
    await this.statService.updateAllStats();
  }

  @ApiOperation({ summary: 'Get top collections' })
  @Post('top')
  async getTopCollections(@Body() filter: FilterParams) {
    return await this.statService.getTopCollections(filter);
  }

  @ApiOperation({ summary: 'Get notable collections' })
  @Get('notable')
  async getNotableCollections() {
    return await this.statService.getNotableCollections();
  }

  @ApiOperation({ summary: 'Get featured projects' })
  @Get('feature')
  async getFeaturedProject() {
    return await this.statService.getFeaturedProjects();
  }

  @ApiOperation({ summary: 'Get stat by collection id' })
  @Get(':collectionId')
  async getStatByCollectionId(
    @Param('collectionId') collectionId: string,
    @Query() period: FilterParams,
  ) {
    return await this.statService.getStatByCollectionId(collectionId, period);
  }

  @ApiOperation({ summary: 'Get collection stats' })
  @Get()
  async getCollections(
    @Query() sort: SortParams,
    @Query() search: SearchParams,
    @Query() filter: FilterParams,
    @Query() pagination: PaginationParams,
  ) {
    return await this.statService.getCollections(
      sort,
      search,
      filter,
      pagination,
    );
  }
}
