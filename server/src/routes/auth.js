import { Router } from "express";
import { randomBytes } from "node:crypto";
import { db } from "../db.js";
import { hash, verify, sign } from "../auth.js";
import { requireAuth } from "../middleware.js";

const r = Router();

r.post("/register", async (req, res) => {
  const name = String(req.body?.name || "").trim();
  const pass = String(req.body?.pass || "");

  if (name.length < 2 || name.length > 40)
    return res.status(400).json({ error: "Name must be 2-40 characters" });
  if (pass.length < 6)
    return res.status(400).json({ error: "Password must be at least 6 characters" });

  const exists = db.prepare("SELECT 1 FROM users WHERE name = ? COLLATE NOCASE").get(name);
  if (exists) return res.status(409).json({ error: "That user name is taken" });

  const info = db.prepare("INSERT INTO users (name, pass_hash) VALUES (?, ?)").run(name, await hash(pass));

  const user = { id: info.lastInsertRowid, name, role: "member" };
  res.status(201).json({ token: sign(user), user });
});

r.post("/login", async (req, res) => {
  const name = String(req.body?.name || "").trim();
  const pass = String(req.body?.pass || "");

  const row = db.prepare("SELECT id, name, role, pass_hash FROM users WHERE name = ? COLLATE NOCASE").get(name);

  if (!row || !(await verify(pass, row.pass_hash)))
    return res.status(401).json({ error: "User name or password is not correct" });

  const user = { id: row.id, name: row.name, role: row.role };
  res.json({ token: sign(user), user });
});

r.get("/me", requireAuth, (req, res) => res.json({ user: req.user }));

r.post("/change-password", requireAuth, async (req, res) => {
  const current = String(req.body?.current || "");
  const next = String(req.body?.next || "");

  if (next.length < 6)
    return res.status(400).json({ error: "New password must be at least 6 characters" });

  const row = db.prepare("SELECT pass_hash FROM users WHERE id = ?").get(req.user.id);
  if (!row || !(await verify(current, row.pass_hash)))
    return res.status(401).json({ error: "Current password is not correct" });

  db.prepare("UPDATE users SET pass_hash = ? WHERE id = ?").run(await hash(next), req.user.id);
  res.json({ ok: true });
});

r.post("/forgot", (req, res) => {
  const name = String(req.body?.name || "").trim();
  const user = db.prepare("SELECT id, name FROM users WHERE name = ? COLLATE NOCASE").get(name);

  if (!user) {
    console.log(`[forgot] no user named "${name}"`);
    return res.json({ ok: true });
  }

  const token = randomBytes(24).toString("hex");
  const expires = new Date(Date.now() + 30 * 60 * 1000).toISOString();

  db.prepare("INSERT INTO reset_tokens (token, user_id, expires_at) VALUES (?, ?, ?)").run(token, user.id, expires);

  console.log("\n=================================================");
  console.log(` RESET TOKEN for user: ${user.name}`);
  console.log(` TOKEN: ${token}`);
  console.log("=================================================\n");

  res.json({ ok: true, devToken: token });
});

r.post("/reset", async (req, res) => {
  const token = String(req.body?.token || "").trim();
  const pass = String(req.body?.pass || "");

  if (pass.length < 6)
    return res.status(400).json({ error: "Password must be at least 6 characters" });

  const row = db.prepare(
    `SELECT t.user_id, t.expires_at, t.used, u.name
     FROM reset_tokens t JOIN users u ON u.id = t.user_id WHERE t.token = ?`
  ).get(token);

  if (!row) return res.status(400).json({ error: "Invalid reset token" });
  if (row.used) return res.status(400).json({ error: "Token already used" });
  if (new Date(row.expires_at) < new Date()) return res.status(400).json({ error: "Token expired" });

  db.prepare("UPDATE users SET pass_hash = ? WHERE id = ?").run(await hash(pass), row.user_id);
  db.prepare("UPDATE reset_tokens SET used = 1 WHERE token = ?").run(token);

  res.json({ ok: true, name: row.name });
});

export default r;
