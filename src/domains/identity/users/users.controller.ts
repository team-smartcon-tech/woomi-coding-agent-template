import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Patch,
  Post,
  ServiceUnavailableException,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { Roles } from '../auth/guard/roles.decorator';
import { RolesGuard } from '../auth/guard/roles.guard';
import { CreatableRoles, UserRole } from '../auth/types/user-role';
import { UserUpdateErrors, UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Master, UserRole.Admin)
  @Post('create')
  async createUser(
    @Body()
    body: {
      username: string;
      password: string;
      role: CreatableRoles;
    },
  ) {
    const created = await this.usersService.createUser(body.username, body.password, body.role);
    if (!created) {
      throw new ServiceUnavailableException('database is not ready');
    }

    return created;
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Master, UserRole.Admin)
  @Get()
  async listUsers() {
    return this.usersService.findAll();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Master, UserRole.Admin)
  @Delete()
  async deleteUser(@Body() body: { username: string }) {
    if (!body.username?.trim()) {
      throw new BadRequestException('username is required');
    }

    return this.usersService.delete(body.username.trim());
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Master, UserRole.Admin)
  @Patch()
  async updateUser(
    @Body()
    body: {
      username: string;
      password?: string;
      role?: CreatableRoles;
    },
  ) {
    const { username, password, role } = body;
    if (!username?.trim()) {
      throw new BadRequestException('username is required');
    }

    const result = await this.usersService.update({
      username: username.trim(),
      password: password?.trim(),
      role,
    });

    if (!result.result && result.error === UserUpdateErrors.USER_NOT_FOUND) {
      throw new NotFoundException('user not found');
    }

    if (!result.result && result.error === UserUpdateErrors.NOT_FULFILLED_ARGS) {
      throw new BadRequestException('password or role is required');
    }

    if (!result.result && result.error === UserUpdateErrors.DATABASE_NOT_READY) {
      throw new ServiceUnavailableException('database is not ready');
    }

    return result;
  }
}
