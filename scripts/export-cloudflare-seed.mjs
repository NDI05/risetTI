import { writeFile } from "node:fs/promises";
import { INITIAL_CATALOG_REFERENCES } from "../src/catalog-seed.ts";

const quote = (value) => value === null || value === undefined
  ? "NULL"
  : typeof value === "number"
    ? String(value)
    : `'${String(value).replaceAll("'", "''")}'`;

const statements = [];
const now = new Date().toISOString();
for (const reference of INITIAL_CATALOG_REFERENCES) {
  const match = reference.sourceUrl.match(/\/(\d+)$/u);
  if (!match) throw new Error(`ID ETD tidak ditemukan pada ${reference.sourceUrl}`);
  const externalId = `ugm-etd:${match[1]}`;
  statements.push(`INSERT OR IGNORE INTO catalog_references
  (title, authors, year, institution, summary, source_name, source_url, external_id, doi, license, language, is_demo, created_at, updated_at)
  VALUES (${[
    reference.title, reference.authors, reference.year, reference.institution, reference.summary,
    reference.sourceName, reference.sourceUrl, externalId, reference.doi, reference.license,
    reference.language, 0, now, now,
  ].map(quote).join(", ")});`);
  for (const [type, tags] of [["domain", [reference.domain]], ["method", reference.methods], ["technology", reference.technologies]]) {
    for (const tag of tags) {
      statements.push(`INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, ${quote(type)}, ${quote(tag)} FROM catalog_references WHERE external_id = ${quote(externalId)};`);
    }
  }
}
statements.push(`INSERT INTO app_metadata (key, value, updated_at)
  VALUES ('catalog_seed_version', 'ugm-etd-2026-10-v1', ${quote(now)})
  ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at;`);
await writeFile(new URL("../migrations/0002_seed_catalog.sql", import.meta.url), `${statements.join("\n\n")}\n`);
console.info(`Generated D1 catalog seed for ${INITIAL_CATALOG_REFERENCES.length} references.`);
