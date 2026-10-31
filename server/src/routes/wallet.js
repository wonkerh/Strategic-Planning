import { Router } from "express";
import { db } from "../db.js";
import { requireAuth } from "../middleware.js";

const r = Router();
r.use(requireAuth);

function ledgerFor(userId) {
  return db.prepare("SELECT id, kind, amount, note, date, end_date, is_locked, created_at FROM transactions WHERE user_id = ? ORDER BY date ASC, id ASC").all(userId);
}
function investmentsFor(userId) {
  return db.prepare("SELECT id, sector, amount, date FROM investments WHERE user_id = ? ORDER BY date ASC, id ASC").all(userId);
}
function roiRows() {
  return db.prepare("SELECT month, rate_pct FROM roi_rates ORDER BY month ASC").all();
}
function cashBalance(txs) {
  const today = new Date().toISOString().slice(0, 10);
  return txs.reduce((s, t) => {
    if (t.kind === "deposit") {
      if (t.is_locked === 1 && t.end_date > today) return s; 
      return s + t.amount;
    }
    if (t.kind === "withdraw") return s - t.amount;
    return s;
  }, 0);
}
function investedTotal(invs) {
  return invs.reduce((s, i) => s + i.amount, 0);
}

function growthSeries(txs, invs, rois) {
  if (!txs.length) return { series: [], final: 0 };
  const firstDate = new Date(txs[0].date);
  const today = new Date(); today.setUTCHours(0, 0, 0, 0);
  const rateByMonth = {}; for (const r of rois) rateByMonth[r.month] = r.rate_pct / 100;
  const events = txs.map((t) => ({ date: t.date, delta: t.kind === "deposit" ? t.amount : -t.amount }));
  let balance = 0; let cursor = new Date(firstDate); const series = [];
  while (cursor <= today) {
    const dayStr = cursor.toISOString().slice(0, 10);
    for (const e of events) if (e.date === dayStr) balance += e.delta;
    const monthKey = dayStr.slice(0, 7); const rt = rateByMonth[monthKey] || 0;
    if (rt > 0 && balance > 0) {
      const dim = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, 0)).getUTCDate();
      balance += balance * (rt / dim);
    }
    series.push({ date: dayStr, balance: Math.round(balance * 100) / 100 });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return { series, final: Math.round(balance * 100) / 100 };
}

r.get("/summary", (req, res) => {
  const txs = ledgerFor(req.user.id); const invs = investmentsFor(req.user.id); const rois = roiRows();
  const cash = cashBalance(txs); const invested = investedTotal(invs); const { series, final } = growthSeries(txs, invs, rois);
  const growth = final - cash;
  const deposits = txs.filter((t) => t.kind === "deposit").reduce((s, t) => s + t.amount, 0);
  
  res.json({
    totals: { deposited: deposits, cash, invested, growth, balanceWithGrowth: final, roiMonthsSet: rois.length },
    series, transactions: txs, investments: invs, roi: rois,
  });
});

r.post("/deposit", (req, res) => {
  const amount = Number(req.body?.amount);
  const date = String(req.body?.date || "");
  
  if (amount <= 0 || amount % 1000 !== 0) {
    return res.status(400).json({ error: "Deposits must be made in multiples of R1,000 (1 Unit)." });
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return res.status(400).json({ error: "Date must be YYYY-MM-DD" });
  
  const depositDate = new Date(date);
  depositDate.setFullYear(depositDate.getFullYear() + 1);
  const end_date = depositDate.toISOString().slice(0, 10);
  const units = amount / 1000;

  const info = db.prepare("INSERT INTO transactions (user_id, kind, amount, note, date, end_date, is_locked) VALUES (?, 'deposit', ?, '12-Month Contract', ?, ?, 1)").run(req.user.id, amount, date, end_date);
  res.status(201).json({ transaction: db.prepare("SELECT * FROM transactions WHERE id = ?").get(info.lastInsertRowid) });
});

r.get("/roi", (req, res) => { res.json({ roi: roiRows() }); });

export default r;
