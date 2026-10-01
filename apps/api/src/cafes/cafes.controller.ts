import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  type CafeDetail,
  cafeSearchQuerySchema,
  type CafeSummary,
  type Paginated,
  proposeCafeSchema,
} from '@coffeeroute/shared';
import { createZodDto } from 'nestjs-zod';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { UuidParam } from '../common/pipes/uuid-param.pipe';
import type { AuthUser } from '../types/auth-user';
import { CafesService } from './cafes.service';

class CafeSearchQueryDto extends createZodDto(cafeSearchQuerySchema) {}
class ProposeCafeDto extends createZodDto(proposeCafeSchema) {}

@ApiTags('cafes')
@Controller('cafes')
export class CafesController {
  constructor(private readonly cafes: CafesService) {}

  /** UC1 / UC3: search verified cafés around a point or in a city. */
  @Public()
  @Get()
  search(@Query() query: CafeSearchQueryDto): Promise<Paginated<CafeSummary>> {
    return this.cafes.search(query);
  }

  @Public()
  @Get(':id')
  findOne(
    @Param('id', UuidParam('El café')) id: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<CafeDetail> {
    return this.cafes.findById(id, user);
  }

  @ApiBearerAuth()
  @Post()
  propose(@Body() dto: ProposeCafeDto, @CurrentUser() user: AuthUser): Promise<CafeDetail> {
    return this.cafes.propose(dto, user.id);
  }
}
