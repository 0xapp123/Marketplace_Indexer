import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';

import { LoggerMiddleware } from '@common/middleware';
import { InkRequestMiddleware } from '@common/middleware/ink-request.middleware';
import { StatModule } from '@modules/stat';

import { CommonModule } from './common';
import { configuration } from './config';
import { HealthModule } from './health';
import { PrismaModule } from './prisma';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    ScheduleModule.forRoot(),
    CommonModule,
    HealthModule,
    PrismaModule,
    StatModule,
  ],
})
export class AppModule implements NestModule {
  // Global Middleware, Inbound logging
  public configure(consumer: MiddlewareConsumer): void {
    consumer.apply(LoggerMiddleware, InkRequestMiddleware).forRoutes('*');
  }
}
