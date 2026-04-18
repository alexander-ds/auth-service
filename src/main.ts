/* eslint-disable prettier/prettier */
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 🔐 Configuración global de variables de entorno
  const configService = app.get(ConfigService);

  // 🌐 CORS (importante para frontend)
  app.enableCors({
    origin: '*', // en producción pon tu dominio
    methods: 'GET,POST,PUT,DELETE',
    credentials: true,
  });

  // 🧪 Validación automática de DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // elimina campos no definidos en DTO
      forbidNonWhitelisted: true, // lanza error si envían campos extra
      transform: true, // transforma payloads a clases
    }),
  );

  // 🚀 Puerto desde .env
  const port = configService.get<number>('PORT') || 3000;

  await app.listen(port);

  console.log(`🚀 Auth service running on: http://localhost:${port}`);
}

bootstrap();