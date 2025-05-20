import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';

async function bootstrap() {
  // env 파일 로드 (NestConfigModule 써도 되고, 간단히 dotenv)
  dotenv.config();

  const app = await NestFactory.create(AppModule);

  // env에서 CORS 허용할 origin 읽어오기
  const clientOrigin = process.env.CLIENT_ORIGIN ?? 'http://localhost:3001';

  app.enableCors({
    origin: [clientOrigin],
    credentials: true,
  });

  const port = Number(process.env.PORT) || 3000;
  await app.listen(port);
  console.log(`🚀 Server listening on http://localhost:${port}`);
}
bootstrap();
