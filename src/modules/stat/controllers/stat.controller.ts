// stat.controller.ts

import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Cron, CronExpression } from '@nestjs/schedule';
import { StatService } from '../services/stat.service';

const moduleName = 'stat';

@ApiTags(moduleName)
@Controller(moduleName)
export class StatController {
  constructor(private readonly statService: StatService) {}

  @Cron(CronExpression.EVERY_10_MINUTES)
  async updateAllStats() {
    await this.statService.updateAllStats();
  }
}
