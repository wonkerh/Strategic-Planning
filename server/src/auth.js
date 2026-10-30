import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET;
const EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

if (!SECRET || SECRET.length < 16) {
  throw new Error("JWT_SECRET missing or too short (min 16 chars)");
}

export const hash = (pw) => bcrypt.hash(pw, 12);
export const verify = (pw, h) => bcrypt.compare(pw, h);
export const sign = (user) =>
  jwt.sign({ sub: user.id, name: user.name, role: user.role }, SECRET, {
    expiresIn: EXPIRES_IN,
  });
export const verifyToken = (token) => jwt.verify(token, SECRET);
