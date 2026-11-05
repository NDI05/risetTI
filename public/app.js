const state = {
  user: null,
  csrfToken: null,
  view: "catalog",
  references: [],
  shortlist: [],
  ideas: [],
  catalogTotal: 0,
  catalogResultTotal: 0,
  selectedRefs: new Set(),
  activeIdeaId: null,
  intakeTitle: "",
  intakeQuestions: [],
  generatedDraft: null,
  draftReferences: [],
  sectionReferenceIds: {},
  resultEditing: false,
  generatingQuestions: false,
  generatingDraft: false,
  editingReferenceId: null,
  authMode: "login",
  pendingView: null,
  pendingAiQuestion: "",
  aiAvailable: false,
  toastTimer: null,
};

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[char]);
}

function showToast(message, isError = false) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.toggle("error", isError);
  toast.classList.add("show");
  clearTimeout(state.toastTimer);
  state.toastTimer = setTimeout(() => toast.classList.remove("show"), 3500);
}

async function api(path, options = {}) {
  const method = options.method ?? "GET";
  const headers = { ...(options.body === undefined ? {} : { "Content-Type": "application/json" }), ...(options.headers ?? {}) };
  if (["POST", "PUT", "PATCH", "DELETE"].includes(method) && state.csrfToken) headers["X-CSRF-Token"] = state.csrfToken;
  const response = await fetch(path, {
    method,
    headers,
    credentials: "same-origin",
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  if (response.status === 204) return null;
  let result;
  try { result = await response.json(); } catch { result = {}; }
  if (!response.ok) throw new Error(result.error || "Permintaan belum berhasil. Coba lagi.");
  return result;
}

function setBusy(button, busy, label) {
  if (!button) return;
  if (busy) {
    button.dataset.previousLabel = button.textContent;
    button.disabled = true;
    if (label) button.textContent = label;
  } else {
    button.disabled = false;
    if (button.dataset.previousLabel) button.textContent = button.dataset.previousLabel;
    delete button.dataset.previousLabel;
  }
}

function setAiStatus(status) {
  const pill = $("#ai-status");
  state.aiAvailable = Boolean(status.available);
  pill.classList.toggle("ready", state.aiAvailable);
  pill.classList.toggle("offline", !status.connected);
  pill.title = status.message;
  pill.querySelector("span:last-child").textContent = state.aiAvailable
    ? "AI lokal siap" : status.connected ? "Model lokal belum tersedia" : "AI lokal tidak tersedia";
  $("#hero-ai-status").textContent = state.aiAvailable ? "Siap digunakan" : status.connected ? "Model belum tersedia" : "Tidak terhubung";
  $("#hero-ai-copy").textContent = state.aiAvailable ? "Pencarian dibantu AI di komputer Anda." : "Pencarian katalog tetap tersedia saat AI offline.";
  const inline = $("#ai-inline-status");
  inline.textContent = status.message;
  inline.classList.toggle("available", state.aiAvailable);
  inline.classList.toggle("unavailable", !state.aiAvailable);
  $$('[data-needs-ai]').forEach((button) => { button.disabled = !state.aiAvailable; });
  $("#summarize-button").disabled = !state.aiAvailable || state.selectedRefs.size === 0;
  updateIntakeControls();
}

async function loadAiStatus() {
  try { setAiStatus(await api("/api/ai/status")); }
  catch { setAiStatus({ available: false, connected: false, message: "Status Ollama belum dapat dibaca." }); }
}

async function loadSession() {
  try {
    const session = await api("/api/session");
    state.user = session.user;
    state.csrfToken = session.csrfToken;
  } catch {
    state.user = null;
    state.csrfToken = null;
  }
  renderAccount();
  updateAdminNav();
}

function renderAccount() {
  const account = $("#account-actions");
  if (!state.user) {
    account.innerHTML = '<button class="button button-quiet" data-auth="login">Masuk</button><button class="button button-primary" data-auth="register">Buat akun</button>';
    return;
  }
  const roleText = state.user.role === "admin" ? "Admin katalog" : "Mahasiswa";
  account.innerHTML = `<span class="account-name" title="${escapeHtml(state.user.name)} · ${roleText}">${escapeHtml(state.user.name)}</span><button class="button button-quiet" id="logout-button">Keluar</button>`;
}

function updateAdminNav() {
  $("#admin-nav").classList.toggle("hidden", state.user?.role !== "admin");
}

function setView(view) {
  if (["shortlist", "ideas", "admin"].includes(view) && !state.user) {
    state.pendingView = view;
    openAuth("login");
    showToast("Masuk atau buat akun mahasiswa untuk membuka ruang pribadi.");
    return;
  }
  if (view === "admin" && state.user?.role !== "admin") {
    showToast("Fitur ini hanya tersedia untuk admin katalog.", true);
    return;
  }
  state.view = view;
  $$(".view").forEach((section) => section.classList.toggle("hidden", section.id !== `${view}-view`));
  $$(".nav-link").forEach((button) => button.classList.toggle("active", button.dataset.view === view));
  if (view === "shortlist") loadShortlist();
  if (view === "ideas") loadIdeas();
  if (view === "admin") loadAdminReferences();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function openAuth(mode = "login") {
  setAuthMode(mode);
  const dialog = $("#auth-dialog");
  if (!dialog.open) dialog.showModal();
}

function setAuthMode(mode) {
  state.authMode = mode;
  const register = mode === "register";
  const dialog = $("#auth-dialog");
  dialog.classList.toggle("register-mode", register);
  $("#auth-name-label").classList.toggle("hidden", !register);
  $("#auth-name-label input").required = register;
  $("#auth-title").textContent = register ? "Buat akun mahasiswa" : "Masuk ke RisetTI";
  $("#auth-description").textContent = register
    ? "Akun mahasiswa menyimpan shortlist dan lembar ide Anda."
    : "Simpan referensi dan lembar ide di ruang pribadi Anda.";
  $("#auth-submit").textContent = register ? "Buat akun" : "Masuk";
  $("#auth-switch-text").textContent = register ? "Sudah punya akun?" : "Belum punya akun?";
  $("#toggle-auth-mode").textContent = register ? "Masuk ke akun" : "Buat akun mahasiswa";
  $("#auth-form [name=password]").setAttribute("autocomplete", register ? "new-password" : "current-password");
  $("#auth-password-help").classList.toggle("hidden", !register);
  $("#auth-error").classList.add("hidden");
}

async function loadCatalog(filters = {}, append = false) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) if (value) params.set(key, value);
  const offset = append ? state.references.length : 0;
  if (offset) params.set("offset", String(offset));
  const results = $("#catalog-results");
  const moreButton = $("#catalog-load-more");
  if (append) { moreButton.disabled = true; moreButton.textContent = "Memuat…"; }
  else results.innerHTML = '<p class="loading">Memuat referensi…</p>';
  try {
    const response = await api(`/api/catalog${params.size ? `?${params}` : ""}`);
    state.references = append ? [...state.references, ...response.items] : response.items;
    state.catalogResultTotal = response.total;
    if (!Object.values(filters).some(Boolean)) $("#hero-catalog-total").textContent = String(state.catalogTotal || response.total);
    renderCatalog();
  } catch (error) { if (append) showToast(error.message, true); else results.innerHTML = `<p class="loading">${escapeHtml(error.message)}</p>`; }
  finally { moreButton.disabled = false; moreButton.textContent = "Muat lebih banyak"; }
}

function tagMarkup(reference) {
  const tags = [reference.domain && `<span class="tag domain-tag">${escapeHtml(reference.domain)}</span>`,
    ...(reference.methods ?? []).slice(0, 2).map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`),
    ...(reference.technologies ?? []).slice(0, 2).map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`)];
  return tags.filter(Boolean).join("");
}

function referenceCard(reference, mode = "catalog") {
  const demo = reference.isDemo ? '<span class="demo-badge">CONTOH DEMO</span>' : "";
  const source = `<span class="source-mini" title="${escapeHtml(reference.sourceName || "Sumber tidak tersedia")}">${escapeHtml(reference.sourceName || "Sumber tidak tersedia")}</span>`;
  const sourceLink = reference.sourceUrl
    ? `<a class="text-button" href="${escapeHtml(reference.sourceUrl)}" target="_blank" rel="noopener noreferrer">Sumber ↗</a>` : "";
  const actions = mode === "shortlist"
    ? `<label class="selection-checkbox"><input type="checkbox" data-select-ref="${reference.id}" ${state.selectedRefs.has(reference.id) ? "checked" : ""} /> Bandingkan</label><button class="text-button danger" data-remove-ref="${reference.id}">Hapus</button>`
    : `<button class="text-button" data-add-ref="${reference.id}">＋ Simpan</button>`;
  return `<article class="reference-card ${mode === "shortlist" ? "shortlist-card" : ""}">
    <div class="reference-card-art" aria-hidden="true"><span>RISETTI · REFERENSI</span><strong>${String(reference.year).slice(-2)}</strong><i></i><b></b></div>
    <div class="reference-card-top"><span class="ref-year">${reference.year} · ${escapeHtml(reference.institution)}${reference.license ? ` · ${escapeHtml(reference.license.toUpperCase())}` : ""}</span>${demo}</div>
    <h3>${escapeHtml(reference.title)}</h3><p class="ref-byline">${escapeHtml(reference.authors)}</p>
    <p class="ref-summary">${escapeHtml(reference.summary)}</p><div class="tag-row">${tagMarkup(reference)}</div>
    <div class="reference-card-footer"><div>${source}</div><div class="card-actions"><button class="text-button" data-detail-ref="${reference.id}">Lihat detail</button>${sourceLink}${actions}</div></div>
  </article>`;
}

function renderCatalog() {
  $("#catalog-results").innerHTML = state.references.map((ref) => referenceCard(ref)).join("");
  const count = state.references.length;
  $("#catalog-count").textContent = count < state.catalogResultTotal
    ? `Menampilkan ${count} dari ${state.catalogResultTotal} referensi yang cocok`
    : `${state.catalogResultTotal} ${state.catalogResultTotal === 1 ? "referensi ditemukan" : "referensi ditemukan"}`;
  $("#catalog-load-more").classList.toggle("hidden", count >= state.catalogResultTotal || count === 0);
  $("#catalog-empty").classList.toggle("hidden", count > 0);
  $("#catalog-results").classList.toggle("hidden", count === 0);
}

function fillOptions(select, values, allLabel) {
  const current = select.value;
  select.innerHTML = `<option value="">${escapeHtml(allLabel)}</option>${values.map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`).join("")}`;
  if (values.includes(current)) select.value = current;
}

async function loadCatalogMeta() {
  try {
    const tags = await api("/api/catalog/meta");
    state.catalogTotal = tags.total ?? 0;
    $("#hero-catalog-total").textContent = String(state.catalogTotal);
    fillOptions($("#filter-domain"), tags.domains, "Semua bidang");
    fillOptions($("#filter-method"), tags.methods, "Semua metode");
    fillOptions($("#filter-technology"), tags.technologies, "Semua teknologi");
  } catch { /* Katalog tetap dapat dicari jika filter tambahan gagal dimuat. */ }
}

function currentFilters() {
  return {
    q: $("#filter-query").value.trim(),
    domain: $("#filter-domain").value,
    method: $("#filter-method").value,
    technology: $("#filter-technology").value,
  };
}

async function loadShortlist() {
  try {
    const response = await api("/api/shortlist");
    state.shortlist = response.items;
    renderShortlist();
  } catch (error) { showToast(error.message, true); }
}

function renderShortlist() {
  const count = state.shortlist.length;
  $("#shortlist-count").textContent = count;
  $("#shortlist-count").classList.toggle("hidden", count === 0);
  $("#shortlist-results").innerHTML = state.shortlist.map((ref) => referenceCard(ref, "shortlist")).join("");
  $("#shortlist-empty").classList.toggle("hidden", count > 0);
  $("#shortlist-results").classList.toggle("hidden", count === 0);
  updateSelectedCount();
}

function updateSelectedCount() {
  const count = state.selectedRefs.size;
  $("#selection-count").textContent = `${count} referensi dipilih`;
  $("#summarize-button").disabled = !state.aiAvailable || count === 0;
}

function summaryMarkup(result) {
  const references = result.references.map((ref) => ref.sourceUrl
    ? `<a href="${escapeHtml(ref.sourceUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(ref.title)} ↗</a>`
    : `<span class="source-mini">${escapeHtml(ref.title)} · data demonstrasi tanpa sumber publik</span>`).join("");
  const section = (title, items) => items.length ? `<h4>${escapeHtml(title)}</h4><ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>` : "";
  return `<h3>Ringkasan awal <span class="draft-badge">DRAF AI</span></h3><p>${escapeHtml(result.draft.summary)}</p>
    ${section("Tema yang muncul", result.draft.commonThemes)}${section("Perbedaan yang terlihat", result.draft.differences)}${section("Pertanyaan untuk divalidasi", result.draft.openQuestions)}
    <h4>Referensi katalog yang digunakan</h4><div class="ai-reference-list">${references}</div><p class="ai-notice">${escapeHtml(result.notice)}</p>`;
}

async function runSummary() {
  if (!state.aiAvailable) return showToast("Bantuan AI lokal belum tersedia. Anda tetap dapat membaca dan membandingkan referensi secara manual.", true);
  const ids = [...state.selectedRefs].slice(0, 8);
  if (!ids.length) return;
  const button = $("#summarize-button");
  const output = $("#summary-result");
  setBusy(button, true, "Menyusun ringkasan…");
  try {
    const result = await api("/api/ai/summarize", { method: "POST", body: { referenceIds: ids } });
    output.innerHTML = summaryMarkup(result);
    output.classList.remove("hidden");
    output.scrollIntoView({ behavior: "smooth", block: "center" });
  } catch (error) { showToast(error.message, true); }
  finally { setBusy(button, false); updateSelectedCount(); }
}

async function runKeywordSuggestions() {
  const question = $("#ai-question").value.trim();
  if (!question) return showToast("Tulis pertanyaan awal terlebih dahulu.", true);
  if (!state.user) {
    state.pendingAiQuestion = question;
    openAuth("login");
    return showToast("Masuk atau buat akun untuk meminta bantuan AI lokal.");
  }
  if (!state.aiAvailable) return showToast("Ollama atau model Gemma lokal belum siap. Anda tetap dapat memakai filter katalog secara manual.", true);
  const button = $("#ai-search-submit");
  setBusy(button, true, "Menyiapkan…");
  try {
    const result = await api("/api/ai/search-suggestions", { method: "POST", body: { question } });
    const holder = $("#keyword-suggestions");
    holder.innerHTML = result.keywords.map((word) => `<button class="suggestion-chip" type="button" data-keyword="${escapeHtml(word)}">${escapeHtml(word)} <span aria-hidden="true">↗</span></button>`).join("");
    holder.classList.remove("hidden");
  } catch (error) { showToast(error.message, true); }
  finally { setBusy(button, false); }
}

async function loadIdeas() {
  try {
    const response = await api("/api/ideas");
    state.ideas = response.items;
    renderIdeaPicker();
    if (state.activeIdeaId && state.ideas.some((idea) => idea.id === state.activeIdeaId)) {
      const idea = state.ideas.find((item) => item.id === state.activeIdeaId);
      if (idea) showIdea(idea);
    } else if (state.ideas.length && !state.activeIdeaId) {
      showIdea(state.ideas[0]);
    } else if (!state.ideas.length) {
      resetIdeaForm();
    }
  } catch (error) { showToast(error.message, true); }
}

function renderIdeaPicker() {
  const picker = $("#idea-picker");
  picker.innerHTML = `<option value="">${state.ideas.length ? "Ide baru" : "Belum ada draf tersimpan"}</option>${state.ideas.map((idea) => `<option value="${idea.id}">${escapeHtml(idea.title)}</option>`).join("")}`;
  picker.value = state.activeIdeaId ? String(state.activeIdeaId) : "";
  $("#delete-idea").classList.toggle("hidden", !state.activeIdeaId);
}

function showIdea(idea) {
  state.activeIdeaId = idea.id;
  state.intakeTitle = idea.title;
  $("#intake-title").value = idea.title;
  state.intakeQuestions = [];
  state.generatedDraft = Object.fromEntries(["title", "problem", "context", "dataSources", "method", "technologies", "technicalNeeds", "timeResources", "risksValidation"]
    .map((key) => [key, idea[key] ?? ""]));
  state.draftReferences = idea.references ?? [];
  state.sectionReferenceIds = idea.sectionReferenceIds ?? {};
  state.resultEditing = false;
  $("#save-status").textContent = `Disunting ${new Date(idea.updatedAt).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}`;
  renderIdeaPicker();
  renderIntakeQuestions();
  renderIdeaResult();
}

function resetIdeaForm() {
  state.activeIdeaId = null;
  state.intakeTitle = "";
  state.intakeQuestions = [];
  state.generatedDraft = null;
  state.draftReferences = [];
  state.sectionReferenceIds = {};
  state.resultEditing = false;
  $("#intake-title").value = "";
  $("#idea-intake-stage").classList.remove("hidden");
  $("#idea-result-stage").classList.add("hidden");
  $("#idea-stage-title").textContent = "Mulai dari ide kasar";
  $("#idea-picker").value = "";
  $("#delete-idea").classList.add("hidden");
  $("#save-status").textContent = "Belum disimpan";
  renderIntakeQuestions();
}

function syncIntakeQuestions() {
  for (const question of state.intakeQuestions) {
    const prompt = $(`[data-intake-prompt="${question.id}"]`);
    const answer = $(`[data-intake-answer="${question.id}"]`);
    if (prompt) question.question = prompt.value.trim();
    if (answer) question.answer = answer.value.trim();
  }
}

function updateIntakeControls() {
  const count = state.intakeQuestions.length;
  const hasTitle = Boolean($("#intake-title")?.value.trim());
  const canAdd = count < 8;
  const aiButton = $("#intake-ai-questions");
  const addButton = $("#add-intake-question");
  const generateButton = $("#generate-idea-button");
  if (!aiButton || !addButton || !generateButton) return;
  aiButton.disabled = state.generatingQuestions || !state.aiAvailable || !hasTitle || !canAdd;
  aiButton.querySelector("span").textContent = state.generatingQuestions ? "Mencari pertanyaan…" : count ? "Tambah pertanyaan dari AI" : "Buat pertanyaan panduan";
  addButton.disabled = !canAdd;
  const answered = state.intakeQuestions.some((question) => question.question.trim() && question.answer.trim());
  generateButton.disabled = state.generatingDraft || !state.aiAvailable || count === 0 || !answered;
  $("#intake-question-count").textContent = `${count} pertanyaan${count === 8 ? " · batas 8" : ""}`;
  $("#intake-hint").textContent = !hasTitle
    ? "Isi ide awal, lalu buat pertanyaan yang lebih sesuai."
    : count === 0
      ? "Buat pertanyaan panduan atau tambahkan pertanyaan sendiri."
      : answered
        ? "Anda cukup menjawab hal yang sudah diketahui."
        : "Isi setidaknya satu jawaban agar hasilnya tidak terlalu umum.";
}

function renderIntakeQuestions() {
  const list = $("#intake-question-list");
  if (!list) return;
  list.innerHTML = state.intakeQuestions.length ? state.intakeQuestions.map((question, index) => `<article class="intake-question">
    <div class="intake-question-heading"><span>Pertanyaan ${index + 1}</span><button class="text-button danger" type="button" data-remove-intake-question="${escapeHtml(question.id)}" aria-label="Hapus pertanyaan ${index + 1}">Hapus</button></div>
    ${question.custom
      ? `<label class="custom-question-field"><span>Pertanyaan Anda</span><input maxlength="400" data-intake-prompt="${escapeHtml(question.id)}" value="${escapeHtml(question.question)}" placeholder="Apa yang ingin Anda ketahui?" /></label>`
      : `<p class="intake-question-prompt">${escapeHtml(question.question)}</p>`}
    <label class="intake-answer-field"><span>Jawaban Anda <small>· boleh dilewati</small></span><textarea maxlength="1500" rows="2" data-intake-answer="${escapeHtml(question.id)}" placeholder="Tulis yang sudah Anda ketahui…">${escapeHtml(question.answer)}</textarea></label>
    </article>`).join("") : '<p class="intake-empty">Pertanyaan akan muncul di sini setelah Anda menulis ide awal.</p>';
  updateIntakeControls();
}

function addIntakeQuestion(question = "", custom = true) {
  syncIntakeQuestions();
  if (state.intakeQuestions.length >= 8) return showToast("Pertanyaan dibatasi hingga 8 agar proses tetap ringkas.", true);
  const added = { id: crypto.randomUUID(), question, answer: "", custom };
  state.intakeQuestions.push(added);
  renderIntakeQuestions();
  if (custom) $(`[data-intake-prompt="${added.id}"]`)?.focus();
}

async function runIntakeQuestionGeneration() {
  if (!state.aiAvailable) return showToast("Bantuan AI lokal belum tersedia. Anda tetap dapat menambah pertanyaan sendiri.", true);
  syncIntakeQuestions();
  const title = $("#intake-title").value.trim();
  if (!title) return $("#intake-title").focus();
  state.generatingQuestions = true;
  updateIntakeControls();
  try {
    const existingQuestions = state.intakeQuestions.map((question) => question.question.trim()).filter(Boolean);
    const response = await api("/api/ai/intake-questions", {
      method: "POST", body: { title, existingQuestions },
    });
    const known = new Set(existingQuestions.map((question) => question.toLocaleLowerCase("id-ID")));
    const available = 8 - state.intakeQuestions.length;
    const newQuestions = response.questions.filter((question) => !known.has(question.toLocaleLowerCase("id-ID"))).slice(0, available);
    if (!newQuestions.length) return showToast("Tidak ada pertanyaan baru yang berbeda. Tambahkan sendiri atau lanjutkan dengan jawaban yang ada.");
    state.intakeQuestions.push(...newQuestions.map((question) => ({ id: crypto.randomUUID(), question, answer: "", custom: false })));
    renderIntakeQuestions();
    showToast(`${newQuestions.length} pertanyaan panduan ditambahkan.`);
  } catch (error) { showToast(error.message, true); }
  finally { state.generatingQuestions = false; updateIntakeControls(); }
}

const RESULT_FIELDS = [
  ["problem", "Masalah yang ingin dibahas"],
  ["context", "Konteks dan calon pengguna"],
  ["dataSources", "Data atau sumber yang diperlukan"],
  ["method", "Pendekatan awal"],
  ["technologies", "Teknologi yang mungkin relevan"],
  ["technicalNeeds", "Kebutuhan teknis dan akses"],
  ["timeResources", "Perkiraan waktu dan sumber daya"],
  ["risksValidation", "Risiko dan hal yang perlu divalidasi"],
];

function citationMarkup(sectionKey) {
  const ids = state.sectionReferenceIds[sectionKey] ?? [];
  const references = state.draftReferences.filter((ref) => ids.includes(ref.id));
  if (!references.length) return '<div class="section-citations missing-citation"><span>RUJUKAN</span><p>Belum ditemukan sumber katalog yang cukup cocok untuk bagian ini.</p></div>';
  return `<div class="section-citations"><span>RUJUKAN TERKAIT</span>${references.map((ref) => `<a href="${escapeHtml(ref.sourceUrl)}" target="_blank" rel="noopener noreferrer"><strong>${escapeHtml(ref.title)}</strong><small>${escapeHtml(ref.authors)} · ${ref.year} · ${escapeHtml(ref.sourceName)}${ref.license ? ` · ${escapeHtml(ref.license.toUpperCase())}` : ""} ↗</small></a>`).join("")}</div>`;
}

function resultFieldMarkup([key, label]) {
  const value = state.generatedDraft[key] ?? "";
  return `<section class="result-section"><h3>${escapeHtml(label)}</h3>${state.resultEditing
    ? `<textarea data-result-field="${key}" maxlength="3000" rows="3" aria-label="${escapeHtml(label)}">${escapeHtml(value)}</textarea>`
    : `<p>${value ? escapeHtml(value).replace(/\n/g, "<br>") : '<span class="result-missing">Belum dirinci. Tambahkan saat menyunting rancangan.</span>'}</p>`}${citationMarkup(key)}</section>`;
}

function renderIdeaResult() {
  if (!state.generatedDraft) return;
  const answered = state.intakeQuestions.filter((question) => question.question.trim() && question.answer.trim());
  const output = $("#idea-result-stage");
  output.innerHTML = `<div class="result-topline"><span class="draft-badge">DRAF AI · PERIKSA SEBELUM DIGUNAKAN</span><span>Rancangan awal</span></div>
    ${state.resultEditing
      ? `<label class="result-title-editor"><span>Judul rancangan</span><input data-result-field="title" maxlength="120" value="${escapeHtml(state.generatedDraft.title)}" /></label>`
      : `<h2 class="result-title">${escapeHtml(state.generatedDraft.title)}</h2>`}
    ${answered.length ? `<section class="result-intake"><h3>Yang Anda ceritakan</h3><dl>${answered.map((question) => `<div><dt>${escapeHtml(question.question)}</dt><dd>${escapeHtml(question.answer)}</dd></div>`).join("")}</dl></section>` : ""}
    <div class="result-sections">${RESULT_FIELDS.map(resultFieldMarkup).join("")}</div>
    <section class="result-references"><h3>Penelusuran otomatis</h3><p>${state.draftReferences.length ? `${state.draftReferences.length} sumber ditemukan dari ide dan jawaban Anda. Setiap bagian hanya menampilkan sumber yang ditandai AI sebagai relevan; periksa abstrak dan artikel aslinya.` : "Belum ada rujukan yang cukup cocok di katalog. Bagian hasil ditandai tanpa dukungan literatur."}</p></section>
    <p class="result-disclaimer">${state.resultEditing ? "Perubahan diterapkan pada rancangan yang sedang ditinjau." : "Ini draf awal, bukan penilaian kelayakan. Periksa fakta, akses, metode, dan persetujuan dengan pembimbing atau pihak terkait."}</p>
    <div class="result-actions">${state.resultEditing
      ? '<button class="button button-quiet" type="button" id="cancel-result-edit">Batal</button><button class="button button-primary" type="button" id="apply-result-edit">Terapkan perubahan</button>'
      : '<button class="button button-secondary" type="button" id="back-to-intake">Ubah jawaban</button><button class="button button-quiet" type="button" id="edit-result">Sunting hasil</button><button class="button button-primary" type="button" id="save-idea-button">Simpan rancangan</button>'}</div>`;
  $("#idea-intake-stage").classList.add("hidden");
  output.classList.remove("hidden");
  $("#idea-stage-title").textContent = "Rancangan awal";
}

async function runIdeaDraft() {
  if (!state.aiAvailable) return showToast("Bantuan AI lokal belum tersedia. Anda tetap dapat merapikan gagasan secara manual.", true);
  syncIntakeQuestions();
  const title = $("#intake-title").value.trim();
  if (!title) { $("#intake-title").focus(); return showToast("Tulis ide awal terlebih dahulu.", true); }
  const answers = state.intakeQuestions.filter((question) => question.question.trim()).map(({ question, answer }) => ({ question, answer }));
  if (!answers.length) return showToast("Buat atau tambahkan setidaknya satu pertanyaan panduan.", true);
  if (!answers.some((answer) => answer.answer.trim())) return showToast("Jawab setidaknya satu pertanyaan agar hasilnya tidak terlalu umum.", true);
  const button = $("#generate-idea-button");
  state.generatingDraft = true;
  setBusy(button, true, "Menyusun rancangan…");
  try {
    const response = await api("/api/ai/draft-idea", {
      method: "POST", body: { title, answers },
    });
    state.intakeTitle = title;
    state.generatedDraft = response.draft;
    state.draftReferences = response.references;
    state.sectionReferenceIds = response.sectionReferenceIds;
    state.resultEditing = false;
    renderIdeaResult();
    $("#idea-result-stage").scrollIntoView({ behavior: "smooth", block: "start" });
    showToast("Rancangan siap ditinjau. Sunting bagian yang perlu diperbaiki sebelum menyimpan.");
  } catch (error) { showToast(error.message, true); }
  finally { state.generatingDraft = false; setBusy(button, false); updateIntakeControls(); }
}

function applyResultEdits() {
  for (const key of ["title", ...RESULT_FIELDS.map(([field]) => field)]) {
    const input = $(`[data-result-field="${key}"]`);
    if (input) {
      if (state.generatedDraft[key] !== input.value.trim()) state.sectionReferenceIds[key] = [];
      state.generatedDraft[key] = input.value.trim();
    }
  }
  if (!state.generatedDraft.title) return showToast("Judul rancangan tidak boleh kosong.", true);
  state.resultEditing = false;
  renderIdeaResult();
}

async function saveIdea() {
  if (!state.generatedDraft) return;
  if (state.resultEditing) return showToast("Terapkan atau batalkan suntingan sebelum menyimpan.", true);
  const button = $("#save-idea-button");
  setBusy(button, true, "Menyimpan…");
  try {
    const payload = { ...state.generatedDraft, referenceIds: state.draftReferences.map((ref) => ref.id), sectionReferenceIds: state.sectionReferenceIds };
    const saved = await api(state.activeIdeaId ? `/api/ideas/${state.activeIdeaId}` : "/api/ideas", {
      method: state.activeIdeaId ? "PUT" : "POST", body: payload,
    });
    state.activeIdeaId = saved.id;
    state.ideas = [saved, ...state.ideas.filter((idea) => idea.id !== saved.id)];
    renderIdeaPicker();
    $("#save-status").textContent = "Tersimpan sekarang";
    showToast("Rancangan tersimpan di akun Anda.");
  } catch (error) { showToast(error.message, true); }
  finally { setBusy(button, false); }
}

async function loadAdminReferences() {
  try {
    const response = await api("/api/admin/references");
    const items = response.items;
    $("#admin-ref-count").textContent = `${items.length} item`;
    const list = $("#admin-reference-list");
    list.innerHTML = items.length ? items.map((ref) => `<div class="admin-ref-row ${ref.archivedAt ? "archived" : ""}">
      <div class="admin-ref-copy"><strong>${escapeHtml(ref.title)}</strong><span>${ref.year} · ${escapeHtml(ref.institution)}${ref.archivedAt ? " · Diarsipkan" : ""}${ref.isDemo ? " · Data demo" : ""}</span></div>
      <div class="admin-row-actions">${ref.archivedAt ? "" : `<button class="text-button" data-edit-reference="${ref.id}">Sunting</button><button class="text-button danger" data-archive-reference="${ref.id}">Arsipkan</button>`}</div>
      </div>`).join("") : '<p class="admin-empty">Belum ada referensi di katalog.</p>';
  } catch (error) { showToast(error.message, true); }
}

function referenceFormData() {
  const form = $("#reference-form");
  const value = (name) => form.elements.namedItem(name).value.trim();
  const isDemo = form.elements.namedItem("isDemo").checked;
  return {
    title: value("title"), authors: value("authors"), year: Number(value("year")), institution: value("institution"),
    sourceName: value("sourceName") || (isDemo ? "Tidak ada — data demonstrasi" : ""),
    sourceUrl: value("sourceUrl"), domain: value("domain"), summary: value("summary"), isDemo,
    methods: value("methods").split(",").map((item) => item.trim()).filter(Boolean),
    technologies: value("technologies").split(",").map((item) => item.trim()).filter(Boolean),
  };
}

function clearReferenceForm() {
  state.editingReferenceId = null;
  $("#reference-form").reset();
  $("#reference-form [name=year]").value = String(new Date().getFullYear());
  $("#admin-form-title").textContent = "Tambah referensi";
  $("#admin-save").textContent = "Simpan referensi";
  $("#cancel-edit").classList.add("hidden");
}

async function editReference(id) {
  try {
    const ref = await api(`/api/catalog/${id}`);
    state.editingReferenceId = id;
    const form = $("#reference-form");
    for (const field of ["title", "authors", "year", "institution", "sourceName", "sourceUrl", "domain", "summary"]) form.elements.namedItem(field).value = ref[field] ?? "";
    form.elements.namedItem("methods").value = ref.methods.join(", ");
    form.elements.namedItem("technologies").value = ref.technologies.join(", ");
    form.elements.namedItem("isDemo").checked = ref.isDemo;
    $("#admin-form-title").textContent = "Sunting referensi";
    $("#admin-save").textContent = "Simpan perubahan";
    $("#cancel-edit").classList.remove("hidden");
    form.scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (error) { showToast(error.message, true); }
}

async function archiveReference(id) {
  if (!window.confirm("Arsipkan referensi ini? Referensi tidak akan tampil pada katalog mahasiswa.")) return;
  try {
    await api(`/api/admin/references/${id}/archive`, { method: "POST", body: {} });
    if (state.editingReferenceId === id) clearReferenceForm();
    await Promise.all([loadAdminReferences(), loadCatalogMeta(), loadCatalog(currentFilters())]);
    showToast("Referensi diarsipkan dari katalog.");
  } catch (error) { showToast(error.message, true); }
}

function renderReferenceDetail(reference) {
  const source = reference.sourceUrl
    ? `<a href="${escapeHtml(reference.sourceUrl)}" target="_blank" rel="noopener noreferrer">Buka sumber asli ↗</a>`
    : "";
  return `<div class="detail-card"><button class="dialog-close" type="button" data-close-detail aria-label="Tutup">×</button>
    <p class="eyebrow">DETAIL REFERENSI ${reference.isDemo ? "· <span class=\"demo-badge\">CONTOH DEMO</span>" : ""}</p>
    <h2>${escapeHtml(reference.title)}</h2><p class="detail-meta">${escapeHtml(reference.authors)} · ${reference.year} · ${escapeHtml(reference.institution)}</p>
    <div class="tag-row">${tagMarkup(reference)}</div><h3>Ringkasan katalog</h3><p>${escapeHtml(reference.summary)}</p>
    <div class="detail-source"><span>${escapeHtml(reference.sourceName || "Sumber tidak tersedia")}${reference.license ? ` · Lisensi ${escapeHtml(reference.license.toUpperCase())}` : ""}${reference.doi ? ` · DOI ${escapeHtml(reference.doi.replace(/^https?:\/\/doi\.org\//u, ""))}` : ""}</span>${source}</div>
    ${reference.isDemo ? '<div class="detail-demo-warning">Data ini dibuat hanya untuk demonstrasi aplikasi. Data contoh ini bukan penelitian nyata dan tidak dapat dijadikan sumber akademik.</div>' : ""}
    <div class="worksheet-actions"><button class="button button-primary" type="button" data-add-ref="${reference.id}">＋ Simpan ke shortlist</button></div>
    </div>`;
}

async function openReferenceDetail(id) {
  try {
    const ref = await api(`/api/catalog/${id}`);
    $("#reference-detail").innerHTML = renderReferenceDetail(ref);
    $("#reference-dialog").showModal();
  } catch (error) { showToast(error.message, true); }
}

function authChanged(result) {
  state.user = result.user;
  state.csrfToken = result.csrfToken;
  state.activeIdeaId = null;
  state.selectedRefs = new Set();
  renderAccount();
  updateAdminNav();
  $("#auth-dialog").close();
  showToast(`Selamat datang, ${state.user.name}.`);
}

function bindEvents() {
  document.addEventListener("click", async (event) => {
    const target = event.target.closest("button, [data-view], [data-detail-ref]");
    if (!target) return;
    if (target.dataset.view) return setView(target.dataset.view);
    if (target.dataset.auth) return openAuth(target.dataset.auth);
    if (target.id === "catalog-load-more") return loadCatalog(currentFilters(), true);
    if (target.id === "logout-button") {
      try { await api("/api/auth/logout", { method: "POST", body: {} }); }
      catch (error) { showToast(error.message, true); return; }
      state.user = null; state.csrfToken = null; state.shortlist = []; state.ideas = []; state.selectedRefs = new Set(); state.activeIdeaId = null;
      $("#summary-result").classList.add("hidden");
      renderAccount(); updateAdminNav(); setView("catalog"); renderShortlist();
      return showToast("Anda telah keluar.");
    }
    if (target.id === "toggle-auth-mode") return setAuthMode(state.authMode === "login" ? "register" : "login");
    if (target.id === "close-auth") return $("#auth-dialog").close();
    if (target.id === "new-idea") { resetIdeaForm(); return; }
    if (target.id === "intake-ai-questions") return runIntakeQuestionGeneration();
    if (target.id === "add-intake-question") return addIntakeQuestion();
    if (target.dataset.removeIntakeQuestion) {
      syncIntakeQuestions();
      state.intakeQuestions = state.intakeQuestions.filter((question) => question.id !== target.dataset.removeIntakeQuestion);
      renderIntakeQuestions();
      return;
    }
    if (target.id === "generate-idea-button") return runIdeaDraft();
    if (target.id === "edit-result") { state.resultEditing = true; renderIdeaResult(); return; }
    if (target.id === "cancel-result-edit") { state.resultEditing = false; renderIdeaResult(); return; }
    if (target.id === "apply-result-edit") return applyResultEdits();
    if (target.id === "back-to-intake") {
      syncIntakeQuestions();
      $("#intake-title").value = state.intakeTitle;
      $("#idea-result-stage").classList.add("hidden");
      $("#idea-intake-stage").classList.remove("hidden");
      $("#idea-stage-title").textContent = "Lanjutkan pertanyaan";
      updateIntakeControls();
      $("#intake-title").focus();
      return;
    }
    if (target.id === "save-idea-button") return saveIdea();
    if (target.id === "delete-idea") {
      if (!state.activeIdeaId || !window.confirm("Hapus lembar ide ini?")) return;
      try {
        await api(`/api/ideas/${state.activeIdeaId}`, { method: "DELETE" });
        state.activeIdeaId = null; await loadIdeas(); showToast("Lembar ide dihapus.");
      } catch (error) { showToast(error.message, true); }
      return;
    }
    if (target.id === "summarize-button") return runSummary();
    if (target.id === "cancel-edit") return clearReferenceForm();
    if (target.id === "reset-search" || target.id === "empty-reset") {
      $("#catalog-search").reset(); await loadCatalogMeta(); return loadCatalog();
    }
    if (target.dataset.addRef) {
      if (!state.user) return openAuth("login");
      try {
        const result = await api(`/api/shortlist/${target.dataset.addRef}`, { method: "POST", body: {} });
        state.shortlist = result.items; renderShortlist(); showToast("Referensi masuk ke shortlist.");
      } catch (error) { showToast(error.message, true); }
      return;
    }
    if (target.dataset.removeRef) {
      try {
        await api(`/api/shortlist/${target.dataset.removeRef}`, { method: "DELETE" });
        state.shortlist = state.shortlist.filter((ref) => ref.id !== Number(target.dataset.removeRef));
        state.selectedRefs.delete(Number(target.dataset.removeRef)); renderShortlist(); showToast("Referensi dihapus dari shortlist.");
      } catch (error) { showToast(error.message, true); }
      return;
    }
    if (target.dataset.detailRef) return openReferenceDetail(Number(target.dataset.detailRef));
    if (target.dataset.keyword) {
      $("#filter-query").value = target.dataset.keyword;
      $("#catalog-search").requestSubmit();
      return;
    }
    if (target.dataset.editReference) return editReference(Number(target.dataset.editReference));
    if (target.dataset.archiveReference) return archiveReference(Number(target.dataset.archiveReference));
  });

  document.addEventListener("change", (event) => {
    const target = event.target;
    if (target.matches("[data-select-ref]")) {
      const id = Number(target.dataset.selectRef);
      if (target.checked && state.selectedRefs.size >= 8) {
        target.checked = false; showToast("Ringkasan AI dibatasi hingga 8 referensi.", true); return;
      }
      target.checked ? state.selectedRefs.add(id) : state.selectedRefs.delete(id);
      renderShortlist();
      return;
    }
    if (target.id === "idea-picker") {
      const id = Number(target.value);
      if (!id) { resetIdeaForm(); return; }
      const idea = state.ideas.find((item) => item.id === id);
      if (idea) showIdea(idea);
    }
  });

  $("#catalog-search").addEventListener("submit", (event) => { event.preventDefault(); loadCatalog(currentFilters()); });
  $("#ai-search-form").addEventListener("submit", (event) => { event.preventDefault(); runKeywordSuggestions(); });
  $("#intake-title").addEventListener("input", updateIntakeControls);
  $("#intake-question-list").addEventListener("input", () => {
    syncIntakeQuestions();
    updateIntakeControls();
  });
  $("#reference-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const button = $("#admin-save"); setBusy(button, true, "Menyimpan…");
    try {
      const path = state.editingReferenceId ? `/api/admin/references/${state.editingReferenceId}` : "/api/admin/references";
      await api(path, { method: state.editingReferenceId ? "PUT" : "POST", body: referenceFormData() });
      clearReferenceForm();
      await Promise.all([loadAdminReferences(), loadCatalogMeta(), loadCatalog(currentFilters())]);
      showToast("Metadata referensi tersimpan.");
    } catch (error) { showToast(error.message, true); }
    finally { setBusy(button, false); }
  });
  $("#auth-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const body = Object.fromEntries(new FormData(form).entries());
    const register = state.authMode === "register";
    const submit = $("#auth-submit");
    setBusy(submit, true, register ? "Membuat akun…" : "Memeriksa…");
    $("#auth-error").classList.add("hidden");
    try {
      const result = await api(register ? "/api/auth/register" : "/api/auth/login", { method: "POST", body });
      authChanged(result);
      await loadShortlist();
      await loadIdeas();
      if (state.pendingView) { const view = state.pendingView; state.pendingView = null; setView(view); }
      if (state.pendingAiQuestion) {
        $("#ai-question").value = state.pendingAiQuestion;
        state.pendingAiQuestion = "";
        runKeywordSuggestions();
      }
    } catch (error) {
      const message = $("#auth-error"); message.textContent = error.message; message.classList.remove("hidden");
    } finally { setBusy(submit, false); }
  });
  $("#reference-detail").addEventListener("click", async (event) => {
    if (event.target.closest("[data-close-detail]")) $("#reference-dialog").close();
    const add = event.target.closest("[data-add-ref]");
    if (add) {
      $("#reference-dialog").close();
      if (!state.user) return openAuth("login");
      try {
        const result = await api(`/api/shortlist/${add.dataset.addRef}`, { method: "POST", body: {} });
        state.shortlist = result.items; renderShortlist(); showToast("Referensi masuk ke shortlist.");
      } catch (error) { showToast(error.message, true); }
    }
  });
  $("#reference-dialog").addEventListener("click", (event) => {
    if (event.target === $("#reference-dialog")) $("#reference-dialog").close();
  });
}

async function initialize() {
  bindEvents();
  await Promise.all([loadSession(), loadAiStatus(), loadCatalogMeta(), loadCatalog()]);
  if (state.user) {
    await Promise.all([loadShortlist(), loadIdeas()]);
  }
}

initialize();
