import { Router } from "express";
import { db } from "../db.js";
import { requireAuth, requireAdmin } from "../middleware.js";
import { hash } from "../auth.js";
import { sendCredentialsEmail, sendDepositEmail } from "../mailer.js";
import multer from "multer";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
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
  const users = db.prepare("SELECT id, name, full_name, email, role, is_temp_pass, created_at FROM users ORDER BY name ASC").all();
  res.json({ users });
});

r.post("/users", async (req, res) => {
  const full_name = String(req.body?.name || "").trim();
  const email = String(req.body?.email || "").trim();
  const pass = "Temp1234"; 
  
  if (full_name.length < 2) return res.status(400).json({ error: "Name must be at least 2 characters" });
  if (!email || !email.includes("@")) return res.status(400).json({ error: "Valid email is required" });

  const count = db.prepare("SELECT COUNT(*) as c FROM users").get().c;
  const uniqueId = `SP-${1000 + count + 1}`;

  db.prepare("INSERT INTO users (name, full_name, email, pass_hash, role, is_temp_pass) VALUES (?, ?, ?, ?, 'member', 1)")
    .run(uniqueId, full_name, email, await hash(pass));
    
  const emailResult = await sendCredentialsEmail(email, full_name, uniqueId, pass);

  if (!emailResult.success) {
    return res.status(201).json({ ok: true, username: uniqueId, tempPass: pass, full_name, warning: "Account created but email failed to send. Please provide details manually." });
  }
  res.status(201).json({ ok: true, username: uniqueId, tempPass: pass, full_name });
});

// --- MEMBER BALANCES ---
r.get("/balances", (req, res) => {
  const users = db.prepare("SELECT id, name, full_name, email, role, created_at FROM users WHERE role = 'member' ORDER BY name ASC").all();
  const allTxs = db.prepare("SELECT user_id, amount, kind FROM transactions").all();

  const balances = users.map(u => {
    const userTxs = allTxs.filter(t => t.user_id === u.id);
    const deposits = userTxs.filter(t => t.kind === "deposit").reduce((sum, t) => sum + t.amount, 0);
    const withdrawals = userTxs.filter(t => t.kind === "withdraw").reduce((sum, t) => sum + t.amount, 0);
    const total = deposits - withdrawals;
    return { id: u.id, name: u.name, full_name: u.full_name, email: u.email, joined: u.created_at.split(" ")[0], totalInvested: total, units: total / 1000 };
  });

  res.json({ balances });
});

// --- ADMIN MANUAL DEPOSIT (With Base64 Image) ---
r.post("/manual-deposit", upload.single("proof"), async (req, res) => {
  const userId = Number(req.body?.userId);
  const amount = Number(req.body?.amount);
  const date = String(req.body?.date || "");
  const note = String(req.body?.note || "Committee Recorded Payment");
  
  let proof_base64 = null;
  if (req.file) {
    proof_base64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
  }

  if (!Number.isFinite(amount) || amount <= 0) return res.status(400).json({ error: "Amount must be > 0" });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return res.status(400).json({ error: "Date must be YYYY-MM-DD" });

  const user = db.prepare("SELECT id, email, full_name FROM users WHERE id = ?").get(userId);
  if (!user) return res.status(404).json({ error: "User not found" });

  const depositDate = new Date(date);
  depositDate.setFullYear(depositDate.getFullYear() + 1);
  const end_date = depositDate.toISOString().slice(0, 10);

  db.prepare(
    "INSERT INTO transactions (user_id, kind, amount, note, date, end_date, is_locked, proof_file) VALUES (?, 'deposit', ?, ?, ?, ?, 1, ?)"
  ).run(userId, amount, note, date, end_date, proof_base64);

  // Send transparency email
  if (user.email) {
    await sendDepositEmail(user.email, user.full_name, amount, date, note);
  }

  res.json({ ok: true });
});

// --- BULK MEMBER CREATION ---
r.post("/bulk-users", async (req, res) => {
  const members = req.body?.members || [];
  if (!Array.isArray(members) || members.length === 0) return res.status(400).json({ error: "No members provided" });
  const results = { success: 0, failed: 0, errors: [], created: [] };
  let count = db.prepare("SELECT COUNT(*) as c FROM users").get().c;
  const tempPass = "Temp1234";

  for (const m of members) {
    const full_name = String(m.name || "").trim();
    if (full_name.length < 2) { results.failed++; results.errors.push(`"${full_name}": Name too short`); continue; }
    
    const uniqueId = `SP-${1000 + count + 1}`;
    count++;

    try {
      db.prepare("INSERT INTO users (name, full_name, email, pass_hash, role, is_temp_pass) VALUES (?, ?, ?, ?, 'member', 1)")
        .run(uniqueId, full_name, null, await hash(tempPass));
      results.success++;
      results.created.push({ full_name, username: uniqueId, tempPass });
    } catch (err) { results.failed++; results.errors.push(`"${full_name}": Database error`); }
  }
  res.json(results);
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

