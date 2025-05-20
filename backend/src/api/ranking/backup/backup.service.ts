// src/backup/backup.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { getCachedBackupData } from './backup-cache.util';
import {
  uploadBackup,
  downloadBackup,
  getLatestBackupTime,
  setLatestBackupTime,
} from '../firebase/firebase.util';

@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);

  /** 하루 1회 다운로드된 백업 데이터를 캐시에서 반환 */
  async getCached(): Promise<any | null> {
    return await getCachedBackupData();
  }

  /** 로컬 파일 → Firebase Storage 업로드 */
  async upload(localPath: string, remotePath: string): Promise<void> {
    try {
      await uploadBackup(localPath, remotePath);
      this.logger.log(`업로드 성공: ${remotePath}`);
    } catch (err: any) {
      this.logger.error(`업로드 실패: ${err.message}`);
      throw err;
    }
  }

  /** Firebase Storage → 로컬 파일 다운로드 */
  async download(remotePath: string, localPath: string): Promise<boolean> {
    try {
      const result = await downloadBackup(remotePath, localPath);
      this.logger.log(`다운로드 ${result ? '성공' : '실패'}: ${remotePath}`);
      return result;
    } catch (err: any) {
      this.logger.error(`다운로드 예외: ${err.message}`);
      return false;
    }
  }

  /** Firebase에 저장된 마지막 백업 시각 조회 */
  async getLatestTime(): Promise<string | null> {
    return await getLatestBackupTime();
  }

  /** Firebase에 현재 시각을 마지막 백업 시각으로 저장 */
  async setLatestTime(): Promise<void> {
    await setLatestBackupTime();
    this.logger.log('마지막 백업 시각 저장 완료');
  }
}
