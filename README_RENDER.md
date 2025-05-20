# Render Docker 배포 가이드

## 개요
- Next.js(프론트, 3000), NestJS(백엔드, 3001), Nginx(80) 단일 컨테이너
- Render.com의 Docker Web Service로 배포
- 모든 예외 및 보안, 로깅, 주석 등 유저 룰 준수

## 구조
- frontend/ : Next.js (app 폴더 기반)
- backend/  : NestJS (src 폴더 기반)
- nginx/nginx.conf : 프록시 및 예외 fallback
- supervisor/supervisord.conf : 프로세스 관리
- Dockerfile, .dockerignore

## 빌드 및 실행

### 1. 로컬 테스트
```sh
docker build -t my-app .
docker run -p 80:80 -p 3000:3000 -p 3001:3001 my-app
```

### 2. Render 배포
- Render 대시보드에서 "Docker" 타입 Web Service 선택
- Dockerfile 자동 인식
- 환경 변수 등 필요시 Render에서 설정

## 주요 설정 설명

### nginx.conf
- /api/* 요청은 NestJS(3001)로 프록시
- 그 외는 Next.js(3000)로 프록시
- 각 서비스 다운 시 fallback(503) 제공

### supervisord.conf
- nginx, next, nest 프로세스 동시 관리 및 자동 재시작

### Dockerfile
- 멀티 스테이지 빌드로 용량 최적화
- 보안, 예외처리, 주석, 로깅 등 반영

## 보안 및 예외 처리
- .env 등 민감정보는 .dockerignore로 제외
- 모든 프록시/서비스 다운 시 fallback 메시지
- 로그 파일 별도 관리

## 임의 값/환경변수
- 환경 변수(NODE_ENV 등)는 필요시 Dockerfile ENV 또는 Render 대시보드에서 직접 설정
- 임의 값이 필요한 경우, 실제 값으로 교체 필요 (주석 확인)

## 문의/문제
- 추가 설정, 커스텀 필요 시 README_RENDER.md 상단에 문의
