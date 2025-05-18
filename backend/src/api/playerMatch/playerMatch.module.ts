import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';

import { PlayerMatchService } from './playerMatch.service';
import { PlayerMatchController } from './playerMatch.controller';

@Module({
  imports: [HttpModule],
  controllers: [PlayerMatchController],
  providers: [PlayerMatchService],
})
export class PlayerMatchModule {}
