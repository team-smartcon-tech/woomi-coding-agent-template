import {
  BadRequestException,
  ConflictException,
  Controller,
  Get,
  Post,
  Body,
  ServiceUnavailableException,
  InternalServerErrorException,
} from '@nestjs/common';
import { AppKnownError, AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  getHealth() {
    return this.appService.getHealth();
  }

  @Get('news/categories')
  getNewsCategories() {
    return this.appService.getNewsCategories();
  }

  @Get('build-info')
  getBuildInfo() {
    return this.appService.getBuildInfo();
  }

  @Post('users')
  async createUser(@Body() payload: unknown) {
    try {
      return await this.appService.createUser(payload);
    } catch (error) {
      if (!(error instanceof AppKnownError)) {
        throw error;
      }

      if (error.code === 'INVALID_USER_PAYLOAD') {
        throw new BadRequestException('username, password is required (role/created optional)');
      }

      if (error.code === 'DUPLICATE_USER') {
        throw new ConflictException('user already exists');
      }

      if (error.code === 'DATABASE_NOT_READY') {
        throw new ServiceUnavailableException('database is not ready');
      }

      if (error.code === 'DB_INSERT_FAILED') {
        throw new InternalServerErrorException({
          message: 'failed to insert user',
          dbCode: error.meta?.dbCode ?? null,
          dbMessage: error.meta?.dbMessage ?? null,
          dbDetail: error.meta?.dbDetail ?? null,
          dbHint: error.meta?.dbHint ?? null,
        });
      }

      throw new InternalServerErrorException('unknown error');
    }
  }
}

