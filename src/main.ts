import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  // Security headers
  app.use(helmet());

  // Cookie parsing
  app.use(cookieParser());

  // Global prefix
  app.setGlobalPrefix('api');

  // CORS
  app.enableCors({
    origin: config.get<string>('app.corsOrigin'),
    credentials: true,
  });

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = config.get<number>('app.port') ?? 3001;
  await app.listen(port);
  console.log(`Auth service running on http://localhost:${port}/api`);
}

bootstrap();
