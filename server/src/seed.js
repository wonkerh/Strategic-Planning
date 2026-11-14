import { db } from "./db.js";
import { hash } from "./auth.js";

export async function seed() {
  const name = process.env.SEED_ADMIN_NAME || "Sandra";
  const full_name = "Sandra (Admin)";
  const pass = process.env.SEED_ADMIN_PASS || "123456";

  const exists = db.prepare("SELECT 1 FROM users WHERE name = ? COLLATE NOCASE").get(name);
  
  if (exists) {
    db.prepare("UPDATE users SET role = 'admin', full_name = ?, is_temp_pass = 0 WHERE name = ?").run(full_name, name);
  } else {
    db.prepare("INSERT INTO users (name, full_name, pass_hash, role, is_temp_pass) VALUES (?, ?, ?, 'admin', 0)").run(
      name,
      full_name,
      await hash(pass)
    );
    console.log("Seeded admin user: " + name);
  }
}
