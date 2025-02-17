import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import * as cors from 'cors';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  app.use(
    cors({
      origin: [
        'http://localhost:3000',
        'http://localhost:5173',
        'http://localhost:8080',
      ],
      credentials: true,
    }),
  );
  await app.listen(3000);
}
bootstrap();
