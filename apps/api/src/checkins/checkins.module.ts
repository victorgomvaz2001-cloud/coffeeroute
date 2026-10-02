import { Module } from '@nestjs/common';
import { CafesModule } from '../cafes/cafes.module';
import { CheckinsController } from './checkins.controller';
import { CheckinsService } from './checkins.service';

@Module({
  imports: [CafesModule],
  controllers: [CheckinsController],
  providers: [CheckinsService],
})
export class CheckinsModule {}
