// Firebase 백업 캐시 유틸 (Python 코드 변환)
import { getLatestBackupTime, downloadBackup } from '../firebase/firebase.util';
import { promises as fs } from 'fs';
import { Logger } from '@nestjs/common';

interface BackupCache {
  date: string | null;
  data: any | null;
}

const _backupCache: BackupCache = {
  date: null,
  data: null,
};

/**
 * Firebase Storage에서 랭킹 백업 데이터를 하루에 한 번만 다운로드하고,
 * 서버 메모리에 캐싱하여 재사용하는 함수
 */
export async function getCachedBackupData(): Promise<any | null> {
  const latestBackupTime = await getLatestBackupTime();
  if (!latestBackupTime) {
    return null;
  }
  const dateStr = latestBackupTime.slice(0, 10); // "YYYY-MM-DD"
  if (_backupCache.date === dateStr) {
    console.log(`[CACHE] 캐시된 백업 데이터 사용: ${dateStr}`);
    return _backupCache.data;
  }
  const filename = `rank_${dateStr}.json`;
  const localPath = `cached_${filename}`;
  const firebasePath = `backups/${filename}`;

  const downloaded = await downloadBackup(firebasePath, localPath);
  if (downloaded) {
    try {
      const fileContent = await fs.readFile(localPath, 'utf-8');
      const jsonData = JSON.parse(fileContent);
      _backupCache.date = dateStr;
      _backupCache.data = jsonData;
      console.log(`[CACHE] 백업 데이터 캐시됨: ${dateStr}`);
      return jsonData;
    } catch (err: any) {
      if (err.code === 'ENOENT') {
        console.error(`[ERROR] 다운로드 성공했지만 파일이 없음: ${localPath}`);
      } else {
        console.error(`[ERROR] JSON 파싱 실패: ${localPath}`);
      }
      return null;
    }
  } else {
    console.error(`[ERROR] 백업 다운로드 실패: ${firebasePath}`);
    return null;
  }
}
