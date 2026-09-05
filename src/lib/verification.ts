import { createHash, randomInt } from "node:crypto";

export function createVerificationCode() {
  return String(randomInt(100000, 1000000));
}

export function hashVerificationCode(code: string) {
  return createHash("sha256").update(`${process.env.JWT_SECRET || "clothflow-code"}:${code}`).digest("hex");
}