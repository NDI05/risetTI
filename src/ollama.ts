export interface OllamaStatus {
  available: boolean;
  connected: boolean;
  model: string;
  message: string;
  localOnly: true;
}

interface OllamaConfig {
  baseUrl: string;
  model: string;
  fetcher?: typeof fetch;
}

export interface ChatMessage {
  role: "system" | "user";
  content: string;
}

export class OllamaClient {
  private readonly baseUrl: string | null;
  private readonly fetcher: typeof fetch;
  private activeGenerations = 0;
  private readonly generationQueue: Array<() => void> = [];
  private readonly maxQueuedGenerations = 2;

  constructor(private readonly config: OllamaConfig) {
    this.fetcher = config.fetcher ?? fetch;
    try {
      const url = new URL(config.baseUrl);
      const localHosts = new Set(["localhost", "127.0.0.1", "::1", "[::1]", "ollama"]);
      this.baseUrl = (url.protocol === "http:" || url.protocol === "https:") &&
        localHosts.has(url.hostname) && !url.username && !url.password && url.pathname === "/" && !url.search && !url.hash
        ? url.toString().replace(/\/$/, "")
        : null;
    } catch {
      this.baseUrl = null;
    }
  }

  async status(): Promise<OllamaStatus> {
    const model = this.config.model.trim();
    if (!this.baseUrl) return { available: false, connected: false, model, message: "Alamat Ollama harus menunjuk ke komputer lokal.", localOnly: true };
    if (!model) return { available: false, connected: false, model, message: "Nama model Ollama belum diatur.", localOnly: true };
    try {
      const response = await this.fetcher(`${this.baseUrl}/api/tags`, { signal: AbortSignal.timeout(1800) });
      if (!response.ok) return { available: false, connected: false, model, message: "Ollama belum merespons dengan benar.", localOnly: true };
      const body: unknown = await response.json();
      const models = body && typeof body === "object" && "models" in body && Array.isArray(body.models)
        ? body.models as { name?: unknown; model?: unknown }[]
        : [];
      const present = models.some((entry) => entry.name === model || entry.model === model);
      return {
        available: present,
        connected: true,
        model,
        message: present
          ? "Bantuan AI lokal siap digunakan. Periksa kembali setiap draf sebelum menyimpannya."
          : `Ollama terhubung, tetapi model ${model} belum tersedia. Jalankan ollama pull ${model}.`,
        localOnly: true,
      };
    } catch {
      return { available: false, connected: false, model, message: "Ollama belum dapat dihubungi. Pencarian katalog dan pengisian manual tetap tersedia.", localOnly: true };
    }
  }

  async generate(messages: ChatMessage[], format: Record<string, unknown>): Promise<unknown> {
    const release = await this.acquireGenerationSlot();
    try {
      const state = await this.status();
      if (!state.available || !this.baseUrl) throw new ApiError(503, state.message);
      let response: Response;
      try {
        response = await this.fetcher(`${this.baseUrl}/api/chat`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            model: this.config.model,
            messages,
            format,
            stream: false,
            options: { temperature: 0.2 },
          }),
          signal: AbortSignal.timeout(90_000),
        });
      } catch (error) {
        if (error instanceof Error && error.name === "TimeoutError") throw new ApiError(504, "Ollama belum menyelesaikan draf dalam 90 detik. Coba lagi dengan ringkasan yang lebih singkat.");
        throw new ApiError(503, "Koneksi ke Ollama terputus. Pastikan Ollama masih berjalan.");
      }
      if (!response.ok) throw new ApiError(502, "Ollama gagal memproses permintaan. Periksa model lokal lalu coba lagi.");
      let body: unknown;
      try {
        body = await response.json();
      } catch {
        throw new ApiError(502, "Respons Ollama tidak dapat dibaca. Coba lagi atau lanjutkan secara manual.");
      }
      const content = body && typeof body === "object" && "message" in body && body.message &&
        typeof body.message === "object" && "content" in body.message && typeof body.message.content === "string"
        ? body.message.content.trim()
        : "";
      if (!content) throw new ApiError(502, "Ollama mengembalikan jawaban kosong. Coba lagi nanti.");
      try {
        return JSON.parse(content) as unknown;
      } catch {
        throw new ApiError(502, "Keluaran AI tidak sesuai format. Coba lagi atau isi lembar secara manual.");
      }
    } finally {
      release();
    }
  }

  private async acquireGenerationSlot(): Promise<() => void> {
    if (this.activeGenerations === 0) {
      this.activeGenerations += 1;
    } else {
      if (this.generationQueue.length >= this.maxQueuedGenerations) {
        throw new ApiError(503, "Bantuan AI sedang sibuk. Tunggu sebentar lalu coba lagi.");
      }
      await new Promise<void>((resolve) => this.generationQueue.push(resolve));
    }

    let released = false;
    return () => {
      if (released) return;
      released = true;
      const next = this.generationQueue.shift();
      if (next) next();
      else this.activeGenerations -= 1;
    };
  }
}
import { ApiError } from "./errors.js";
