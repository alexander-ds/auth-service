import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { DbService } from 'src/db/db.service';

describe('UsersService', () => {
  let service: UsersService;
  let db: { query: jest.Mock };

  beforeEach(async () => {
    db = { query: jest.fn() };

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [UsersService, { provide: DbService, useValue: db }],
    }).compile();

    service = moduleRef.get(UsersService);
  });

  describe('create', () => {
    it('debe insertar y devolver la fila creada', async () => {
      const row = { id: 'abc', email: 'nuevo@inventory.local' };
      db.query.mockResolvedValue({ rows: [row] });

      const result = await service.create(
        'nuevo@inventory.local',
        'hash123',
        'Nuevo',
      );

      expect(result).toBe(row);
      expect(db.query).toHaveBeenCalledTimes(1);
    });

    it('debe pasar email, hash y name como parametros posicionales', async () => {
      db.query.mockResolvedValue({ rows: [{}] });

      await service.create('nuevo@inventory.local', 'hash123', 'Nuevo');

      const [query, params] = db.query.mock.calls[0];
      expect(query).toContain('INSERT INTO users');
      expect(params).toEqual(['nuevo@inventory.local', 'hash123', 'Nuevo']);
    });

    it('debe convertir name ausente en NULL', async () => {
      db.query.mockResolvedValue({ rows: [{}] });

      await service.create('sin-nombre@inventory.local', 'hash123');

      expect(db.query.mock.calls[0][1][2]).toBeNull();
    });

    it('debe pasar el hash como parametro y nunca interpolarlo en el SQL', async () => {
      db.query.mockResolvedValue({ rows: [{}] });

      await service.create('nuevo@inventory.local', 'hash123', 'Nuevo');

      const [query, params] = db.query.mock.calls[0];
      expect(params).toContain('hash123');
      expect(query).toContain('$2');
      expect(query).not.toContain('hash123');
    });
  });

  describe('findByEmail', () => {
    it('debe devolver la fila encontrada', async () => {
      const row = { id: 'abc', email: 'admin@inventory.local' };
      db.query.mockResolvedValue({ rows: [row] });

      const result = await service.findByEmail('admin@inventory.local');

      expect(result).toBe(row);
    });

    it('debe comparar el email case-insensitive', async () => {
      db.query.mockResolvedValue({ rows: [] });

      await service.findByEmail('Admin@Inventory.Local');

      expect(db.query.mock.calls[0][0]).toContain('LOWER(email)');
      expect(db.query.mock.calls[0][1]).toEqual(['Admin@Inventory.Local']);
    });

    it('debe devolver undefined cuando no hay coincidencias', async () => {
      db.query.mockResolvedValue({ rows: [] });

      await expect(
        service.findByEmail('no-existe@inventory.local'),
      ).resolves.toBeUndefined();
    });
  });
});
