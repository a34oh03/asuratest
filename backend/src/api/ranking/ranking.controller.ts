// src/api/api.controller.ts
import { Controller, Get, Query, UsePipes, ValidationPipe } from '@nestjs/common';
import { RankingService } from './ranking.service';
import { GetRankingDto } from './dto/get-ranking.dto';

@Controller('api')
export class RankingController {
  constructor(private readonly apiService: RankingService) {}

  @Get('ranking')
  @UsePipes(new ValidationPipe({ transform: true }))
  async getRanking(@Query() dto: GetRankingDto) {
    const userNetID   = dto.userNetID;
    const region      = dto.region ?? 'ES';
    const teamMode    = Number(dto.teamMode ?? 1);
    const rankingType = Number(dto.rankingType ?? 1);
    const champType   = Number(dto.champType   ?? 0);
    const rowCount    = Number(dto.rowCount    ?? 100);

    return this.apiService.getRankingData({
      userNetID,
      region,
      teamMode,
      rankingType,
      champType,
      rowCount,
    });
  }
}
