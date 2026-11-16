import { verifyToken } from "./auth.js";
import { db } from "./db.js";

export function requireAuth(req, res, next) {
  let token = null;
  const header = req.headers.authorization || "";
  
  if (header.startsWith("Bearer ")) {
    token = header.slice(7);
  } else if (req.query.token) {
    // Allow token in query string for file downloads
    token = req.query.token;
  }

  if (!token) return res.status(401).json({ error: "Not signed in" });

  try {
    const payload = verifyToken(token);
    const user = db.prepare("SELECT id, name, full_name, role, email, is_temp_pass, profile_complete FROM users WHERE id = ?").get(payload.sub);
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
