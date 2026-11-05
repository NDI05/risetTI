import "dotenv/config";
import { bootstrapAdmin, createDatabase } from "./db.js";
import { createApp } from "./app.js";
import { validateEmail, validatePassword } from "./validation.js";

const db = createDatabase(process.env.DATABASE_PATH ?? "./data/risetti.sqlite");
const adminEmail = process.env.ADMIN_EMAIL?.trim();
const adminPassword = process.env.ADMIN_PASSWORD;
const production = process.env.NODE_ENV === "production";
if (production && (!adminEmail || !adminPassword)) {
  throw new Error("ADMIN_EMAIL dan ADMIN_PASSWORD wajib diatur sebelum menjalankan mode production.");
}
if (production && process.env.COOKIE_SECURE !== "true") {
  throw new Error("COOKIE_SECURE=true wajib diatur untuk menjalankan mode production melalui HTTPS.");
}
if (adminEmail && adminPassword) {
  const email = validateEmail(adminEmail);
  const password = validatePassword(adminPassword);
  const result = bootstrapAdmin(db, email, password);
  if (result === "created") console.info(`Akun admin awal dibuat untuk ${email}.`);
} else {
  console.info("Akun admin belum dibuat. Atur ADMIN_EMAIL dan ADMIN_PASSWORD sebelum menjalankan aplikasi untuk mengelola katalog.");
}

const app = createApp({ db });
const port = Number(process.env.PORT ?? 3000);
const host = process.env.HOST ?? "127.0.0.1";
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("PORT harus berupa angka antara 1 dan 65535.");
const server = app.listen(port, host, () => console.info(`RisetTI berjalan di http://${host}:${port}`));
let shuttingDown = false;

function shutdown(signal: string): void {
  if (shuttingDown) return;
  shuttingDown = true;
  console.info(`Menerima ${signal}; menunggu permintaan aktif selesai.`);
  const forceCloseTimer = setTimeout(() => {
    console.error("Waktu shutdown habis; menutup koneksi yang masih terbuka.");
    server.closeAllConnections();
  }, 110_000);
  forceCloseTimer.unref();

  server.close((error) => {
    clearTimeout(forceCloseTimer);
    try {
      db.pragma("wal_checkpoint(TRUNCATE)");
      db.close();
    } catch (closeError) {
      console.error("Gagal menutup basis data dengan bersih:", closeError);
      process.exitCode = 1;
    }
    if (error) {
      console.error("Gagal menutup server dengan bersih:", error);
      process.exitCode = 1;
    }
  });
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
server.on("error", (error) => {
  console.error("Server gagal berjalan:", error);
  try { db.close(); } catch { /* process is exiting */ }
  process.exitCode = 1;
});
