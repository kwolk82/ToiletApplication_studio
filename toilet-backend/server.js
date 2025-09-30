import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";

// ✅ 여기서 DB 연결 파일만 import (연결은 이 파일이 담당)
import "./src/config/db.js";

import favoritesRoutes from "./src/routes/favorites.js";
import authRoutes from "./src/routes/auth.js";
import reviewsRouter from "./src/routes/reviews.js";
dotenv.config();

const app = express();
app.use(cors({ origin: "*", credentials: false }));
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

app.get("/", (_, res) => res.send("OK"));
app.get("/health", (_, res) => res.json({ ok: true }));

app.use("/auth", authRoutes);
app.use("/favorites", favoritesRoutes);
app.use("/", reviewsRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`[server] listening on ${PORT}`);
});

