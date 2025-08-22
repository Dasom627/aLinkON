const express = require("express");
const Database = require("better-sqlite3");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// SQLite 파일 생성/연결
const db = new Database("linkon.db");
db.exec(`
  PRAGMA journal_mode = WAL;
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nickname TEXT NOT NULL,
    email TEXT UNIQUE,
    phone TEXT,
    password_hash TEXT
  );
  CREATE UNIQUE INDEX IF NOT EXISTS idx_users_nickname_ci
  ON users (lower(nickname));
`);

const reNick = /^[a-z0-9._-]{3,20}$/;

// 닉네임 중복확인
app.get("/api/nickname/check", (req, res) => {
  const name = (req.query.name || "").trim();
  if (!reNick.test(name)) {
    return res.status(400).json({ ok: false, reason: "invalid_format" });
  }
  const row = db.prepare("SELECT 1 FROM users WHERE lower(nickname)=lower(?)").get(name);
  res.json({ ok: true, available: !row });
});

// (옵션) 가입 API 데모
app.post("/api/signup", (req, res) => {
  const { nickname, email, phone, password_hash } = req.body;
  if (!reNick.test(nickname)) {
    return res.status(400).json({ ok: false, reason: "invalid_format" });
  }
  try {
    db.prepare(
      "INSERT INTO users (nickname, email, phone, password_hash) VALUES (?, ?, ?, ?)"
    ).run(nickname, email, phone, password_hash || null);
    res.json({ ok: true });
  } catch (e) {
    if (String(e.code).includes("SQLITE_CONSTRAINT")) {
      return res.status(409).json({ ok: false, reason: "duplicate_nickname" });
    }
    console.error(e);
    res.status(500).json({ ok: false });
  }
});

app.listen(3000, () => console.log("API running: http://localhost:3000"));
