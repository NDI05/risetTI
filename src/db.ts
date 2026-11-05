import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import Database from "better-sqlite3";
import { INITIAL_CATALOG_REFERENCES, LEGACY_DEMO_REPLACEMENTS } from "./catalog-seed.js";
import { hashPassword } from "./security.js";
import type { ReferenceInput, UserRole, Worksheet } from "./types.js";

export type Sqlite = Database.Database;

interface ReferenceRow {
  id: number;
  title: string;
  authors: string;
  year: number;
  institution: string;
  summary: string;
  sourceName: string;
  sourceUrl: string;
  externalId: string | null;
  doi: string | null;
  license: string | null;
  language: string | null;
  isDemo: number;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export function createDatabase(path = "./data/risetti.sqlite"): Sqlite {
  const absolutePath = path === ":memory:" ? path : resolve(path);
  if (absolutePath !== ":memory:") mkdirSync(dirname(absolutePath), { recursive: true });
  const db = new Database(absolutePath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.pragma("busy_timeout = 5000");
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE COLLATE NOCASE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('mahasiswa', 'admin')),
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      csrf_token TEXT NOT NULL,
      expires_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS sessions_expiry ON sessions(expires_at);
    CREATE TABLE IF NOT EXISTS catalog_references (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      authors TEXT NOT NULL,
      year INTEGER NOT NULL,
      institution TEXT NOT NULL,
      summary TEXT NOT NULL,
      source_name TEXT NOT NULL,
      source_url TEXT NOT NULL DEFAULT '',
      external_id TEXT,
      doi TEXT,
      license TEXT,
      language TEXT,
      is_demo INTEGER NOT NULL DEFAULT 0 CHECK (is_demo IN (0, 1)),
      archived_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS reference_tags (
      reference_id INTEGER NOT NULL REFERENCES catalog_references(id) ON DELETE CASCADE,
      tag_type TEXT NOT NULL CHECK (tag_type IN ('domain', 'method', 'technology')),
      tag TEXT NOT NULL,
      PRIMARY KEY (reference_id, tag_type, tag)
    );
    CREATE INDEX IF NOT EXISTS reference_tags_lookup ON reference_tags(tag_type, tag COLLATE NOCASE);
    CREATE TABLE IF NOT EXISTS shortlist (
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      reference_id INTEGER NOT NULL REFERENCES catalog_references(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL,
      PRIMARY KEY (user_id, reference_id)
    );
    CREATE TABLE IF NOT EXISTS ideas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      problem TEXT NOT NULL DEFAULT '',
      context TEXT NOT NULL DEFAULT '',
      data_sources TEXT NOT NULL DEFAULT '',
      method TEXT NOT NULL DEFAULT '',
      technologies TEXT NOT NULL DEFAULT '',
      technical_needs TEXT NOT NULL DEFAULT '',
      time_resources TEXT NOT NULL DEFAULT '',
      risks_validation TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS idea_references (
      idea_id INTEGER NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
      reference_id INTEGER NOT NULL REFERENCES catalog_references(id) ON DELETE CASCADE,
      PRIMARY KEY (idea_id, reference_id)
    );
    CREATE TABLE IF NOT EXISTS idea_section_references (
      idea_id INTEGER NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
      section_key TEXT NOT NULL,
      reference_id INTEGER NOT NULL REFERENCES catalog_references(id) ON DELETE CASCADE,
      PRIMARY KEY (idea_id, section_key, reference_id)
    );
    CREATE TABLE IF NOT EXISTS app_metadata (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS shortlist_user_created ON shortlist(user_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS ideas_user_updated ON ideas(user_id, updated_at DESC);
  `);
  ensureColumn(db, "catalog_references", "external_id", "TEXT");
  ensureColumn(db, "catalog_references", "doi", "TEXT");
  ensureColumn(db, "catalog_references", "license", "TEXT");
  ensureColumn(db, "catalog_references", "language", "TEXT");
  db.exec("CREATE UNIQUE INDEX IF NOT EXISTS catalog_external_id ON catalog_references(external_id) WHERE external_id IS NOT NULL");
  seedInitialCatalog(db);
  return db;
}

function ensureColumn(db: Sqlite, table: string, column: string, type: string): void {
  const columns = db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
  if (!columns.some((item) => item.name === column)) db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`);
}

const CATALOG_SEED_VERSION = "ugm-etd-2026-10-v1";

export function seedInitialCatalog(db: Sqlite): void {
  const state = db.prepare("SELECT value FROM app_metadata WHERE key = 'catalog_seed_version'").get() as { value: string } | undefined;
  if (state?.value === CATALOG_SEED_VERSION) return;

  const migrate = db.transaction(() => {
    const idsBySource = new Map<number, number>();
    const existing = db.prepare("SELECT id FROM catalog_references WHERE source_url = ? ORDER BY id LIMIT 1");
    for (const item of INITIAL_CATALOG_REFERENCES) {
      const row = existing.get(item.sourceUrl) as { id: number } | undefined;
      idsBySource.set(Number(item.sourceUrl.split("/").at(-1)), row?.id ?? insertReference(db, item));
    }

    const demos = db.prepare("SELECT id, title FROM catalog_references WHERE is_demo = 1").all() as { id: number; title: string }[];
    const moveShortlist = db.prepare(`
      INSERT OR IGNORE INTO shortlist (user_id, reference_id, created_at)
      SELECT user_id, ?, created_at FROM shortlist WHERE reference_id = ?
    `);
    const moveIdeaReferences = db.prepare(`
      INSERT OR IGNORE INTO idea_references (idea_id, reference_id)
      SELECT idea_id, ? FROM idea_references WHERE reference_id = ?
    `);
    const removeDemo = db.prepare("DELETE FROM catalog_references WHERE id = ? AND is_demo = 1");
    const archiveDemo = db.prepare("UPDATE catalog_references SET archived_at = ?, updated_at = ? WHERE id = ? AND archived_at IS NULL");
    const now = new Date().toISOString();

    for (const demo of demos) {
      const targetSourceId = LEGACY_DEMO_REPLACEMENTS[demo.title];
      const targetId = targetSourceId ? idsBySource.get(targetSourceId) : undefined;
      if (!targetId) {
        archiveDemo.run(now, now, demo.id);
        continue;
      }
      moveShortlist.run(targetId, demo.id);
      moveIdeaReferences.run(targetId, demo.id);
      removeDemo.run(demo.id);
    }

    db.prepare("INSERT INTO app_metadata (key, value, updated_at) VALUES ('catalog_seed_version', ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at")
      .run(CATALOG_SEED_VERSION, now);
  });
  migrate();
}

export function bootstrapAdmin(db: Sqlite, email: string, password: string): "created" | "exists" {
  const normalized = email.trim().toLowerCase();
  const existing = db.prepare("SELECT id FROM users WHERE email = ? COLLATE NOCASE").get(normalized);
  if (existing) return "exists";
  const now = new Date().toISOString();
  db.prepare("INSERT INTO users (name, email, password_hash, role, created_at) VALUES (?, ?, ?, 'admin', ?)")
    .run("Admin katalog", normalized, hashPassword(password), now);
  return "created";
}

export function insertReference(db: Sqlite, input: ReferenceInput): number {
  const now = new Date().toISOString();
  const result = db.prepare(`
    INSERT INTO catalog_references
      (title, authors, year, institution, summary, source_name, source_url, is_demo, external_id, doi, license, language, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(input.title, input.authors, input.year, input.institution, input.summary,
    input.sourceName, input.sourceUrl, Number(input.isDemo), input.externalId ?? null, input.doi ?? null,
    input.license ?? null, input.language ?? null, now, now);
  const id = Number(result.lastInsertRowid);
  replaceTags(db, id, input);
  return id;
}

export function insertImportedReference(db: Sqlite, input: ReferenceInput): boolean {
  if (!input.externalId) throw new Error("Referensi impor wajib memiliki ID eksternal.");
  const now = new Date().toISOString();
  const result = db.prepare(`
    INSERT INTO catalog_references
      (title, authors, year, institution, summary, source_name, source_url, is_demo, external_id, doi, license, language, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(external_id) WHERE external_id IS NOT NULL DO NOTHING
  `).run(input.title, input.authors, input.year, input.institution, input.summary,
    input.sourceName, input.sourceUrl, input.externalId, input.doi ?? null, input.license ?? null, input.language ?? null, now, now);
  if (!result.changes) return false;
  replaceTags(db, Number(result.lastInsertRowid), input);
  return true;
}

export function updateReference(db: Sqlite, id: number, input: ReferenceInput): void {
  const result = db.prepare(`
    UPDATE catalog_references SET title = ?, authors = ?, year = ?, institution = ?, summary = ?,
      source_name = ?, source_url = ?, is_demo = ?, updated_at = ?
    WHERE id = ? AND archived_at IS NULL
  `).run(input.title, input.authors, input.year, input.institution, input.summary,
    input.sourceName, input.sourceUrl, Number(input.isDemo), new Date().toISOString(), id);
  if (result.changes === 0) return;
  replaceTags(db, id, input);
}

function replaceTags(db: Sqlite, id: number, input: ReferenceInput): void {
  const remove = db.prepare("DELETE FROM reference_tags WHERE reference_id = ?");
  const add = db.prepare("INSERT INTO reference_tags (reference_id, tag_type, tag) VALUES (?, ?, ?)");
  db.transaction(() => {
    remove.run(id);
    add.run(id, "domain", input.domain);
    for (const tag of input.methods) add.run(id, "method", tag);
    for (const tag of input.technologies) add.run(id, "technology", tag);
  })();
}

export interface CatalogFilters {
  query?: string;
  domain?: string;
  method?: string;
  technology?: string;
}

const QUERY_SYNONYMS: Record<string, string[]> = {
  ai: ["kecerdasan buatan", "artificial intelligence", "machine learning", "pembelajaran mesin"],
  ml: ["machine learning", "pembelajaran mesin"],
  iot: ["internet of things"],
  ux: ["user experience", "pengalaman pengguna"],
  ui: ["user interface", "antarmuka pengguna"],
  hci: ["human-computer interaction", "interaksi manusia-komputer"],
  nlp: ["natural language processing", "pemrosesan bahasa alami"],
};

function catalogWhere(filters: CatalogFilters, includeArchived: boolean): { clause: string; params: (string | number)[] } {
  const clauses = [includeArchived ? "1 = 1" : "r.archived_at IS NULL"];
  const params: (string | number)[] = [];
  if (filters.query?.trim()) {
    const terms = filters.query.trim().split(/\s+/)
      .map((term) => term.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, ""))
      .filter(Boolean);
    const searchable = `(r.title || ' ' || r.summary || ' ' || r.authors || ' ' || r.institution || ' ' || r.source_name || ' ' || COALESCE((SELECT group_concat(qtag.tag, ' ') FROM reference_tags qtag WHERE qtag.reference_id = r.id), ''))`;
    clauses.push(`(${terms.map((term) => {
      const candidates = [term, ...(QUERY_SYNONYMS[term.toLowerCase()] ?? [])];
      params.push(...candidates);
      return `(${candidates.map(() => `instr(lower(${searchable}), lower(?)) > 0`).join(" OR ")})`;
    }).join(" AND ")})`);
  }
  for (const [type, value] of [["domain", filters.domain], ["method", filters.method], ["technology", filters.technology]] as const) {
    if (!value?.trim()) continue;
    clauses.push("EXISTS (SELECT 1 FROM reference_tags ft WHERE ft.reference_id = r.id AND ft.tag_type = ? AND lower(ft.tag) = lower(?))");
    params.push(type, value.trim());
  }
  return { clause: clauses.join(" AND "), params };
}

export function countReferences(db: Sqlite, filters: CatalogFilters = {}, includeArchived = false): number {
  const { clause, params } = catalogWhere(filters, includeArchived);
  return Number((db.prepare(`SELECT count(*) AS count FROM catalog_references r WHERE ${clause}`).get(...params) as { count: number }).count);
}

export function listReferences(db: Sqlite, filters: CatalogFilters = {}, includeArchived = false, limit = 500, offset = 0): ReturnType<typeof toReference>[] {
  const { clause, params } = catalogWhere(filters, includeArchived);
  const safeLimit = Number.isInteger(limit) ? Math.max(1, Math.min(500, limit)) : 100;
  const safeOffset = Number.isInteger(offset) ? Math.max(0, Math.min(100_000, offset)) : 0;
  const rows = db.prepare(`
    SELECT r.id, r.title, r.authors, r.year, r.institution, r.summary,
      r.source_name AS sourceName, r.source_url AS sourceUrl, r.external_id AS externalId,
      r.doi, r.license, r.language, r.is_demo AS isDemo,
      r.archived_at AS archivedAt, r.created_at AS createdAt, r.updated_at AS updatedAt
    FROM catalog_references r WHERE ${clause}
    ORDER BY r.year DESC, r.title COLLATE NOCASE ASC LIMIT ? OFFSET ?
  `).all(...params, safeLimit, safeOffset) as unknown as ReferenceRow[];
  return rows.map((row) => toReference(db, row));
}

export function findRelatedReferences(db: Sqlite, phrases: string[], limit = 8): ReturnType<typeof listReferences> {
  const stopwords = new Set("about above after again all also am an and any are as at be because been before between both but by can could did do does doing down during each few for from further had has have he her here hers herself him himself his how i if in into is it its itself just me more most my myself no nor not of off on once only or other our ours ourselves out over own same she should so some such than that the their theirs them themselves then there these they this those through to too under until up very was we were what when where which while who whom why will with would you your yours yourselves yang dan dalam di dari dengan untuk pada oleh sebagai adalah atau itu ini tidak bisa akan sudah belum secara terhadap terhadapnya ide rancang rancangan penelitian studi sistem aplikasi informasi teknologi berbasis judul fokus bagaimana apa siapa kapan".split(/\s+/u));
  const tokenize = (value: string) => value.toLocaleLowerCase("id-ID").match(/[\p{L}\p{N}]{3,}/gu) ?? [];
  const normalizedPhrases = [...new Set(phrases.map((phrase) => phrase.trim().toLocaleLowerCase("id-ID")).filter(Boolean))].slice(0, 18);
  const queryTokens = [...new Set(normalizedPhrases.flatMap(tokenize).filter((token) => !stopwords.has(token)))];
  if (!queryTokens.length) return [];
  const rows = db.prepare(`
    SELECT r.id, r.title, r.summary, r.year, r.source_name AS sourceName,
      COALESCE((SELECT group_concat(t.tag, ' ') FROM reference_tags t WHERE t.reference_id = r.id), '') AS tags
    FROM catalog_references r WHERE r.archived_at IS NULL
  `).all() as { id: number; title: string; summary: string; year: number; sourceName: string; tags: string }[];
  const ranked = rows.map((row) => {
    const title = row.title.toLocaleLowerCase("id-ID");
    const summary = row.summary.toLocaleLowerCase("id-ID");
    const tags = row.tags.toLocaleLowerCase("id-ID");
    let score = 0;
    for (const phrase of normalizedPhrases) {
      if (phrase.length >= 5 && title.includes(phrase)) score += 6;
      else if (phrase.length >= 5 && summary.includes(phrase)) score += 2.2;
    }
    for (const token of queryTokens) {
      if (title.includes(token)) score += 2.4;
      if (summary.includes(token)) score += 0.55;
      if (tags.includes(token)) score += 0.6;
    }
    return { id: row.id, score, year: row.year };
  }).filter((item) => item.score >= 2.4)
    .sort((a, b) => b.score - a.score || b.year - a.year || a.id - b.id)
    .slice(0, Math.max(1, Math.min(8, limit)));
  return ranked.map(({ id }) => getReference(db, id)).filter((item): item is NonNullable<typeof item> => item !== null);
}

export function getReference(db: Sqlite, id: number, includeArchived = false): ReturnType<typeof toReference> | null {
  const row = db.prepare(`
    SELECT r.id, r.title, r.authors, r.year, r.institution, r.summary,
      r.source_name AS sourceName, r.source_url AS sourceUrl, r.external_id AS externalId,
      r.doi, r.license, r.language, r.is_demo AS isDemo,
      r.archived_at AS archivedAt, r.created_at AS createdAt, r.updated_at AS updatedAt
    FROM catalog_references r WHERE r.id = ? ${includeArchived ? "" : "AND r.archived_at IS NULL"}
  `).get(id) as ReferenceRow | undefined;
  return row ? toReference(db, row) : null;
}

export function toReference(db: Sqlite, row: ReferenceRow) {
  const tags = db.prepare("SELECT tag_type AS type, tag FROM reference_tags WHERE reference_id = ? ORDER BY tag COLLATE NOCASE")
    .all(row.id) as { type: string; tag: string }[];
  return {
    id: row.id,
    title: row.title,
    authors: row.authors,
    year: row.year,
    institution: row.institution,
    summary: row.summary,
    sourceName: row.sourceName,
    sourceUrl: row.sourceUrl,
    externalId: row.externalId,
    doi: row.doi,
    license: row.license,
    language: row.language,
    isDemo: Boolean(row.isDemo),
    archivedAt: row.archivedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    domain: tags.find((tag) => tag.type === "domain")?.tag ?? "",
    methods: tags.filter((tag) => tag.type === "method").map((tag) => tag.tag),
    technologies: tags.filter((tag) => tag.type === "technology").map((tag) => tag.tag),
  };
}

export function listTagOptions(db: Sqlite): { total: number; domains: string[]; methods: string[]; technologies: string[] } {
  const rows = db.prepare(`
    SELECT DISTINCT t.tag_type AS type, t.tag FROM reference_tags t
    JOIN catalog_references r ON r.id = t.reference_id
    WHERE r.archived_at IS NULL ORDER BY t.tag COLLATE NOCASE
  `).all() as { type: string; tag: string }[];
  return {
    total: Number((db.prepare("SELECT count(*) AS count FROM catalog_references WHERE archived_at IS NULL").get() as { count: number }).count),
    domains: rows.filter((row) => row.type === "domain").map((row) => row.tag),
    methods: rows.filter((row) => row.type === "method").map((row) => row.tag),
    technologies: rows.filter((row) => row.type === "technology").map((row) => row.tag),
  };
}

export function listShortlist(db: Sqlite, userId: number): ReturnType<typeof listReferences> {
  const ids = db.prepare("SELECT reference_id AS id FROM shortlist WHERE user_id = ? ORDER BY created_at DESC")
    .all(userId) as { id: number }[];
  return ids.map(({ id }) => getReference(db, id)).filter((item): item is NonNullable<typeof item> => item !== null);
}

export function listIdeas(db: Sqlite, userId: number) {
  const rows = db.prepare(`
    SELECT id, title, problem, context, data_sources AS dataSources, method, technologies,
      technical_needs AS technicalNeeds, time_resources AS timeResources,
      risks_validation AS risksValidation, created_at AS createdAt, updated_at AS updatedAt
    FROM ideas WHERE user_id = ? ORDER BY updated_at DESC
  `).all(userId) as (Worksheet & { id: number; createdAt: string; updatedAt: string })[];
  const refs = db.prepare("SELECT reference_id AS referenceId FROM idea_references WHERE idea_id = ? ORDER BY reference_id");
  const sectionRefs = db.prepare("SELECT section_key AS sectionKey, reference_id AS referenceId FROM idea_section_references WHERE idea_id = ? ORDER BY section_key, reference_id");
  return rows.map((idea) => {
    const referenceIds = (refs.all(idea.id) as { referenceId: number }[]).map((ref) => ref.referenceId);
    const sectionReferenceIds: Record<string, number[]> = {};
    for (const item of sectionRefs.all(idea.id) as { sectionKey: string; referenceId: number }[]) {
      (sectionReferenceIds[item.sectionKey] ??= []).push(item.referenceId);
    }
    const references = referenceIds.map((id) => getReference(db, id)).filter((ref) => ref !== null);
    return { ...idea, referenceIds, sectionReferenceIds, references };
  });
}

export function saveIdea(db: Sqlite, userId: number, worksheet: Worksheet, referenceIds: number[], id?: number, sectionReferenceIds: Record<string, number[]> = {}): number {
  const now = new Date().toISOString();
  let ideaId = id;
  if (id !== undefined) {
    const existing = db.prepare("SELECT id FROM ideas WHERE id = ? AND user_id = ?").get(id, userId);
    if (!existing) return 0;
    db.prepare(`UPDATE ideas SET title = ?, problem = ?, context = ?, data_sources = ?, method = ?, technologies = ?,
      technical_needs = ?, time_resources = ?, risks_validation = ?, updated_at = ? WHERE id = ? AND user_id = ?`)
      .run(worksheet.title, worksheet.problem, worksheet.context, worksheet.dataSources, worksheet.method,
        worksheet.technologies, worksheet.technicalNeeds, worksheet.timeResources, worksheet.risksValidation, now, id, userId);
  } else {
    const result = db.prepare(`INSERT INTO ideas
      (user_id, title, problem, context, data_sources, method, technologies, technical_needs, time_resources, risks_validation, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(userId, worksheet.title, worksheet.problem, worksheet.context, worksheet.dataSources, worksheet.method,
        worksheet.technologies, worksheet.technicalNeeds, worksheet.timeResources, worksheet.risksValidation, now, now);
    ideaId = Number(result.lastInsertRowid);
  }
  const removeRefs = db.prepare("DELETE FROM idea_references WHERE idea_id = ?");
  const addRef = db.prepare("INSERT INTO idea_references (idea_id, reference_id) VALUES (?, ?)");
  const removeSectionRefs = db.prepare("DELETE FROM idea_section_references WHERE idea_id = ?");
  const addSectionRef = db.prepare("INSERT INTO idea_section_references (idea_id, section_key, reference_id) VALUES (?, ?, ?)");
  db.transaction(() => {
    removeRefs.run(ideaId);
    for (const referenceId of referenceIds) addRef.run(ideaId, referenceId);
    removeSectionRefs.run(ideaId);
    for (const [sectionKey, sectionIds] of Object.entries(sectionReferenceIds)) {
      for (const referenceId of sectionIds) addSectionRef.run(ideaId, sectionKey, referenceId);
    }
  })();
  if (ideaId === undefined) throw new Error("Lembar ide belum mendapatkan ID.");
  return ideaId;
}

export function archiveReference(db: Sqlite, id: number): boolean {
  const result = db.prepare("UPDATE catalog_references SET archived_at = ?, updated_at = ? WHERE id = ? AND archived_at IS NULL")
    .run(new Date().toISOString(), new Date().toISOString(), id);
  return result.changes > 0;
}

export function userRole(value: string): UserRole | null {
  return value === "admin" || value === "mahasiswa" ? value : null;
}
