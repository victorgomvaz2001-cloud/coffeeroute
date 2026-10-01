import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  type AdminCafe,
  type Paginated,
  paginationQuerySchema,
  rejectCafeSchema,
} from '@coffeeroute/shared';
import { createZodDto } from 'nestjs-zod';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { UuidParam } from '../common/pipes/uuid-param.pipe';
import type { AuthUser } from '../types/auth-user';
import { AdminCafesService } from './admin-cafes.service';

class PaginationQueryDto extends createZodDto(paginationQuerySchema) {}
class RejectCafeDto extends createZodDto(rejectCafeSchema) {}

@ApiTags('admin')
@ApiBearerAuth()
@Roles('ADMIN')
@Controller('admin/cafes')
export class AdminCafesController {
  constructor(private readonly cafes: AdminCafesService) {}

  @Get('pending')
  listPending(@Query() query: PaginationQueryDto): Promise<Paginated<AdminCafe>> {
    return this.cafes.listPending(query);
  }

  @Get(':id')
  findOne(@Param('id', UuidParam('El café')) id: string): Promise<AdminCafe> {
    return this.cafes.findOne(id);
  }

  @Patch(':id/verify')
  verify(
    @Param('id', UuidParam('El café')) id: string,
    @CurrentUser() admin: AuthUser,
  ): Promise<AdminCafe> {
    return this.cafes.verify(id, admin.id);
  }

  @Patch(':id/reject')
  reject(
    @Param('id', UuidParam('El café')) id: string,
    @Body() dto: RejectCafeDto,
  ): Promise<AdminCafe> {
    return this.cafes.reject(id, dto.reason);
  }
}
