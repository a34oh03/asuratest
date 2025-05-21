# 1. 베이스 이미지 및 패키지 설치
FROM node:18-alpine AS builder
WORKDIR /app

# 2. frontend, backend 복사 및 의존성 설치/빌드
COPY frontend ./frontend
COPY backend  ./backend

# pnpm 설치 (글로벌)
RUN corepack enable && corepack prepare pnpm@8.15.5 --activate

# 프론트엔드 의존성 및 빌드
WORKDIR /app/frontend
RUN pnpm install --frozen-lockfile && pnpm build

# 백엔드 의존성 및 빌드
WORKDIR /app/backend
RUN pnpm install --frozen-lockfile && pnpm build

# 3. 런타임 이미지(nginx 포함)
FROM node:18-alpine
WORKDIR /app

# nginx, supervisor, gettext 설치
RUN apk add --no-cache nginx supervisor gettext

# ★ pnpm 활성화 (런타임에도 필요)
RUN corepack enable && corepack prepare pnpm@8.15.5 --activate

# 4. 빌드 결과 복사
COPY --from=builder /app/frontend ./frontend
COPY --from=builder /app/backend  ./backend

# 5. nginx, supervisor 설정 복사
COPY nginx/nginx.conf.template /etc/nginx/nginx.conf.template
COPY supervisor/supervisord.conf    /etc/supervisord.conf

# 6. 환경설정: 로그 디렉토리 등
RUN mkdir -p /var/log/nginx /var/log/supervisor /app/frontend /app/backend

# 7. 포트 오픈
EXPOSE 80 3000 3001

# 8. 환경 변수(임의 값 필요 시 주석)
# ENV NODE_ENV=production

# 9. 실행: 템플릿 치환 후 supervisor로 nginx, next, nest 동시 실행
CMD \
  envsubst '$PORT' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf && \
  exec supervisord -c /etc/supervisord.conf
