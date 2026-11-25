import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import * as request from 'supertest';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersService } from 'src/users/users.service';

// No se usa la BD real: UsersService esta mockeado y DbService ni se registra.
// Asi esta suite corre con `npm test` sin PostgreSQL.
const JWT_SECRET = 'http_test_secret';
const PASSWORD = '123456';

type FakeUser = {
  id: string;
  email: string;
  password_hash: string;
  name: string | null;
};

const buildUser = async (
  overrides: Partial<FakeUser> = {},
): Promise<FakeUser> => ({
  id: '3f1b0c2e-0000-4000-8000-000000000002',
  email: 'admin@inventory.local',
  password_hash: await bcrypt.hash(PASSWORD, 10),
  name: 'Admin',
  ...overrides,
});

describe('Auth HTTP (sin base de datos)', () => {
  let app: INestApplication;
  let users: { create: jest.Mock; findByEmail: jest.Mock };
  let jwtService: JwtService;

  beforeEach(async () => {
    users = { create: jest.fn(), findByEmail: jest.fn() };

    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        AuthService,
        { provide: UsersService, useValue: users },
        {
          provide: JwtService,
          useValue: new JwtService({
            secret: JWT_SECRET,
            signOptions: { expiresIn: '1h' },
          }),
        },
      ],
    }).compile();

    jwtService = moduleRef.get(JwtService);
    app = moduleRef.createNestApplication();

    // Mismo pipe que main.ts: valida los DTO y descarta campos extra.
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /auth/register', () => {
    it('registra al usuario con el password hasheado', async () => {
      users.create.mockResolvedValue({
        id: 'abc',
        email: 'nuevo@inventory.local',
      });

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'nuevo@inventory.local',
          name: 'Nuevo',
          password: PASSWORD,
        })
        .expect(201);

      expect(response.body).toEqual({
        id: 'abc',
        email: 'nuevo@inventory.local',
      });
      expect(users.create).toHaveBeenCalledTimes(1);

      const [email, hash, name] = users.create.mock.calls[0];
      expect(email).toBe('nuevo@inventory.local');
      expect(name).toBe('Nuevo');
      expect(hash).not.toBe(PASSWORD);
      await expect(bcrypt.compare(PASSWORD, hash)).resolves.toBe(true);
      expect(JSON.stringify(response.body)).not.toContain(PASSWORD);
    });

    it('devuelve 400 con email invalido y no llama a UsersService', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: 'no-es-un-email', name: 'X', password: PASSWORD })
        .expect(400);

      expect(users.create).not.toHaveBeenCalled();
    });

    it('devuelve 400 con password menor a 6 caracteres', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: 'corto@inventory.local', name: 'X', password: '12345' })
        .expect(400);

      expect(users.create).not.toHaveBeenCalled();
    });

    it('descarta campos extra: el cliente no puede inyectar roles', async () => {
      users.create.mockResolvedValue({ id: 'abc' });

      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'nuevo@inventory.local',
          name: 'Nuevo',
          password: PASSWORD,
          roles: ['ADMIN'],
        })
        .expect(201);

      expect(users.create.mock.calls[0]).toHaveLength(3);
      expect(users.create.mock.calls[0][2]).toBe('Nuevo');
    });
  });

  describe('POST /auth/login', () => {
    it('devuelve un JWT valido con los claims acordados', async () => {
      const user = await buildUser();
      users.findByEmail.mockResolvedValue(user);

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: user.email, password: PASSWORD })
        .expect(201);

      expect(typeof response.body.access_token).toBe('string');
      expect(response.body).not.toHaveProperty('password_hash');

      const payload = jwtService.verify(response.body.access_token);
      expect(payload).toMatchObject({
        sub: user.id,
        email: user.email,
        name: 'Admin',
      });
      expect(payload).not.toHaveProperty('password_hash');
      // Los roles son una decision futura: hoy no deben aparecer en el token.
      expect(payload).not.toHaveProperty('roles');
    });

    it('omite el claim name cuando el usuario no tiene nombre', async () => {
      const user = await buildUser({ name: null });
      users.findByEmail.mockResolvedValue(user);

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: user.email, password: PASSWORD })
        .expect(201);

      expect(jwtService.verify(response.body.access_token)).not.toHaveProperty(
        'name',
      );
    });

    it('devuelve 401 con password incorrecto', async () => {
      const user = await buildUser();
      users.findByEmail.mockResolvedValue(user);

      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: user.email, password: 'clave-mala' })
        .expect(401);
    });

    it('devuelve 401 con usuario inexistente', async () => {
      users.findByEmail.mockResolvedValue(undefined);

      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'no-existe@inventory.local', password: PASSWORD })
        .expect(401);
    });

    it('devuelve 400 cuando falta el password', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'admin@inventory.local' })
        .expect(400);

      expect(users.findByEmail).not.toHaveBeenCalled();
    });

    it('el token generado expira en 1 hora', async () => {
      const user = await buildUser();
      users.findByEmail.mockResolvedValue(user);

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: user.email, password: PASSWORD })
        .expect(201);

      const { iat, exp } = jwtService.decode(response.body.access_token) as {
        iat: number;
        exp: number;
      };
      expect(exp - iat).toBe(3600);
    });
  });
});
