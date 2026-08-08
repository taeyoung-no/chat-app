# Chat App

Docker, AWS 배포, CI/CD, 모니터링, 부하 테스트 등 포함 실무에서 사용한다고 알려진 기술 스택을 학습하기 위한 Node.js, React CRUD 프로젝트입니다. [링크](https://chat.taeyoung-no.com)

## 목차
1. [기능](#기능)
2. [기술 스택](#기술-스택)
3. [개발 노트](#개발-노트)
4. [로컬 실행](#로컬-실행)

## 기능
- 회원 기능
- 방 생성, 목록 조회, 입장, 삭제
- 실시간 양방향 통신 (WebSocket)
- 방 목록 실시간 업데이트 (SSE)

## 기술 스택
핵심이라고 생각하는 것만 정리했습니다.

| 영역 | 기술 |
|------|------|
| 프론트 | React, TypeScript |
| 백엔드 | Express, TypeScript |
| DB | MongoDB |
| 캐시, 세션 | Redis |
| 단위, 통합 테스트 | Vitest |
| 부하 테스트 | Artillery |
| 모니터링 | Prometheus, Grafana |
| 인프라 | Docker, Nginx |
| 배포 | AWS ECR, EC2 |
| CI/CD | GitHub Actions |

## 개발 노트
- [확장 가능한 예외 처리 구조](https://taeyoung-no.github.io/2026/06/22/nodejs.html)
- [Sokcet.IO의 저수준, Manager 이해하기](https://taeyoung-no.github.io/2026/07/05/socket-io.html)
- [로드 밸런서가 sticky session을 사용해야 했던 이유](https://taeyoung-no.github.io/2026/08/08/sticky-session.html)
- [인생 첫 부하 테스트: 라이브러리 없이 Node.js로 구현하게 된 계기와 병목 지점 찾기](https://taeyoung-no.github.io/2026/08/08/load-test.html)
- [인생 첫 모니터링: 메모리 누수 검사](https://taeyoung-no.github.io/2026/08/08/monitoring.html)

## 로컬 실행
### 요구사항
- Node.js 20+
- Docker, Docker Compose
- npm

### 의존성
```bash
npm install
npm run build --workspace=shared
```

### 환경 변수
`server/.env` (`server/.env.example` 참고)

### 인프라
```bash
docker compose up -d
```

### 개발 서버
```bash
# 터미널 1
npm run dev --workspace=server

# 터미널 2
npm run dev --workspace=client
```

### 단위, 통합 테스트
```bash
npm test --workspace=server
```
### 부하 테스트
```bash
# 테스트용 유저 등록
node test/register-users.js

#부하 테스트
node test/auth-test.js
node test/create-room-test.js
ROOM_ID=미리-생성한-방-ID node test/message-test.js
```