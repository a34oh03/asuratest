// ping.module.ts: ping.controller와 ping.service를 등록
import { Module } from '@nestjs/common';
import { PingController } from './ping.controller';
import { PingService } from './ping.service';

@Module({
  controllers: [PingController],
  providers: [PingService],
  exports: [PingService],
})
export class PingModule {}
