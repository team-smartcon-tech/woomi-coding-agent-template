import { Inject, Injectable, Optional } from '@nestjs/common';
import { desc, eq } from 'drizzle-orm';
import * as bcrypt from 'bcryptjs';
import { CreatableRoles, UserRole } from '../auth/types/user-role';
import { DATABASE, type DB } from '../../../database/db.module';
import { usersTable } from '../../../database/schema';

const SALT_ROUND = 10;

type CreateUserOption = {
  username: string;
  password: string;
  role?: typeof usersTable.$inferSelect.role;
  created?: Date;
};

export enum UserUpdateErrors {
  NOT_FULFILLED_ARGS = 'NOT_FULFILLED_ARGS',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  DATABASE_NOT_READY = 'DATABASE_NOT_READY',
}

export type UserUpdateResult = {
  result: boolean;
  error?: UserUpdateErrors;
};

export class UsersDomainError extends Error {
  constructor(
    public readonly code: 'DATABASE_NOT_READY' | 'DUPLICATE_USER' | 'USER_CREATE_FAILED',
    public readonly meta?: Record<string, unknown>,
  ) {
    super(code);
  }
}

@Injectable()
export class UsersService {
  constructor(@Optional() @Inject(DATABASE) private readonly db?: DB) {}

  async findByUsername(username: string) {
    if (!this.db) {
      return null;
    }

    const [user] = await this.db
      .select()
      .from(usersTable)
      .where(eq(usersTable.username, username))
      .limit(1);

    return user ?? null;
  }

  async findById(id: number) {
    if (!this.db) {
      return null;
    }

    const [user] = await this.db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);
    return user ?? null;
  }

  async createUser(username: string, password: string, role: CreatableRoles = UserRole.User) {
    return this.createUserRecord({ username, password, role });
  }

  async createUserRecord(option: CreateUserOption) {
    if (!this.db) {
      throw new UsersDomainError('DATABASE_NOT_READY');
    }

    const username = option.username.trim();
    const password = option.password.trim();
    const hashedPassword = await bcrypt.hash(password, SALT_ROUND);

    try {
      const [created] = await this.db
        .insert(usersTable)
        .values({
          username,
          password: hashedPassword,
          role: option.role ?? UserRole.User,
          created: option.created ?? new Date(),
        })
        .returning({
          id: usersTable.id,
          username: usersTable.username,
          role: usersTable.role,
          created: usersTable.created,
        });

      return created;
    } catch (error) {
      const pgError = this.extractPgError(error);
      if (pgError.code === '23505') {
        throw new UsersDomainError('DUPLICATE_USER');
      }

      throw new UsersDomainError('USER_CREATE_FAILED', {
        dbCode: pgError.code ?? null,
        dbMessage: pgError.message ?? null,
        dbDetail: pgError.detail ?? null,
        dbHint: pgError.hint ?? null,
      });
    }
  }

  async findAll() {
    if (!this.db) {
      return [];
    }

    return this.db
      .select({
        id: usersTable.id,
        username: usersTable.username,
        role: usersTable.role,
        created: usersTable.created,
      })
      .from(usersTable)
      .orderBy(desc(usersTable.created));
  }

  async delete(username: string) {
    if (!this.db) {
      return { deleted: 0 };
    }

    const deleted = await this.db.delete(usersTable).where(eq(usersTable.username, username)).returning({
      id: usersTable.id,
    });

    return { deleted: deleted.length };
  }

  async update(option: {
    username: string;
    password?: string;
    role?: CreatableRoles;
  }): Promise<UserUpdateResult> {
    if (!this.db) {
      return {
        result: false,
        error: UserUpdateErrors.DATABASE_NOT_READY,
      };
    }

    const { username, password, role } = option;
    const user = await this.findByUsername(username);
    if (!user) {
      return {
        result: false,
        error: UserUpdateErrors.USER_NOT_FOUND,
      };
    }

    if (!password && !role) {
      return {
        result: false,
        error: UserUpdateErrors.NOT_FULFILLED_ARGS,
      };
    }

    const hashedPassword = password ? await bcrypt.hash(password, SALT_ROUND) : undefined;

    await this.db
      .update(usersTable)
      .set({
        password: hashedPassword,
        role,
      })
      .where(eq(usersTable.id, user.id));

    return {
      result: true,
    };
  }

  private extractPgError(error: unknown) {
    const err = error as Record<string, unknown> | undefined;
    const cause = (err?.cause ?? error) as Record<string, unknown> | undefined;

    return {
      code: this.asString(cause?.code ?? err?.code),
      message: this.asString(cause?.message ?? err?.message),
      detail: this.asString(cause?.detail),
      hint: this.asString(cause?.hint),
    };
  }

  private asString(value: unknown): string | undefined {
    return typeof value === 'string' ? value : undefined;
  }
}
