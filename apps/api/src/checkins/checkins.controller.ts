import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import {
  type CheckIn,
  checkInListQuerySchema,
  createCheckInSchema,
  type Paginated,
  type PublicCheckIn,
  type UserCheckIn,
  updateCheckInSchema,
} from '@coffeeroute/shared';
import { createZodDto } from 'nestjs-zod';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { UuidParam } from '../common/pipes/uuid-param.pipe';
import type { AuthUser } from '../types/auth-user';
import { CheckinsService } from './checkins.service';

class CreateCheckInDto extends createZodDto(createCheckInSchema) {}
class UpdateCheckInDto extends createZodDto(updateCheckInSchema) {}
class CheckInListQueryDto extends createZodDto(checkInListQuerySchema) {}

/** Paths are spelled out because check-ins also hang off cafés and users. */
@ApiTags('checkins')
@ApiBearerAuth()
@Controller()
export class CheckinsController {
  constructor(private readonly checkins: CheckinsService) {}

  @Post('checkins')
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  create(@Body() dto: CreateCheckInDto, @CurrentUser() user: AuthUser): Promise<CheckIn> {
    return this.checkins.create(user.id, dto);
  }

  @Get('checkins/me')
  listMine(
    @Query() query: CheckInListQueryDto,
    @CurrentUser() user: AuthUser,
  ): Promise<Paginated<CheckIn>> {
    return this.checkins.listMine(user.id, query);
  }

  @Get('checkins/:id')
  findOne(
    @Param('id', UuidParam('El check-in')) id: string,
    @CurrentUser() user: AuthUser,
  ): Promise<CheckIn> {
    return this.checkins.findOwn(id, user.id);
  }

  @Patch('checkins/:id')
  update(
    @Param('id', UuidParam('El check-in')) id: string,
    @Body() dto: UpdateCheckInDto,
    @CurrentUser() user: AuthUser,
  ): Promise<CheckIn> {
    return this.checkins.update(id, user.id, dto);
  }

  @Delete('checkins/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('id', UuidParam('El check-in')) id: string,
    @CurrentUser() user: AuthUser,
  ): Promise<void> {
    return this.checkins.remove(id, user.id);
  }

  @Public()
  @Get('cafes/:id/checkins')
  listForCafe(
    @Param('id', UuidParam('El café')) id: string,
    @Query() query: CheckInListQueryDto,
  ): Promise<Paginated<PublicCheckIn>> {
    return this.checkins.listForCafe(id, query);
  }

  @Public()
  @Get('users/:id/checkins')
  listForUser(
    @Param('id', UuidParam('El usuario')) id: string,
    @Query() query: CheckInListQueryDto,
  ): Promise<Paginated<UserCheckIn>> {
    return this.checkins.listForUser(id, query);
  }
}
