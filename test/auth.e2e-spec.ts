import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { DbService } from './../src/db/db.service';

// Requiere Postgres con db/schema.sql aplicado.
// En CI lo levanta el service container; en local, la BD de desarrollo.
describe('Auth (e2e)', () => {
  let app: INestApplication;
  let db: DbService;
  let jwtService: JwtService;

  const uniqueEmail = `e2e-${Date.now()}@inventory.local`;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Debe replicar el pipe de main.ts para que la validacion sea real.
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );

    await app.init();

    db = app.get(DbService);
    jwtService = app.get(JwtService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /auth/register', () => {
    it('debe registrar un usuario nuevo', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: uniqueEmail, name: 'E2E User', password: '123456' })
        .expect(201);

      expect(res.body.email).toBe(uniqueEmail);
    });

    it('debe persistir el usuario con password hasheado, no en texto plano', async () => {
      const { rows } = await db.query(
        'SELECT password_hash FROM users WHERE email = $1',
        [uniqueEmail],
      );

      expect(rows).toHaveLength(1);
      expect(rows[0].password_hash).not.toBe('123456');
      expect(rows[0].password_hash).toMatch(/^\$2[aby]\$/);
    });

    it('debe rechazar un email invalido con 400', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: 'no-es-un-email', name: 'X', password: '123456' })
        .expect(400);
    });

    it('debe rechazar un password menor a 6 caracteres con 400', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: 'corto@inventory.local', name: 'X', password: '12345' })
        .expect(400);
    });
  });

  describe('POST /auth/login', () => {
    it('debe autenticar con credenciales validas y devolver access_token', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: uniqueEmail, password: '123456' })
        .expect(201);

      expect(res.body.access_token).toBeDefined();
      expect(res.body).not.toHaveProperty('password_hash');
    });

    it('debe emitir un JWT firmable con los claims esperados', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: uniqueEmail, password: '123456' });

      const payload = jwtService.verify(res.body.access_token);

      expect(payload.email).toBe(uniqueEmail);
      expect(payload.sub).toBeDefined();
      expect(payload.name).toBe('E2E User');
    });

    it('debe expirar el token en 1 hora', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: uniqueEmail, password: '123456' });

      const { iat, exp } = jwtService.decode(res.body.access_token) as {
        iat: number;
        exp: number;
      };

      expect(exp - iat).toBe(3600);
    });

    it('debe rechazar password incorrecto con 401', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: uniqueEmail, password: 'clave-mala' })
        .expect(401);
    });

    it('debe rechazar usuario inexistente con 401', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'no-existe-e2e@inventory.local', password: '123456' })
        .expect(401);
    });

    it('debe ser case-insensitive en el email', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: uniqueEmail.toUpperCase(), password: '123456' })
        .expect(201);

      expect(res.body.access_token).toBeDefined();
    });

    it('debe rechazar un payload sin password con 400', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: uniqueEmail })
        .expect(400);
    });
  });
});
