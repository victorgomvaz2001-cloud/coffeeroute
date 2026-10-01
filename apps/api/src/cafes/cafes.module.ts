import { Module } from '@nestjs/common';
import { CafeSearchCache } from './cafe-search-cache.service';
import { CafesController } from './cafes.controller';
import { CafesService } from './cafes.service';

@Module({
  controllers: [CafesController],
  providers: [CafesService, CafeSearchCache],
  exports: [CafeSearchCache],
})
export class CafesModule {}
