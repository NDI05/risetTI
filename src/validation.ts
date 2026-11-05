import { ApiError } from "./errors.js";
import type { IdeaAnswer, IdeaIntake, ReferenceInput, Worksheet } from "./types.js";

export function bodyObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new ApiError(400, "Format permintaan tidak valid.");
  return value as Record<string, unknown>;
}

export function textValue(value: unknown, field: string, max: number, required = false): string {
  if (typeof value !== "string") {
    if (!required && (value === null || value === undefined)) return "";
    throw new ApiError(400, `Isian ${field} harus berupa teks.`);
  }
  const cleaned = value.trim();
  if (required && !cleaned) throw new ApiError(400, `Isian ${field} wajib diisi.`);
  if (cleaned.length > max) throw new ApiError(400, `Isian ${field} maksimal ${max} karakter.`);
  return cleaned;
}

export function stringList(value: unknown, field: string, maxItems = 12, maxLength = 80): string[] {
  if (!Array.isArray(value)) throw new ApiError(400, `Isian ${field} harus berupa daftar.`);
  if (value.length > maxItems) throw new ApiError(400, `Isian ${field} maksimal ${maxItems} item.`);
  const items = value.map((item) => textValue(item, field, maxLength, true));
  return [...new Set(items.map((item) => item.replace(/\s+/g, " ")))];
}

export function integerIds(value: unknown, field: string, maxItems = 12): number[] {
  if (!Array.isArray(value) || value.length > maxItems) throw new ApiError(400, `Daftar ${field} tidak valid.`);
  const ids = value.map((item) => {
    if (!Number.isSafeInteger(item) || Number(item) < 1) throw new ApiError(400, `ID ${field} tidak valid.`);
    return Number(item);
  });
  return [...new Set(ids)];
}

export function validateEmail(value: unknown): string {
  const email = textValue(value, "email", 254, true).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new ApiError(400, "Format email belum benar.");
  return email;
}

export function validatePassword(value: unknown): string {
  if (typeof value !== "string" || value.length < 12 || value.length > 200) {
    throw new ApiError(400, `Kata sandi harus berisi 12–200 karakter.`);
  }
  return value;
}

export function validateReferenceInput(value: unknown): ReferenceInput {
  const body = bodyObject(value);
  const year = body.year;
  if (!Number.isInteger(year) || Number(year) < 1980 || Number(year) > 2100) {
    throw new ApiError(400, "Tahun harus berupa angka antara 1980 dan 2100.");
  }
  if (typeof body.isDemo !== "boolean") throw new ApiError(400, "Status data demonstrasi tidak valid.");
  const sourceUrl = textValue(body.sourceUrl, "tautan sumber", 1000);
  if (sourceUrl) {
    try {
      const url = new URL(sourceUrl);
      if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error("protocol");
    } catch {
      throw new ApiError(400, "Tautan sumber harus menggunakan http atau https.");
    }
  } else if (!body.isDemo) {
    throw new ApiError(400, "Referensi noncontoh harus memiliki tautan sumber.");
  }
  return {
    title: textValue(body.title, "judul", 240, true),
    authors: textValue(body.authors, "penulis", 240, true),
    year: Number(year),
    institution: textValue(body.institution, "institusi", 180, true),
    summary: textValue(body.summary, "ringkasan", 4000, true),
    sourceName: textValue(body.sourceName, "nama sumber", 180, true),
    sourceUrl,
    domain: textValue(body.domain, "bidang", 80, true),
    methods: stringList(body.methods, "metode"),
    technologies: stringList(body.technologies, "teknologi"),
    isDemo: body.isDemo,
  };
}

export function validateWorksheet(value: unknown): Worksheet {
  const body = bodyObject(value);
  return {
    title: textValue(body.title, "judul ide", 120, true),
    problem: textValue(body.problem, "masalah", 3000),
    context: textValue(body.context, "konteks/calon pengguna", 3000),
    dataSources: textValue(body.dataSources, "data/sumber data", 3000),
    method: textValue(body.method, "metode awal", 3000),
    technologies: textValue(body.technologies, "teknologi", 3000),
    technicalNeeds: textValue(body.technicalNeeds, "kebutuhan teknis", 3000),
    timeResources: textValue(body.timeResources, "perkiraan waktu/sumber daya", 3000),
    risksValidation: textValue(body.risksValidation, "risiko/validasi", 3000),
  };
}

export function validateIdeaIntake(value: unknown): IdeaIntake {
  const body = bodyObject(value);
  if (!Array.isArray(body.answers) || body.answers.length > 8) {
    throw new ApiError(400, "Pertanyaan ide harus berisi maksimal 8 item.");
  }
  const answers: IdeaAnswer[] = body.answers.map((item) => {
    const answer = bodyObject(item);
    return {
      question: textValue(answer.question, "pertanyaan", 400, true),
      answer: textValue(answer.answer, "jawaban", 1500),
    };
  });
  if (!answers.some((answer) => answer.answer.trim())) throw new ApiError(400, "Jawab setidaknya satu pertanyaan agar rancangan tidak terlalu umum.");
  return {
    title: textValue(body.title, "ide awal", 120, true),
    answers,
  };
}

export function positiveId(value: string): number {
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id < 1) throw new ApiError(400, "ID tidak valid.");
  return id;
}
