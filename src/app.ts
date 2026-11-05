import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import express, { type ErrorRequestHandler, type RequestHandler } from "express";
import { draftWorksheet, suggestIntakeQuestions, suggestKeywords, summarizeReferences } from "./ai.js";
import { archiveReference, bootstrapAdmin, countReferences, createDatabase, getReference, insertReference, listIdeas, listReferences, listShortlist, listTagOptions, saveIdea, updateReference, type Sqlite } from "./db.js";
import { ApiError } from "./errors.js";
import { OllamaClient } from "./ollama.js";
import { digestToken, hashPassword, newCsrfToken, newSessionToken, safeEqual, verifyPassword } from "./security.js";
import type { AppRequest, AuthContext, PublicUser } from "./types.js";
import { bodyObject, integerIds, positiveId, textValue, validateEmail, validateIdeaIntake, validatePassword, validateReferenceInput, validateWorksheet } from "./validation.js";

const SESSION_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000;
const SESSION_COOKIE = "risetti.sid";

interface AppOptions {
  db?: Sqlite;
  ollama?: OllamaClient;
  publicDir?: string;
  cookieSecure?: boolean;
  trustProxyHops?: number;
  adminEmail?: string;
  adminPassword?: string;
}

interface AuthRow {
  tokenHash: string;
  csrfToken: string;
  id: number;
  name: string;
  email: string;
  role: "mahasiswa" | "admin";
}

function requestCookie(req: AppRequest): string | null {
  for (const segment of (req.headers.cookie ?? "").split(";")) {
    const [name, ...parts] = segment.trim().split("=");
    if (name === SESSION_COOKIE) return parts.join("=") || null;
  }
  return null;
}

function userFromRow(row: AuthRow): PublicUser {
  return { id: row.id, name: row.name, email: row.email, role: row.role };
}

function pathId(req: AppRequest): number {
  const value = req.params.id;
  if (typeof value !== "string") throw new ApiError(400, "ID tidak valid.");
  return positiveId(value);
}

function serializeCookie(token: string, secure: boolean): string {
  return `${SESSION_COOKIE}=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${Math.floor(SESSION_LIFETIME_MS / 1000)}${secure ? "; Secure" : ""}`;
}

function createSession(db: Sqlite, userId: number, secure: boolean, res: express.Response): AuthContext {
  const token = newSessionToken();
  const tokenHash = digestToken(token);
  const csrfToken = newCsrfToken();
  const expiresAt = Date.now() + SESSION_LIFETIME_MS;
  db.prepare("INSERT INTO sessions (token_hash, user_id, csrf_token, expires_at) VALUES (?, ?, ?, ?)")
    .run(tokenHash, userId, csrfToken, expiresAt);
  const user = db.prepare("SELECT id, name, email, role FROM users WHERE id = ?").get(userId) as PublicUser;
  res.setHeader("Set-Cookie", serializeCookie(token, secure));
  return { user, tokenHash, csrfToken };
}

function assertReferenceIds(db: Sqlite, ids: number[]): void {
  for (const id of ids) {
    if (!getReference(db, id)) throw new ApiError(400, "Pilih hanya referensi aktif yang tersedia di katalog.");
  }
}

const DRAFT_SECTION_KEYS = ["problem", "context", "dataSources", "method", "technologies", "technicalNeeds", "timeResources", "risksValidation"] as const;

function validateSectionReferenceIds(value: unknown): Record<string, number[]> {
  if (value === undefined) return {};
  const body = bodyObject(value);
  const result: Record<string, number[]> = {};
  for (const [key, ids] of Object.entries(body)) {
    if (!(DRAFT_SECTION_KEYS as readonly string[]).includes(key)) throw new ApiError(400, "Bagian sitasi tidak valid.");
    result[key] = integerIds(ids, "sitasi", 2);
  }
  return result;
}

function configuredTrustProxyHops(): number {
  const value = process.env.TRUST_PROXY_HOPS ?? "0";
  if (!/^\d+$/.test(value)) throw new Error("TRUST_PROXY_HOPS harus berupa angka bulat mulai dari 0.");
  const hops = Number(value);
  if (!Number.isSafeInteger(hops) || hops > 5) throw new Error("TRUST_PROXY_HOPS harus berada di antara 0 dan 5.");
  return hops;
}

function rateLimiter(): RequestHandler {
  const attempts = new Map<string, { timestamps: number[]; lastSeen: number }>();
  let lastCleanupAt = 0;
  return ((req, res, next) => {
    const now = Date.now();
    const key = req.ip || req.socket.remoteAddress || "unknown";
    if (now - lastCleanupAt >= 60_000) {
      for (const [address, bucket] of attempts) {
        if (now - bucket.lastSeen >= 15 * 60_000) attempts.delete(address);
      }
      lastCleanupAt = now;
    }
    const recent = (attempts.get(key)?.timestamps ?? []).filter((time) => now - time < 15 * 60_000);
    if (recent.length >= 10) {
      attempts.set(key, { timestamps: recent, lastSeen: now });
      res.status(429).json({ error: "Terlalu banyak percobaan. Tunggu beberapa menit lalu coba lagi." });
      return;
    }
    recent.push(now);
    attempts.delete(key);
    attempts.set(key, { timestamps: recent, lastSeen: now });
    while (attempts.size > 10_000) {
      const oldestAddress = attempts.keys().next().value as string | undefined;
      if (!oldestAddress) break;
      attempts.delete(oldestAddress);
    }
    next();
  }) satisfies RequestHandler;
}

export function createApp(options: AppOptions = {}) {
  const db = options.db ?? createDatabase();
  const ollama = options.ollama ?? new OllamaClient({
    baseUrl: process.env.OLLAMA_BASE_URL ?? "http://localhost:11434",
    model: process.env.OLLAMA_MODEL ?? "gemma4:e2b-it-q4_K_M",
  });
  const secureCookie = options.cookieSecure ?? process.env.COOKIE_SECURE === "true";
  if (options.adminEmail && options.adminPassword) bootstrapAdmin(db, options.adminEmail, options.adminPassword);

  const app = express();
  app.set("trust proxy", options.trustProxyHops ?? configuredTrustProxyHops());
  app.disable("x-powered-by");
  app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Content-Security-Policy", "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'");
    next();
  });
  // API clients send small JSON documents; rejecting compressed bodies also
  // avoids decompression risk and does not affect the browser application.
  app.use(express.json({ limit: "64kb", strict: true, inflate: false }));
  app.use((req: AppRequest, _res, next) => {
    const rawToken = requestCookie(req);
    if (rawToken) {
      const tokenHash = digestToken(rawToken);
      const row = db.prepare(`SELECT s.token_hash AS tokenHash, s.csrf_token AS csrfToken,
        u.id, u.name, u.email, u.role FROM sessions s JOIN users u ON u.id = s.user_id
        WHERE s.token_hash = ? AND s.expires_at > ?`).get(tokenHash, Date.now()) as AuthRow | undefined;
      if (row) req.auth = { user: userFromRow(row), tokenHash: row.tokenHash, csrfToken: row.csrfToken };
    }
    next();
  });
  app.use("/api", (req: AppRequest, res, next) => {
    if (!["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) return next();
    if (req.path === "/auth/login" || req.path === "/auth/register") return next();
    if (!req.auth) return res.status(401).json({ error: "Masuk terlebih dahulu untuk melanjutkan." });
    const supplied = req.header("x-csrf-token") ?? "";
    if (!safeEqual(supplied, req.auth.csrfToken)) return res.status(403).json({ error: "Sesi formulir berakhir. Muat ulang halaman lalu coba lagi." });
    next();
  });

  const authLimiter = rateLimiter();
  const requireUser: RequestHandler = (req: AppRequest, res, next) => {
    if (!req.auth) return res.status(401).json({ error: "Masuk terlebih dahulu untuk melanjutkan." });
    next();
  };
  const requireAdmin: RequestHandler = (req: AppRequest, res, next) => {
    if (!req.auth) return res.status(401).json({ error: "Masuk terlebih dahulu untuk melanjutkan." });
    if (req.auth.user.role !== "admin") return res.status(403).json({ error: "Fitur ini hanya untuk admin katalog." });
    next();
  };

  app.get("/health/live", (_req, res) => res.status(200).json({ status: "alive" }));
  app.get("/health/ready", (_req, res) => {
    try {
      db.prepare("SELECT 1").get();
      res.status(200).json({ status: "ready" });
    } catch {
      res.status(503).json({ status: "unavailable" });
    }
  });

  app.get("/api/session", (req: AppRequest, res) => {
    res.json({ user: req.auth?.user ?? null, csrfToken: req.auth?.csrfToken ?? null });
  });

  app.post("/api/auth/register", authLimiter, (req, res) => {
    const body = bodyObject(req.body);
    const name = textValue(body.name, "nama", 80, true);
    if (name.length < 2) throw new ApiError(400, "Nama harus berisi sedikitnya 2 karakter.");
    const email = validateEmail(body.email);
    const password = validatePassword(body.password);
    if (db.prepare("SELECT 1 FROM users WHERE email = ? COLLATE NOCASE").get(email)) throw new ApiError(409, "Email tersebut sudah memiliki akun.");
    const result = db.prepare("INSERT INTO users (name, email, password_hash, role, created_at) VALUES (?, ?, ?, 'mahasiswa', ?)")
      .run(name, email, hashPassword(password), new Date().toISOString());
    const auth = createSession(db, Number(result.lastInsertRowid), secureCookie, res);
    res.status(201).json({ user: auth.user, csrfToken: auth.csrfToken });
  });

  app.post("/api/auth/login", authLimiter, (req, res) => {
    const body = bodyObject(req.body);
    const email = validateEmail(body.email);
    if (typeof body.password !== "string" || body.password.length > 200) throw new ApiError(400, "Email atau kata sandi belum benar.");
    const row = db.prepare("SELECT id, password_hash AS passwordHash FROM users WHERE email = ? COLLATE NOCASE")
      .get(email) as { id: number; passwordHash: string } | undefined;
    if (!row || !verifyPassword(body.password, row.passwordHash)) throw new ApiError(401, "Email atau kata sandi belum benar.");
    db.prepare("DELETE FROM sessions WHERE expires_at <= ?").run(Date.now());
    const auth = createSession(db, row.id, secureCookie, res);
    res.json({ user: auth.user, csrfToken: auth.csrfToken });
  });

  app.post("/api/auth/logout", requireUser, (req: AppRequest, res) => {
    db.prepare("DELETE FROM sessions WHERE token_hash = ?").run(req.auth!.tokenHash);
    res.setHeader("Set-Cookie", `${SESSION_COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${secureCookie ? "; Secure" : ""}`);
    res.status(204).end();
  });

  app.get("/api/catalog/meta", (_req, res) => res.json(listTagOptions(db)));
  app.get("/api/catalog", (req, res) => {
    const query = textValue(req.query.q ?? "", "kata kunci", 120);
    const domain = textValue(req.query.domain ?? "", "bidang", 80);
    const method = textValue(req.query.method ?? "", "metode", 80);
    const technology = textValue(req.query.technology ?? "", "teknologi", 80);
    const offsetValue = textValue(req.query.offset ?? "0", "offset", 6);
    const offset = Number(offsetValue || 0);
    if (!Number.isSafeInteger(offset) || offset < 0 || offset > 100_000) throw new ApiError(400, "Nomor halaman katalog tidak valid.");
    const items = listReferences(db, { query, domain, method, technology }, false, 100, offset);
    res.json({ items, total: countReferences(db, { query, domain, method, technology }) });
  });
  app.get("/api/catalog/:id", (req, res) => {
    const reference = getReference(db, pathId(req as AppRequest));
    if (!reference) throw new ApiError(404, "Referensi tidak ditemukan atau sudah diarsipkan.");
    res.json(reference);
  });

  app.get("/api/shortlist", requireUser, (req: AppRequest, res) => res.json({ items: listShortlist(db, req.auth!.user.id) }));
  app.post("/api/shortlist/:id", requireUser, (req: AppRequest, res) => {
    const id = pathId(req);
    if (!getReference(db, id)) throw new ApiError(404, "Referensi tidak tersedia untuk disimpan.");
    db.prepare("INSERT INTO shortlist (user_id, reference_id, created_at) VALUES (?, ?, ?) ON CONFLICT DO NOTHING")
      .run(req.auth!.user.id, id, new Date().toISOString());
    res.status(201).json({ items: listShortlist(db, req.auth!.user.id) });
  });
  app.delete("/api/shortlist/:id", requireUser, (req: AppRequest, res) => {
    db.prepare("DELETE FROM shortlist WHERE user_id = ? AND reference_id = ?")
      .run(req.auth!.user.id, pathId(req));
    res.status(204).end();
  });

  app.get("/api/ideas", requireUser, (req: AppRequest, res) => res.json({ items: listIdeas(db, req.auth!.user.id) }));
  app.post("/api/ideas", requireUser, (req: AppRequest, res) => {
    const body = bodyObject(req.body);
    const worksheet = validateWorksheet(body);
    const sectionReferenceIds = validateSectionReferenceIds(body.sectionReferenceIds);
    const referenceIds = [...new Set([...integerIds(body.referenceIds ?? [], "referensi", 8), ...Object.values(sectionReferenceIds).flat()])];
    if (referenceIds.length > 8) throw new ApiError(400, "Rancangan memuat terlalu banyak referensi.");
    assertReferenceIds(db, referenceIds);
    const id = saveIdea(db, req.auth!.user.id, worksheet, referenceIds, undefined, sectionReferenceIds);
    const item = listIdeas(db, req.auth!.user.id).find((idea) => idea.id === id);
    res.status(201).json(item);
  });
  app.put("/api/ideas/:id", requireUser, (req: AppRequest, res) => {
    const body = bodyObject(req.body);
    const worksheet = validateWorksheet(body);
    const sectionReferenceIds = validateSectionReferenceIds(body.sectionReferenceIds);
    const referenceIds = [...new Set([...integerIds(body.referenceIds ?? [], "referensi", 8), ...Object.values(sectionReferenceIds).flat()])];
    if (referenceIds.length > 8) throw new ApiError(400, "Rancangan memuat terlalu banyak referensi.");
    assertReferenceIds(db, referenceIds);
    const id = saveIdea(db, req.auth!.user.id, worksheet, referenceIds, pathId(req), sectionReferenceIds);
    if (!id) throw new ApiError(404, "Lembar ide tidak ditemukan pada akun ini.");
    res.json(listIdeas(db, req.auth!.user.id).find((idea) => idea.id === id));
  });
  app.delete("/api/ideas/:id", requireUser, (req: AppRequest, res) => {
    const result = db.prepare("DELETE FROM ideas WHERE id = ? AND user_id = ?").run(pathId(req), req.auth!.user.id);
    if (!result.changes) throw new ApiError(404, "Lembar ide tidak ditemukan pada akun ini.");
    res.status(204).end();
  });

  app.get("/api/admin/references", requireAdmin, (_req, res) => res.json({ items: listReferences(db, {}, true) }));
  app.post("/api/admin/references", requireAdmin, (req, res) => {
    const input = validateReferenceInput(req.body);
    const id = insertReference(db, input);
    res.status(201).json(getReference(db, id));
  });
  app.put("/api/admin/references/:id", requireAdmin, (req, res) => {
    const id = pathId(req as AppRequest);
    const current = getReference(db, id);
    if (!current) throw new ApiError(404, "Referensi tidak ditemukan atau sudah diarsipkan.");
    const input = validateReferenceInput(req.body);
    updateReference(db, id, input);
    res.json(getReference(db, id));
  });
  app.post("/api/admin/references/:id/archive", requireAdmin, (req, res) => {
    if (!archiveReference(db, pathId(req as AppRequest))) throw new ApiError(404, "Referensi sudah diarsipkan atau tidak ditemukan.");
    res.status(204).end();
  });

  app.get("/api/ai/status", async (_req, res) => res.json(await ollama.status()));
  app.post("/api/ai/search-suggestions", requireUser, async (req, res) => {
    const body = bodyObject(req.body);
    const question = textValue(body.question, "pertanyaan", 1000, true);
    res.json(await suggestKeywords(ollama, question));
  });
  app.post("/api/ai/intake-questions", requireUser, async (req, res) => {
    const body = bodyObject(req.body);
    const title = textValue(body.title, "ide awal", 120, true);
    const existingQuestions = body.existingQuestions ?? [];
    if (!Array.isArray(existingQuestions) || existingQuestions.length > 8) throw new ApiError(400, "Daftar pertanyaan sebelumnya tidak valid.");
    const normalizedQuestions = existingQuestions.map((question) => textValue(question, "pertanyaan", 400, true));
    res.json(await suggestIntakeQuestions(ollama, db, title, [], normalizedQuestions));
  });
  app.post("/api/ai/summarize", requireUser, async (req: AppRequest, res) => {
    const body = bodyObject(req.body);
    const ids = integerIds(body.referenceIds, "referensi", 8);
    res.json(await summarizeReferences(ollama, db, ids));
  });
  app.post("/api/ai/draft-idea", requireUser, async (req: AppRequest, res) => {
    const body = bodyObject(req.body);
    const legacyReferenceIds = body.worksheet ? integerIds(body.referenceIds ?? [], "referensi", 8) : [];
    const intake = body.worksheet ? validateWorksheet(body.worksheet) : validateIdeaIntake(body);
    res.json(await draftWorksheet(ollama, db, intake, legacyReferenceIds));
  });

  const sourceDirectory = dirname(fileURLToPath(import.meta.url));
  const publicDirectory = options.publicDir ?? join(sourceDirectory, "../public");
  app.use(express.static(publicDirectory, { index: false, maxAge: 0 }));
  app.get("*path", (req, res, next) => {
    if (!req.accepts("html") || req.path.startsWith("/api/")) return next();
    res.sendFile(join(publicDirectory, "index.html"));
  });

  app.use((_req, res) => res.status(404).json({ error: "Halaman atau data tidak ditemukan." }));
  const errorHandler: ErrorRequestHandler = (error: unknown, _req, res, _next) => {
    if (error instanceof ApiError) {
      res.status(error.status).json({ error: error.message });
      return;
    }
    if (error && typeof error === "object" && "type" in error && error.type === "entity.too.large") {
      res.status(413).json({ error: "Permintaan terlalu besar." });
      return;
    }
    if (error instanceof SyntaxError) {
      res.status(400).json({ error: "Format JSON tidak valid." });
      return;
    }
    console.error("Permintaan gagal:", error);
    res.status(500).json({ error: "Terjadi kendala pada server. Coba lagi sebentar." });
  };
  app.use(errorHandler);
  return app;
}
