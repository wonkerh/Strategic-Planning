import { Router } from "express";
import { requireAdmin } from "../middleware.js";

const r = Router();

r.get("/", requireAdmin, (req, res) => {
  res.json({ ok: true });
});

export default r;
