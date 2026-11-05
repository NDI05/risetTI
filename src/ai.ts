import { ApiError } from "./errors.js";
import { findRelatedReferences, getReference, type Sqlite } from "./db.js";
import { OllamaClient } from "./ollama.js";
import type { IdeaAnswer, IdeaIntake, Worksheet } from "./types.js";

const SEARCH_SCHEMA: Record<string, unknown> = {
  type: "object",
  properties: { keywords: { type: "array", items: { type: "string" }, maxItems: 6 } },
  required: ["keywords"],
  additionalProperties: false,
};

const SUMMARY_SCHEMA: Record<string, unknown> = {
  type: "object",
  properties: {
    summary: { type: "string" },
    commonThemes: { type: "array", items: { type: "string" }, maxItems: 5 },
    differences: { type: "array", items: { type: "string" }, maxItems: 5 },
    openQuestions: { type: "array", items: { type: "string" }, maxItems: 5 },
  },
  required: ["summary", "commonThemes", "differences", "openQuestions"],
  additionalProperties: false,
};

const INTAKE_QUESTIONS_SCHEMA: Record<string, unknown> = {
  type: "object",
  properties: { questions: { type: "array", items: { type: "string" }, maxItems: 5 } },
  required: ["questions"],
  additionalProperties: false,
};

const DRAFT_SCHEMA: Record<string, unknown> = {
  type: "object",
  properties: {
    title: { type: "string" },
    problem: { type: "string" },
    context: { type: "string" },
    dataSources: { type: "string" },
    method: { type: "string" },
    technologies: { type: "string" },
    technicalNeeds: { type: "string" },
    timeResources: { type: "string" },
    risksValidation: { type: "string" },
    citations: {
      type: "object",
      properties: {
        problem: { type: "array", items: { type: "integer" }, maxItems: 2 },
        context: { type: "array", items: { type: "integer" }, maxItems: 2 },
        dataSources: { type: "array", items: { type: "integer" }, maxItems: 2 },
        method: { type: "array", items: { type: "integer" }, maxItems: 2 },
        technologies: { type: "array", items: { type: "integer" }, maxItems: 2 },
        technicalNeeds: { type: "array", items: { type: "integer" }, maxItems: 2 },
        timeResources: { type: "array", items: { type: "integer" }, maxItems: 2 },
        risksValidation: { type: "array", items: { type: "integer" }, maxItems: 2 },
      },
      required: ["problem", "context", "dataSources", "method", "technologies", "technicalNeeds", "timeResources", "risksValidation"],
      additionalProperties: false,
    },
  },
  required: ["title", "problem", "context", "dataSources", "method", "technologies", "technicalNeeds", "timeResources", "risksValidation", "citations"],
  additionalProperties: false,
};

const BASE_SYSTEM = `Kamu membantu mahasiswa menyusun informasi awal ide tugas akhir dalam bahasa Indonesia.
Gunakan HANYA masukan mahasiswa dan referensi katalog yang disediakan. Jangan membuat judul penelitian terdahulu, fakta, data, kutipan, DOI, atau tautan. Jangan mengklaim sebuah ide layak atau pasti diterima. Jika informasi belum cukup, tulis bahwa hal itu perlu divalidasi. Jawaban adalah draf yang harus diperiksa mahasiswa. Balas hanya JSON sesuai skema.`;

function requireObject(value: unknown, message: string): Record<string, unknown> {
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

function citationIndexes(value: unknown, field: string, referenceCount: number): number[] {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.some((item) => !Number.isInteger(item))) {
    throw new ApiError(502, `Keluaran AI tidak berisi sitasi ${field} dalam format yang benar.`);
  }
  return [...new Set(value.map(Number))].filter((index) => index >= 1 && index <= referenceCount).slice(0, 2);
}

function selectedReferences(db: Sqlite, ids: number[], required = true) {
  if ((required && ids.length < 1) || ids.length > 8) {
    throw new ApiError(400, required ? "Pilih 1–8 referensi katalog untuk bantuan AI." : "Pilih maksimal 8 referensi katalog untuk bantuan AI.");
  }
  const references = ids.map((id) => getReference(db, id));
  if (references.some((ref) => ref === null)) throw new ApiError(400, "Satu atau lebih referensi tidak tersedia di katalog.");
  return references as NonNullable<(typeof references)[number]>[];
}

function referenceContext(references: ReturnType<typeof selectedReferences>) {
  return references.map((ref) => ({
    title: ref.title,
    authors: ref.authors,
    year: ref.year,
    summary: ref.summary.slice(0, 1200),
    domain: ref.domain,
    methods: ref.methods,
    technologies: ref.technologies,
    sourceName: ref.sourceName,
    sourceUrl: ref.sourceUrl,
    doi: ref.doi,
    license: ref.license,
    isDemonstrationData: ref.isDemo,
  }));
}

export async function suggestKeywords(client: OllamaClient, question: string) {
  const raw = await client.generate([
    { role: "system", content: "Ubah ide dan jawaban mahasiswa menjadi maksimal 6 frasa pencarian 2–5 kata untuk artikel akademik. Utamakan nama objek, proses, dan masalah yang spesifik. Sertakan sinonim bahasa Inggris jika ide berbahasa Indonesia. Hindari frasa generik seperti sistem informasi, teknologi, metode, dan data jika bukan inti topik. Jangan menjawab atau menambah fakta. Hanya JSON." },
    { role: "user", content: JSON.stringify({ pertanyaan: question }) },
  ], SEARCH_SCHEMA);
  const result = requireObject(raw, "Keluaran AI untuk saran pencarian tidak valid.");
  const keywords = list(result.keywords, "daftar kata kunci").slice(0, 6);
  if (!keywords.length) throw new ApiError(502, "AI belum menghasilkan saran kata kunci. Coba tulis pertanyaan lain.");
  return { keywords };
}

export async function summarizeReferences(client: OllamaClient, db: Sqlite, ids: number[]) {
  const references = selectedReferences(db, ids);
  const raw = await client.generate([
    { role: "system", content: `${BASE_SYSTEM}\nRingkas perbandingan hanya dari ringkasan dan metadata referensi berikut. Jangan menyimpulkan lebih jauh dari isi yang diberikan.` },
    { role: "user", content: JSON.stringify({ references: referenceContext(references) }) },
  ], SUMMARY_SCHEMA);
  const result = requireObject(raw, "Keluaran ringkasan AI tidak valid.");
  return {
    draft: {
      summary: text(result.summary, "ringkasan", true),
      commonThemes: list(result.commonThemes, "tema umum"),
      differences: list(result.differences, "perbedaan"),
      openQuestions: list(result.openQuestions, "pertanyaan validasi"),
    },
    references: references.map(({ id, title, sourceName, sourceUrl, isDemo }) => ({ id, title, sourceName, sourceUrl, isDemo })),
    notice: "Draf AI untuk ditinjau; periksa kembali isi dan semua referensi.",
  };
}

export async function suggestIntakeQuestions(client: OllamaClient, db: Sqlite, title: string, ids: number[], existingQuestions: string[] = []) {
  const references = selectedReferences(db, ids, false);
  const raw = await client.generate([
    { role: "system", content: `Kamu membantu mahasiswa Indonesia memperjelas ide tugas akhir yang masih awal. Buat 3 sampai 5 pertanyaan singkat, satu hal per pertanyaan, yang spesifik pada ide tersebut. Prioritaskan istilah atau objek yang ambigu, konteks tempat proses terjadi, siapa yang terdampak, bukti masalah, dan hasil yang diinginkan. Jangan mengasumsikan solusinya harus berupa aplikasi atau teknologi tertentu. Contoh: judul “Keterlambatan dalam pengembalian obat” perlu ditanya tentang konteks layanan, arti pengembalian obat, dan siapa yang mengalami keterlambatan. Jangan ulangi pertanyaan yang sudah ada. Balas hanya JSON sesuai skema.` },
    { role: "user", content: JSON.stringify({ ideAwal: title, pertanyaanYangSudahAda: existingQuestions, referensiKonteks: referenceContext(references) }) },
  ], INTAKE_QUESTIONS_SCHEMA);
  const result = requireObject(raw, "Keluaran pertanyaan panduan tidak valid.");
  const questions = list(result.questions, "pertanyaan panduan").map((item) => item.slice(0, 400)).slice(0, 5);
  if (questions.length < 2) throw new ApiError(502, "AI belum menghasilkan cukup pertanyaan panduan. Coba lagi atau tambahkan pertanyaan sendiri.");
  return { questions };
}

function legacyAnswers(worksheet: Worksheet): IdeaAnswer[] {
  const fields: [keyof Worksheet, string][] = [
    ["problem", "Masalah yang ingin dibahas"],
    ["context", "Konteks atau calon pengguna"],
    ["dataSources", "Data atau sumber data yang mungkin diperlukan"],
    ["method", "Metode awal yang dipertimbangkan"],
    ["technologies", "Teknologi yang dipertimbangkan"],
    ["technicalNeeds", "Kebutuhan teknis dan akses"],
    ["timeResources", "Perkiraan waktu atau sumber daya"],
    ["risksValidation", "Risiko dan hal yang masih perlu divalidasi"],
  ];
  return fields.filter(([key]) => worksheet[key].trim()).map(([key, question]) => ({ question, answer: worksheet[key] }));
}

export async function draftWorksheet(client: OllamaClient, db: Sqlite, intake: IdeaIntake | Worksheet, legacyReferenceIds: number[] = []) {
  const normalizedIntake: IdeaIntake = "answers" in intake
    ? intake
    : { title: intake.title, answers: legacyAnswers(intake) };
  const searchPrompt = [normalizedIntake.title, ...normalizedIntake.answers.map(({ question, answer }) => `${question}: ${answer}`)].join("\n");
  let searchPhrases = domainSearchPhrases(searchPrompt);
  let references = legacyReferenceIds.length ? selectedReferences(db, legacyReferenceIds) : [];
  if (!legacyReferenceIds.length) {
    try {
      const suggestions = await suggestKeywords(client, searchPrompt);
      searchPhrases = [...domainSearchPhrases(searchPrompt), ...suggestions.keywords, normalizedIntake.title];
    } catch {
      // Local lexical retrieval remains available if keyword expansion fails.
    }
    references = findRelatedReferences(db, searchPhrases, 4);
  }
  const raw = await client.generate([
    { role: "system", content: `${BASE_SYSTEM}\nSusun rancangan awal berdasarkan ide dan jawaban mahasiswa. Pertahankan batas topik yang diberikan. Buat judul ringkas dan spesifik sesuai objek/proses yang diceritakan, maksimal 120 karakter, dan jangan gunakan judul generik. Jangan masukkan catatan [Perlu klarifikasi] ke dalam judul; letakkan hal yang belum pasti pada bagian risiko/validasi. Jika objek, lokasi, pengguna, atau sasaran belum jelas, tandai [Perlu klarifikasi] dan ajukan validasi konkret. Jangan mengarang fakta lapangan, jumlah responden, data yang tersedia, izin, jadwal pasti, atau keputusan teknologi. Bagian dataSources berarti calon data lapangan (misalnya catatan proses atau wawancara) dan akses yang perlu diminta, bukan daftar pustaka. Metode dan teknologi harus berupa opsi awal dengan alasan singkat, bukan keputusan final. Buat tiap bagian informatif dan langsung, maksimal dua kalimat. Jangan tulis nomor referensi seperti (1) atau [1] di teks bagian; tautan sitasi akan ditampilkan terpisah.\nReferensi bernomor yang diberikan adalah satu-satunya sumber yang boleh dikutip. Untuk tiap bagian, isi citations dengan nomor referensi (1-based) hanya jika abstrak/metadata benar-benar mendukung bagian tersebut. Kosongkan daftar bila tidak ada dukungan langsung; jangan menyimpulkan kondisi lokal mahasiswa dari artikel umum. Jangan mengarang kutipan atau temuan yang tidak tertulis pada abstrak. Jika referensi tidak ada atau tidak cocok, katakan bahwa dasar pustaka belum ditemukan dan tandai bagian itu untuk penelusuran lanjutan.` },
    { role: "user", content: JSON.stringify({ ideAwal: normalizedIntake.title, lembarMahasiswa: legacyReferenceIds.length ? normalizedIntake : undefined, pertanyaanDanJawaban: normalizedIntake.answers, frasaPencarianOtomatis: searchPhrases, referensiBernomor: referenceContext(references).map((reference, index) => ({ nomor: index + 1, ...reference })) }) },
  ], DRAFT_SCHEMA);
  const result = requireObject(raw, "Keluaran draf AI tidak valid.");
  const citationValues = result.citations === undefined ? {} : requireObject(result.citations, "Keluaran sitasi AI tidak valid.");
  const fieldKeys = ["problem", "context", "dataSources", "method", "technologies", "technicalNeeds", "timeResources", "risksValidation"];
  const referenceList = references.map(({ id, title, sourceName, sourceUrl, isDemo, year, authors, doi, license }) => ({ id, title, sourceName, sourceUrl, isDemo, year, authors, doi, license }));
  const sectionReferenceIds = Object.fromEntries(fieldKeys.map((key) => [
    key,
    citationIndexes(citationValues[key], key, references.length).map((index) => references[index - 1]!.id),
  ]));
  return {
    draft: {
      title: cleanGeneratedTitle(text(result.title, "judul", true)),
      problem: cleanCitationMarkers(text(result.problem, "masalah")),
      context: cleanCitationMarkers(text(result.context, "konteks")),
      dataSources: cleanCitationMarkers(text(result.dataSources, "sumber data")),
      method: cleanCitationMarkers(text(result.method, "metode")),
      technologies: cleanCitationMarkers(text(result.technologies, "teknologi")),
      technicalNeeds: cleanCitationMarkers(text(result.technicalNeeds, "kebutuhan teknis")),
      timeResources: cleanCitationMarkers(text(result.timeResources, "perkiraan sumber daya")),
      risksValidation: cleanCitationMarkers(text(result.risksValidation, "risiko dan validasi")),
    },
    references: referenceList,
    sectionReferenceIds,
    searchPhrases,
    notice: "Ini draf awal, bukan penilaian kelayakan. Tinjau dan sunting setiap bagian sebelum disimpan.",
  };
}

function tokenizeIdea(value: string): string[] {
  return [...new Set(value.toLocaleLowerCase("id-ID").match(/[\p{L}\p{N}]{3,}/gu) ?? [])].slice(0, 12);
}

function cleanCitationMarkers(value: string): string {
  return value.replace(/\s*\((?:\s*\d+\s*,)*\s*\d+\s*\)|\s*\[\d+\]/gu, "").trim();
}

function cleanGeneratedTitle(value: string): string {
  const cleaned = value.replace(/\s*\[perlu\s+klarifikasi[^\]]*\]?\s*$/iu, "").replace(/\s+/gu, " ").trim();
  if (cleaned.length <= 120) return cleaned;
  const truncated = cleaned.slice(0, 120);
  const boundary = truncated.lastIndexOf(" ");
  return (boundary > 0 ? truncated.slice(0, boundary) : truncated).replace(/[,:;–—-]+$/u, "").trim();
}

function domainSearchPhrases(value: string): string[] {
  const input = value.toLocaleLowerCase("id-ID");
  const phrases: string[] = [];
  if (/obat|farmasi|medicin|medication|pharmacy|pharmaceutical/u.test(input)) {
    phrases.push("medicines returned", "medicines returned pharmacies", "returned medicines", "unused medicines return", "medicine return pharmacy", "medication return pharmacy", "drug return pharmacy");
  }
  if (/pengembalian|dikembalikan|kembali|return/u.test(input)) phrases.push("medicine return", "returned medicine", "returned medicines");
  if (/terlambat|keterlambatan|delay|delayed/u.test(input)) phrases.push("medicine return delay", "delayed medicine return");
  const titleTokens = tokenizeIdea(value).filter((token) => !["dalam", "untuk", "yang", "pada", "dari", "dengan", "sebuah", "bagaimana", "konteks", "masalah", "terjadi", "sistem", "informasi"].includes(token));
  return [...new Set([...phrases, ...titleTokens])].slice(0, 14);
}
