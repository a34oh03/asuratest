import { IsString } from 'class-validator';

// viewMatchRecord 요청 DTO
export class ViewMatchRecordDto {
  /** 조회할 닉네임 */
  @IsString()
  viewNickname: string;
}
