import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { DbService } from './db.service';

const mockQuery = jest.fn();
const mockEnd = jest.fn();
const mockPoolCtor = jest.fn();

jest.mock('pg', () => ({
  Pool: jest.fn().mockImplementation((config: unknown) => {
    mockPoolCtor(config);
    return { query: mockQuery, end: mockEnd };
  }),
}));

const ENV = {
  DB_HOST: 'localhost',
  DB_PORT: 5432,
  DB_USER: 'auth_user',
  DB_PASSWORD: 'auth_password',
  DB_NAME: 'auth_db',
};

// DbService traduce las variables DB_* a las claves que espera pg.
const EXPECTED_POOL_CONFIG = {
  host: 'localhost',
  port: 5432,
  user: 'auth_user',
  password: 'auth_password',
  database: 'auth_db',
};

describe('DbService', () => {
  let service: DbService;

  const build = async () => {
    const configValues: Record<string, unknown> = { ...ENV };
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        DbService,
        {
          provide: ConfigService,
          useValue: { get: (k: string) => configValues[k] },
        },
      ],
    }).compile();

    return moduleRef.get(DbService);
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockQuery.mockResolvedValue({ rows: [] });
    mockEnd.mockResolvedValue(undefined);
  });

  describe('construccion', () => {
    it('debe crear el Pool con la configuracion de DB_*', async () => {
      await build();

      expect(mockPoolCtor).toHaveBeenCalledWith(EXPECTED_POOL_CONFIG);
    });
  });

  describe('query', () => {
    it('debe delegar la query al Pool', async () => {
      service = await build();
      const result = { rows: [{ id: 'abc' }] };
      mockQuery.mockResolvedValue(result);

      const response = await service.query('SELECT * FROM users WHERE id=$1', [
        'abc',
      ]);

      expect(mockQuery).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE id=$1',
        ['abc'],
      );
      expect(response).toBe(result);
    });

    it('debe soportar queries sin parametros', async () => {
      service = await build();

      await service.query('SELECT 1');

      expect(mockQuery).toHaveBeenCalledWith('SELECT 1', undefined);
    });
  });

  describe('onModuleDestroy', () => {
    it('debe cerrar el Pool al destruir el modulo', async () => {
      service = await build();

      await service.onModuleDestroy();

      expect(mockEnd).toHaveBeenCalledTimes(1);
    });
  });
});
