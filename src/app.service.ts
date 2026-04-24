import { Injectable } from '@nestjs/common';
import { UsersDomainError, UsersService } from './domains/identity/users/users.service';

type CreateUserInput = {
  username: string;
  password: string;
  role: 'Master' | 'Admin' | 'User';
  created?: Date;
};

export class AppKnownError extends Error {
  constructor(
    public readonly code:
      | 'INVALID_USER_PAYLOAD'
      | 'DUPLICATE_USER'
      | 'DATABASE_NOT_READY'
      | 'DB_INSERT_FAILED',
    public readonly meta?: Record<string, unknown>,
  ) {
    super(code);
  }
}

@Injectable()
export class AppService {
  constructor(private readonly usersService: UsersService) {}

  getHello(): string {
    return 'NestJS on Cloudflare Workers';
  }

  getHealth() {
    return {
      status: 'ok',
      runtime: 'cloudflare-workers',
    };
  }

  getNewsCategories() {
    return {
      categories: ['politics', 'economy', 'tech', 'sports'],
    };
  }

  getBuildInfo() {
    return {
      app: 'nestjs-cf-test',
      version: '0.0.1',
      mode: 'dev',
    };
  }

  async createUser(payload: unknown) {
    const input = this.validateCreateUserPayload(payload);

    try {
      return await this.usersService.createUserRecord(input);
    } catch (error) {
      if (!(error instanceof UsersDomainError)) {
        throw error;
      }

      if (error.code === 'DATABASE_NOT_READY') {
        throw new AppKnownError('DATABASE_NOT_READY');
      }

      if (error.code === 'DUPLICATE_USER') {
        throw new AppKnownError('DUPLICATE_USER');
      }

      throw new AppKnownError('DB_INSERT_FAILED', error.meta);
    }
  }

  private validateCreateUserPayload(payload: unknown): CreateUserInput {
    if (!payload || typeof payload !== 'object') {
      throw new AppKnownError('INVALID_USER_PAYLOAD');
    }

    const { username, password, role, created } = payload as Record<string, unknown>;

    if (typeof username !== 'string' || !username.trim()) {
      throw new AppKnownError('INVALID_USER_PAYLOAD');
    }

    if (typeof password !== 'string' || !password.trim()) {
      throw new AppKnownError('INVALID_USER_PAYLOAD');
    }

    let parsedCreated: Date | undefined;
    if (created !== undefined && created !== null && String(created).trim() !== '') {
      parsedCreated = created instanceof Date ? created : new Date(String(created));
    }
    if (parsedCreated && Number.isNaN(parsedCreated.getTime())) {
      throw new AppKnownError('INVALID_USER_PAYLOAD');
    }

    return {
      username: username.trim(),
      password: password.trim(),
      role: role === 'Master' || role === 'Admin' ? role : 'User',
      created: parsedCreated,
    };
  }
}
