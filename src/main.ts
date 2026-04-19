/* eslint-disable prettier/prettier */
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';


async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);

  // CORS
  app.enableCors();

  // ValidationPipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // Swagger config
  const config = new DocumentBuilder()
    .setTitle('Auth Service')
    .setDescription('Microservicio de autenticación con JWT')
    .setVersion('1.0')
    .addBearerAuth() // habilita JWT en Swagger
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('docs', app, document); 
  // 👉 http://localhost:3000/docs

  const port = configService.get<number>('PORT') || 3000;

  await app.listen(port);

  console.log(`Running on http://localhost:${port}`);
  console.log(`Swagger available on http://localhost:${port}/docs`);
}

bootstrap();
