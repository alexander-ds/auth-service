import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: { register: jest.Mock; login: jest.Mock };

  beforeEach(async () => {
    authService = { register: jest.fn(), login: jest.fn() };

    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authService }],
    }).compile();

    controller = moduleRef.get(AuthController);
  });

  describe('POST /auth/register', () => {
    it('debe delegar email, password y name a AuthService', () => {
      const created = { id: 'abc', email: 'nuevo@inventory.local' };
      authService.register.mockReturnValue(created);

      const result = controller.register({
        email: 'nuevo@inventory.local',
        password: '123456',
        name: 'Nuevo',
      });

      expect(authService.register).toHaveBeenCalledWith(
        'nuevo@inventory.local',
        '123456',
        'Nuevo',
      );
      expect(result).toBe(created);
    });

    it('debe propagar el error de AuthService', () => {
      authService.register.mockImplementation(() => {
        throw new Error('email duplicado');
      });

      expect(() =>
        controller.register({
          email: 'duplicado@inventory.local',
          password: '123456',
          name: 'Dup',
        }),
      ).toThrow('email duplicado');
    });
  });

  describe('POST /auth/login', () => {
    it('debe delegar email y password a AuthService', () => {
      const tokens = { access_token: 'fake.jwt.token' };
      authService.login.mockReturnValue(tokens);

      const result = controller.login({
        email: 'admin@inventory.local',
        password: '123456',
      });

      expect(authService.login).toHaveBeenCalledWith(
        'admin@inventory.local',
        '123456',
      );
      expect(result).toBe(tokens);
    });

    it('debe propagar UnauthorizedException sin envolverla', () => {
      authService.login.mockImplementation(() => {
        throw new Error('boom');
      });

      expect(() =>
        controller.login({
          email: 'admin@inventory.local',
          password: 'mal',
        }),
      ).toThrow('boom');
    });
  });
});
