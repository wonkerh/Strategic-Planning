import { Router } from "express";
import { db } from "../db.js";
import { requireAuth } from "../middleware.js";

const r = Router();
r.use(requireAuth);

const SECTORS = [
  "Logistics",
  "Commercial agriculture",
  "Mining",
  "Distribution centres",
];

r.post("/", (req, res) => {
  const sector = String(req.body?.sector || "");
  const amount = Number(req.body?.amount);
  const date = String(req.body?.date || "");

  if (!SECTORS.includes(sector))
    return res.status(400).json({ error: "Unknown sector" });
  if (!Number.isFinite(amount) || amount <= 0)
    return res.status(400).json({ error: "Amount must be > 0" });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date))
    return res.status(400).json({ error: "Date must be YYYY-MM-DD" });

  const info = db
    .prepare("INSERT INTO investments (user_id, sector, amount, date) VALUES (?, ?, ?, ?)")
    .run(req.user.id, sector, amount, date);

  const row = db
    .prepare("SELECT id, sector, amount, date FROM investments WHERE id = ?")
    .get(info.lastInsertRowid);
  res.status(201).json({ investment: row });
});

r.get("/mine", (req, res) => {
  const rows = db
    .prepare(
      "SELECT id, sector, amount, date FROM investments WHERE user_id = ? ORDER BY date DESC, id DESC"
    )
    .all(req.user.id);
  res.json({ investments: rows });
});

r.delete("/:id", (req, res) => {
  const id = Number(req.params.id);
  const info = db
    .prepare("DELETE FROM investments WHERE id = ? AND user_id = ?")
    .run(id, req.user.id);
  if (info.changes === 0)
    return res.status(404).json({ error: "Investment not found" });
  res.json({ ok: true });
});

r.get("/summary", (req, res) => {
  const all = db
    .prepare(
      `SELECT i.id, i.sector, i.amount, i.date, u.name AS who
       FROM investments i JOIN users u ON u.id = i.user_id
       ORDER BY i.date DESC, i.id DESC`
    )
    .all();

  const me = req.user.name;
  const pool = all.reduce((s, i) => s + i.amount, 0);
  const mine = all.filter((i) => i.who === me);
  const my = mine.reduce((s, i) => s + i.amount, 0);

  const people = {};
  all.forEach((i) => (people[i.who] = 1));

  const sectors = SECTORS.map((name) => {
    const list = all.filter((i) => i.sector === name);
    const members = new Set(list.map((i) => i.who));
    return {
      name,
      total: list.reduce((s, i) => s + i.amount, 0),
      members: members.size,
      mine: list.filter((i) => i.who === me).reduce((s, i) => s + i.amount, 0),
    };
  });

  const members = Object.keys(people).map((name) => {
    const list = all.filter((i) => i.who === name);
    const by = {};
    list.forEach((i) => (by[i.sector] = (by[i.sector] || 0) + i.amount));
    const top = Object.keys(by).sort((a, b) => by[b] - by[a])[0];
    return {
      name,
      total: list.reduce((s, i) => s + i.amount, 0),
      top,
      isMe: name === me,
    };
  });
  members.sort((a, b) => b.total - a.total);

  const drilldown = {};
  SECTORS.forEach((name) => {
    const list = all.filter((i) => i.sector === name);
    const by = {};
    list.forEach((i) => (by[i.who] = (by[i.who] || 0) + i.amount));
    drilldown[name] = Object.entries(by)
      .map(([who, amount]) => ({ who, amount }))
      .sort((a, b) => b.amount - a.amount);
  });

  res.json({
    me,
    totals: {
      pool,
      my,
      mySharePct: pool ? (my / pool) * 100 : 0,
      membersInvesting: members.length,
      payments: mine.length,
    },
    sectors,
    members,
    drilldown,
    myInvestments: mine.map(({ id, sector, amount, date }) => ({ id, sector, amount, date })),
  });
});

export default r;
