import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configureSwagger } from './config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: true,        // 👈 Acepta cualquier origen (dev)
    credentials: true,
  });

  configureSwagger(app);

  await app.listen(process.env.PORT || 3000);
}

bootstrap();
