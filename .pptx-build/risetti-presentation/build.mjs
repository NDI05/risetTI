import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { Presentation, PresentationFile } from '@oai/artifact-tool';

const SKILL_DIR = '/Users/user/.codex/plugins/cache/openai-primary-runtime/presentations/26.1015.12040/skills/presentations';
const workspaceDir = '/Users/user/Documents/Kuliah/MANPRO';
const BUILD_DIR = path.join(workspaceDir, '.pptx-build/risetti-presentation');
const FINAL_PPTX = path.join(workspaceDir, 'output/pptx/RisetTI_Pengenalan_Produk_dan_Manajemen_Proyek_Trello-Lengkap.pptx');
const RUNTIME_PYTHON = '/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3';
const referencePath = '/Users/user/Downloads/risetti-perencanaan-inisiasi-gemma4 (1).pptx';
const referenceSha256 = 'dd24f2b7669b533e4c2144ba96a55647e6d9a4e80120d27d6b583db323b65452';
const { finalizePresentation } = await import(pathToFileURL(path.join(SKILL_DIR, 'container_tools/artifact_tool_utils.mjs')).href);

await fs.mkdir(BUILD_DIR, { recursive: true });
await fs.mkdir(path.dirname(FINAL_PPTX), { recursive: true });

const W = 1280, H = 720;
const FONT = 'Times New Roman';
const C = {
  black: '#111111', gray: '#555555', muted: '#777777', line: '#A8A8A8', light: '#F1F1F1',
  white: '#FFFFFF', green: '#3F8064', greenLight: '#EAF3EE', orange: '#E89363', orangeLight: '#FBF0E9'
};
const ppt = Presentation.create({ slideSize: { width: W, height: H } });

function shape(slide, x, y, w, h, fill = 'none', stroke = 'none', sw = 0, geometry = 'rect') {
  return slide.shapes.add({ geometry, position: { left: x, top: y, width: w, height: h }, fill, line: { style: 'solid', fill: stroke, width: sw } });
}
function txt(slide, value, x, y, w, h, size = 22, opts = {}) {
  const s = shape(slide, x, y, w, h);
  s.text = value;
  s.text.style = {
    typeface: FONT, fontSize: size, color: opts.color || C.black, bold: !!opts.bold, italic: !!opts.italic,
    alignment: opts.align || 'left', verticalAlignment: opts.valign || 'top', autoFit: 'shrinkText', wrap: 'square',
    insets: { left: opts.pad ?? 0, right: opts.pad ?? 0, top: opts.pad ?? 0, bottom: opts.pad ?? 0 },
    lineSpacing: opts.lineSpacing ?? 1.08
  };
  return s;
}
function rule(slide, x1, y1, x2, y2, color = C.line, width = 1) {
  return slide.shapes.add({ geometry: 'line', position: { left: x1, top: y1, width: x2 - x1, height: y2 - y1 }, fill: 'none', line: { style: 'solid', fill: color, width } });
}
function notes(slide, value) { slide.speakerNotes.textFrame.setText(value); }
function base(title, num, source = '') {
  const s = ppt.slides.add();
  s.background.fill = C.white;
  txt(s, 'RISETTI  /  PENGENALAN PRODUK & RENCANA PROYEK', 70, 28, 800, 22, 15, { bold: true, color: C.gray });
  txt(s, String(num).padStart(2, '0'), 1150, 28, 60, 22, 15, { align: 'right', color: C.gray });
  rule(s, 70, 61, 1210, 61, C.line, 1);
  txt(s, title, 70, 82, 1140, 58, 43, { bold: true });
  if (source) txt(s, source, 70, 675, 1140, 20, 14, { color: C.muted });
  return s;
}
function section(slide, label, x, y, w = 450, color = C.green) {
  txt(slide, label.toUpperCase(), x, y, w, 24, 16, { bold: true, color });
}
function pill(slide, label, x, y, w, fill = C.greenLight, color = C.green) {
  shape(slide, x, y, w, 28, fill, 'none', 0, 'roundRect');
  txt(slide, label, x + 8, y + 4, w - 16, 20, 15, { bold: true, color, align: 'center' });
}

// 1. Cover — visual continuity with the prior deck: serif typography, white field, restrained rules.
{
  const s = ppt.slides.add(); s.background.fill = C.white;
  txt(s, 'PROYEK PLATFORM WEBSITE', 80, 82, 620, 30, 19, { bold: true, color: C.gray });
  txt(s, 'RISETTI', 80, 160, 800, 95, 78, { bold: true });
  rule(s, 80, 276, 360, 276, C.green, 4);
  txt(s, 'Pengenalan Produk', 80, 312, 900, 54, 39, { bold: true });
  txt(s, 'Sistematis Manajemen Proyek', 80, 368, 1050, 48, 31, { color: C.gray });
  txt(s, 'Dari katalog tugas akhir hingga rancangan awal ide yang dapat ditinjau dan disunting.', 80, 437, 970, 62, 24, { color: C.gray, lineSpacing: 1.12 });
  txt(s, 'BASELINE RENCANA', 80, 574, 230, 24, 16, { bold: true, color: C.gray });
  txt(s, '8 minggu  ·  4 sprint  ·  26 Oktober–20 Desember 2026', 80, 605, 720, 30, 21, { bold: true });
  txt(s, '21 Oktober 2026', 1020, 620, 180, 24, 17, { color: C.gray, align: 'right' });
  notes(s, 'Pengenalan produk dan rencana manajemen proyek RisetTI. Baseline jadwal adalah usulan yang tercatat di board Trello per 21 Oktober 2026; pekerjaan belum dimulai. Gaya visual mengikuti presentasi RisetTI sebelumnya yang diberikan pengguna.');
}

// 2. Product overview.
{
  const s = base('Apa yang dibantu RisetTI?', 2, 'Dasar: brief kebutuhan RisetTI dan README proyek.');
  txt(s, 'Mahasiswa memulai dari ide; RisetTI mengaitkannya dengan katalog untuk merakit rujukan dan draf awal.', 70, 157, 1090, 64, 28, { bold: true, lineSpacing: 1.1 });
  section(s, 'Dua tujuan produk', 80, 254, 350);
  txt(s, '01', 80, 296, 70, 38, 22, { bold: true, color: C.green });
  txt(s, 'Telusuri katalog', 158, 294, 400, 40, 27, { bold: true });
  txt(s, 'Katalog tetap dapat dijelajahi menurut kata kunci, bidang, metode, dan teknologi; detail menunjukkan metadata serta sumber.', 158, 341, 400, 98, 21, { color: C.gray });
  rule(s, 622, 270, 622, 460, C.line, 1);
  txt(s, '02', 678, 296, 70, 38, 22, { bold: true, color: C.green });
  txt(s, 'Mulai dari ide', 756, 294, 400, 40, 27, { bold: true });
  txt(s, 'Input singkat memicu pertanyaan dinamis; katalog menyusun shortlist dan sitasi otomatis untuk draf yang dapat diedit.', 756, 341, 400, 98, 21, { color: C.gray });
  rule(s, 80, 484, 1195, 484, C.line, 1);
  section(s, 'Batas produk', 80, 511, 220);
  txt(s, 'RisetTI berhenti pada telaah awal dan draf yang dapat disunting. Sistem tidak melacak progres skripsi atau memberi persetujuan akademik.', 80, 544, 1090, 64, 20, { color: C.gray });
  notes(s, 'Sasaran produk disarikan dari brief kebutuhan pengguna dan README RisetTI. Brief membatasi produk pada katalog yang bisa ditelusuri dan bantuan untuk menyusun informasi awal serta mengenali kebutuhan dan risiko ide.');
}

// 3. Student experience and ambiguity handling.
{
  const s = base('Alur dari ide singkat ke draf yang bisa ditinjau', 3, 'Dasar: brief kebutuhan RisetTI dan README proyek.');
  txt(s, 'Satu judul yang belum rinci seharusnya memicu pertanyaan klarifikasi, bukan jawaban yang mengarang konteks.', 70, 155, 1100, 48, 24, { color: C.gray });
  const steps = [
    ['01', 'Tulis ide', 'Satu kalimat awal, misalnya masalah pengembalian obat.'],
    ['02', 'Klarifikasi', '3–5 pertanyaan kontekstual; dapat ditambah atau dihapus.'],
    ['03', 'Sumber otomatis', 'Shortlist kandidat disusun dari topik dan jawaban.'],
    ['04', 'Susun draf', 'AI mengisi bagian yang didukung jawaban dan sumber.'],
    ['05', 'Tinjau & simpan', 'Draf dapat disunting; sitasi mengarah ke rekaman katalog.']
  ];
  const xs = [75, 306, 537, 768, 999], y = 243, bw = 190;
  steps.forEach((it, i) => {
    txt(s, it[0], xs[i], y, bw, 28, 18, { bold: true, color: C.green });
    rule(s, xs[i], y + 36, xs[i] + bw, y + 36, i === 3 ? C.orange : C.black, 2);
    txt(s, it[1], xs[i], y + 53, bw, 34, 23, { bold: true });
    txt(s, it[2], xs[i], y + 97, bw, 106, 18, { color: C.gray, lineSpacing: 1.1 });
    if (i < steps.length - 1) txt(s, '→', xs[i] + bw + 9, y + 68, 30, 32, 22, { bold: true, color: C.green, align: 'center' });
  });
  shape(s, 75, 494, 1120, 90, C.greenLight, 'none', 0, 'roundRect');
  txt(s, 'Prinsip keluaran', 100, 511, 210, 28, 18, { bold: true, color: C.green });
  txt(s, 'Tandai informasi yang belum tersedia. Tampilkan sumber yang benar-benar diambil dari katalog. Semua hasil tetap berstatus draf untuk ditinjau pengguna.', 315, 508, 845, 58, 20, { bold: true, lineSpacing: 1.08 });
  notes(s, 'Pertanyaan dinamis, draf yang dapat disunting, dan sumber katalog sesuai README. Shortlist dan rujukan otomatis mengikuti arahan produk terbaru pengguna agar tidak mewajibkan pilihan manual. README snapshot masih menjelaskan pemilihan referensi opsional; alur otomatis perlu ditegaskan sebagai acceptance criterion saat desain Sprint 1. Ini adalah target rancangan, bukan hasil evaluasi pengguna.');
}

// 4. Current catalog snapshot.
{
  const s = base('Fondasi data katalog', 4, 'Snapshot SQLite lokal diperiksa 21 Oktober 2026; jumlah adalah metadata, bukan validasi kualitas.');
  txt(s, '3.132', 80, 193, 390, 110, 102, { bold: true, color: C.green });
  txt(s, 'rekaman aktif non-demo', 84, 306, 390, 34, 24, { bold: true });
  txt(s, 'Rentang tahun 1962–2026\nSumber tersebar di repositori dan jurnal.', 84, 353, 390, 72, 20, { color: C.gray, lineSpacing: 1.2 });
  rule(s, 530, 193, 530, 482, C.line, 1);
  section(s, 'Contoh sumber terbesar dalam snapshot', 580, 196, 600);
  const sources = [
    ['Zenodo (CERN)', 256], ['PLoS ONE', 35], ['IEEE Access', 35],
    ['International Journal of Advanced Computer Science and Applications', 33], ['ETD Universitas Gadjah Mada', 32]
  ];
  let y = 241;
  for (const [name, n] of sources) {
    txt(s, name, 580, y, 390, 25, 17, { color: C.gray });
    shape(s, 580, y + 30, Math.max(25, Math.round(260 * n / 256)), 10, n === 256 ? C.green : '#A8BFB2', 'none', 0, 'rect');
    txt(s, String(n), 1010, y + 19, 50, 24, 18, { bold: true, align: 'right' });
    y += 52;
  }
  rule(s, 80, 502, 1195, 502, C.line, 1);
  section(s, 'Sebelum katalog diperluas', 80, 526, 330, C.orange);
  txt(s, 'Audit tautan, kelengkapan metadata, izin penggunaan, bahasa, dan ringkasan. Jumlah rekaman saja tidak membuktikan bahwa semua sumber layak dipakai atau ditampilkan.', 80, 559, 1080, 66, 19, { color: C.gray });
  notes(s, 'Hitungan read-only dari data/risetti.sqlite pada 21 Oktober 2026: 3.132 total rekaman, seluruhnya aktif dan non-demo; rentang tahun 1962–2026. Sumber teratas: Zenodo (CERN) 256, PLoS ONE 35, IEEE Access 35, IJACSA 33, ETD UGM 32. Distribusi ini tidak membuktikan review sejawat, izin publikasi, maupun validitas data. Lisensi dan kelengkapan metadata harus diaudit sebelum katalog dipakai lebih luas.');
}

// 5. Technical/product boundary.
{
  const s = base('Arsitektur produk dan batas AI', 5, 'Dasar: README proyek dan brief kebutuhan RisetTI.');
  txt(s, 'AI berjalan lokal melalui Ollama. Katalog dan isian manual tetap menjadi jalur kerja utama.', 70, 155, 1100, 43, 24, { color: C.gray });
  shape(s, 80, 255, 265, 102, C.light, 'none', 0, 'roundRect');
  txt(s, 'Browser RisetTI', 98, 275, 230, 32, 25, { bold: true, align: 'center' });
  txt(s, 'Katalog • shortlist • draf ide', 96, 315, 232, 26, 16, { color: C.gray, align: 'center' });
  txt(s, '→', 362, 285, 64, 44, 34, { bold: true, color: C.green, align: 'center' });
  shape(s, 430, 255, 275, 102, C.greenLight, 'none', 0, 'roundRect');
  txt(s, 'Backend aplikasi', 448, 275, 240, 32, 25, { bold: true, align: 'center' });
  txt(s, 'API • validasi • sumber sitasi', 448, 315, 240, 26, 16, { color: C.gray, align: 'center' });
  shape(s, 800, 207, 360, 74, C.light, 'none', 0, 'roundRect');
  txt(s, 'SQLite', 820, 222, 320, 28, 23, { bold: true, align: 'center' });
  txt(s, 'Katalog, shortlist, dan lembar ide', 820, 251, 320, 22, 16, { color: C.gray, align: 'center' });
  shape(s, 800, 337, 360, 74, C.orangeLight, 'none', 0, 'roundRect');
  txt(s, 'Ollama • Gemma 4', 820, 350, 320, 29, 23, { bold: true, align: 'center' });
  txt(s, 'Model lokal; hanya dipanggil saat diminta', 820, 380, 320, 22, 16, { color: C.gray, align: 'center' });
  rule(s, 705, 306, 760, 306, C.line, 1.5);
  rule(s, 760, 244, 760, 374, C.line, 1.5);
  rule(s, 760, 244, 800, 244, C.line, 1.5);
  txt(s, '→', 772, 229, 26, 27, 18, { bold: true, color: C.green, align: 'center' });
  rule(s, 760, 374, 800, 374, C.line, 1.5);
  txt(s, '→', 772, 359, 26, 27, 18, { bold: true, color: C.green, align: 'center' });
  rule(s, 80, 466, 1195, 466, C.line, 1);
  section(s, 'Saat Ollama atau model tidak siap', 80, 492, 470, C.orange);
  txt(s, 'Status model terlihat. Pengguna tetap dapat mencari katalog, mengelola shortlist, dan mengisi lembar ide secara manual.', 80, 527, 1080, 60, 21, { color: C.gray });
  txt(s, 'Aplikasi membatasi alamat model ke loopback; browser tidak memanggil layanan AI eksternal.', 80, 599, 1080, 28, 18, { bold: true });
  notes(s, 'README menyebut SQLite lokal; Ollama hanya dibutuhkan untuk bantuan AI; katalog, shortlist, dan lembar ide manual tetap dapat digunakan saat model tidak tersedia. Backend membatasi OLLAMA_BASE_URL ke alamat loopback dan browser hanya memanggil API RisetTI. Model awal: gemma4:e2b-it-q4_K_M.');
}

// 6. Project systematic and chosen management framework.
{
  const s = base('Sistematis proyek: kelola, bangun, kendalikan', 6, 'Acuan: Karakteristik Pengembangan Proyek pada Teknologi Informasi, hlm. 3, 7–8, 22–23, 26; Kelompok Proses…, hlm. 3, 7.');
  txt(s, 'Proyek TI bersifat sementara dan unik. Rencana dibuat bertahap lalu disesuaikan dari hasil review.', 70, 155, 1100, 43, 24, { color: C.gray });
  const stages = [
    ['Inisiasi', 'Charter, tujuan, stakeholder, izin sumber data'],
    ['Perencanaan', 'Scope, WBS, jadwal, biaya, kualitas, risiko'],
    ['Pelaksanaan', 'Desain dan bangun katalog, alur ide, integrasi'],
    ['Pantau & kendalikan', 'Review sprint, perubahan, biaya, mutu, risiko'],
    ['Penutupan', 'UAT, rilis, dokumentasi, handover, pelajaran']
  ];
  const xs = [75, 306, 537, 768, 999], y = 248, bw = 190;
  rule(s, 90, 271, 1185, 271, C.green, 2);
  stages.forEach((it, i) => {
    shape(s, xs[i] + 3, 261, 20, 20, C.green, 'none', 0, 'ellipse');
    txt(s, String(i + 1).padStart(2, '0'), xs[i], y + 26, bw, 26, 17, { bold: true, color: C.green });
    txt(s, it[0], xs[i], y + 59, bw, 54, 22, { bold: true });
    txt(s, it[1], xs[i], y + 119, bw, 92, 18, { color: C.gray, lineSpacing: 1.1 });
  });
  rule(s, 75, 512, 1195, 512, C.line, 1);
  section(s, 'Siklus teknis di dalam sprint', 75, 537, 350);
  txt(s, 'Kebutuhan → desain → implementasi → pengujian → deployment', 75, 570, 1080, 35, 23, { bold: true });
  txt(s, 'Kerangka bahan acuan memakai 5 kelompok proses dan 10 knowledge area. Delapan area berikut dipilih sesuai permintaan presentasi.', 75, 617, 1100, 32, 17, { color: C.gray });
  notes(s, 'Bahan IT: proyek sementara dan unik (hlm. 3); SDLC dari kebutuhan sampai deployment (hlm. 7); Agile/Waterfall (hlm. 8); iterasi 2–4 minggu (hlm. 22); monitoring dan control (hlm. 23); peran manajer proyek dan pendekatan hybrid (hlm. 26). Bahan process groups: 5 kelompok proses (hlm. 3) dan 10 knowledge area (hlm. 7). Siklus dan sprint di slide merupakan penerapan yang diusulkan untuk RisetTI.');
}

// 7. Integration management.
{
  const s = base('01  Integration management', 7, 'Acuan: Kelompok Proses dan Knowledge Area dalam Manajemen Proyek, hlm. 8–9, 28–30.');
  txt(s, 'Satu keputusan proyek harus menjaga produk, jadwal, biaya, mutu, dan risiko tetap selaras.', 70, 155, 1100, 44, 25, { color: C.gray });
  section(s, 'Rangkaian integrasi', 80, 230, 360);
  const chain = [
    ['Charter', 'Tujuan, batas, stakeholder'], ['Baseline terpadu', 'Scope, WBS, jadwal, biaya, quality gate'],
    ['Perubahan terkendali', 'Alasan, dampak, keputusan, pemilik'], ['Penutupan', 'UAT, rilis, handover, lesson learned']
  ];
  let y = 270;
  for (let i = 0; i < chain.length; i++) {
    txt(s, String(i + 1).padStart(2, '0'), 80, y, 48, 28, 18, { bold: true, color: C.green });
    txt(s, chain[i][0], 135, y - 1, 250, 30, 22, { bold: true });
    txt(s, chain[i][1], 135, y + 32, 430, 42, 18, { color: C.gray });
    if (i < chain.length - 1) rule(s, 102, y + 32, 102, y + 82, C.line, 1);
    y += 88;
  }
  rule(s, 625, 228, 625, 603, C.line, 1);
  section(s, 'Sebelum menerima perubahan', 680, 230, 460, C.orange);
  txt(s, 'Tanyakan dampaknya pada:', 680, 273, 500, 30, 21, { bold: true });
  const checks = ['Scope dan kriteria penerimaan', 'Tanggal milestone / dependensi', 'Biaya dan beban peran', 'Mutu dan keamanan', 'Daftar risiko serta respons'];
  y = 320;
  for (const item of checks) { rule(s, 680, y + 22, 713, y + 22, C.green, 2); txt(s, item, 730, y + 7, 420, 30, 20, { color: C.gray }); y += 48; }
  txt(s, 'Catat keputusan dan alasannya di decision log yang terhubung ke Trello.', 680, 567, 490, 44, 18, { bold: true });
  notes(s, 'Mengacu area Integration: koordinasi proses dan pengetahuan proyek (bahan Kelompok Proses…, hlm. 8–9) dan relasi proses/knowledge area pada hlm. 28–30. Mekanisme charter, baseline terpadu, change log, dan dampak lintas area adalah usulan tata kelola untuk proyek RisetTI.');
}

// 8. Scope management.
{
  const s = base('02  Scope management', 8, 'Acuan: Kelompok Proses dan Knowledge Area dalam Manajemen Proyek, hlm. 10; brief kebutuhan RisetTI.');
  txt(s, 'Scope baseline menjaga MVP fokus pada dua tujuan produk.', 70, 155, 1100, 42, 25, { color: C.gray });
  section(s, 'Masuk scope MVP', 80, 229, 440);
  section(s, 'Di luar scope saat ini', 680, 229, 470, C.orange);
  rule(s, 80, 266, 575, 266, C.green, 2); rule(s, 680, 266, 1185, 266, C.orange, 2);
  const inside = [
    'Katalog tugas akhir: metadata, sumber, pencarian, dan filter.',
    'Shortlist kandidat rujukan otomatis dari topik dan jawaban; pengguna meninjau relevansinya.',
    'Form ide dinamis dengan bagian kebutuhan dan risiko.',
    'Draf AI lokal yang bisa disunting dan menampilkan sitasi katalog.',
    'Admin untuk mengelola metadata katalog.'
  ];
  const outside = [
    'Pelacakan progres skripsi dan pengelolaan bimbingan.',
    'Persetujuan judul atau penilaian kelayakan otomatis.',
    'Penulisan skripsi penuh atau pemeriksaan plagiarisme.',
    'Integrasi SIAKAD dan aplikasi seluler.'
  ];
  let y = 288;
  for (const item of inside) { txt(s, '—', 80, y, 24, 28, 20, { bold: true, color: C.green }); txt(s, item, 112, y, 460, 44, 19, { color: C.gray }); y += 58; }
  y = 288;
  for (const item of outside) { txt(s, '—', 680, y, 24, 28, 20, { bold: true, color: C.orange }); txt(s, item, 712, y, 460, 44, 19, { color: C.gray }); y += 67; }
  shape(s, 80, 598, 1105, 46, C.light, 'none', 0, 'roundRect');
  txt(s, 'Exit scope: alur dapat dicari, ditinjau, disunting, dan disimpan; sumber draf dapat ditelusuri ke katalog.', 100, 610, 1060, 25, 18, { bold: true });
  notes(s, 'Batas MVP mengikuti brief kebutuhan terbaru dan README. Poin out-of-scope juga menegaskan bahwa cakupan progres/bimbingan dari materi lama tidak termasuk arah produk saat ini. Area Scope pada bahan referensi: hlm. 10. Kriteria exit di slide adalah usulan untuk baseline, belum hasil pengujian.');
}

// 9. Schedule management and baseline.
{
  const s = base('03  Schedule management', 9, 'Baseline Trello per 21 Oktober 2026; tanggal mulai dan durasi masih perlu disepakati saat kickoff.');
  txt(s, 'Delapan minggu dibagi menjadi empat sprint dua mingguan.', 70, 155, 1100, 42, 25, { color: C.gray });
  const sprints = [
    ['SPRINT 1', '26 Okt–8 Nov', 'Inisiasi & desain', 'Charter, scope, risk awal, UX, arsitektur, WBS.'],
    ['SPRINT 2', '9–22 Nov', 'Katalog & AI', 'Audit data, pencarian, filter, shortlist, draf ide dan sitasi.'],
    ['SPRINT 3', '23 Nov–6 Des', 'Integrasi & kualitas', 'Autentikasi, admin, Ollama, fallback, QA dan quality gate.'],
    ['SPRINT 4', '7–20 Des', 'UAT & rilis', 'Uji mahasiswa, perbaikan, dokumentasi, rilis dan handover.']
  ];
  const x0 = 80, w = 275, gap = 12;
  rule(s, x0 + 12, 239, x0 + 4 * (w + gap) - 10, 239, C.green, 3);
  sprints.forEach((it, i) => {
    const x = x0 + i * (w + gap);
    shape(s, x, 222, 22, 22, C.green, 'none', 0, 'ellipse');
    txt(s, it[0], x, 269, w, 24, 16, { bold: true, color: C.green });
    txt(s, it[1], x, 299, w, 27, 20, { bold: true });
    txt(s, it[2], x, 340, w, 58, 24, { bold: true });
    rule(s, x, 409, x + w - 10, 409, i === 3 ? C.orange : C.line, 1.3);
    txt(s, it[3], x, 429, w - 9, 92, 18, { color: C.gray, lineSpacing: 1.1 });
  });
  shape(s, 80, 553, 1105, 66, C.greenLight, 'none', 0, 'roundRect');
  txt(s, 'Urutan kendali', 98, 568, 170, 25, 17, { bold: true, color: C.green });
  txt(s, 'Audit sumber → alur katalog → draf ide → integrasi & QA → UAT → rilis.', 280, 566, 865, 30, 20, { bold: true });
  notes(s, 'Tanggal dan tema sprint ditarik dari board Trello RisetTI. Sprint 1: 26 Okt–8 Nov; Sprint 2: 9–22 Nov; Sprint 3: 23 Nov–6 Des; Sprint 4: 7–20 Des 2026. Ada 8 kartu kerja dengan due date mingguan. Board dibuat 21 Okt; semua kartu masih open dan belum ada yang selesai. Baseline indikatif untuk review, bukan komitmen jadwal final. Acuan schedule management: bahan Knowledge Area, hlm. 12; sifat iteratif dari bahan proyek TI, hlm. 22–23.');
}

// 10. Cost management.
{
  const s = base('04  Cost management', 10, 'Acuan: Kelompok Proses dan Knowledge Area dalam Manajemen Proyek, hlm. 14; estimasi rupiah belum tersedia.');
  txt(s, 'Anggaran belum ditetapkan; hitung setelah sumber data, perangkat, dan kapasitas tim dikonfirmasi.', 70, 155, 1100, 52, 25, { color: C.gray });
  section(s, 'Komponen estimasi', 80, 239, 340);
  const costRows = [
    ['Usaha tim', 'Jam kerja per peran × tarif yang disepakati'],
    ['Perangkat & operasi', 'Komputer lokal, penyimpanan, jaringan, backup'],
    ['Data & hak pakai', 'Akses, lisensi, kurasi, dan verifikasi sumber'],
    ['Uji & rilis', 'UAT, dokumentasi, dan kebutuhan deployment']
  ];
  let y = 278;
  for (const [a, b] of costRows) {
    txt(s, a, 80, y, 260, 30, 22, { bold: true });
    txt(s, b, 350, y, 330, 48, 18, { color: C.gray });
    rule(s, 80, y + 53, 680, y + 53, '#C7C7C7', 0.8);
    y += 68;
  }
  rule(s, 740, 238, 740, 561, C.line, 1);
  section(s, 'Kontrol biaya', 790, 239, 340, C.orange);
  txt(s, '01  Buat estimasi bottom-up setelah WBS dan usaha tiap peran disepakati.', 790, 281, 390, 62, 20, { lineSpacing: 1.1 });
  txt(s, '02  Catat biaya aktual dan komitmen pada review mingguan/sprint.', 790, 360, 390, 62, 20, { lineSpacing: 1.1 });
  txt(s, '03  Revisi baseline hanya lewat keputusan perubahan scope atau asumsi.', 790, 439, 390, 62, 20, { lineSpacing: 1.1 });
  shape(s, 80, 578, 1100, 49, C.orangeLight, 'none', 0, 'roundRect');
  txt(s, 'Jangan cantumkan angka biaya sebelum ada tarif, penawaran, atau nilai aktual yang bisa diperiksa.', 100, 590, 1060, 26, 18, { bold: true });
  notes(s, 'Cost management mengikuti area pada bahan Kelompok Proses…, hlm. 14. Belum ada data biaya atau tarif yang diberikan; karena itu deck tidak mengarang nilai rupiah. Struktur estimasi dan mekanisme kontrol adalah usulan perencanaan yang perlu diisi oleh tim.');
}

// 11. Quality management.
{
  const s = base('05  Quality management', 11, 'Acuan: Kelompok Proses dan Knowledge Area dalam Manajemen Proyek, hlm. 16; kriteria adalah rencana, belum hasil uji.');
  txt(s, 'Kualitas berarti informasi dapat ditelusuri dan alur tetap dapat dipakai saat AI tidak siap.', 70, 155, 1100, 44, 25, { color: C.gray });
  const quality = [
    ['Katalog', 'Detail memuat sumber, tahun, dan metadata yang bisa diperiksa.'],
    ['Sitasi AI', 'Setiap sitasi berasal dari rekaman aktif; tautan dibangun dari DB.'],
    ['Draf', 'Hasil ditandai sebagai draf; informasi yang belum ada tetap terlihat.'],
    ['Fallback', 'Pencarian, shortlist, dan isi manual jalan meski Ollama offline.']
  ];
  const poss = [[80, 246], [660, 246], [80, 391], [660, 391]];
  quality.forEach((q, i) => {
    const [x, y] = poss[i];
    txt(s, String(i + 1).padStart(2, '0'), x, y, 50, 26, 17, { bold: true, color: C.green });
    txt(s, q[0], x + 58, y - 3, 400, 34, 24, { bold: true });
    txt(s, q[1], x + 58, y + 39, 440, 64, 19, { color: C.gray });
    rule(s, x + 58, y + 112, x + 490, y + 112, C.line, 1);
  });
  section(s, 'Gerbang sebelum UAT', 80, 546, 300, C.orange);
  txt(s, 'Lint, typecheck, test, build, keamanan input/sesi, tampilan responsif, serta keyboard/accessibility diperiksa dan hasilnya dicatat.', 80, 580, 1100, 52, 19, { color: C.gray });
  notes(s, 'Area Quality: bahan Kelompok Proses…, hlm. 16. Rencana gerbang sebelum UAT diambil dari kartu QA pada Trello (uji alur, validasi server, sesi/CSRF, responsif, keyboard; lint, typecheck, test, build). Kriteria ini belum diverifikasi. Ketertelusuran referensi dan fallback berasal dari README produk.');
}

// 12. Resource management.
{
  const s = base('06  Resource management', 12, 'Peran awal dari PPT RisetTI sebelumnya; tanggung jawab dan ketersediaan perlu dikonfirmasi saat kickoff.');
  txt(s, 'Pembagian peran memperjelas pemilik hasil; belum menunjukkan alokasi waktu yang tersedia.', 70, 155, 1100, 44, 24, { color: C.gray });
  const team = [
    ['20240140037', 'Koordinasi produk & analisis kebutuhan'],
    ['20240140125', 'Riset pengguna & desain alur'],
    ['20240140005', 'Frontend dan integrasi UI'],
    ['20240140031', 'Backend, SQLite, dan integrasi Ollama'],
    ['20240140025', 'Kurasi metadata serta sumber katalog'],
    ['20240140154', 'QA, keamanan, dan deployment']
  ];
  team.forEach((t, i) => {
    const col = i < 3 ? 0 : 1, row = i % 3, x = col === 0 ? 80 : 660, y = 240 + row * 116;
    txt(s, String(i + 1).padStart(2, '0'), x, y, 46, 28, 17, { bold: true, color: C.green });
    txt(s, t[0], x + 53, y - 1, 200, 30, 21, { bold: true });
    txt(s, t[1], x + 53, y + 38, 420, 52, 19, { color: C.gray });
    rule(s, x + 53, y + 98, x + 492, y + 98, C.line, 1);
  });
  shape(s, 80, 603, 1100, 42, C.greenLight, 'none', 0, 'roundRect');
  txt(s, 'Langkah awal: cek kapasitas, beban kuliah, akses perangkat, dan backup untuk setiap pemilik tugas.', 98, 614, 1060, 22, 17, { bold: true, color: C.green });
  notes(s, 'Nomor anggota dan peran diadaptasi dari slide pembagian kerja pada PPT RisetTI sebelumnya yang diberikan pengguna. Peran adalah hipotesis alokasi, bukan informasi alokasi usaha aktual. Acuan area Resource: bahan Knowledge Area, hlm. 18.');
}

// 13. Communications management.
{
  const s = base('07  Communications management', 13, 'Acuan: Kelompok Proses dan Knowledge Area dalam Manajemen Proyek, hlm. 20; ritme berikut adalah usulan tim.');
  txt(s, 'Informasi proyek harus punya pemilik, waktu pembaruan, dan tempat keputusan tercatat.', 70, 155, 1100, 44, 24, { color: C.gray });
  const rows = [
    ['Setiap minggu', 'Koordinasi tim', 'Status, blocker, dependensi', 'Trello + pertemuan singkat'],
    ['Awal sprint', 'Rencana kerja', 'Prioritas, owner, acceptance', 'Backlog dan baseline'],
    ['Akhir sprint', 'Review & retrospektif', 'Demo, feedback, keputusan perubahan', 'Catatan keputusan'],
    ['Sprint 1 & 4', 'Stakeholder / UAT', 'Masalah tervalidasi dan temuan pengguna', 'Catatan sesi dan triase']
  ];
  const x = [80, 320, 560, 890], widths = [220, 220, 300, 280];
  ['KAPAN', 'FORUM', 'ISI', 'BUKTI / MEDIA'].forEach((h, i) => section(s, h, x[i], 233, widths[i], i === 3 ? C.orange : C.green));
  rule(s, 80, 268, 1185, 268, C.black, 1.6);
  rows.forEach((r, ri) => {
    const y = 285 + ri * 72;
    r.forEach((v, i) => txt(s, v, x[i], y, widths[i] - 12, 54, i === 0 ? 18 : 18, { bold: i === 0, color: i === 0 ? C.green : C.gray, lineSpacing: 1.08 }));
    if (ri < rows.length - 1) rule(s, 80, y + 60, 1185, y + 60, '#C7C7C7', 0.8);
  });
  shape(s, 80, 592, 1100, 52, C.light, 'none', 0, 'roundRect');
  txt(s, 'Dokumen kendali: charter • decision log • risk register • catatan uji • release notes', 99, 605, 1060, 26, 18, { bold: true });
  notes(s, 'Area Communications: bahan Knowledge Area, hlm. 20. Bahan proyek TI menekankan perubahan kebutuhan dan adaptabilitas (hlm. 12) serta review iteratif (hlm. 22). Ritme rapat, kanal, dan artefak di slide ini adalah usulan dan dapat disesuaikan tim.');
}

// 14. Risk management.
{
  const s = base('08  Risk management', 14, 'Acuan: Pengelolaan Risiko pada Suatu Proyek, hlm. 10, 14, 24, 31. H/M = estimasi awal tim; validasi Sprint 1.');
  txt(s, 'Daftar risiko hidup diperiksa setiap review; respons punya pemilik dan tenggat.', 70, 155, 1100, 42, 24, { color: C.gray });
  const headers = [['RISIKO', 80, 300], ['P / I', 385, 110], ['RESPONS AWAL', 510, 500], ['OWNER', 1030, 150]];
  headers.forEach(([h, x, w]) => section(s, h, x, 223, w, h === 'P / I' ? C.orange : C.green));
  rule(s, 80, 259, 1185, 259, C.black, 1.6);
  const risks = [
    ['Sumber, izin, atau tautan metadata tidak valid', 'Tinggi / Tinggi', 'Audit provenance; arsipkan atau tahan rekaman yang belum jelas.', 'Data'],
    ['Ollama lambat / tidak tersedia di perangkat uji', 'Sedang / Tinggi', 'Uji perangkat target lebih awal; pertahankan alur manual.', 'Backend'],
    ['Draf AI samar atau sitasi tak didukung', 'Sedang / Tinggi', 'Ajukan klarifikasi; sitasi hanya dari katalog; tandai bagian belum diketahui.', 'Produk + QA'],
    ['Bentrok jadwal anggota dan dependensi sprint', 'Sedang / Sedang', 'Batasi pekerjaan berjalan; review mingguan; pindahkan prioritas secara tercatat.', 'PM'],
    ['Kehilangan data lokal atau paparan tak sengaja', 'Rendah / Tinggi', 'Batasi akses; verifikasi backup; cek sesi dan konfigurasi jaringan.', 'Backend + QA']
  ];
  risks.forEach((r, i) => {
    const y = 275 + i * 68;
    txt(s, r[0], 80, y, 290, 54, 17, { bold: true, lineSpacing: 1.05 });
    txt(s, r[1], 385, y + 4, 112, 48, 16, { color: C.orange, bold: true });
    txt(s, r[2], 510, y, 485, 54, 17, { color: C.gray, lineSpacing: 1.05 });
    txt(s, r[3], 1030, y + 3, 155, 48, 16, { color: C.gray, bold: true });
    if (i < risks.length - 1) rule(s, 80, y + 59, 1185, y + 59, '#C7C7C7', 0.8);
  });
  notes(s, 'Proses risiko diadaptasi dari Pengelolaan Risiko pada Suatu Proyek: enam langkah pada hlm. 10, implementasi dan pemantauan respons/daftar risiko hlm. 14 dan 31, serta field register hlm. 24. Tingkat kemungkinan dan dampak adalah penilaian kualitatif awal untuk diskusi, bukan probabilitas terukur. Board Trello juga memuat risiko awal pada kartu inisiasi.');
}

// 15. Trello evidence.
{
  const s = base('Rencana kerja terlihat di Trello', 15, 'Snapshot lengkap diambil 21 Oktober 2026 dalam mode baca saja. Board tetap private.');
  const trelloImage = path.join(BUILD_DIR, 'trello-board-full.png');
  const trelloImageBytes = new Uint8Array(await fs.readFile(trelloImage));
  s.images.add({ blob: trelloImageBytes, contentType: 'image/png', alt: 'Screenshot lengkap board Trello RisetTI dengan kelima daftar dan seluruh kartu', fit: 'contain', position: { left: 75, top: 155, width: 1130, height: 380 } });
  txt(s, '5 daftar  ·  8 kartu kerja masih open  ·  0 kartu selesai', 75, 550, 535, 26, 17, { bold: true });
  txt(s, 'trello.com/b/g1bAwx83/risetti-timeline-pengembangan-produk', 625, 550, 580, 26, 15, { color: C.green });
  notes(s, 'Screenshot lengkap board Trello diambil 21 Oktober 2026 dalam mode baca saja setelah memperlebar viewport sementara agar kelima daftar terlihat sekaligus. Tidak ada perubahan pada board. Semua 8 kartu masih open dan daftar Selesai kosong saat screenshot dibuat. URL: https://trello.com/b/g1bAwx83/risetti-timeline-pengembangan-produk. Board private.');
}

// 16. Kickoff decisions.
{
  const s = base('Keputusan sebelum kickoff', 16, 'Asumsi yang harus disepakati sebelum baseline dijadikan komitmen.');
  txt(s, 'Tanggal 26 Oktober adalah titik mulai usulan. Lima keputusan ini menentukan apakah baseline realistis.', 70, 155, 1100, 48, 24, { color: C.gray });
  const decisions = [
    ['01', 'Waktu & kapasitas', 'Konfirmasi kalender kuliah, pemilik tugas, dan jam kerja yang tersedia.'],
    ['02', 'Data & hak pakai', 'Tetapkan sumber katalog yang boleh ditampilkan dan standar audit metadata.'],
    ['03', 'Perangkat lokal', 'Pastikan perangkat uji mampu menjalankan Ollama/Gemma 4; catat fallback.'],
    ['04', 'UAT & penerimaan', 'Tentukan peserta uji, skenario, sumber otomatis, dan kriteria draf yang diterima.'],
    ['05', 'Biaya', 'Isi effort dan kebutuhan biaya setelah WBS, sumber, dan perangkat dipastikan.']
  ];
  let y = 232;
  for (const [n, h, b] of decisions) {
    txt(s, n, 80, y, 54, 30, 19, { bold: true, color: C.green });
    txt(s, h, 145, y - 2, 300, 32, 23, { bold: true });
    txt(s, b, 445, y, 690, 48, 19, { color: C.gray });
    rule(s, 145, y + 54, 1180, y + 54, '#C7C7C7', 0.8);
    y += 75;
  }
  txt(s, 'Setelah keputusan ini, revisi WBS, biaya, tanggal, risiko, dan acceptance criteria secara terpadu.', 80, 625, 1090, 30, 19, { bold: true });
  notes(s, 'Daftar keputusan merupakan tindak lanjut dari asumsi yang belum terkonfirmasi dalam brief, repository, dan board. Tanggal jadwal adalah usulan. Cost estimate, perangkat, hak pakai data, kapasitas anggota, dan peserta UAT belum memiliki bukti/keputusan yang cukup untuk dijadikan komitmen.');
}

// 17. References.
{
  const s = base('Acuan materi dan sumber', 17);
  txt(s, 'Materi manajemen proyek', 80, 153, 500, 29, 20, { bold: true });
  const refs = [
    ['Karakteristik Pengembangan Proyek pada Teknologi Informasi — Tri Andi, S.T., M.Kom.', 'hlm. 3, 7–8, 12, 22–23, 26'],
    ['Kelompok Proses dan Knowledge Area dalam Manajemen Proyek', 'hlm. 3, 7–10, 12, 14, 16, 18, 20, 22, 28–30'],
    ['Pengelolaan Risiko pada Suatu Proyek: Kunci Kesuksesan dan Keberlanjutan', 'hlm. 10, 14, 24, 31'],
    ['Brief kebutuhan RisetTI dan README proyek', 'Batas produk, alur katalog/ide, SQLite, Ollama lokal, dan fallback'],
    ['PPT RisetTI sebelumnya dari pengguna', 'Sumber nomor anggota dan pembagian peran awal'],
    ['Database data/risetti.sqlite', 'Snapshot lokal dihitung 21 Oktober 2026; 3.132 aktif non-demo'],
    ['Trello — RisetTI | Timeline Pengembangan Produk', 'Board private: trello.com/b/g1bAwx83/risetti-timeline-pengembangan-produk']
  ];
  let y = 195;
  refs.forEach((r, i) => {
    txt(s, String(i + 1).padStart(2, '0'), 80, y, 42, 24, 16, { bold: true, color: C.green });
    txt(s, r[0], 132, y, 650, 30, 18, { bold: true });
    txt(s, r[1], 790, y, 390, 38, 16, { color: C.gray });
    if (i < refs.length - 1) rule(s, 132, y + 41, 1185, y + 41, '#D0D0D0', 0.7);
    y += 62;
  });
  txt(s, 'Perencanaan bersifat indikatif. Validasi data, biaya, kapasitas tim, dan kriteria UAT diperlukan saat kickoff.', 80, 642, 1100, 26, 18, { bold: true, color: C.gray });
  notes(s, 'Sumber utama adalah tiga PDF yang diberikan pengguna, brief kebutuhan RisetTI, README, snapshot SQLite, PPT lama yang diberikan pengguna, dan board Trello private. Nomor halaman merujuk pada halaman PDF. Konten dari PPT lama digunakan untuk konteks dan peran; batas produk saat ini mengikuti brief/README yang lebih baru.');
}

// Export candidate plus review renders.
const candidatePath = path.join(BUILD_DIR, 'candidate.pptx');
await (await PresentationFile.exportPptx(ppt)).save(candidatePath);
for (let i = 0; i < ppt.slides.items.length; i++) {
  const slide = ppt.slides.items[i];
  const png = await ppt.export({ slide, format: 'png', scale: 1 });
  await fs.writeFile(path.join(BUILD_DIR, 'slide-' + (i + 1) + '.png'), new Uint8Array(await png.arrayBuffer()));
  const layout = await slide.export({ format: 'layout' });
  await fs.writeFile(path.join(BUILD_DIR, 'slide-' + (i + 1) + '.layout.json'), await layout.text());
}

const result = await finalizePresentation({
  workspaceDir,
  candidatePath,
  finalPath: FINAL_PPTX,
  pythonExecutable: RUNTIME_PYTHON,
  integrityValidatorPath: path.join(SKILL_DIR, 'container_tools/inspect_presentation_package_integrity.py'),
  layoutValidatorPath: path.join(SKILL_DIR, 'container_tools/inspect_presentation_layout_geometry.py'),
  layoutArgs: ['--expected-slide-size-emu', '12192000,6858000', '--validate-heading-fit'],
  explicitTotalSlideCount: 17,
  fontPolicy: { basis: 'reference', families: [FONT], referencePath, referenceSha256 },
  verifyArtifactToolImport: true,
  receiptPath: path.join(BUILD_DIR, 'RisetTI_Pengenalan_Produk_dan_Manajemen_Proyek_Trello-Lengkap.validation.json')
});
console.log(JSON.stringify(result, null, 2));
