// src/config/db.js (교체)
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

// ✅ 환경변수 키: MONGODB_URI (README와 .env에 맞춤)
const uri = process.env.MONGODB_URI;

console.log("[db] MONGODB_URI present:", !!uri);

if (!uri) {
  console.error("[db] Missing MONGODB_URI");
  process.exit(1);
}

mongoose.set("strictQuery", true);

mongoose
  .connect(uri, {
    maxPoolSize: 12,
    serverSelectionTimeoutMS: 12000,
    dbName: process.env.MONGODB_DB || "toilet_app",
  })
  .then(() => console.log("[db] connected"))
  .catch((err) => {
    console.error("[db] failed to connect");
    console.error("[db] message=", err.message);
    if (err.message?.includes("bad auth") || err.code === 18) {
      console.error("[hint] 유저/비밀번호 불일치 (Database Access 사용자 자격 확인)");
    }
    if (err.message?.includes("ENOTFOUND") || err.message?.includes("getaddrinfo")) {
      console.error("[hint] DNS/SRV 호스트 오타 또는 네트워크 문제 (URI 호스트 확인)");
    }
    if (err.message?.includes("IP address") || err.message?.includes("not allowed")) {
      console.error("[hint] Atlas Network Access 화이트리스트(0.0.0.0/0) 설정 필요");
    }
    process.exit(1);
  });
