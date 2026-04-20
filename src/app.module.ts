import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { appConfig, authConfig, databaseConfig, redisConfig } from './common/config';
import { DatabaseModule } from './common/database';
import { GlobalExceptionFilter } from './common/filters';
import { JwtAuthGuard } from './common/guards';
import { RedisModule } from './common/redis';
import { AuthModule } from './modules/auth';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, authConfig, databaseConfig, redisConfig],
    }),
    DatabaseModule,
    RedisModule,
    AuthModule,
  ],
  providers: [
    { provide: APP_FILTER, useClass: GlobalExceptionFilter },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class AppModule {}
