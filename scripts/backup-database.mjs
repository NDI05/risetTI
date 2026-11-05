import Database from "better-sqlite3";
import { mkdir, readdir, stat, unlink } from "node:fs/promises";
import { resolve } from "node:path";

const sourcePath = resolve(process.env.DATABASE_PATH ?? "./data/risetti.sqlite");
if (process.env.DATABASE_PATH === ":memory:") throw new Error("Basis data in-memory tidak dapat dicadangkan.");

const backupDirectory = resolve(process.env.BACKUP_DIR ?? "./backups");
const retentionDays = Number(process.env.BACKUP_RETENTION_DAYS ?? 30);
if (!Number.isSafeInteger(retentionDays) || retentionDays < 1 || retentionDays > 3650) {
  throw new Error("BACKUP_RETENTION_DAYS harus berupa angka antara 1 dan 3650.");
}
await mkdir(backupDirectory, { recursive: true });

const timestamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
const destinationPath = resolve(backupDirectory, `risetti-${timestamp}.sqlite`);
if (sourcePath === destinationPath) {
  throw new Error("Lokasi file backup tidak boleh sama dengan basis data aktif.");
}

const database = new Database(sourcePath, { readonly: true, fileMustExist: true });
try {
  await database.backup(destinationPath);
} finally {
  database.close();
}

const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000;
for (const name of await readdir(backupDirectory)) {
  if (!/^risetti-\d{8}T\d{6}Z\.sqlite$/.test(name)) continue;
  const filePath = resolve(backupDirectory, name);
  const fileStats = await stat(filePath);
  if (fileStats.isFile() && fileStats.mtimeMs < cutoff) await unlink(filePath);
}

console.info(`Backup basis data dibuat: ${destinationPath}`);
