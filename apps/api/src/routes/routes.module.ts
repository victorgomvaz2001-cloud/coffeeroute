import { Module } from '@nestjs/common';
import { RoutesController } from './routes.controller';
import { RoutesService } from './routes.service';
import { TravelMatrixService } from './travel-matrix.service';

@Module({
  controllers: [RoutesController],
  providers: [RoutesService, TravelMatrixService],
})
export class RoutesModule {}
