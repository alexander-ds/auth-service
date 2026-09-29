import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { RegisterDto, LoginDto } from './auth.dto';

const errorsFor = async (cls: any, payload: Record<string, unknown>) => {
  const instance = plainToInstance(cls, payload) as object;
  const errors = await validate(instance);
  return Object.keys(
    errors.reduce<Record<string, string[]>>((acc, error) => {
      acc[error.property] = Object.values(error.constraints ?? {});
      return acc;
    }, {}),
  );
};

describe('RegisterDto', () => {
  it('debe aceptar un payload valido', async () => {
    await expect(
      errorsFor(RegisterDto, {
        email: 'nuevo@inventory.local',
        name: 'Nuevo',
        password: '123456',
      }),
    ).resolves.toEqual([]);
  });

  it('debe rechazar un email invalido', async () => {
    await expect(
      errorsFor(RegisterDto, {
        email: 'no-es-un-email',
        name: 'Nuevo',
        password: '123456',
      }),
    ).resolves.toEqual(expect.arrayContaining(['email']));
  });

  it('debe exigir email', async () => {
    await expect(
      errorsFor(RegisterDto, { name: 'Nuevo', password: '123456' }),
    ).resolves.toEqual(expect.arrayContaining(['email']));
  });

  it('debe exigir un password de al menos 6 caracteres', async () => {
    await expect(
      errorsFor(RegisterDto, {
        email: 'nuevo@inventory.local',
        name: 'Nuevo',
        password: '12345',
      }),
    ).resolves.toEqual(expect.arrayContaining(['password']));
  });

  it('debe rechazar un password no string', async () => {
    await expect(
      errorsFor(RegisterDto, {
        email: 'nuevo@inventory.local',
        name: 'Nuevo',
        password: 123456,
      }),
    ).resolves.toEqual(expect.arrayContaining(['password']));
  });

  it('debe rechazar un name no string', async () => {
    await expect(
      errorsFor(RegisterDto, {
        email: 'nuevo@inventory.local',
        name: 42,
        password: '123456',
      }),
    ).resolves.toEqual(expect.arrayContaining(['name']));
  });
});

describe('LoginDto', () => {
  it('debe aceptar un payload valido', async () => {
    await expect(
      errorsFor(LoginDto, {
        email: 'admin@inventory.local',
        password: '123456',
      }),
    ).resolves.toEqual([]);
  });

  it('debe rechazar un email invalido', async () => {
    await expect(
      errorsFor(LoginDto, { email: 'invalido', password: '123456' }),
    ).resolves.toEqual(expect.arrayContaining(['email']));
  });

  it('debe exigir password', async () => {
    await expect(
      errorsFor(LoginDto, { email: 'admin@inventory.local' }),
    ).resolves.toEqual(expect.arrayContaining(['password']));
  });

  it('no debe exigir minlength de 6 en login', async () => {
    await expect(
      errorsFor(LoginDto, {
        email: 'admin@inventory.local',
        password: '123',
      }),
    ).resolves.toEqual([]);
  });
});
