import { Router } from "express";

const r = Router();

r.get("/", (req, res) => {
  res.json({
    sectors: [
      { name: "Logistics", color: "#2F7FB0" },
      { name: "Commercial agriculture", color: "#2E7D5B" },
      { name: "Mining", color: "#6B4226" },
      { name: "Distribution centres", color: "#B8892A" },
    ],
  });
});

export default r;
