# Chat App

Docker, AWS 배포, CI/CD, 모니터링, 부하 테스트 등 포함 실무에서 사용한다고 알려진 기술 스택을 학습하기 위한 Node.js, React CRUD 프로젝트입니다. [링크](https://chat.taeyoung-no.com)

## 목차
1. [개발 노트](#개발-노트)
2. [기술 스택](#기술-스택)
3. [기능](#기능)
4. [로컬 실행](#로컬-실행)

## 개발 노트
[확장 가능한 예외 처리 구조](https://taeyoung-no.github.io/2026/06/22/nodejs.html)
- 서버와 클라이언트 여기저기 흩어진 예외 처리를 `{ success, message, data }` 응답 형식, `AppError`, 에러 핸들러 미들웨어로 통일
- 클라이언트는 service layer에서 Axios 에러와 서버 에러 메시지를 하나의 `Error`로 변환, 컴포넌트는 `err.message`만 확인

[Socket.IO의 저수준, Manager 이해하기](https://taeyoung-no.github.io/2026/07/05/socket-io.html)
- 로그인 후에도 소켓에 세션 정보가 없는 원인을 세션이 첫 handshake 요청에만 담기기 때문으로 분석
- public/private namespace로 나눠도 같은 Manager를 재사용해 세션이 없는 문제를 `forceNew`로 새로 연결해서 해결

[로드 밸런서가 sticky session을 사용해야 했던 이유](https://taeyoung-no.github.io/2026/08/08/sticky-session.html)
- 서버 두 대에서 방 입장 시 `xhr post error`가 발생하는 문제를 Nginx `ip_hash` sticky session으로 해결, long-polling 요청이 서로 다른 서버로 분산되는 것이 원인

[인생 첫 부하 테스트: 라이브러리 없이 Node.js로 구현하게 된 계기와 병목 지점 찾기](https://taeyoung-no.github.io/2026/08/08/load-test.html)
- Artillery로는 로그인 후 Socket.IO에 연결하는 시나리오를 만들 수 없는 문제를 Node.js로 부하 테스트를 직접 구현해서 해결
- 회원 기능에서 RPS 약 90에서 120으로 늘리면 p95가 약 70ms에서 약 6000ms로 증가하는 병목을 비밀번호 해싱으로 특정, 해시 라운드를 1로 줄이면 p95 10ms 미만, CPU 사용률 약 400%에서 50%로 감소

[인생 첫 모니터링: 메모리 누수 검사](https://taeyoung-no.github.io/2026/08/08/monitoring.html)
- SSE 연결 해제 시 응답 객체를 `Set`에서 제거하지 않아 생기는 메모리 누수를 Prometheus, Grafana로 확인 후 해결, 새로고침 횟수에 비례하던 `Set` 크기가 일정하게 유지

## 기술 스택
핵심이라고 생각하는 것만 정리했습니다.

| 영역 | 기술 |
|------|------|
| 프론트엔드 | React, TypeScript |
| 백엔드 | Express, TypeScript |
| DB | MongoDB |
| 캐시, 세션 | Redis |
| 단위, 통합 테스트 | Vitest |
| 부하 테스트 | Node.js (직접 구현) |
| 모니터링 | Prometheus, Grafana |
| 인프라 | Docker, Nginx |
| 배포 | AWS ECR, EC2 |
| CI/CD | GitHub Actions |

## 기능
- 회원 기능
- 방 생성, 목록 조회, 입장, 삭제
- 실시간 양방향 통신 (WebSocket)
- 방 목록 실시간 업데이트 (SSE)

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
# 백엔드
npm run dev --workspace=server
```

```bash
# 프론트엔드
npm run dev --workspace=client
```
