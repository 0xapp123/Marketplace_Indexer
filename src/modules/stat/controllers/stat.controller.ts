// stat.controller.ts

import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Cron, CronExpression } from '@nestjs/schedule';
import { StatService } from '../services/stat.service';

const moduleName = 'stat';

@ApiTags(moduleName)
@Controller(moduleName)
export class StatController {
  constructor(private readonly statService: StatService) {}

  @Cron('* * * * *')
  async updateAllStats() {
    await this.statService.updateAllStats();
  }

  @ApiOperation({ summary: 'Get top collections' })
  @Get('top/:period')
  async getTopCollections(@Param('period') period: string) {
    return await this.statService.getTopCollections(period);
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
  async getStatByCollectionId(@Param('collectionId') collectionId: string) {
    return await this.statService.getStatByCollectionId(collectionId);
  }
}
