/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { DbModule } from './db/db.module';

@Module({
  imports: [
    // 🌍 Variables de entorno globales
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // 🗄️ Base de datos (Postgres pool)
    DbModule,

    // 👤 Usuarios
    UsersModule,

    // 🔐 Auth (JWT, login, register)
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}