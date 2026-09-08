/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { DbService } from 'src/db/db.service';


@Injectable()
export class UsersService {
  constructor(
    private readonly db: DbService
) {}

  async create(email: string, passwordHash: string, name?: string) {
    const result = await this.db.query(
      'INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING *',
      [email, passwordHash, name ?? null],
    );
    return result.rows[0];
  }

  async findByEmail(email: string) {
    const result = await this.db.query(
      'SELECT * FROM users WHERE LOWER(email) = LOWER($1)',
      [email],
    );
    return result.rows[0];
  }
}