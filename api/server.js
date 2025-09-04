// ===== imports =====
const express = require("express");
const Database = require("better-sqlite3");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const path = require("path");

// ===== app & middleware =====
const app = express();
app.use(cors());              // 다른 포트에서 접근하면: app.use(cors({ origin:"http://localhost:5500", credentials:true }));
app.use(express.json());
app.use(cookieParser());

// ===== JWT =====
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
const JWT_EXPIRES = "7d";

// ===== DB (better-sqlite3) =====
const dbPath = path.join(__dirname, "linkon.db");
const db = new Database(dbPath);
db.exec(`
PRAGMA journal_mode=WAL;

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nickname TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT,
  password_hash TEXT
);

DROP INDEX IF EXISTS idx_users_nickname_ci;
DROP INDEX IF EXISTS idx_users_nickname;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_nickname
ON users(nickname COLLATE BINARY);
`);

// ===== helpers =====
const reNick = /^[A-Za-z0-9._-]{3,20}$/;
function authRequired(req, res, next) {
  const token = req.cookies?.linkon_token;
  if (!token) return res.status(401).json({ ok:false, error:"로그인이 필요합니다." });
  try { req.user = jwt.verify(token, JWT_SECRET); next(); }
  catch { return res.status(401).json({ ok:false, error:"세션이 만료되었어요. 다시 로그인 해 주세요." }); }
}

// ===== routes =====

// 닉네임 중복 확인
app.get("/api/nickname/check", (req, res) => {
  const name = (req.query.name || "").trim();
  if (!reNick.test(name)) return res.status(400).json({ ok:false, reason:"invalid_format" });
  const row = db.prepare("SELECT 1 FROM users WHERE nickname = ? COLLATE BINARY").get(name);
  res.json({ ok:true, available: !row });
});

// 회원가입 (단일 버전)
app.post("/api/signup", async (req, res) => {
  const { nickname, email, phone, password } = req.body;
  if (!reNick.test(nickname)) return res.status(400).json({ ok:false, reason:"invalid_format" });

  try {
    const passwordHash = password ? await bcrypt.hash(password, 10) : null;
    db.prepare(
      "INSERT INTO users (nickname, email, phone, password_hash) VALUES (?, ?, ?, ?)"
    ).run(nickname, email, phone, passwordHash);
    res.json({ ok:true });
  } catch (e) {
    if (String(e.code).includes("SQLITE_CONSTRAINT")) {
      return res.status(409).json({ ok:false, reason:"duplicate_nickname_or_email" });
    }
    console.error(e);
    res.status(500).json({ ok:false });
  }
});

// 로그인
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ ok:false, error:"이메일과 비밀번호를 입력해 주세요." });

    const user = db.prepare(
      "SELECT id, email, nickname, password_hash FROM users WHERE lower(email) = lower(?)"
    ).get(email);

    if (!user) return res.status(401).json({ ok:false, error:"이메일 또는 비밀번호가 올바르지 않습니다." });

    const ok = await bcrypt.compare(password, user.password_hash || "");
    if (!ok) return res.status(401).json({ ok:false, error:"이메일 또는 비밀번호가 올바르지 않습니다." });

    const token = jwt.sign({ uid:user.id, email:user.email }, JWT_SECRET, { expiresIn: JWT_EXPIRES });

    res.cookie("linkon_token", token, {
      httpOnly:true, sameSite:"lax", secure:false, // HTTPS면 true
      maxAge: 7*24*60*60*1000, path:"/",
    });

    res.json({ ok:true, user:{ id:user.id, email:user.email, nickname:user.nickname } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok:false, error:"서버 오류가 발생했어요." });
  }
});

// 내 정보
app.get("/api/me", authRequired, (req, res) => {
  res.json({ ok:true, user:req.user });
});

// 로그아웃
app.post("/api/logout", (req, res) => {
  res.clearCookie("linkon_token", { path:"/" });
  res.json({ ok:true });
});

// ===== start =====
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("LinkON server running: http://localhost:" + PORT));
