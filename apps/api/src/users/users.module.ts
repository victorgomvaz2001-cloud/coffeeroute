import { Module } from '@nestjs/common';
import { CafesModule } from '../cafes/cafes.module';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  controllers: [UsersController],
  providers: [UsersService],
  imports: [CafesModule],
})
export class UsersModule {}
