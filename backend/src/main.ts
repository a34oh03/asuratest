import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import { PingController } from './api/ranking/ping.controller';
import { RefreshSessionService } from './api/playerMatch/refresh-session.service';

async function bootstrap() {
  // env 파일 로드 (NestConfigModule 써도 되고, 간단히 dotenv)
  dotenv.config();

  const app = await NestFactory.create(AppModule);

  // env에서 CORS 허용할 origin 읽어오기
  const clientOrigin = process.env.CLIENT_ORIGIN;

  app.enableCors({
    origin: [clientOrigin],
    credentials: true,
  });

  const port = Number(process.env.PORT);
  await app.listen(port);

  // 서버가 완전히 실행된 후 ping 반복 시작
  const pingController = app.get(PingController);
  if (pingController && typeof pingController.startPingLoop === 'function') {
    pingController.startPingLoop();
    console.log('[main.ts] PingController.startPingLoop() 호출 완료');
  } else {
    console.warn('[main.ts] PingController를 찾을 수 없거나 startPingLoop 미구현');
  }

  // 서버가 완전히 실행된 후 refreshSession 반복 시작
  const refreshSessionService = app.get(RefreshSessionService);
  if (refreshSessionService && typeof refreshSessionService.startRefreshLoop === 'function') {
    refreshSessionService.startRefreshLoop();
    console.log('[main.ts] RefreshSessionService.startRefreshLoop() 호출 완료');
  } else {
    console.warn('[main.ts] RefreshSessionService를 찾을 수 없거나 startRefreshLoop 미구현');
  }
}
bootstrap();
