import { Module } from '@nestjs/common';
import { CafesModule } from '../cafes/cafes.module';
import { AdminCafesController } from './admin-cafes.controller';
import { AdminCafesService } from './admin-cafes.service';

@Module({
  imports: [CafesModule],
  controllers: [AdminCafesController],
  providers: [AdminCafesService],
})
export class AdminModule {}
