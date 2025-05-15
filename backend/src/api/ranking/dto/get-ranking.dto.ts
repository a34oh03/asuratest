// src/api/ranking/dto/get-ranking.dto.ts
import { IsString, IsNumberString, IsOptional } from 'class-validator';
import { ApiProperty, ApiQuery } from '@nestjs/swagger';

export class GetRankingDto {
  @ApiProperty({ description: '사용자 NetID' })
  @IsString()
  userNetID: string;

  @ApiProperty({ description: '팀 모드 (1=솔로, 2=트리오)', required: false, default: 1 })
  @IsOptional()
  @IsNumberString()
  teamMode?: string;

  @ApiProperty({ description: '가져올 행 개수', required: false, default: 100 })
  @IsOptional()
  @IsNumberString()
  rowCount?: string;

  @ApiProperty({ description: 'Region 코드', required: false, default: 'ES' })
  @IsOptional()
  @IsString()
  region?: string;

  @ApiProperty({ description: '랭킹 타입', required: false, default: 1 })
  @IsOptional()
  @IsNumberString()
  rankingType?: string;

  @ApiProperty({ description: '챔프 타입', required: false, default: 0 })
  @IsOptional()
  @IsNumberString()
  champType?: string;
}
