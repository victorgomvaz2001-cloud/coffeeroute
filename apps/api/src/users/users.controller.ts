import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { type MeResponse, type PublicUserResponse, updateProfileSchema } from '@coffeeroute/shared';
import { createZodDto } from 'nestjs-zod';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { UuidParam } from '../common/pipes/uuid-param.pipe';
import type { AuthUser } from '../types/auth-user';
import { UsersService } from './users.service';

class UpdateProfileDto extends createZodDto(updateProfileSchema) {}

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get('me')
  getMe(@CurrentUser() user: AuthUser): Promise<MeResponse> {
    return this.users.getMe(user.id);
  }

  @Patch('me')
  updateMe(@CurrentUser() user: AuthUser, @Body() dto: UpdateProfileDto): Promise<MeResponse> {
    return this.users.updateMe(user.id, dto);
  }

  @Delete('me')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteMe(@CurrentUser() user: AuthUser): Promise<void> {
    return this.users.deleteMe(user.id);
  }

  @Public()
  @Get(':id')
  getPublicProfile(@Param('id', UuidParam('El usuario')) id: string): Promise<PublicUserResponse> {
    return this.users.getPublicProfile(id);
  }
}
