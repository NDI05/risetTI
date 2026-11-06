import { ApiError } from "../src/errors.js";
import { bodyObject, integerIds, positiveId, textValue, validateEmail, validateIdeaIntake, validatePassword, validateReferenceInput, validateWorksheet } from "../src/validation.js";
import { archiveReference, countReferences, getReference, insertReference, listIdeas, listReferences, listShortlist, listTagOptions, saveIdea, updateReference } from "./data.js";
import { draftWorksheet, suggestIntakeQuestions, suggestKeywords, summarizeReferences, type AiEnvironment } from "./ai.js";

interface Env extends AiEnvironment {
  ASSETS: Fetcher;
  AUTH_RATE_LIMIT_SECRET?: string;
  ADMIN_SETUP_TOKEN?: string;
}

interface PublicUser { id: number; name: string; email: string; role: "mahasiswa" | "admin" }
interface AuthContext { user: PublicUser; tokenHash: string; csrfToken: string }
interface AuthRow extends PublicUser { tokenHash: string; csrfToken: string }
interface Context { request: Request; env: Env; url: URL; auth: AuthContext | null }

const SESSION_COOKIE = "risetti.sid";
const SESSION_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000;
const mutating = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const sectionKeys = ["problem", "context", "dataSources", "method", "technologies", "technicalNeeds", "timeResources", "risksValidation"] as const;

const headers = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-Frame-Options": "DENY",
  "Content-Security-Policy": "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'",
};

function json(value: unknown, status = 200, extra: HeadersInit = {}): Response {
  const resultHeaders = new Headers(headers);
  resultHeaders.set("content-type", "application/json; charset=utf-8");
  resultHeaders.set("cache-control", "no-store");
  new Headers(extra).forEach((value, key) => resultHeaders.set(key, value));
  return new Response(JSON.stringify(value), { status, headers: resultHeaders });
}

function empty(status = 204, extra: HeadersInit = {}): Response {
  return new Response(null, { status, headers: { ...headers, ...Object.fromEntries(new Headers(extra).entries()) } });
}

function cookie(request: Request): string | null {
  for (const part of (request.headers.get("cookie") ?? "").split(";")) {
    const [name, ...value] = part.trim().split("=");
    if (name === SESSION_COOKIE) return value.join("=") || null;
  }
  return null;
}

function base64url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/u, "");
}

async function digest(value: string): Promise<string> {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(bytes)].map((item) => item.toString(16).padStart(2, "0")).join("");
}

async function randomToken(length: number): Promise<string> {
  return base64url(crypto.getRandomValues(new Uint8Array(length)));
}

function safeEqual(left: string, right: string): boolean {
  const size = Math.max(left.length, right.length);
  let different = left.length ^ right.length;
  for (let i = 0; i < size; i += 1) different |= (left.charCodeAt(i) || 0) ^ (right.charCodeAt(i) || 0);
  return different === 0;
}

async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const material = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations: 310_000 }, material, 256);
  return `pbkdf2$sha256$310000$${base64url(salt)}$${base64url(new Uint8Array(bits))}`;
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, hash, iterationText, saltText, expectedText] = stored.split("$");
  if (scheme !== "pbkdf2" || hash !== "sha256" || iterationText !== "310000" || !saltText || !expectedText) return false;
  try {
    const decode = (value: string) => Uint8Array.from(atob(value.replaceAll("-", "+").replaceAll("_", "/") + "===".slice((value.length + 3) % 4)), (char) => char.charCodeAt(0));
    const salt = decode(saltText);
    const expected = decode(expectedText);
    const material = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
    const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations: 310_000 }, material, 256);
    const actual = base64url(new Uint8Array(bits));
    return safeEqual(actual, expectedText) && expected.length === 32;
  } catch { return false; }
}

function sessionCookie(token: string, secure: boolean): string {
  return `${SESSION_COOKIE}=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${Math.floor(SESSION_LIFETIME_MS / 1000)}${secure ? "; Secure" : ""}`;
}

async function currentAuth(request: Request, env: Env): Promise<AuthContext | null> {
  const token = cookie(request);
  if (!token) return null;
  const tokenHash = await digest(token);
  const row = await env.DB.prepare(`SELECT s.token_hash AS tokenHash, s.csrf_token AS csrfToken,
    u.id, u.name, u.email, u.role FROM sessions s JOIN users u ON u.id = s.user_id
    WHERE s.token_hash = ? AND s.expires_at > ?`).bind(tokenHash, Date.now()).first<AuthRow>();
  return row ? { user: { id: row.id, name: row.name, email: row.email, role: row.role }, tokenHash: row.tokenHash, csrfToken: row.csrfToken } : null;
}

async function requestBody(request: Request): Promise<Record<string, unknown>> {
  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > 64 * 1024) throw new ApiError(413, "Permintaan terlalu besar.");
  const raw = await request.text();
  if (new TextEncoder().encode(raw).byteLength > 64 * 1024) throw new ApiError(413, "Permintaan terlalu besar.");
  if (!raw) return {};
  try { return bodyObject(JSON.parse(raw) as unknown); }
  catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(400, "Format JSON tidak valid.");
  }
}

function requireUser(context: Context): AuthContext {
  if (!context.auth) throw new ApiError(401, "Masuk terlebih dahulu untuk melanjutkan.");
  return context.auth;
}

function requireAdmin(context: Context): AuthContext {
  const auth = requireUser(context);
  if (auth.user.role !== "admin") throw new ApiError(403, "Fitur ini hanya untuk admin katalog.");
  return auth;
}

function routeId(path: string, pattern: RegExp): number {
  const match = path.match(pattern);
  if (!match?.[1]) throw new ApiError(404, "Halaman atau data tidak ditemukan.");
  return positiveId(match[1]);
}

function validateSectionReferenceIds(value: unknown): Record<string, number[]> {
  if (value === undefined) return {};
  const body = bodyObject(value);
  const result: Record<string, number[]> = {};
  for (const [key, ids] of Object.entries(body)) {
    if (!(sectionKeys as readonly string[]).includes(key)) throw new ApiError(400, "Bagian sitasi tidak valid.");
    result[key] = integerIds(ids, "sitasi", 2);
  }
  return result;
}

async function assertReferenceIds(env: Env, ids: number[]): Promise<void> {
  for (const id of ids) if (!await getReference(env.DB, id)) throw new ApiError(400, "Pilih hanya referensi aktif yang tersedia di katalog.");
}

async function rateLimitAuth(request: Request, env: Env): Promise<void> {
  const address = request.headers.get("cf-connecting-ip") ?? "unknown";
  const addressHash = await digest(`${env.AUTH_RATE_LIMIT_SECRET ?? "risetti-auth-rate-limit"}:${address}`);
  const now = Date.now();
  await env.DB.prepare("DELETE FROM auth_attempts WHERE attempted_at <= ?").bind(now - 15 * 60_000).run();
  const count = await env.DB.prepare("SELECT count(*) AS count FROM auth_attempts WHERE address_hash = ? AND attempted_at > ?")
    .bind(addressHash, now - 15 * 60_000).first<{ count: number }>();
  if (Number(count?.count ?? 0) >= 10) throw new ApiError(429, "Terlalu banyak percobaan. Tunggu beberapa menit lalu coba lagi.");
  await env.DB.prepare("INSERT INTO auth_attempts (address_hash, attempted_at) VALUES (?, ?)").bind(addressHash, now).run();
}

async function createSession(context: Context, userId: number): Promise<Response> {
  const token = await randomToken(32);
  const tokenHash = await digest(token);
  const csrfToken = await randomToken(24);
  const expiresAt = Date.now() + SESSION_LIFETIME_MS;
  await context.env.DB.prepare("INSERT INTO sessions (token_hash, user_id, csrf_token, expires_at) VALUES (?, ?, ?, ?)")
    .bind(tokenHash, userId, csrfToken, expiresAt).run();
  const user = await context.env.DB.prepare("SELECT id, name, email, role FROM users WHERE id = ?").bind(userId).first<PublicUser>();
  if (!user) throw new Error("Akun tidak ditemukan setelah sesi dibuat.");
  const secure = context.url.protocol === "https:";
  return json({ user, csrfToken }, 200, { "set-cookie": sessionCookie(token, secure) });
}

async function handleApi(context: Context): Promise<Response> {
  const { request, env, url, auth } = context;
  const { pathname, searchParams } = url;
  const method = request.method.toUpperCase();

  if (method === "GET" && pathname === "/health/live") return json({ status: "alive" });
  if (method === "GET" && pathname === "/health/ready") {
    try { await env.DB.prepare("SELECT 1 AS ready").first(); return json({ status: "ready" }); }
    catch { return json({ status: "unavailable" }, 503); }
  }
  if (method === "GET" && pathname === "/api/session") return json({ user: auth?.user ?? null, csrfToken: auth?.csrfToken ?? null });

  if (method === "POST" && pathname === "/api/auth/register") {
    await rateLimitAuth(request, env);
    const body = await requestBody(request);
    const name = textValue(body.name, "nama", 80, true);
    if (name.length < 2) throw new ApiError(400, "Nama harus berisi sedikitnya 2 karakter.");
    const email = validateEmail(body.email);
    const password = validatePassword(body.password);
    const existing = await env.DB.prepare("SELECT id FROM users WHERE email = ? COLLATE NOCASE").bind(email).first<{ id: number }>();
    if (existing) throw new ApiError(409, "Email tersebut sudah memiliki akun.");
    const row = await env.DB.prepare("INSERT INTO users (name, email, password_hash, role, created_at) VALUES (?, ?, ?, 'mahasiswa', ?) RETURNING id")
      .bind(name, email, await hashPassword(password), new Date().toISOString()).first<{ id: number }>();
    if (!row) throw new Error("Akun mahasiswa tidak berhasil dibuat.");
    const response = await createSession(context, row.id);
    return new Response(response.body, { status: 201, headers: response.headers });
  }

  if (method === "POST" && pathname === "/api/auth/login") {
    await rateLimitAuth(request, env);
    const body = await requestBody(request);
    const email = validateEmail(body.email);
    if (typeof body.password !== "string" || body.password.length > 200) throw new ApiError(400, "Email atau kata sandi belum benar.");
    const row = await env.DB.prepare("SELECT id, password_hash AS passwordHash FROM users WHERE email = ? COLLATE NOCASE")
      .bind(email).first<{ id: number; passwordHash: string }>();
    if (!row || !await verifyPassword(body.password, row.passwordHash)) throw new ApiError(401, "Email atau kata sandi belum benar.");
    await env.DB.prepare("DELETE FROM sessions WHERE expires_at <= ?").bind(Date.now()).run();
    return createSession(context, row.id);
  }

  if (method === "POST" && pathname === "/api/auth/admin-setup") {
    const body = await requestBody(request);
    if (!env.ADMIN_SETUP_TOKEN || !safeEqual(String(body.setupToken ?? ""), env.ADMIN_SETUP_TOKEN)) throw new ApiError(403, "Token penyiapan admin tidak valid.");
    const existingAdmin = await env.DB.prepare("SELECT id FROM users WHERE role = 'admin' LIMIT 1").first<{ id: number }>();
    if (existingAdmin) throw new ApiError(409, "Admin sudah disiapkan. Endpoint penyiapan admin telah ditutup.");
    const name = textValue(body.name, "nama", 80, true);
    if (name.length < 2) throw new ApiError(400, "Nama harus berisi sedikitnya 2 karakter.");
    const email = validateEmail(body.email);
    const password = validatePassword(body.password);
    const row = await env.DB.prepare("INSERT INTO users (name, email, password_hash, role, created_at) VALUES (?, ?, ?, 'admin', ?) RETURNING id")
      .bind(name, email, await hashPassword(password), new Date().toISOString()).first<{ id: number }>();
    if (!row) throw new Error("Akun admin tidak berhasil dibuat.");
    return createSession(context, row.id);
  }

  if (!auth && mutating.has(method)) throw new ApiError(401, "Masuk terlebih dahulu untuk melanjutkan.");
  if (auth && mutating.has(method) && !safeEqual(request.headers.get("x-csrf-token") ?? "", auth.csrfToken)) {
    throw new ApiError(403, "Sesi formulir berakhir. Muat ulang halaman lalu coba lagi.");
  }

  if (method === "POST" && pathname === "/api/auth/logout") {
    const session = requireUser(context);
    await env.DB.prepare("DELETE FROM sessions WHERE token_hash = ?").bind(session.tokenHash).run();
    const secure = url.protocol === "https:";
    return empty(204, { "set-cookie": `${SESSION_COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${secure ? "; Secure" : ""}` });
  }

  if (method === "GET" && pathname === "/api/catalog/meta") return json(await listTagOptions(env.DB));
  if (method === "GET" && pathname === "/api/catalog") {
    const query = textValue(searchParams.get("q") ?? "", "kata kunci", 120);
    const domain = textValue(searchParams.get("domain") ?? "", "bidang", 80);
    const methodFilter = textValue(searchParams.get("method") ?? "", "metode", 80);
    const technology = textValue(searchParams.get("technology") ?? "", "teknologi", 80);
    const offsetValue = textValue(searchParams.get("offset") ?? "0", "offset", 6);
    const offset = Number(offsetValue || 0);
    if (!Number.isSafeInteger(offset) || offset < 0 || offset > 100_000) throw new ApiError(400, "Nomor halaman katalog tidak valid.");
    const filters = { query, domain, method: methodFilter, technology };
    const [items, total] = await Promise.all([listReferences(env.DB, filters, false, 100, offset), countReferences(env.DB, filters)]);
    return json({ items, total });
  }
  if (method === "GET" && /^\/api\/catalog\/[^/]+$/u.test(pathname)) {
    const reference = await getReference(env.DB, routeId(pathname, /^\/api\/catalog\/(\d+)$/u));
    if (!reference) throw new ApiError(404, "Referensi tidak ditemukan atau sudah diarsipkan.");
    return json(reference);
  }

  if (method === "GET" && pathname === "/api/shortlist") return json({ items: await listShortlist(env.DB, requireUser(context).user.id) });
  if (method === "POST" && /^\/api\/shortlist\/\d+$/u.test(pathname)) {
    const userId = requireUser(context).user.id;
    const id = routeId(pathname, /^\/api\/shortlist\/(\d+)$/u);
    if (!await getReference(env.DB, id)) throw new ApiError(404, "Referensi tidak tersedia untuk disimpan.");
    await env.DB.prepare("INSERT INTO shortlist (user_id, reference_id, created_at) VALUES (?, ?, ?) ON CONFLICT DO NOTHING")
      .bind(userId, id, new Date().toISOString()).run();
    return json({ items: await listShortlist(env.DB, userId) }, 201);
  }
  if (method === "DELETE" && /^\/api\/shortlist\/\d+$/u.test(pathname)) {
    await env.DB.prepare("DELETE FROM shortlist WHERE user_id = ? AND reference_id = ?")
      .bind(requireUser(context).user.id, routeId(pathname, /^\/api\/shortlist\/(\d+)$/u)).run();
    return empty();
  }

  if (method === "GET" && pathname === "/api/ideas") return json({ items: await listIdeas(env.DB, requireUser(context).user.id) });
  if ((method === "POST" && pathname === "/api/ideas") || (method === "PUT" && /^\/api\/ideas\/\d+$/u.test(pathname))) {
    const body = await requestBody(request);
    const worksheet = validateWorksheet(body);
    const sectionReferenceIds = validateSectionReferenceIds(body.sectionReferenceIds);
    const referenceIds = [...new Set([...integerIds(body.referenceIds ?? [], "referensi", 8), ...Object.values(sectionReferenceIds).flat()])];
    if (referenceIds.length > 8) throw new ApiError(400, "Rancangan memuat terlalu banyak referensi.");
    await assertReferenceIds(env, referenceIds);
    const userId = requireUser(context).user.id;
    const existingId = method === "PUT" ? routeId(pathname, /^\/api\/ideas\/(\d+)$/u) : undefined;
    const id = await saveIdea(env.DB, userId, worksheet, referenceIds, existingId, sectionReferenceIds);
    if (!id) throw new ApiError(404, "Lembar ide tidak ditemukan pada akun ini.");
    const item = (await listIdeas(env.DB, userId)).find((idea) => idea.id === id);
    return json(item, method === "POST" ? 201 : 200);
  }
  if (method === "DELETE" && /^\/api\/ideas\/\d+$/u.test(pathname)) {
    const result = await env.DB.prepare("DELETE FROM ideas WHERE id = ? AND user_id = ?")
      .bind(routeId(pathname, /^\/api\/ideas\/(\d+)$/u), requireUser(context).user.id).run();
    if (!result.meta.changes) throw new ApiError(404, "Lembar ide tidak ditemukan pada akun ini.");
    return empty();
  }

  if (pathname.startsWith("/api/admin/")) requireAdmin(context);
  if (method === "GET" && pathname === "/api/admin/references") return json({ items: await listReferences(env.DB, {}, true, 500) });
  if (method === "POST" && pathname === "/api/admin/references") {
    const id = await insertReference(env.DB, validateReferenceInput(await requestBody(request)));
    return json(await getReference(env.DB, id, true), 201);
  }
  if (method === "PUT" && /^\/api\/admin\/references\/\d+$/u.test(pathname)) {
    const id = routeId(pathname, /^\/api\/admin\/references\/(\d+)$/u);
    if (!await getReference(env.DB, id)) throw new ApiError(404, "Referensi tidak ditemukan atau sudah diarsipkan.");
    await updateReference(env.DB, id, validateReferenceInput(await requestBody(request)));
    return json(await getReference(env.DB, id));
  }
  if (method === "POST" && /^\/api\/admin\/references\/\d+\/archive$/u.test(pathname)) {
    const id = routeId(pathname, /^\/api\/admin\/references\/(\d+)\/archive$/u);
    if (!await archiveReference(env.DB, id)) throw new ApiError(404, "Referensi sudah diarsipkan atau tidak ditemukan.");
    return empty();
  }

  if (method === "GET" && pathname === "/api/ai/status") {
    const model = env.AI_MODEL || "@cf/meta/llama-3.1-8b-instruct-fast";
    const configured = Boolean(env.AI && typeof env.AI.run === "function");
    return json({
      available: configured,
      connected: configured,
      model,
      provider: "Cloudflare Workers AI",
      message: configured
        ? "Model Workers AI terkonfigurasi. Inferensi memakai kuota Cloudflare; uji respons dengan fitur AI sebelum menyimpan draf."
        : "Binding atau nama model Workers AI belum dikonfigurasi.",
      localOnly: false,
    });
  }
  if (method === "POST" && pathname === "/api/ai/search-suggestions") {
    requireUser(context);
    const body = await requestBody(request);
    return json(await suggestKeywords(env, textValue(body.question, "pertanyaan", 1000, true)));
  }
  if (method === "POST" && pathname === "/api/ai/intake-questions") {
    requireUser(context);
    const body = await requestBody(request);
    const title = textValue(body.title, "ide awal", 120, true);
    const existing = body.existingQuestions ?? [];
    if (!Array.isArray(existing) || existing.length > 8) throw new ApiError(400, "Daftar pertanyaan sebelumnya tidak valid.");
    return json(await suggestIntakeQuestions(env, title, existing.map((item) => textValue(item, "pertanyaan", 400, true))));
  }
  if (method === "POST" && pathname === "/api/ai/summarize") {
    requireUser(context);
    const body = await requestBody(request);
    return json(await summarizeReferences(env, integerIds(body.referenceIds, "referensi", 8)));
  }
  if (method === "POST" && pathname === "/api/ai/draft-idea") {
    requireUser(context);
    const body = await requestBody(request);
    const legacyReferenceIds = body.worksheet ? integerIds(body.referenceIds ?? [], "referensi", 8) : [];
    const intake = body.worksheet ? validateWorksheet(body.worksheet) : validateIdeaIntake(body);
    return json(await draftWorksheet(env, intake, legacyReferenceIds));
  }

  return json({ error: "Halaman atau data tidak ditemukan." }, 404);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (!url.pathname.startsWith("/api/") && !url.pathname.startsWith("/health/")) {
      const asset = await env.ASSETS.fetch(request);
      const responseHeaders = new Headers(asset.headers);
      for (const [key, value] of Object.entries(headers)) responseHeaders.set(key, value);
      return new Response(asset.body, { status: asset.status, statusText: asset.statusText, headers: responseHeaders });
    }

    try {
      const auth = await currentAuth(request, env);
      return await handleApi({ request, env, url, auth });
    } catch (error) {
      if (error instanceof ApiError) return json({ error: error.message }, error.status);
      console.error("Worker request failed:", error);
      return json({ error: "Terjadi kendala pada server. Coba lagi sebentar." }, 500);
    }
  },
};
