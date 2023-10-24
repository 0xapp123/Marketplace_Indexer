import { Module } from '@nestjs/common';
import { StatService } from './services/stat.service';
import { StatController } from './controllers/stat.controller';
@Module({
  controllers: [StatController],
  providers: [StatService],
})
export class StatModule {}
