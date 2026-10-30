import { verifyToken } from "./auth.js";
import { db } from "./db.js";

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Not signed in" });

  try {
    const payload = verifyToken(token);
    const user = db
      .prepare("SELECT id, name, role FROM users WHERE id = ?")
      .get(payload.sub);
    if (!user) return res.status(401).json({ error: "User not found" });
    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: "Session expired or invalid" });
  }
}

export function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin")
    return res.status(403).json({ error: "Admins only" });
  next();
}
