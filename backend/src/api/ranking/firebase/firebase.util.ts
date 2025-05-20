// Firebase 연동 유틸 (Python 코드 변환)
import {
  initializeApp,
  getApps,
  cert,
  applicationDefault,
} from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import * as fs from 'fs';
import * as path from 'path';
import { DateTime } from 'luxon';

const BUCKET_NAME = 'asurajang-39231.firebasestorage.app';
const LAST_BACKUP_PATH = 'backups/last_backup.txt';

// Firebase 앱 초기화
export function initFirebase() {
  if (!getApps().length) {
    if (process.env.RENDER) {
      console.log('[INFO] Render 환경 감지됨 → 환경변수로 Firebase 초기화');
      const firebaseJsonStr = process.env.FIREBASE_CONFIG_JSON;
      if (!firebaseJsonStr) throw new Error('FIREBASE_CONFIG_JSON env not set');
      const cred = JSON.parse(firebaseJsonStr);
      initializeApp({
        credential: cert(cred),
        storageBucket: BUCKET_NAME,
      });
    } else {
      console.log('[INFO] 로컬 환경 → 파일로 Firebase 초기화');
      const credPath = path.resolve(process.cwd(), 'firebase_config.json');
      initializeApp({
        credential: cert(credPath),
        storageBucket: BUCKET_NAME,
      });
    }
  }
}

export async function uploadBackup(
  filePath: string,
  firebasePath: string,
): Promise<void> {
  initFirebase();
  const bucket = getStorage().bucket();
  await bucket.upload(filePath, { destination: firebasePath });
  console.log(`[Firebase] 백업 업로드 완료: ${firebasePath}`);
}

export async function downloadBackup(
  firebasePath: string,
  localPath: string,
): Promise<boolean> {
  initFirebase();
  const bucket = getStorage().bucket();
  const file = bucket.file(firebasePath);
  const exists = (await file.exists())[0];
  if (exists) {
    await file.download({ destination: localPath });
    console.log(`[Firebase] 백업 다운로드 완료: ${firebasePath}`);
    return true;
  } else {
    console.log(`[Firebase] 백업 파일 없음: ${firebasePath}`);
    return false;
  }
}

export async function getLatestBackupTime(): Promise<string | null> {
  initFirebase();
  const bucket = getStorage().bucket();
  const file = bucket.file(LAST_BACKUP_PATH);
  const exists = (await file.exists())[0];
  if (exists) {
    const [contents] = await file.download();
    // 항상 'yyyy-MM-dd HH:mm:ss' 포맷으로 반환
    const str = contents.toString().trim();
    // 만약 기존에 ISO 포맷으로 저장된 경우도 호환
    let dt = DateTime.fromFormat(str, 'yyyy-MM-dd HH:mm:ss', {
      zone: 'Asia/Seoul',
    });
    if (!dt.isValid) {
      dt = DateTime.fromISO(str, { zone: 'Asia/Seoul' });
    }
    return dt.isValid ? dt.toFormat('yyyy-MM-dd HH:mm:ss') : str;
  }
  return null;
}

export async function setLatestBackupTime(): Promise<void> {
  initFirebase();
  const bucket = getStorage().bucket();
  const file = bucket.file(LAST_BACKUP_PATH);
  // luxon을 사용해 항상 'yyyy-MM-dd HH:mm:ss' 포맷, Asia/Seoul 기준으로 저장
  const nowStr = DateTime.now()
    .setZone('Asia/Seoul')
    .toFormat('yyyy-MM-dd HH:mm:ss');
  await file.save(nowStr);
  console.log('[Firebase] 마지막 백업 시각 저장됨:', nowStr);
}
