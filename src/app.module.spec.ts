import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from './app.module';
import { AuthController } from './auth/auth.controller';
import { AuthService } from './auth/auth.service';
import { UsersService } from './users/users.service';
import { DbService } from './db/db.service';
import { AppController } from './app.controller';

// El Pool de pg es lazy: no abre conexion hasta el primer query,
// por lo que este test no necesita Postgres.
describe('AppModule (wiring)', () => {
  let moduleRef: TestingModule;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    await moduleRef.init();
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  it('debe resolver AppController', () => {
    expect(moduleRef.get(AppController)).toBeInstanceOf(AppController);
  });

  it('debe resolver AuthController', () => {
    expect(moduleRef.get(AuthController)).toBeInstanceOf(AuthController);
  });

  it('debe resolver AuthService con UsersService inyectado', () => {
    const authService = moduleRef.get(AuthService);

    expect(authService).toBeInstanceOf(AuthService);
    expect(moduleRef.get(UsersService)).toBeInstanceOf(UsersService);
  });

  it('debe exponer DbService globalmente (sin importar DbModule)', () => {
    expect(moduleRef.get(DbService, { strict: false })).toBeInstanceOf(
      DbService,
    );
  });
});
