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
  createRouteSchema,
  type Paginated,
  planRouteSchema,
  type RouteDetail,
  routeListQuerySchema,
  type RoutePlan,
  type RouteSummary,
  updateRouteSchema,
} from '@coffeeroute/shared';
import { createZodDto } from 'nestjs-zod';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { UuidParam } from '../common/pipes/uuid-param.pipe';
import type { AuthUser } from '../types/auth-user';
import { RoutesService } from './routes.service';

class PlanRouteDto extends createZodDto(planRouteSchema) {}
class CreateRouteDto extends createZodDto(createRouteSchema) {}
class UpdateRouteDto extends createZodDto(updateRouteSchema) {}
class RouteListQueryDto extends createZodDto(routeListQuerySchema) {}

@ApiTags('routes')
@ApiBearerAuth()
@Controller('routes')
export class RoutesController {
  constructor(private readonly routes: RoutesService) {}

  /** Previews legs/totals and optionally the optimal order, without saving. */
  @Post('plan')
  @HttpCode(HttpStatus.OK)
  // Each plan may hit the Mapbox Matrix API (60 req/min for the whole app).
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  plan(@Body() dto: PlanRouteDto): Promise<RoutePlan> {
    return this.routes.plan(dto);
  }

  @Public()
  @Get()
  listPublic(@Query() query: RouteListQueryDto): Promise<Paginated<RouteSummary>> {
    return this.routes.listPublic(query);
  }

  @Get('mine')
  listMine(@CurrentUser() user: AuthUser): Promise<RouteSummary[]> {
    return this.routes.listMine(user.id);
  }

  @Public()
  @Get(':id')
  findOne(
    @Param('id', UuidParam('La ruta')) id: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<RouteDetail> {
    return this.routes.findOne(id, user);
  }

  @Post()
  create(@Body() dto: CreateRouteDto, @CurrentUser() user: AuthUser): Promise<RouteDetail> {
    return this.routes.create(user.id, dto);
  }

  @Patch(':id')
  update(
    @Param('id', UuidParam('La ruta')) id: string,
    @Body() dto: UpdateRouteDto,
    @CurrentUser() user: AuthUser,
  ): Promise<RouteDetail> {
    return this.routes.update(id, user.id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('id', UuidParam('La ruta')) id: string,
    @CurrentUser() user: AuthUser,
  ): Promise<void> {
    return this.routes.remove(id, user.id);
  }
}
