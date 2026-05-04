import { Injectable, NotFoundException } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import type { Database } from '../../database/drizzle.factory.js';
import { DRIZZLE } from '../../database/tokens.js';
import { profiles } from '../../database/schema.js';

@Injectable()
export class UsersService {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async getProfile(userId: string) {
    const [row] = await this.db
      .select()
      .from(profiles)
      .where(eq(profiles.id, userId))
      .limit(1);
    if (!row) throw new NotFoundException('Perfil não encontrado');
    return row;
  }
}
