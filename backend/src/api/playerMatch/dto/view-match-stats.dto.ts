// dto/view-match-stats.dto.ts
import { IsString, IsOptional } from 'class-validator';

// viewMatchStats 요청 DTO
export class ViewMatchStatsDto {
  /** 조회할 닉네임 */
  @IsString()
  viewNickname: string;

  /** 지역 (기본값 ES) */
  @IsString()
  @IsOptional()
  region?: string = 'ES';
}
