# Toilet Backend Starter (Express + MongoDB Atlas + JWT)

Minimal backend to support signup/login and sync user favorites/ratings/reviews.

## 1) Setup MongoDB Atlas
1. https://www.mongodb.com/atlas 에서 무료 클러스터 생성
2. Database Access에서 DB 사용자 생성 (username/password)
3. Network Access에서 IP Whitelist: 개발 중에는 `0.0.0.0/0` 허용 후, 배포 시 제한
4. Connection String 복사 → `.env`의 `MONGODB_URI`에 붙여넣기

## 2) Run
```bash
npm i
cp .env.example .env
# .env 수정 (MONGODB_URI / JWT_SECRET)
npm run dev
# health check
curl http://localhost:3000/health
```

## 3) REST API
- POST /auth/signup { name, email, password }
- POST /auth/login { email, password }
- GET  /favorites        (Bearer <token>)
- POST /favorites        (Bearer <token>) { toiletId, fav, rating, review }
- DELETE /favorites/:toiletId  (Bearer <token>)

## 4) Expo App Integration (quick)
- 로그인/회원가입 성공 시 서버가 준 `token`을 AsyncStorage에 저장
- 보호 API 호출 시 `Authorization: Bearer <token>` 헤더 포함
- 기존 로컬 즐겨찾기 데이터를 서버와 동기화하려면, 앱 시작 시
  - AsyncStorage → 서버로 업로드(최초 1회 마이그레이션)
  - 이후 변경 발생 시 서버 POST로 반영

## 5) Production Tips
- CORS origin 화이트리스트 적용
- HTTPS (프록시나 PaaS에서)
- JWT 만료/갱신 전략 (7d → refresh 토큰 설계 가능)
- Rate limit & Helmet 적용 고려
