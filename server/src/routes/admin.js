import { Router } from "express";
import { db } from "../db.js";
import { requireAuth, requireAdmin } from "../middleware.js";

const r = Router();
r.use(requireAuth, requireAdmin);

r.post("/roi", (req, res) => {
  const month = String(req.body?.month || "");
  const rate_pct = Number(req.body?.rate_pct);
  const note = String(req.body?.note || "").slice(0, 200);

  if (!/^\d{4}-\d{2}$/.test(month))
    return res.status(400).json({ error: "Month must be YYYY-MM" });
  if (!Number.isFinite(rate_pct) || rate_pct < -100 || rate_pct > 100)
    return res.status(400).json({ error: "Rate must be between -100 and 100 (%)" });

  db.prepare(
    `INSERT INTO roi_rates (month, rate_pct, note)
     VALUES (?, ?, ?)
     ON CONFLICT(month) DO UPDATE SET rate_pct = excluded.rate_pct, note = excluded.note`
  ).run(month, rate_pct, note);

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

export default r;
