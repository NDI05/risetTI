import { ApiError } from "../src/errors.js";
import type { IdeaAnswer, IdeaIntake, Worksheet } from "../src/types.js";
import { findRelatedReferences, getReference, type Reference } from "./data.js";

export interface AiEnvironment {
  AI: Ai;
  AI_MODEL?: string;
  DB: D1Database;
}

interface Message { role: "system" | "user"; content: string }

const SEARCH_SCHEMA = { type: "object", properties: { keywords: { type: "array", items: { type: "string" }, maxItems: 6 } }, required: ["keywords"], additionalProperties: false };
const SUMMARY_SCHEMA = {
  type: "object", properties: {
    summary: { type: "string" }, commonThemes: { type: "array", items: { type: "string" }, maxItems: 5 },
    differences: { type: "array", items: { type: "string" }, maxItems: 5 }, openQuestions: { type: "array", items: { type: "string" }, maxItems: 5 },
  }, required: ["summary", "commonThemes", "differences", "openQuestions"], additionalProperties: false,
};
const INTAKE_SCHEMA = { type: "object", properties: { questions: { type: "array", items: { type: "string" }, maxItems: 5 } }, required: ["questions"], additionalProperties: false };
const DRAFT_SCHEMA = {
  type: "object", properties: {
    title: { type: "string" }, problem: { type: "string" }, context: { type: "string" }, dataSources: { type: "string" },
    method: { type: "string" }, technologies: { type: "string" }, technicalNeeds: { type: "string" },
    timeResources: { type: "string" }, risksValidation: { type: "string" },
    citations: { type: "object", properties: Object.fromEntries(["problem", "context", "dataSources", "method", "technologies", "technicalNeeds", "timeResources", "risksValidation"].map((key) => [key, { type: "array", items: { type: "integer" }, maxItems: 2 }])),
      required: ["problem", "context", "dataSources", "method", "technologies", "technicalNeeds", "timeResources", "risksValidation"], additionalProperties: false },
  }, required: ["title", "problem", "context", "dataSources", "method", "technologies", "technicalNeeds", "timeResources", "risksValidation", "citations"], additionalProperties: false,
};

const BASE_SYSTEM = `Kamu membantu mahasiswa menyusun informasi awal ide tugas akhir dalam bahasa Indonesia.
Gunakan HANYA masukan mahasiswa dan referensi katalog yang disediakan. Jangan membuat judul penelitian terdahulu, fakta, data, kutipan, DOI, atau tautan. Jangan mengklaim sebuah ide layak atau pasti diterima. Jika informasi belum cukup, tulis bahwa hal itu perlu divalidasi. Jawaban adalah draf yang harus diperiksa mahasiswa. Balas hanya JSON sesuai skema.`;

function object(value: unknown, message: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new ApiError(502, message);
  return value as Record<string, unknown>;
}

function text(value: unknown, field: string, required = false): string {
  if (typeof value !== "string" || (required && !value.trim())) throw new ApiError(502, `Keluaran AI tidak berisi ${field} yang valid.`);
  return value.trim().slice(0, 3000);
}

function list(value: unknown, field: string): string[] {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) throw new ApiError(502, `Keluaran AI tidak berisi ${field} dalam format yang benar.`);
  return value.slice(0, 5).map((item) => String(item).trim().slice(0, 500)).filter(Boolean);
}

function citationIndexes(value: unknown, field: string, count: number): number[] {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.some((item) => !Number.isInteger(item))) throw new ApiError(502, `Keluaran AI tidak berisi sitasi ${field} dalam format yang benar.`);
  return [...new Set(value.map(Number))].filter((index) => index >= 1 && index <= count).slice(0, 2);
}

async function generate(env: AiEnvironment, messages: Message[], schema: Record<string, unknown>): Promise<unknown> {
  try {
    const response = await env.AI.run(env.AI_MODEL || "@cf/meta/llama-3.1-8b-instruct-fast", {
      messages,
      response_format: { type: "json_schema", json_schema: schema },
      max_tokens: 1800,
      temperature: 0.2,
    });
    const candidate = response && typeof response === "object" && "response" in response ? response.response : response;
    if (typeof candidate === "string") {
      try { return JSON.parse(candidate) as unknown; }
      catch { throw new ApiError(502, "Workers AI mengembalikan JSON yang tidak valid. Coba lagi."); }
    }
    return candidate;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    console.error("Workers AI inference failed:", error);
    throw new ApiError(502, "Workers AI belum dapat menyusun jawaban. Tunggu sebentar lalu coba lagi.");
  }
}

function referenceContext(references: Reference[]) {
  return references.map((ref) => ({
    title: ref.title, authors: ref.authors, year: ref.year, summary: ref.summary.slice(0, 1200), domain: ref.domain,
    methods: ref.methods, technologies: ref.technologies, sourceName: ref.sourceName, sourceUrl: ref.sourceUrl,
    doi: ref.doi, license: ref.license, isDemonstrationData: ref.isDemo,
  }));
}

async function selectedReferences(db: D1Database, ids: number[], required = true): Promise<Reference[]> {
  if ((required && ids.length < 1) || ids.length > 8) throw new ApiError(400, required ? "Pilih 1–8 referensi katalog untuk bantuan AI." : "Pilih maksimal 8 referensi katalog untuk bantuan AI.");
  const references: Reference[] = [];
  for (const id of ids) {
    const reference = await getReference(db, id);
    if (!reference) throw new ApiError(400, "Satu atau lebih referensi tidak tersedia di katalog.");
    references.push(reference);
  }
  return references;
}

export async function suggestKeywords(env: AiEnvironment, question: string) {
  const raw = await generate(env, [
    { role: "system", content: "Ubah ide dan jawaban mahasiswa menjadi maksimal 6 frasa pencarian 2–5 kata untuk artikel akademik. Utamakan nama objek, proses, dan masalah yang spesifik. Sertakan sinonim bahasa Inggris jika ide berbahasa Indonesia. Hindari frasa generik seperti sistem informasi, teknologi, metode, dan data jika bukan inti topik. Jangan menjawab atau menambah fakta. Hanya JSON." },
    { role: "user", content: JSON.stringify({ pertanyaan: question }) },
  ], SEARCH_SCHEMA);
  const result = object(raw, "Keluaran AI untuk saran pencarian tidak valid.");
  const keywords = list(result.keywords, "daftar kata kunci").slice(0, 6);
  if (!keywords.length) throw new ApiError(502, "AI belum menghasilkan saran kata kunci. Coba tulis pertanyaan lain.");
  return { keywords };
}

export async function summarizeReferences(env: AiEnvironment, ids: number[]) {
  const references = await selectedReferences(env.DB, ids);
  const raw = await generate(env, [
    { role: "system", content: `${BASE_SYSTEM}\nRingkas perbandingan hanya dari ringkasan dan metadata referensi berikut. Jangan menyimpulkan lebih jauh dari isi yang diberikan.` },
    { role: "user", content: JSON.stringify({ references: referenceContext(references) }) },
  ], SUMMARY_SCHEMA);
  const result = object(raw, "Keluaran ringkasan AI tidak valid.");
  return {
    draft: { summary: text(result.summary, "ringkasan", true), commonThemes: list(result.commonThemes, "tema umum"), differences: list(result.differences, "perbedaan"), openQuestions: list(result.openQuestions, "pertanyaan validasi") },
    references: references.map(({ id, title, sourceName, sourceUrl, isDemo }) => ({ id, title, sourceName, sourceUrl, isDemo })),
    notice: "Draf AI untuk ditinjau; periksa kembali isi dan semua referensi.",
  };
}

export async function suggestIntakeQuestions(env: AiEnvironment, title: string, existingQuestions: string[] = []) {
  const raw = await generate(env, [
    { role: "system", content: `Kamu membantu mahasiswa Indonesia memperjelas ide tugas akhir yang masih awal. Buat 3 sampai 5 pertanyaan singkat, satu hal per pertanyaan, yang spesifik pada ide tersebut. Prioritaskan istilah atau objek yang ambigu, konteks tempat proses terjadi, siapa yang terdampak, bukti masalah, dan hasil yang diinginkan. Jangan mengasumsikan solusinya harus berupa aplikasi atau teknologi tertentu. Contoh: judul “Keterlambatan dalam pengembalian obat” perlu ditanya tentang konteks layanan, arti pengembalian obat, dan siapa yang mengalami keterlambatan. Jangan ulangi pertanyaan yang sudah ada. Balas hanya JSON sesuai skema.` },
    { role: "user", content: JSON.stringify({ ideAwal: title, pertanyaanYangSudahAda: existingQuestions }) },
  ], INTAKE_SCHEMA);
  const result = object(raw, "Keluaran pertanyaan panduan tidak valid.");
  const questions = list(result.questions, "pertanyaan panduan").map((item) => item.slice(0, 400)).slice(0, 5);
  if (questions.length < 2) throw new ApiError(502, "AI belum menghasilkan cukup pertanyaan panduan. Coba lagi atau tambahkan pertanyaan sendiri.");
  return { questions };
}

function legacyAnswers(worksheet: Worksheet): IdeaAnswer[] {
  const fields: [keyof Worksheet, string][] = [
    ["problem", "Masalah yang ingin dibahas"], ["context", "Konteks atau calon pengguna"], ["dataSources", "Data atau sumber data yang mungkin diperlukan"],
    ["method", "Metode awal yang dipertimbangkan"], ["technologies", "Teknologi yang dipertimbangkan"], ["technicalNeeds", "Kebutuhan teknis dan akses"],
    ["timeResources", "Perkiraan waktu atau sumber daya"], ["risksValidation", "Risiko dan hal yang masih perlu divalidasi"],
  ];
  return fields.filter(([key]) => worksheet[key].trim()).map(([key, question]) => ({ question, answer: worksheet[key] }));
}

export async function draftWorksheet(env: AiEnvironment, intake: IdeaIntake | Worksheet, legacyReferenceIds: number[] = []) {
  const normalized: IdeaIntake = "answers" in intake ? intake : { title: intake.title, answers: legacyAnswers(intake) };
  const searchPrompt = [normalized.title, ...normalized.answers.map(({ question, answer }) => `${question}: ${answer}`)].join("\n");
  let searchPhrases = domainSearchPhrases(searchPrompt);
  let references = legacyReferenceIds.length ? await selectedReferences(env.DB, legacyReferenceIds) : [];
  if (!legacyReferenceIds.length) {
    try {
      const suggestions = await suggestKeywords(env, searchPrompt);
      searchPhrases = [...domainSearchPhrases(searchPrompt), ...suggestions.keywords, normalized.title];
    } catch { /* Lexical catalogue retrieval remains available if keyword expansion fails. */ }
    references = await findRelatedReferences(env.DB, searchPhrases, 4);
  }
  const raw = await generate(env, [
    { role: "system", content: `${BASE_SYSTEM}\nSusun rancangan awal berdasarkan ide dan jawaban mahasiswa. Pertahankan batas topik yang diberikan. Buat judul ringkas dan spesifik sesuai objek/proses yang diceritakan, maksimal 120 karakter, dan jangan gunakan judul generik. Jangan masukkan catatan [Perlu klarifikasi] ke dalam judul; letakkan hal yang belum pasti pada bagian risiko/validasi. Jika objek, lokasi, pengguna, atau sasaran belum jelas, tandai [Perlu klarifikasi] dan ajukan validasi konkret. Jangan mengarang fakta lapangan, jumlah responden, data yang tersedia, izin, jadwal pasti, atau keputusan teknologi. Bagian dataSources berarti calon data lapangan (misalnya catatan proses atau wawancara) dan akses yang perlu diminta, bukan daftar pustaka. Metode dan teknologi harus berupa opsi awal dengan alasan singkat, bukan keputusan final. Buat tiap bagian informatif dan langsung, maksimal dua kalimat. Jangan tulis nomor referensi seperti (1) atau [1] di teks bagian; tautan sitasi akan ditampilkan terpisah.\nReferensi bernomor yang diberikan adalah satu-satunya sumber yang boleh dikutip. Untuk tiap bagian, isi citations dengan nomor referensi (1-based) hanya jika abstrak/metadata benar-benar mendukung bagian tersebut. Kosongkan daftar bila tidak ada dukungan langsung; jangan menyimpulkan kondisi lokal mahasiswa dari artikel umum. Jangan mengarang kutipan atau temuan yang tidak tertulis pada abstrak. Jika referensi tidak ada atau tidak cocok, katakan bahwa dasar pustaka belum ditemukan dan tandai bagian itu untuk penelusuran lanjutan.` },
    { role: "user", content: JSON.stringify({ ideAwal: normalized.title, lembarMahasiswa: legacyReferenceIds.length ? normalized : undefined, pertanyaanDanJawaban: normalized.answers, frasaPencarianOtomatis: searchPhrases, referensiBernomor: referenceContext(references).map((reference, index) => ({ nomor: index + 1, ...reference })) }) },
  ], DRAFT_SCHEMA);
  const result = object(raw, "Keluaran draf AI tidak valid.");
  const citations = result.citations === undefined ? {} : object(result.citations, "Keluaran sitasi AI tidak valid.");
  const keys = ["problem", "context", "dataSources", "method", "technologies", "technicalNeeds", "timeResources", "risksValidation"];
  const sectionReferenceIds = Object.fromEntries(keys.map((key) => [key, citationIndexes(citations[key], key, references.length).map((index) => references[index - 1]!.id)]));
  const clean = (key: string, label: string) => text(result[key], label).replace(/\s*\((?:\s*\d+\s*,)*\s*\d+\s*\)|\s*\[\d+\]/gu, "").trim();
  return {
    draft: {
      title: cleanTitle(text(result.title, "judul", true)), problem: clean("problem", "masalah"), context: clean("context", "konteks"),
      dataSources: clean("dataSources", "sumber data"), method: clean("method", "metode"), technologies: clean("technologies", "teknologi"),
      technicalNeeds: clean("technicalNeeds", "kebutuhan teknis"), timeResources: clean("timeResources", "perkiraan sumber daya"), risksValidation: clean("risksValidation", "risiko dan validasi"),
    },
    references: references.map(({ id, title, sourceName, sourceUrl, isDemo, year, authors, doi, license }) => ({ id, title, sourceName, sourceUrl, isDemo, year, authors, doi, license })),
    sectionReferenceIds, searchPhrases,
    notice: "Ini draf awal, bukan penilaian kelayakan. Tinjau dan sunting setiap bagian sebelum disimpan.",
  };
}

function tokenizeIdea(value: string): string[] { return [...new Set(value.toLocaleLowerCase("id-ID").match(/[\p{L}\p{N}]{3,}/gu) ?? [])].slice(0, 12); }
function cleanTitle(value: string): string {
  const cleaned = value.replace(/\s*\[perlu\s+klarifikasi[^\]]*\]?\s*$/iu, "").replace(/\s+/gu, " ").trim();
  if (cleaned.length <= 120) return cleaned;
  const truncated = cleaned.slice(0, 120); const boundary = truncated.lastIndexOf(" ");
  return (boundary > 0 ? truncated.slice(0, boundary) : truncated).replace(/[,:;–—-]+$/u, "").trim();
}
function domainSearchPhrases(value: string): string[] {
  const input = value.toLocaleLowerCase("id-ID"); const phrases: string[] = [];
  if (/obat|farmasi|medicin|medication|pharmacy|pharmaceutical/u.test(input)) phrases.push("medicines returned", "medicines returned pharmacies", "returned medicines", "unused medicines return", "medicine return pharmacy", "medication return pharmacy", "drug return pharmacy");
  if (/pengembalian|dikembalikan|kembali|return/u.test(input)) phrases.push("medicine return", "returned medicine", "returned medicines");
  if (/terlambat|keterlambatan|delay|delayed/u.test(input)) phrases.push("medicine return delay", "delayed medicine return");
  const ignored = new Set(["dalam", "untuk", "yang", "pada", "dari", "dengan", "sebuah", "bagaimana", "konteks", "masalah", "terjadi", "sistem", "informasi"]);
  return [...new Set([...phrases, ...tokenizeIdea(value).filter((token) => !ignored.has(token))])].slice(0, 14);
}
