import { afterEach, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { bootstrapAdmin, createDatabase, insertReference, listIdeas, listShortlist, saveIdea, seedInitialCatalog, type Sqlite } from "../src/db.js";
import { OllamaClient } from "../src/ollama.js";

const PASSWORD = "RisetTI-mango-2026!";
const openedDatabases: Sqlite[] = [];

function database(): Sqlite {
  const db = createDatabase(":memory:");
  openedDatabases.push(db);
  return db;
}

afterEach(() => {
  for (const db of openedDatabases.splice(0)) db.close();
});

async function register(agent: ReturnType<typeof request.agent>, email = "mahasiswa@example.test") {
  const response = await agent.post("/api/auth/register").send({ name: "Ayu Mahasiswa", email, password: PASSWORD });
  expect(response.status).toBe(201);
  return response.body.csrfToken as string;
}

function worksheet(title = "Analisis akses layanan kampus") {
  return {
    title,
    problem: "Mahasiswa sulit menemukan informasi layanan.",
    context: "Portal layanan kampus.",
    dataSources: "Wawancara dan dokumen yang mendapat izin.",
    method: "Evaluasi usability.",
    technologies: "React.",
    technicalNeeds: "Izin menghubungi calon pengguna.",
    timeResources: "Delapan minggu.",
    risksValidation: "Validasi akses dan jumlah responden.",
  };
}

describe("RisetTI API", () => {
  it("mencari katalog dengan kata kunci, bidang, metode, dan teknologi", async () => {
    const app = createApp({ db: database() });
    const response = await request(app).get("/api/catalog")
      .query({ q: "sistem informasi laboratorium", domain: "Sistem Informasi", method: "Rapid Application Development", technology: "Web" });

    expect(response.status).toBe(200);
    expect(response.body.total).toBe(1);
    expect(response.body.items[0].title).toContain("SISTEM INFORMASI LABORATORIUM");
    expect(response.body.items[0].isDemo).toBe(false);
    expect(response.body.items[0].sourceUrl).toContain("etd.repository.ugm.ac.id");

    const multiWord = await request(app).get("/api/catalog").query({ q: "IoT smart farming" });
    expect(multiWord.body.total).toBe(2);
    const acronym = await request(app).get("/api/catalog").query({ q: "AI" });
    expect(acronym.body.total).toBeGreaterThanOrEqual(2);
  });

  it("memuat katalog sumber nyata dan memigrasikan shortlist serta ide dari data demo", () => {
    const db = database();
    const demoId = insertReference(db, {
      title: "Contoh Demo — Dashboard analitik peminjaman laboratorium",
      authors: "Data demonstrasi",
      year: 2026,
      institution: "RisetTI",
      summary: "Contoh sintetis.",
      sourceName: "Data demo",
      sourceUrl: "",
      domain: "Sistem Informasi",
      methods: [],
      technologies: [],
      isDemo: true,
    });
    const userId = Number(db.prepare("INSERT INTO users (name, email, password_hash, role, created_at) VALUES (?, ?, ?, 'mahasiswa', ?)")
      .run("Ayu", "migrasi@example.test", "test-hash", new Date().toISOString()).lastInsertRowid);
    db.prepare("INSERT INTO shortlist (user_id, reference_id, created_at) VALUES (?, ?, ?)")
      .run(userId, demoId, new Date().toISOString());
    const ideaId = saveIdea(db, userId, worksheet("Ide yang harus tetap ada"), [demoId]);
    db.prepare("DELETE FROM app_metadata WHERE key = 'catalog_seed_version'").run();

    seedInitialCatalog(db);

    const references = db.prepare("SELECT COUNT(*) AS count FROM catalog_references WHERE archived_at IS NULL").get() as { count: number };
    expect(references.count).toBe(32);
    expect(db.prepare("SELECT COUNT(*) AS count FROM catalog_references WHERE is_demo = 1 AND archived_at IS NULL").get()).toMatchObject({ count: 0 });
    expect(listShortlist(db, userId)).toMatchObject([{ sourceUrl: "https://etd.repository.ugm.ac.id/penelitian/detail/159732" }]);
    expect(listIdeas(db, userId)).toMatchObject([{ id: ideaId, title: "Ide yang harus tetap ada", referenceIds: [expect.any(Number)] }]);
    expect(db.prepare("SELECT COUNT(*) AS count FROM ideas WHERE user_id = ?").get(userId)).toMatchObject({ count: 1 });
  });

  it("membatasi akun mahasiswa pada data miliknya dan menyimpan shortlist serta lembar manual", async () => {
    const db = database();
    const app = createApp({ db });
    const first = request.agent(app);
    const second = request.agent(app);
    const csrf = await register(first);
    expect((await first.get("/api/session")).body.user.role).toBe("mahasiswa");
    await register(second, "budi@example.test");
    const ref = (await request(app).get("/api/catalog")).body.items[0];

    const noCsrf = await first.post(`/api/shortlist/${ref.id}`).send({});
    expect(noCsrf.status).toBe(403);
    const added = await first.post(`/api/shortlist/${ref.id}`).set("x-csrf-token", csrf).send({});
    expect(added.status).toBe(201);
    expect(added.body.items).toHaveLength(1);
    expect((await second.get("/api/shortlist")).body.items).toHaveLength(0);

    const saved = await first.post("/api/ideas").set("x-csrf-token", csrf)
      .send({ ...worksheet(), referenceIds: [ref.id] });
    expect(saved.status).toBe(201);
    expect(saved.body.title).toBe("Analisis akses layanan kampus");
    expect(saved.body.referenceIds).toEqual([ref.id]);
    const updated = await first.put(`/api/ideas/${saved.body.id}`).set("x-csrf-token", csrf)
      .send({ ...worksheet("Analisis akses kampus — revisi"), referenceIds: [] });
    expect(updated.status).toBe(200);
    expect(updated.body.title).toContain("revisi");
    expect((await second.get("/api/ideas")).body.items).toHaveLength(0);
  });

  it("melindungi endpoint admin dan mendukung tambah serta arsip metadata", async () => {
    const db = database();
    bootstrapAdmin(db, "admin@example.test", PASSWORD);
    const app = createApp({ db });
    const student = request.agent(app);
    const csrf = await register(student);
    const forbidden = await student.get("/api/admin/references");
    expect(forbidden.status).toBe(403);

    const admin = request.agent(app);
    const login = await admin.post("/api/auth/login").send({ email: "admin@example.test", password: PASSWORD });
    expect(login.status).toBe(200);
    const adminCsrf = login.body.csrfToken as string;
    const created = await admin.post("/api/admin/references").set("x-csrf-token", adminCsrf).send({
      title: "Pemetaan kebutuhan layanan kampus",
      authors: "Penulis A",
      year: 2025,
      institution: "Repositori Universitas Contoh",
      summary: "Ringkasan metadata yang dimasukkan admin.",
      sourceName: "Repositori kampus",
      sourceUrl: "https://example.edu/repository/123",
      domain: "Sistem Informasi",
      methods: ["Survei"],
      technologies: ["PostgreSQL"],
      isDemo: false,
    });
    expect(created.status).toBe(201);
    const archived = await admin.post(`/api/admin/references/${created.body.id}/archive`)
      .set("x-csrf-token", adminCsrf).send({});
    expect(archived.status).toBe(204);
    expect((await request(app).get(`/api/catalog/${created.body.id}`)).status).toBe(404);
    const archivedItem = (await admin.get("/api/admin/references")).body.items.find((item: { id: number }) => item.id === created.body.id) as { archivedAt: string } | undefined;
    expect(archivedItem?.archivedAt).toBeTruthy();
    expect((await student.post(`/api/shortlist/${created.body.id}`).set("x-csrf-token", csrf).send({})).status).toBe(404);
  });

  it("menonaktifkan AI untuk URL nonlokal tanpa mengganggu lembar manual", async () => {
    const db = database();
    const app = createApp({ db, ollama: new OllamaClient({
      baseUrl: "https://ollama.example.test",
      model: "gemma4:e2b-it-q4_K_M",
      fetcher: async () => { throw new Error("URL nonlokal tidak boleh dipanggil"); },
    }) });
    const state = await request(app).get("/api/ai/status");
    expect(state.body.available).toBe(false);
    expect(state.body.localOnly).toBe(true);
    expect(state.body.message).toContain("komputer lokal");

    const student = request.agent(app);
    const csrf = await register(student);
    const saved = await student.post("/api/ideas").set("x-csrf-token", csrf).send({ ...worksheet(), referenceIds: [] });
    expect(saved.status).toBe(201);
    expect((await student.get("/api/ideas")).body.items).toHaveLength(1);
  });

  it("mengirim ke Gemma hanya referensi terpilih dan mengembalikan tautan sumber dari katalog", async () => {
    const db = database();
    const model = "gemma4:e2b-it-q4_K_M";
    const sentPrompts: string[] = [];
    const ollama = new OllamaClient({
      baseUrl: "http://localhost:11434",
      model,
      fetcher: async (input, init) => {
        if (String(input).endsWith("/api/tags")) return new Response(JSON.stringify({ models: [{ name: model }] }), { status: 200 });
        if (String(input).endsWith("/api/chat")) {
          const body = JSON.parse(String(init?.body)) as { messages: { content: string }[] };
          const userMessage = body.messages[1];
          if (!userMessage) throw new Error("Pesan pengguna tidak diteruskan ke Ollama.");
          sentPrompts.push(userMessage.content);
          const result = userMessage.content.includes("lembarMahasiswa") ? {
            title: "Draf kajian layanan kampus",
            problem: "Masalah yang perlu ditinjau.",
            context: "Konteks pengguna perlu divalidasi.",
            dataSources: "Data yang perlu dicari.",
            method: "Metode awal.",
            technologies: "Teknologi pilihan.",
            technicalNeeds: "Kebutuhan akses perlu divalidasi.",
            timeResources: "Perkiraan awal.",
            risksValidation: "Validasi izin dan kebutuhan.",
          } : {
            summary: "Keduanya memberi contoh rancangan awal.",
            commonThemes: ["Prototipe"], differences: [], openQuestions: ["Perlu validasi pengguna."],
          };
          return new Response(JSON.stringify({ message: { content: JSON.stringify(result), role: "assistant" } }), { status: 200 });
        }
        return new Response("not found", { status: 404 });
      },
    });
    const app = createApp({ db, ollama });
    const catalog = (await request(app).get("/api/catalog")).body.items as { id: number; title: string }[];
    const [selectedReference, otherReference] = catalog;
    if (!selectedReference || !otherReference) throw new Error("Katalog demonstrasi belum lengkap.");
    const student = request.agent(app);
    const csrf = await register(student);
    const result = await student.post("/api/ai/summarize").set("x-csrf-token", csrf).send({ referenceIds: [selectedReference.id] });

    expect(result.status).toBe(200);
    expect(sentPrompts[0]).toContain(selectedReference.title);
    expect(sentPrompts[0]).not.toContain(otherReference.title);
    expect(result.body.references[0].title).toBe(selectedReference.title);
    expect(result.body.notice).toContain("Draf");

    const ideaDraft = await student.post("/api/ai/draft-idea").set("x-csrf-token", csrf)
      .send({ worksheet: worksheet(), referenceIds: [selectedReference.id] });
    expect(ideaDraft.status).toBe(200);
    expect(ideaDraft.body.draft.title).toBe("Draf kajian layanan kampus");
    expect(ideaDraft.body.references[0].title).toBe(selectedReference.title);
    expect(sentPrompts[1]).not.toContain(otherReference.title);
  });

  it("menangani respons AI yang tidak valid sebagai galat terkelola", async () => {
    const db = database();
    const model = "gemma4:e2b-it-q4_K_M";
    const ollama = new OllamaClient({
      baseUrl: "http://localhost:11434",
      model,
      fetcher: async (input) => String(input).endsWith("/api/tags")
        ? new Response(JSON.stringify({ models: [{ name: model }] }), { status: 200 })
        : new Response(JSON.stringify({ message: { content: "jawaban bukan JSON" } }), { status: 200 }),
    });
    const app = createApp({ db, ollama });
    const student = request.agent(app);
    const csrf = await register(student);
    const response = await student.post("/api/ai/search-suggestions").set("x-csrf-token", csrf)
      .send({ question: "Bagaimana mencari topik aksesibilitas web?" });
    expect(response.status).toBe(502);
    expect(response.body.error).toContain("tidak sesuai format");
  });
});
