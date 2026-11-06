import "dotenv/config";
import { execFile } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { promisify } from "node:util";
import { createDatabase, insertImportedReference } from "../src/db.js";
import type { ReferenceInput } from "../src/types.js";

const OPENALEX_API = "https://api.openalex.org/works";
const CROSSREF_API = "https://api.crossref.org/works";
const CROSSREF_CC_BY_4 = "https://creativecommons.org/licenses/by/4.0/";
const TOPIC_SEARCHES = [
  "medicines returned pharmacies disposal",
  "computer science information systems",
  "information systems",
  "software engineering",
  "human computer interaction",
  "information retrieval",
  "artificial intelligence machine learning",
  "data mining",
  "information security cybersecurity",
  "digital health information technology",
  "healthcare information systems",
  "decision support systems",
  "e-government information systems",
  "education technology information systems",
  "supply chain information systems",
  "database management information systems",
  "natural language processing",
  "web application usability",
  "business intelligence information systems",
  "research information systems",
  "mobile application information systems",
  "cloud computing information systems",
  "internet of things information systems",
  "data science information systems",
  "software quality information systems",
  "digital transformation information systems",
  "computer networks information systems",
  "pharmacy medicine return information systems",
  "hospital information systems",
  "financial technology information systems",
  "agriculture information systems technology",
  "open data information systems",
  "information systems user experience",
];

interface OpenAlexWork {
  id?: string;
  doi?: string | null;
  title?: string | null;
  publication_year?: number | null;
  language?: string | null;
  abstract_inverted_index?: Record<string, number[]> | null;
  authorships?: { author?: { display_name?: string | null } | null; institutions?: { display_name?: string | null }[] }[];
  primary_location?: {
    landing_page_url?: string | null;
    license?: string | null;
    source?: { display_name?: string | null } | null;
  } | null;
  topics?: { subfield?: { display_name?: string | null } | null; field?: { display_name?: string | null } | null }[];
}

interface OpenAlexResponse {
  meta?: { next_cursor?: string | null };
  results?: OpenAlexWork[];
}

interface CrossrefWork {
  DOI?: string;
  title?: string[];
  author?: { given?: string; family?: string; name?: string; affiliation?: { name?: string }[] }[];
  publisher?: string;
  "container-title"?: string[];
  URL?: string;
  abstract?: string;
  language?: string;
  license?: { URL?: string; "content-version"?: string }[];
  "published-print"?: { "date-parts"?: number[][] };
  "published-online"?: { "date-parts"?: number[][] };
  issued?: { "date-parts"?: number[][] };
  created?: { "date-parts"?: number[][] };
}

interface CrossrefResponse {
  message?: { "next-cursor"?: string | null; items?: CrossrefWork[] };
}

function option(name: string, fallback: number): number {
  const key = `--${name}`;
  const index = process.argv.indexOf(key);
  if (index < 0) return fallback;
  const value = Number(process.argv[index + 1]);
  if (!Number.isSafeInteger(value) || value < 1 || value > 100_000) throw new Error(`${key} harus berupa angka antara 1 dan 100000.`);
  return value;
}

function stringOption(name: string): string | null {
  const index = process.argv.indexOf(`--${name}`);
  if (index < 0) return null;
  const value = process.argv[index + 1]?.trim();
  if (!value || value.length > 160) throw new Error(`--${name} harus berisi teks maksimal 160 karakter.`);
  return value;
}

function sql(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "number") return String(value);
  return `'${value.replaceAll("'", "''")}'`;
}

async function insertCloudflareBatch(items: ReferenceInput[]): Promise<void> {
  if (!items.length) return;
  const now = new Date().toISOString();
  const statements: string[] = [];
  for (const item of items) {
    if (!item.externalId) throw new Error("Referensi OpenAlex tidak memiliki ID eksternal.");
    statements.push(`INSERT OR IGNORE INTO catalog_references
      (title, authors, year, institution, summary, source_name, source_url, is_demo, external_id, doi, license, language, created_at, updated_at)
      VALUES (${[
        item.title, item.authors, item.year, item.institution, item.summary, item.sourceName, item.sourceUrl, 0,
        item.externalId, item.doi ?? null, item.license ?? null, item.language ?? null, now, now,
      ].map(sql).join(", ")});`);
    statements.push(`INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
      SELECT id, 'domain', ${sql(item.domain)} FROM catalog_references WHERE external_id = ${sql(item.externalId)};`);
  }

  const directory = await mkdtemp(join(tmpdir(), "risetti-openalex-"));
  const file = join(directory, "batch.sql");
  try {
    await writeFile(file, `${statements.join("\n")}\n`, { mode: 0o600 });
    await promisify(execFile)(resolve("node_modules/.bin/wrangler"), ["d1", "execute", "DB", "--remote", `--file=${file}`], {
      cwd: process.cwd(), maxBuffer: 1024 * 1024, encoding: "utf8",
    });
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

function reconstructAbstract(index: OpenAlexWork["abstract_inverted_index"]): string {
  if (!index) return "";
  const words: string[] = [];
  for (const [word, positions] of Object.entries(index)) {
    for (const position of positions) words[position] = word;
  }
  return words.filter((word) => word !== undefined).join(" ").slice(0, 4000).trim();
}

function toReference(work: OpenAlexWork): ReferenceInput | null {
  const id = work.id?.trim();
  const title = work.title?.trim();
  const year = work.publication_year;
  const location = work.primary_location;
  const summary = reconstructAbstract(work.abstract_inverted_index);
  if (!id || !title || !summary || !Number.isInteger(year) || !location?.license || location.license !== "cc-by") return null;
  const authorNames = [...new Set((work.authorships ?? []).map((item) => item.author?.display_name?.trim()).filter((name): name is string => Boolean(name)))];
  const authors = authorNames.length > 4 ? `${authorNames.slice(0, 4).join(", ")}, et al.` : authorNames.join(", ");
  const institutions = [...new Set((work.authorships ?? []).flatMap((item) => item.institutions ?? []).map((item) => item.display_name?.trim()).filter((name): name is string => Boolean(name)))];
  const doi = work.doi?.trim() || null;
  const sourceUrl = location.landing_page_url?.trim() || doi || "";
  if (!sourceUrl) return null;
  try {
    const parsedUrl = new URL(sourceUrl);
    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") return null;
  } catch {
    return null;
  }
  const domain = work.topics?.[0]?.subfield?.display_name?.trim()
    || work.topics?.[0]?.field?.display_name?.trim()
    || "Computer Science";
  return {
    title: title.slice(0, 240),
    authors: (authors || "Penulis tidak tercatat").slice(0, 240),
    year: Number(year),
    institution: (institutions.slice(0, 2).join("; ") || "Institusi tidak tercantum").slice(0, 180),
    summary,
    sourceName: (location.source?.display_name?.trim() || "Jurnal akademik").slice(0, 180),
    sourceUrl,
    domain: domain.slice(0, 80),
    methods: [],
    technologies: [],
    isDemo: false,
    externalId: id,
    doi,
    license: location.license,
    language: work.language ?? "en",
  };
}

async function fetchPage(search: string, cursor: string, perPage: number): Promise<OpenAlexResponse> {
  const url = new URL(OPENALEX_API);
  url.searchParams.set("search", search);
  url.searchParams.set("filter", "type:article,has_abstract:true,primary_location.license:cc-by,language:en");
  url.searchParams.set("per_page", String(perPage));
  url.searchParams.set("cursor", cursor);
  url.searchParams.set("select", "id,doi,title,publication_year,authorships,primary_location,language,abstract_inverted_index,topics");
  const email = process.env.OPENALEX_EMAIL;
  if (email) url.searchParams.set("mailto", email);
  const apiKey = process.env.OPENALEX_API_KEY;
  if (apiKey) url.searchParams.set("api_key", apiKey);
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const response = await fetch(url, { headers: { "user-agent": "RisetTI/1.0 (open research catalog import)" } });
    if (response.ok) return await response.json() as OpenAlexResponse;
    if (response.status === 401 || response.status === 409) {
      throw new Error("OpenAlex memerlukan API key gratis yang sudah diverifikasi. Gunakan --source crossref untuk mengimpor metadata berlisensi CC BY 4.0 tanpa API key.");
    }
    if (response.status !== 429 && response.status < 500) throw new Error(`OpenAlex mengembalikan HTTP ${response.status}.`);
    if (attempt === 3) throw new Error(`OpenAlex masih membatasi permintaan (HTTP ${response.status}).`);
    await new Promise((resolve) => setTimeout(resolve, 1000 * (2 ** attempt)));
  }
  throw new Error("OpenAlex tidak memberikan respons yang dapat diproses.");
}

async function fetchCrossrefPage(search: string, cursor: string, perPage: number): Promise<CrossrefResponse> {
  const url = new URL(CROSSREF_API);
  url.searchParams.set("query.bibliographic", search);
  url.searchParams.set("filter", `type:journal-article,has-abstract:true,license.url:${CROSSREF_CC_BY_4}`);
  url.searchParams.set("rows", String(perPage));
  url.searchParams.set("cursor", cursor);
  url.searchParams.set("select", "DOI,title,author,publisher,container-title,URL,abstract,license,published-print,published-online,issued,created");
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const response = await fetch(url, { headers: { "user-agent": "RisetTI/1.0 (open academic catalog importer)" } });
    if (response.ok) return await response.json() as CrossrefResponse;
    if (response.status !== 429 && response.status < 500) throw new Error(`Crossref mengembalikan HTTP ${response.status}.`);
    if (attempt === 3) throw new Error(`Crossref masih membatasi permintaan (HTTP ${response.status}).`);
    await new Promise((resolve) => setTimeout(resolve, 1000 * (2 ** attempt)));
  }
  throw new Error("Crossref tidak memberikan respons yang dapat diproses.");
}

function plainAbstract(value: string | undefined): string {
  if (!value) return "";
  return value.replace(/<[^>]*>/gu, " ")
    .replace(/&#(\d+);/gu, (_entity, decimal: string) => String.fromCodePoint(Number(decimal)))
    .replace(/&#x([\da-f]+);/giu, (_entity, hex: string) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&amp;/gu, "&").replace(/&lt;/gu, "<").replace(/&gt;/gu, ">").replace(/&quot;/gu, '"').replace(/&apos;/gu, "'").replace(/&nbsp;/gu, " ")
    .replace(/\s+/gu, " ").trim().slice(0, 3000);
}

function crossrefYear(work: CrossrefWork): number | null {
  const year = work["published-print"]?.["date-parts"]?.[0]?.[0]
    ?? work["published-online"]?.["date-parts"]?.[0]?.[0]
    ?? work.issued?.["date-parts"]?.[0]?.[0]
    ?? work.created?.["date-parts"]?.[0]?.[0];
  return Number.isInteger(year) ? Number(year) : null;
}

function toCrossrefReference(work: CrossrefWork, domain: string): ReferenceInput | null {
  const doi = work.DOI?.trim().toLowerCase();
  const title = work.title?.[0]?.trim();
  const summary = plainAbstract(work.abstract);
  const year = crossrefYear(work);
  const license = work.license?.find((item) => item.URL?.replace(/^http:/u, "https:") === CROSSREF_CC_BY_4);
  if (!doi || !title || !summary || !year || !license) return null;
  const names = [...new Set((work.author ?? []).map((author) => author.name?.trim() || [author.given, author.family].filter(Boolean).join(" ").trim()).filter(Boolean))];
  const authors = names.length > 4 ? `${names.slice(0, 4).join(", ")}, et al.` : names.join(", ");
  const institutions = [...new Set((work.author ?? []).flatMap((author) => author.affiliation ?? []).map((item) => item.name?.trim()).filter((name): name is string => Boolean(name)))];
  const sourceName = work["container-title"]?.[0]?.trim() || work.publisher?.trim() || "Jurnal akademik";
  return {
    title: title.slice(0, 240),
    authors: (authors || "Penulis tidak tercatat").slice(0, 240),
    year,
    institution: (institutions.slice(0, 2).join("; ") || "Institusi tidak tercantum").slice(0, 180),
    summary,
    sourceName: sourceName.slice(0, 180),
    sourceUrl: `https://doi.org/${doi}`,
    domain: domain.slice(0, 80),
    methods: [],
    technologies: [],
    isDemo: false,
    externalId: `crossref:${doi}`,
    doi,
    license: "CC BY 4.0",
    language: work.language ?? "en",
  };
}

async function main(): Promise<void> {
  const target = stringOption("target") ?? "local";
  if (target !== "local" && target !== "cloudflare") throw new Error("--target harus berupa local atau cloudflare.");
  const source = stringOption("source") ?? "openalex";
  if (source !== "openalex" && source !== "crossref") throw new Error("--source harus berupa openalex atau crossref.");
  const limit = option("limit", 3000);
  const perPage = Math.min(100, option("page-size", 100));
  const searches = stringOption("search") ? [stringOption("search")!] : TOPIC_SEARCHES;
  const db = target === "local" ? createDatabase(process.env.DATABASE_PATH ?? "./data/risetti.sqlite") : null;
  const insertBatch = db ? db.transaction((items: ReferenceInput[]) => items.reduce((count, item) => count + Number(insertImportedReference(db, item)), 0)) : null;
  const seen = new Set<string>();
  let inserted = 0;
  let requests = 0;
  try {
    for (const search of searches) {
      let cursor = "*";
      while (inserted < limit && cursor) {
        let works: (OpenAlexWork | CrossrefWork)[];
        let nextCursor: string | null | undefined;
        if (source === "openalex") {
          const response = await fetchPage(search, cursor, perPage);
          works = response.results ?? [];
          nextCursor = response.meta?.next_cursor;
        } else {
          const response = await fetchCrossrefPage(search, cursor, perPage);
          works = response.message?.items ?? [];
          nextCursor = response.message?.["next-cursor"];
        }
        requests += 1;
        const batch: ReferenceInput[] = [];
        for (const work of works) {
          const reference = source === "openalex"
            ? toReference(work as OpenAlexWork)
            : toCrossrefReference(work as CrossrefWork, search);
          if (!reference || !reference.externalId || seen.has(reference.externalId)) continue;
          seen.add(reference.externalId);
          batch.push(reference);
          if (batch.length >= Math.min(perPage, limit - inserted)) break;
        }
        if (insertBatch) inserted += insertBatch(batch);
        else {
          for (let start = 0; start < batch.length; start += 25) {
            const chunk = batch.slice(start, start + 25);
            await insertCloudflareBatch(chunk);
            inserted += chunk.length;
          }
        }
        if (inserted % 300 < batch.length || inserted === limit) {
          const progressLabel = target === "cloudflare" ? "artikel diproses" : "referensi baru";
          console.info(`${source} ${inserted}/${limit} ${progressLabel}; ${requests} permintaan.`);
        }
        cursor = nextCursor ?? "";
        if (source === "crossref") await new Promise((resolve) => setTimeout(resolve, 150));
        if (!batch.length && !cursor) break;
      }
      if (inserted >= limit) break;
    }
    if (inserted < limit) throw new Error(`Hanya ${inserted} referensi baru yang tersedia; target ${limit}. Jalankan ulang agar pencarian dilanjutkan dengan sumber yang masih belum tersimpan.`);
    if (db) {
      const total = (db.prepare("SELECT count(*) AS count FROM catalog_references WHERE archived_at IS NULL").get() as { count: number }).count;
      console.info(`Selesai: ${inserted} artikel baru, ${total} referensi aktif total. Data lama tetap dipertahankan.`);
    } else {
      console.info(`Selesai: ${inserted} artikel berlisensi CC-BY dari ${source} dikirim ke D1. Data duplikat diabaikan oleh database.`);
    }
  } finally {
    db?.close();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
