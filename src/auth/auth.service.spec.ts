import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UsersService } from 'src/users/users.service';

const JWT_SECRET = 'unit_test_secret';
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
  id: '3f1b0c2e-0000-4000-8000-000000000001',
  email: 'admin@inventory.local',
  password_hash: await bcrypt.hash(PASSWORD, 10),
  name: 'Admin',
  ...overrides,
});

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: JwtService;
  let usersService: { create: jest.Mock; findByEmail: jest.Mock };

  beforeEach(async () => {
    usersService = { create: jest.fn(), findByEmail: jest.fn() };

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        {
          provide: JwtService,
          useFactory: () =>
            new JwtService({
              secret: JWT_SECRET,
              signOptions: { expiresIn: '1h' },
            }),
        },
      ],
    }).compile();

    service = moduleRef.get(AuthService);
    jwtService = moduleRef.get(JwtService);
  });

  describe('register', () => {
    it('debe guardar el password como hash bcrypt, nunca en texto plano', async () => {
      usersService.create.mockResolvedValue({ id: 'abc' });

      await service.register('nuevo@inventory.local', PASSWORD, 'Nuevo');

      const [, hash] = usersService.create.mock.calls[0];
      expect(hash).not.toBe(PASSWORD);
      expect(hash).toMatch(/^\$2[aby]\$/);
      await expect(bcrypt.compare(PASSWORD, hash)).resolves.toBe(true);
    });

    it('debe delegar email, hash y nombre a UsersService', async () => {
      usersService.create.mockResolvedValue({ id: 'abc' });

      const result = await service.register(
        'nuevo@inventory.local',
        PASSWORD,
        'Nuevo',
      );

      expect(usersService.create).toHaveBeenCalledTimes(1);
      expect(usersService.create.mock.calls[0][0]).toBe(
        'nuevo@inventory.local',
      );
      expect(usersService.create.mock.calls[0][2]).toBe('Nuevo');
      expect(result).toEqual({ id: 'abc' });
    });

    it('debe permitir registro sin nombre', async () => {
      usersService.create.mockResolvedValue({ id: 'abc' });

      await service.register('sin-nombre@inventory.local', PASSWORD);

      expect(usersService.create.mock.calls[0][2]).toBeUndefined();
    });

    it('debe generar un hash distinto para el mismo password', async () => {
      usersService.create.mockResolvedValue({ id: 'abc' });

      await service.register('a@inventory.local', PASSWORD);
      await service.register('b@inventory.local', PASSWORD);

      const firstHash = usersService.create.mock.calls[0][1];
      const secondHash = usersService.create.mock.calls[1][1];
      expect(firstHash).not.toBe(secondHash);
    });
  });

  describe('login', () => {
    it('debe rechazar cuando el usuario no existe', async () => {
      usersService.findByEmail.mockResolvedValue(undefined);

      await expect(
        service.login('no-existe@inventory.local', PASSWORD),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('debe rechazar cuando el password es incorrecto', async () => {
      const user = await buildUser();
      usersService.findByEmail.mockResolvedValue(user);

      await expect(
        service.login(user.email, 'password-equivocado'),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('debe buscar el usuario por email sin distinguir mayusculas', async () => {
      const user = await buildUser();
      usersService.findByEmail.mockResolvedValue(user);

      await service.login(user.email, PASSWORD);

      expect(usersService.findByEmail).toHaveBeenCalledWith(
        'admin@inventory.local',
      );
    });

    it('debe devolver un access_token cuando las credenciales son validas', async () => {
      const user = await buildUser();
      usersService.findByEmail.mockResolvedValue(user);

      const result = await service.login(user.email, PASSWORD);

      expect(result).toHaveProperty('access_token');
      expect(typeof result.access_token).toBe('string');
      expect(result.access_token.split('.')).toHaveLength(3);
    });

    it('debe firmar el token con el secret configurado', async () => {
      const user = await buildUser();
      usersService.findByEmail.mockResolvedValue(user);

      const { access_token } = await service.login(user.email, PASSWORD);

      expect(() =>
        jwtService.verify(access_token, { secret: JWT_SECRET }),
      ).not.toThrow();
      expect(() =>
        jwtService.verify(access_token, { secret: 'otro_secret' }),
      ).toThrow();
    });
  });

  describe('claims del JWT', () => {
    it('debe incluir sub con el id del usuario', async () => {
      const user = await buildUser();
      usersService.findByEmail.mockResolvedValue(user);

      const { access_token } = await service.login(user.email, PASSWORD);

      expect(jwtService.verify(access_token).sub).toBe(user.id);
    });

    it('debe incluir email en los claims', async () => {
      const user = await buildUser();
      usersService.findByEmail.mockResolvedValue(user);

      const { access_token } = await service.login(user.email, PASSWORD);

      expect(jwtService.verify(access_token).email).toBe(user.email);
    });

    it('debe incluir name cuando el usuario tiene nombre', async () => {
      const user = await buildUser({ name: 'Admin' });
      usersService.findByEmail.mockResolvedValue(user);

      const { access_token } = await service.login(user.email, PASSWORD);

      expect(jwtService.verify(access_token).name).toBe('Admin');
    });

    it('debe omitir name cuando el usuario no tiene nombre', async () => {
      const user = await buildUser({ name: null });
      usersService.findByEmail.mockResolvedValue(user);

      const { access_token } = await service.login(user.email, PASSWORD);

      expect(jwtService.verify(access_token)).not.toHaveProperty('name');
    });

    it('no debe filtrar el password_hash en los claims', async () => {
      const user = await buildUser();
      usersService.findByEmail.mockResolvedValue(user);

      const { access_token } = await service.login(user.email, PASSWORD);
      const payload = jwtService.decode(access_token) as Record<
        string,
        unknown
      >;

      expect(Object.keys(payload)).toEqual(
        expect.arrayContaining(['sub', 'email', 'iat', 'exp']),
      );
      expect(payload).not.toHaveProperty('password_hash');
      expect(payload).not.toHaveProperty('passwordHash');
    });
  });

  describe('expiracion del JWT', () => {
    it('debe expirar en 1 hora (3600 segundos)', async () => {
      const user = await buildUser();
      usersService.findByEmail.mockResolvedValue(user);

      const { access_token } = await service.login(user.email, PASSWORD);
      const { iat, exp } = jwtService.decode(access_token) as {
        iat: number;
        exp: number;
      };

      expect(exp - iat).toBe(3600);
    });

    it('debe generar un token aun no expirado al momento del login', async () => {
      const user = await buildUser();
      usersService.findByEmail.mockResolvedValue(user);

      const { access_token } = await service.login(user.email, PASSWORD);

      expect(jwtService.verify(access_token)).toBeDefined();
    });

    it('debe rechazar un token expirado', async () => {
      const expired = jwtService.sign(
        { sub: 'x' },
        { secret: JWT_SECRET, expiresIn: '-1s' },
      );

      expect(() => jwtService.verify(expired)).toThrow(/expired/i);
    });
  });
});
