import { Router } from "express";
import { db } from "../db.js";
import { requireAuth, requireAdmin } from "../middleware.js";
import { hash } from "../auth.js";

const r = Router();
r.use(requireAuth, requireAdmin);

// --- ROI MANAGEMENT ---
r.post("/roi", (req, res) => {
  const month = String(req.body?.month || "");
  const rate_pct = Number(req.body?.rate_pct);
  const note = String(req.body?.note || "").slice(0, 200);
  if (!/^\d{4}-\d{2}$/.test(month)) return res.status(400).json({ error: "Month must be YYYY-MM" });
  db.prepare(`INSERT INTO roi_rates (month, rate_pct, note) VALUES (?, ?, ?) ON CONFLICT(month) DO UPDATE SET rate_pct = excluded.rate_pct, note = excluded.note`).run(month, rate_pct, note);
  res.json({ ok: true });
});
r.get("/roi", (req, res) => {
  const rows = db.prepare("SELECT month, rate_pct, note, created_at FROM roi_rates ORDER BY month DESC").all();
  res.json({ roi: rows });
});
r.delete("/roi/:month", (req, res) => {
  const info = db.prepare("DELETE FROM roi_rates WHERE month = ?").run(req.params.month);
  if (!info.changes) return res.status(404).json({ error: "Not found" });
  res.json({ ok: true });
});

// --- MEMBER MANAGEMENT ---
r.get("/users", (req, res) => {
  const users = db.prepare("SELECT id, name, role, created_at FROM users ORDER BY name ASC").all();
  res.json({ users });
});
r.post("/users", async (req, res) => {
  const name = String(req.body?.name || "").trim();
  const pass = String(req.body?.pass || "");
  if (name.length < 2 || name.length > 40) return res.status(400).json({ error: "Name must be 2-40 characters" });
  if (pass.length < 6) return res.status(400).json({ error: "Password must be at least 6 characters" });
  const exists = db.prepare("SELECT 1 FROM users WHERE name = ? COLLATE NOCASE").get(name);
  if (exists) return res.status(409).json({ error: "That user name is taken" });
  db.prepare("INSERT INTO users (name, pass_hash, role) VALUES (?, ?, 'member')").run(name, await hash(pass));
  res.status(201).json({ ok: true });
});

// --- REPORTS MANAGEMENT ---
r.get("/reports", (req, res) => {
  const period = String(req.query.period || "monthly");
  const now = new Date(); let startDate = new Date();
  if (period === "weekly") startDate.setDate(now.getDate() - 7);
  else if (period === "monthly") startDate.setMonth(now.getMonth() - 1);
  else if (period === "3months") startDate.setMonth(now.getMonth() - 3);
  else if (period === "yearly") startDate.setFullYear(now.getFullYear() - 1);
  else if (period === "2years") startDate.setFullYear(now.getFullYear() - 2);
  const startStr = startDate.toISOString().slice(0, 10);

  const allTxs = db.prepare("SELECT * FROM transactions").all();
  const activeUsers = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'member'").get().count;
  const periodTxs = allTxs.filter(t => t.date >= startStr && t.kind === "deposit");
  const periodTotal = periodTxs.reduce((sum, t) => sum + t.amount, 0);
  const periodMembers = new Set(periodTxs.map(t => t.user_id)).size;
  const sectorTxs = db.prepare("SELECT sector, amount FROM investments WHERE date >= ?").all(startStr);
  
  const sectorBreakdown = {};
  sectorTxs.forEach(t => { sectorBreakdown[t.sector] = (sectorBreakdown[t.sector] || 0) + t.amount; });

  res.json({
    period, startDate: startStr, endDate: now.toISOString().slice(0, 10),
    stats: { totalMembers: activeUsers, newDeposits: periodTotal, newInvestors: periodMembers, totalPool: allTxs.filter(t => t.kind === "deposit").reduce((sum, t) => sum + t.amount, 0) },
    sectorBreakdown
  });
});

export default r;
