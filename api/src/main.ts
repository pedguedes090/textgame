import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3001',
    credentials: true,
  });

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('Text Game RPG API')
    .setDescription('API cho web game săn thú, phó bản, gacha, PVP')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Xác thực & đăng ký')
    .addTag('creatures', 'Quản lý creatures')
    .addTag('hunt', 'Săn thú')
    .addTag('dungeons', 'Phó bản')
    .addTag('gacha', 'Gacha/Triệu hồi')
    .addTag('items', 'Vật phẩm & cường hoá')
    .addTag('pvp', 'PVP & matchmaking')
    .addTag('leaderboard', 'Bảng xếp hạng')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 API running on http://localhost:${port}`);
  console.log(`📚 Swagger docs: http://localhost:${port}/api`);
}

bootstrap();
