import type { ReferenceInput, Worksheet } from "../src/types.js";

export interface Reference {
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
  isDemo: boolean;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  domain: string;
  methods: string[];
  technologies: string[];
}

interface ReferenceRow extends Omit<Reference, "isDemo" | "domain" | "methods" | "technologies"> {
  isDemo: number;
}

export interface CatalogFilters {
  query?: string;
  domain?: string;
  method?: string;
  technology?: string;
}

const referenceColumns = `r.id, r.title, r.authors, r.year, r.institution, r.summary,
  r.source_name AS sourceName, r.source_url AS sourceUrl, r.external_id AS externalId,
  r.doi, r.license, r.language, r.is_demo AS isDemo, r.archived_at AS archivedAt,
  r.created_at AS createdAt, r.updated_at AS updatedAt`;

const synonyms: Record<string, string[]> = {
  ai: ["kecerdasan buatan", "artificial intelligence", "machine learning", "pembelajaran mesin"],
  ml: ["machine learning", "pembelajaran mesin"], iot: ["internet of things"],
  ux: ["user experience", "pengalaman pengguna"], ui: ["user interface", "antarmuka pengguna"],
  hci: ["human-computer interaction", "interaksi manusia-komputer"],
  nlp: ["natural language processing", "pemrosesan bahasa alami"],
};

function where(filters: CatalogFilters, includeArchived: boolean) {
  const clauses = [includeArchived ? "1 = 1" : "r.archived_at IS NULL"];
  const params: (string | number)[] = [];
  if (filters.query?.trim()) {
    const terms = filters.query.trim().split(/\s+/u)
      .map((term) => term.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "")).filter(Boolean);
    const searchable = `(r.title || ' ' || r.summary || ' ' || r.authors || ' ' || r.institution || ' ' || r.source_name || ' ' || COALESCE((SELECT group_concat(qtag.tag, ' ') FROM reference_tags qtag WHERE qtag.reference_id = r.id), ''))`;
    clauses.push(`(${terms.map((term) => {
      const options = [term, ...(synonyms[term.toLowerCase()] ?? [])];
      params.push(...options);
      return `(${options.map(() => `instr(lower(${searchable}), lower(?)) > 0`).join(" OR ")})`;
    }).join(" AND ")})`);
  }
  for (const [type, value] of [["domain", filters.domain], ["method", filters.method], ["technology", filters.technology]] as const) {
    if (!value?.trim()) continue;
    clauses.push("EXISTS (SELECT 1 FROM reference_tags ft WHERE ft.reference_id = r.id AND ft.tag_type = ? AND lower(ft.tag) = lower(?))");
    params.push(type, value.trim());
  }
  return { clause: clauses.join(" AND "), params };
}

async function rowsToReferences(db: D1Database, rows: ReferenceRow[]): Promise<Reference[]> {
  if (!rows.length) return [];
  const tags = new Map<number, { type: string; tag: string }[]>();
  for (let start = 0; start < rows.length; start += 80) {
    const chunk = rows.slice(start, start + 80);
    const marks = chunk.map(() => "?").join(", ");
    const result = await db.prepare(`SELECT reference_id AS referenceId, tag_type AS type, tag FROM reference_tags WHERE reference_id IN (${marks}) ORDER BY tag COLLATE NOCASE`)
      .bind(...chunk.map((row) => row.id)).all<{ referenceId: number; type: string; tag: string }>();
    for (const tag of result.results) (tags.get(tag.referenceId) ?? (tags.set(tag.referenceId, []), tags.get(tag.referenceId)!)).push(tag);
  }
  return rows.map((row) => {
    const rowTags = tags.get(row.id) ?? [];
    return {
      ...row,
      isDemo: Boolean(row.isDemo),
      domain: rowTags.find((tag) => tag.type === "domain")?.tag ?? "",
      methods: rowTags.filter((tag) => tag.type === "method").map((tag) => tag.tag),
      technologies: rowTags.filter((tag) => tag.type === "technology").map((tag) => tag.tag),
    };
  });
}

export async function getReference(db: D1Database, id: number, includeArchived = false): Promise<Reference | null> {
  const row = await db.prepare(`SELECT ${referenceColumns} FROM catalog_references r WHERE r.id = ? ${includeArchived ? "" : "AND r.archived_at IS NULL"}`)
    .bind(id).first<ReferenceRow>();
  return row ? (await rowsToReferences(db, [row]))[0] ?? null : null;
}

export async function listReferences(db: D1Database, filters: CatalogFilters = {}, includeArchived = false, limit = 100, offset = 0): Promise<Reference[]> {
  const { clause, params } = where(filters, includeArchived);
  const safeLimit = Math.max(1, Math.min(500, Math.trunc(limit)));
  const safeOffset = Math.max(0, Math.min(100_000, Math.trunc(offset)));
  const result = await db.prepare(`SELECT ${referenceColumns} FROM catalog_references r WHERE ${clause}
    ORDER BY r.year DESC, r.title COLLATE NOCASE ASC LIMIT ? OFFSET ?`)
    .bind(...params, safeLimit, safeOffset).all<ReferenceRow>();
  return rowsToReferences(db, result.results);
}

export async function countReferences(db: D1Database, filters: CatalogFilters = {}, includeArchived = false): Promise<number> {
  const { clause, params } = where(filters, includeArchived);
  const row = await db.prepare(`SELECT count(*) AS count FROM catalog_references r WHERE ${clause}`)
    .bind(...params).first<{ count: number }>();
  return Number(row?.count ?? 0);
}

export async function listTagOptions(db: D1Database) {
  const [rows, total] = await Promise.all([
    db.prepare(`SELECT DISTINCT t.tag_type AS type, t.tag FROM reference_tags t JOIN catalog_references r ON r.id = t.reference_id
      WHERE r.archived_at IS NULL ORDER BY t.tag COLLATE NOCASE`).all<{ type: string; tag: string }>(),
    db.prepare("SELECT count(*) AS count FROM catalog_references WHERE archived_at IS NULL").first<{ count: number }>(),
  ]);
  return {
    total: Number(total?.count ?? 0),
    domains: rows.results.filter((row) => row.type === "domain").map((row) => row.tag),
    methods: rows.results.filter((row) => row.type === "method").map((row) => row.tag),
    technologies: rows.results.filter((row) => row.type === "technology").map((row) => row.tag),
  };
}

const stopwords = new Set("about above after again all also am an and any are as at be because been before between both but by can could did do does doing down during each few for from further had has have he her here hers herself him himself his how i if in into is it its itself just me more most my myself no nor not of off on once only or other our ours ourselves out over own same she should so some such than that the their theirs them then there these they this those through to too under until up very was we were what when where which while who whom why will with would you your yours yourselves yang dan dalam di dari dengan untuk pada oleh sebagai adalah atau itu ini tidak bisa akan sudah belum secara terhadap terhadapnya ide rancang rancangan penelitian studi sistem aplikasi informasi teknologi berbasis judul fokus bagaimana apa siapa kapan".split(/\s+/u));
const tokenize = (value: string) => value.toLocaleLowerCase("id-ID").match(/[\p{L}\p{N}]{3,}/gu) ?? [];

export async function findRelatedReferences(db: D1Database, phrases: string[], limit = 8): Promise<Reference[]> {
  const normalized = [...new Set(phrases.map((phrase) => phrase.trim().toLocaleLowerCase("id-ID")).filter(Boolean))].slice(0, 18);
  const tokens = [...new Set(normalized.flatMap(tokenize).filter((token) => !stopwords.has(token)))].slice(0, 20);
  if (!tokens.length) return [];
  const searchable = `(r.title || ' ' || r.summary || ' ' || COALESCE((SELECT group_concat(t.tag, ' ') FROM reference_tags t WHERE t.reference_id = r.id), ''))`;
  const candidates = tokens.map(() => `instr(lower(${searchable}), lower(?)) > 0`).join(" OR ");
  const result = await db.prepare(`SELECT r.id, r.title, r.summary, r.year, r.source_name AS sourceName,
    COALESCE((SELECT group_concat(t.tag, ' ') FROM reference_tags t WHERE t.reference_id = r.id), '') AS tags
    FROM catalog_references r WHERE r.archived_at IS NULL AND (${candidates}) LIMIT 3000`)
    .bind(...tokens).all<{ id: number; title: string; summary: string; year: number; sourceName: string; tags: string }>();
  const ranked = result.results.map((row) => {
    const title = row.title.toLocaleLowerCase("id-ID");
    const summary = row.summary.toLocaleLowerCase("id-ID");
    const tags = row.tags.toLocaleLowerCase("id-ID");
    let score = 0;
    for (const phrase of normalized) {
      if (phrase.length >= 5 && title.includes(phrase)) score += 6;
      else if (phrase.length >= 5 && summary.includes(phrase)) score += 2.2;
    }
    for (const token of tokens) {
      if (title.includes(token)) score += 2.4;
      if (summary.includes(token)) score += 0.55;
      if (tags.includes(token)) score += 0.6;
    }
    return { id: row.id, score, year: row.year };
  }).filter((item) => item.score >= 2.4)
    .sort((a, b) => b.score - a.score || b.year - a.year || a.id - b.id)
    .slice(0, Math.max(1, Math.min(8, limit)));
  const selected: Reference[] = [];
  for (const item of ranked) {
    const reference = await getReference(db, item.id);
    if (reference) selected.push(reference);
  }
  return selected;
}

export async function listShortlist(db: D1Database, userId: number): Promise<Reference[]> {
  const ids = await db.prepare("SELECT reference_id AS id FROM shortlist WHERE user_id = ? ORDER BY created_at DESC LIMIT 100")
    .bind(userId).all<{ id: number }>();
  const items: Reference[] = [];
  for (const { id } of ids.results) {
    const reference = await getReference(db, id);
    if (reference) items.push(reference);
  }
  return items;
}

export async function listIdeas(db: D1Database, userId: number) {
  const ideas = await db.prepare(`SELECT id, title, problem, context, data_sources AS dataSources, method, technologies,
    technical_needs AS technicalNeeds, time_resources AS timeResources, risks_validation AS risksValidation,
    created_at AS createdAt, updated_at AS updatedAt FROM ideas WHERE user_id = ? ORDER BY updated_at DESC LIMIT 100`)
    .bind(userId).all<Worksheet & { id: number; createdAt: string; updatedAt: string }>();
  const result = [];
  for (const idea of ideas.results) {
    const [refs, sectionRefs] = await Promise.all([
      db.prepare("SELECT reference_id AS referenceId FROM idea_references WHERE idea_id = ? ORDER BY reference_id").bind(idea.id).all<{ referenceId: number }>(),
      db.prepare("SELECT section_key AS sectionKey, reference_id AS referenceId FROM idea_section_references WHERE idea_id = ? ORDER BY section_key, reference_id").bind(idea.id).all<{ sectionKey: string; referenceId: number }>(),
    ]);
    const sectionReferenceIds: Record<string, number[]> = {};
    for (const item of sectionRefs.results) (sectionReferenceIds[item.sectionKey] ??= []).push(item.referenceId);
    const references: Reference[] = [];
    for (const { referenceId } of refs.results) {
      const reference = await getReference(db, referenceId);
      if (reference) references.push(reference);
    }
    result.push({ ...idea, referenceIds: refs.results.map((ref) => ref.referenceId), sectionReferenceIds, references });
  }
  return result;
}

export async function saveIdea(db: D1Database, userId: number, worksheet: Worksheet, referenceIds: number[], id?: number, sectionReferenceIds: Record<string, number[]> = {}): Promise<number> {
  const now = new Date().toISOString();
  let ideaId = id;
  const fields = [worksheet.title, worksheet.problem, worksheet.context, worksheet.dataSources, worksheet.method,
    worksheet.technologies, worksheet.technicalNeeds, worksheet.timeResources, worksheet.risksValidation, now];
  if (id !== undefined) {
    const result = await db.prepare(`UPDATE ideas SET title = ?, problem = ?, context = ?, data_sources = ?, method = ?, technologies = ?,
      technical_needs = ?, time_resources = ?, risks_validation = ?, updated_at = ? WHERE id = ? AND user_id = ?`)
      .bind(...fields, id, userId).run();
    if (!result.meta.changes) return 0;
  } else {
    const result = await db.prepare(`INSERT INTO ideas
      (user_id, title, problem, context, data_sources, method, technologies, technical_needs, time_resources, risks_validation, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`)
      .bind(userId, ...fields.slice(0, -1), now, now).first<{ id: number }>();
    if (!result) throw new Error("Lembar ide belum mendapatkan ID.");
    ideaId = result.id;
  }
  if (ideaId === undefined) throw new Error("Lembar ide belum mendapatkan ID.");
  const statements = [
    db.prepare("DELETE FROM idea_references WHERE idea_id = ?").bind(ideaId),
    db.prepare("DELETE FROM idea_section_references WHERE idea_id = ?").bind(ideaId),
    ...referenceIds.map((refId) => db.prepare("INSERT INTO idea_references (idea_id, reference_id) VALUES (?, ?)").bind(ideaId, refId)),
    ...Object.entries(sectionReferenceIds).flatMap(([sectionKey, ids]) => ids.map((refId) =>
      db.prepare("INSERT INTO idea_section_references (idea_id, section_key, reference_id) VALUES (?, ?, ?)").bind(ideaId, sectionKey, refId))),
  ];
  if (statements.length) await db.batch(statements);
  return ideaId;
}

function referenceStatements(db: D1Database, referenceId: number, input: ReferenceInput) {
  return [
    db.prepare("DELETE FROM reference_tags WHERE reference_id = ?").bind(referenceId),
    db.prepare("INSERT INTO reference_tags (reference_id, tag_type, tag) VALUES (?, 'domain', ?)").bind(referenceId, input.domain),
    ...input.methods.map((tag) => db.prepare("INSERT INTO reference_tags (reference_id, tag_type, tag) VALUES (?, 'method', ?)").bind(referenceId, tag)),
    ...input.technologies.map((tag) => db.prepare("INSERT INTO reference_tags (reference_id, tag_type, tag) VALUES (?, 'technology', ?)").bind(referenceId, tag)),
  ];
}

export async function insertReference(db: D1Database, input: ReferenceInput): Promise<number> {
  const now = new Date().toISOString();
  const row = await db.prepare(`INSERT INTO catalog_references
    (title, authors, year, institution, summary, source_name, source_url, is_demo, external_id, doi, license, language, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`)
    .bind(input.title, input.authors, input.year, input.institution, input.summary, input.sourceName, input.sourceUrl,
      Number(input.isDemo), input.externalId ?? null, input.doi ?? null, input.license ?? null, input.language ?? null, now, now)
    .first<{ id: number }>();
  if (!row) throw new Error("Referensi tidak berhasil disimpan.");
  await db.batch(referenceStatements(db, row.id, input));
  return row.id;
}

export async function updateReference(db: D1Database, id: number, input: ReferenceInput): Promise<boolean> {
  const result = await db.prepare(`UPDATE catalog_references SET title = ?, authors = ?, year = ?, institution = ?, summary = ?,
    source_name = ?, source_url = ?, is_demo = ?, updated_at = ? WHERE id = ? AND archived_at IS NULL`)
    .bind(input.title, input.authors, input.year, input.institution, input.summary, input.sourceName, input.sourceUrl,
      Number(input.isDemo), new Date().toISOString(), id).run();
  if (!result.meta.changes) return false;
  await db.batch(referenceStatements(db, id, input));
  return true;
}

export async function archiveReference(db: D1Database, id: number): Promise<boolean> {
  const now = new Date().toISOString();
  const result = await db.prepare("UPDATE catalog_references SET archived_at = ?, updated_at = ? WHERE id = ? AND archived_at IS NULL")
    .bind(now, now, id).run();
  return result.meta.changes > 0;
}

