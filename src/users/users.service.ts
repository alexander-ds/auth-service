/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { DbService } from 'src/db/db.service';


@Injectable()
export class UsersService {
  constructor(
    private readonly db: DbService
) {}

  async create(email: string, password: string) {
    const result = await this.db.query(
      'INSERT INTO users (email, password) VALUES ($1, $2) RETURNING *',
      [email, password],
    );
    return result.rows[0];
  }

  async findByEmail(email: string) {
    const result = await this.db.query(
      'SELECT * FROM users WHERE email = $1',
      [email],
    );
    return result.rows[0];
  }
}