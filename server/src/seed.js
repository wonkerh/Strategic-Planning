import { db } from "./db.js";
import { hash } from "./auth.js";

export async function seed() {
  const name = process.env.SEED_ADMIN_NAME || "Sandra";
  const pass = process.env.SEED_ADMIN_PASS || "123456";

  const exists = db
    .prepare("SELECT 1 FROM users WHERE name = ? COLLATE NOCASE")
    .get(name);
  if (exists) return;

  db.prepare("INSERT INTO users (name, pass_hash, role) VALUES (?, ?, 'admin')").run(
    name,
    await hash(pass)
  );
  console.log("Seeded admin user: " + name);
}
