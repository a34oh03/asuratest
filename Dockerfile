# 1. 빌드용 이미지: 의존성 설치 & 빌드
FROM node:18-alpine AS builder

# 공통 작업 디렉터리
WORKDIR /app

# --- FRONTEND BUILD ---
# 1-1) 의존성 파일만 복사
COPY frontend/package.json frontend/pnpm-lock.yaml ./frontend/

# 1-2) pnpm 활성화 및 의존성 설치
RUN corepack enable \
 && corepack prepare pnpm@8.15.5 --activate

WORKDIR /app/frontend
RUN pnpm install --frozen-lockfile

# 1-3) 소스 전체 복사 & 빌드
COPY frontend/ ./
RUN pnpm build

# --- BACKEND BUILD ---
WORKDIR /app

# 2-1) 의존성 파일만 복사
COPY backend/package.json backend/pnpm-lock.yaml ./backend/

WORKDIR /app/backend
RUN pnpm install --frozen-lockfile

# 2-2) 소스 전체 복사 & 빌드
COPY backend/ ./
RUN pnpm build

# 3. 런타임 이미지: nginx + supervisor + pnpm 활성화
FROM node:18-alpine

# 3-1) 작업 디렉터리
WORKDIR /app

# 3-2) 필요한 패키지 설치
RUN apk add --no-cache nginx supervisor gettext \
 # 런타임에도 pnpm 활성화
 && corepack enable \
 && corepack prepare pnpm@8.15.5 --activate

# 3-3) 빌드 결과 복사
COPY --from=builder /app/frontend ./frontend
COPY --from=builder /app/backend  ./backend

# 3-4) 설정 파일 복사
COPY nginx/nginx.conf.template /etc/nginx/nginx.conf.template
COPY supervisor/supervisord.conf    /etc/supervisord.conf

# 3-5) 로그 디렉터리 및 앱 디렉터리 생성
RUN mkdir -p /var/log/nginx /var/log/supervisor /app/frontend /app/backend

# 3-6) 기본 PORT 환경변수 설정
ENV PORT=80

# 4. 외부 노출 포트 (Render에서는 이 포트만 인식)
EXPOSE 80

# 5. 컨테이너 기동 명령 (템플릿 치환 후 supervisord 실행)
CMD ["sh", "-c", "\
  envsubst '$PORT' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf && \
  exec supervisord -c /etc/supervisord.conf \
"]
