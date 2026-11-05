import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { Presentation, PresentationFile } from '@oai/artifact-tool';

const SKILL_DIR = '/Users/user/.codex/plugins/cache/openai-primary-runtime/presentations/26.909.12148/skills/presentations';
const workspaceDir = '/Users/user/Documents/Kuliah/MANPRO';
const TMP_DIR = path.join(workspaceDir, '.pptx-build/risetti-planning');
const FINAL_PPTX = path.join(workspaceDir, 'output/pptx/risetti-perencanaan-inisiasi-gemma4.pptx');
const RUNTIME_PYTHON = '/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3';
const family = 'Times New Roman';
const { finalizePresentation } = await import(pathToFileURL(path.join(SKILL_DIR, 'container_tools/artifact_tool_utils.mjs')).href);

await fs.mkdir(TMP_DIR, { recursive: true });
await fs.mkdir(path.dirname(FINAL_PPTX), { recursive: true });
const W=1280, H=720;
const C={black:'#111111', gray:'#555555', light:'#EEEEEE', line:'#777777', white:'#FFFFFF'};
const ppt = Presentation.create({slideSize:{width:W,height:H}});

function box(slide, x,y,w,h, fill='none', stroke='none', sw=0, geometry='rect') {
  return slide.shapes.add({geometry,position:{left:x,top:y,width:w,height:h},fill,line:{style:'solid',fill:stroke,width:sw}});
}
function text(slide, txt, x,y,w,h, size=24, opts={}) {
  const s=box(slide,x,y,w,h);
  s.text=txt;
  s.text.style={typeface:family,fontSize:size,color:opts.color||C.black,bold:!!opts.bold,italic:!!opts.italic,alignment:opts.align||'left',verticalAlignment:opts.valign||'top',autoFit:'shrinkText',wrap:'square',insets:{left:opts.pad??0,right:opts.pad??0,top:opts.pad??0,bottom:opts.pad??0},lineSpacing:opts.lineSpacing??1.1};
  return s;
}
function line(slide,x1,y1,x2,y2,color=C.line,width=1.4){
  return slide.shapes.add({geometry:'line',position:{left:x1,top:y1,width:x2-x1,height:y2-y1},fill:'none',line:{style:'solid',fill:color,width}});
}
function base(title, num) {
  const s=ppt.slides.add(); s.background.fill=C.white;
  if (num>1) {
    text(s,'RISETTI  /  PERENCANAAN & INISIASI',70,30,620,22,15,{bold:true,color:C.gray});
    text(s,String(num).padStart(2,'0'),1160,30,50,22,15,{align:'right',color:C.gray});
    line(s,70,62,1210,62,C.line,1);
    text(s,title,70,86,1140,58,42,{bold:true});
  }
  return s;
}
function notes(s, txt){s.speakerNotes.textFrame.setText(txt);}
function bulletList(s, items, x,y,w, gap=56, size=25){
  let yy=y;
  for(const [i,item] of items.entries()){
    text(s,'•',x,yy,24,34,size,{bold:true});
    text(s,item,x+32,yy,w-32,gap-5,size,{lineSpacing:1.12});
    yy+=gap;
  }
}

// 1 — Title
{
 const s=ppt.slides.add(); s.background.fill=C.white;
 text(s,'PROYEK PLATFORM WEBSITE',80,86,1060,32,20,{bold:true,color:C.gray});
 text(s,'RISETTI',80,178,1060,88,68,{bold:true});
 line(s,80,286,310,286,C.black,3);
 text(s,'Perencanaan dan Inisiasi',80,322,1060,58,38,{bold:true});
 text(s,'Proses bisnis pencarian dan penyaringan ide tugas akhir mahasiswa TI',80,390,980,64,27,{color:C.gray});
 text(s,'Anggota kelompok',80,555,240,26,18,{bold:true});
 text(s,'20240140037  ·  20240140125  ·  20240140005\n20240140031  ·  20240140025  ·  20240140154',80,590,890,58,19,{lineSpacing:1.25});
 notes(s,'Presentasi ini merinci tahap perencanaan dan inisiasi untuk RisetTI. Fokus platform hanya pada pencarian referensi tugas akhir dan penyusunan informasi awal kelayakan ide.');
}
// 2 — Scope and two objectives
{
 const s=base('Fokus produk dan tujuan',2);
 text(s,'RisetTI membantu mahasiswa menemukan ide yang punya pijakan dan bisa diperiksa kelayakannya.',70,164,1090,68,29,{bold:true});
 line(s,70,252,1210,252,C.line,1);
 text(s,'TUJUAN 1',70,282,180,28,18,{bold:true,color:C.gray});
 text(s,'Menyediakan katalog tugas akhir yang dapat ditelusuri berdasarkan bidang, metode, teknologi, dan kata kunci.',70,318,510,126,27,{lineSpacing:1.14});
 line(s,630,282,630,560,C.line,1);
 text(s,'TUJUAN 2',680,282,180,28,18,{bold:true,color:C.gray});
 text(s,'Membantu mahasiswa menyusun informasi awal serta mengidentifikasi kebutuhan dan risiko ide sebelum diajukan.',680,318,510,126,27,{lineSpacing:1.14});
 text(s,'Batas fokus',70,500,180,26,18,{bold:true});
 text(s,'Katalog → telaah awal → shortlist ide. Platform berhenti sebelum pengajuan formal dan tidak mengelola progres tugas akhir.',70,534,1120,78,22,{color:C.gray});
 notes(s,'Tujuan produk mengikuti dua tujuan yang ditegaskan pengguna dari dokumen proposal. Tidak ada tujuan ketiga untuk pelacakan bimbingan atau manajemen pengerjaan skripsi.');
}
// 3 — Business workflow
{
 const s=base('Alur bisnis pencarian ide',3);
 text(s,'Satu alur berakhir pada ringkasan ide yang siap dibawa untuk diskusi awal.',70,158,1100,42,25,{color:C.gray});
 const xs=[75,310,545,780,1015]; const yy=250; const bw=185; const bh=166;
 const steps=[
  ['01','Tentukan arah','Bidang minat dan pengalaman kuliah'],
  ['02','Telusuri','Cari berdasarkan bidang, metode, teknologi, kata kunci'],
  ['03','Bandingkan','Simpan referensi yang paling dekat dengan minat'],
  ['04','Uji awal','Catat kebutuhan, akses, waktu, dan risiko'],
  ['05','Rangkum ide','Susun shortlist dan lembar ringkas ide'],
 ];
 steps.forEach((st,i)=>{
   text(s,st[0],xs[i],yy,bw,32,20,{bold:true,color:C.gray});
   line(s,xs[i],yy+38,xs[i]+bw,yy+38,C.black,2);
   text(s,st[1],xs[i],yy+54,bw,38,24,{bold:true});
   text(s,st[2],xs[i],yy+100,bw,82,19,{color:C.gray,lineSpacing:1.08});
   if(i<steps.length-1) text(s,'→',xs[i]+bw+12,yy+74,34,40,27,{bold:true,align:'center'});
 });
 line(s,75,478,1200,478,C.line,1);
 text(s,'HASIL',75,506,100,24,17,{bold:true,color:C.gray});
 text(s,'Kumpulan referensi tersaring + satu lembar informasi awal untuk setiap ide yang dipertimbangkan.',75,540,1080,55,26,{bold:true});
 notes(s,'Urutan proses merupakan rancangan awal bisnis yang perlu diuji melalui wawancara mahasiswa dan dosen sasaran. Lembar ide bukan persetujuan akademik.');
}
// 4 — Initiation
{
 const s=base('Inisiasi proyek',4);
 text(s,'Sebelum desain dan coding, pastikan masalah, pengguna, dan sumber katalog jelas.',70,158,1100,42,25,{color:C.gray});
 const leftX=80, rightX=675;
 text(s,'KEGIATAN',80,228,220,28,18,{bold:true});
 const acts=[
   ['Tetapkan masalah','Mahasiswa sulit menelusuri contoh TA dan membandingkan apakah ide awalnya realistis. Validasi rumusan ini lewat wawancara.'],
   ['Tentukan pengguna','Mahasiswa TI sebagai pengguna utama; dosen atau pengelola prodi sebagai narasumber dan calon kurator referensi.'],
   ['Periksa sumber data','Pastikan metadata/abstrak TA dapat digunakan, punya sumber jelas, dan tidak menampilkan dokumen terbatas.'],
   ['Buat project charter','Catat tujuan, batas MVP, pihak terkait, asumsi, risiko, dan kriteria lanjut/tunda.'],
 ];
 let y=274;
 for(const [h,b] of acts){ text(s,h,leftX,y,490,29,22,{bold:true}); text(s,b,leftX,y+33,500,64,18,{color:C.gray,lineSpacing:1.08}); y+=104; }
 line(s,620,224,620,634,C.line,1);
 text(s,'HASIL INISIASI',675,228,360,28,18,{bold:true});
 text(s,'Project charter\nRumusan masalah yang sudah dibahas dengan calon pengguna.\n\nDaftar pihak terkait\nMahasiswa, dosen pembimbing/narasumber, pengelola prodi.\n\nKeputusan lanjut\nSepakati akses referensi dan satu skenario pencarian untuk diuji.',675,274,490,295,22,{lineSpacing:1.16});
 text(s,'Gerbang keputusan: lanjut ke perencanaan rinci bila ada pengguna yang mengonfirmasi masalah dan data katalog dapat digunakan.',675,575,490,60,17,{bold:true,color:C.gray});
 notes(s,'Klaim masalah pada slide ini diperlakukan sebagai hipotesis kerja, bukan hasil riset pengguna yang sudah dilakukan. Tim perlu mengujinya pada tahap inisiasi.');
}
// 5 — Planning scope / deliverable
{
 const s=base('Perencanaan: apa yang dibangun',5);
 text(s,'Ruang lingkup MVP dibatasi pada dua kemampuan produk.',70,158,1100,40,25,{color:C.gray});
 text(s,'MASUK MVP',80,228,240,28,18,{bold:true});
 line(s,80,266,575,266,C.black,2);
 bulletList(s,[
  'Katalog tugas akhir dengan metadata bidang, metode, teknologi, kata kunci, tahun, dan sumber.',
  'Pencarian dan filter; buka ringkasan referensi yang diizinkan.',
  'Formulir lembar ide: masalah, calon pengguna/data, metode awal, kebutuhan teknis, waktu, dan risiko.',
  'Simpan dan bandingkan beberapa ide dalam shortlist.'
 ],80,288,500,70,21);
 line(s,635,225,635,612,C.line,1);
 text(s,'DI LUAR MVP',680,228,280,28,18,{bold:true});
 line(s,680,266,1190,266,C.black,2);
 bulletList(s,[
  'Persetujuan judul atau rekomendasi akademik otomatis.',
  'Pelacakan bimbingan, milestone skripsi, dan monitoring progres.',
  'Penulisan skripsi otomatis atau pemeriksaan plagiarisme.',
  'Integrasi SIAKAD dan aplikasi seluler.'
 ],680,288,500,70,21);
 notes(s,'Tujuan dan scope mengikuti klarifikasi terbaru pengguna. Shortlist dan formulir ide adalah cara mewujudkan dua tujuan, bukan sasaran produk tambahan.');
}
// 6 — Methods and tools
{
 const s=base('Metode kerja dan tools kolaborasi',6);
 text(s,'Metode untuk memahami kebutuhan, lalu mengembangkan MVP secara bertahap.',70,158,1100,40,25,{color:C.gray});
 text(s,'METODE',80,222,180,25,18,{bold:true});
 text(s,'Design Thinking',80,258,330,36,26,{bold:true});
 text(s,'Empathize → Define → Ideate → Prototype → Test',80,298,500,34,20,{color:C.gray});
 text(s,'Dipakai saat inisiasi untuk menggali masalah pencarian ide, merancang alur, dan menguji prototipe dengan mahasiswa.',80,340,485,84,19,{lineSpacing:1.12});
 text(s,'Agile / Scrum ringan',80,440,360,35,26,{bold:true});
 text(s,'Backlog → Sprint → Review → Perbaiki',80,480,490,33,20,{color:C.gray});
 text(s,'Sprint 1-2 minggu; review singkat tiap akhir sprint. Prioritas awal: katalog, pencarian, lalu lembar kelayakan ide.',80,520,485,74,19,{lineSpacing:1.12});
 line(s,620,220,620,618,C.line,1);
 text(s,'TOOLS KOLABORASI',675,222,350,25,18,{bold:true});
 const rows=[
  ['Google Docs / Drive','Charter, kebutuhan, catatan wawancara, sumber referensi'],
  ['Trello','Backlog, tugas sprint, PIC, status kerja'],
  ['Figma','Alur pengguna dan prototipe yang diuji'],
  ['GitHub','Repositori, isu teknis, perubahan kode'],
  ['WhatsApp / Meet','Koordinasi cepat dan wawancara jarak jauh'],
 ];
 let ry=266;
 rows.forEach(([a,b],i)=>{
   text(s,a,675,ry,205,30,20,{bold:true}); text(s,b,880,ry,300,48,18,{color:C.gray,lineSpacing:1.06});
   if(i<rows.length-1) line(s,675,ry+53,1180,ry+53,'#BBBBBB',0.8);
   ry+=70;
 });
 notes(s,'Daftar tools adalah usulan praktis untuk tim, bukan ketergantungan produk. Tim dapat mengganti tools sesuai akses kampus dan kebiasaan anggota.');
}
// 7 — Local AI deployment
{
 const s=base('AI lokal sebagai asisten ide',7);
 text(s,'Gemma 4 membantu menyusun ringkasan awal berdasarkan data katalog; hasilnya tetap perlu diperiksa.',70,158,1100,42,24,{color:C.gray});
 text(s,'TUGAS YANG DIBANTU',80,226,400,26,18,{bold:true});
 text(s,'•  Mengubah pertanyaan mahasiswa menjadi kata kunci pencarian.\n\n•  Merangkum referensi yang ditemukan katalog.\n\n•  Mengisi draf lembar ide: masalah, data, metode, kebutuhan teknis, dan risiko.',80,266,505,264,22,{lineSpacing:1.15});
 line(s,620,222,620,612,C.line,1);
 text(s,'ALUR MODEL LOKAL',675,226,350,26,18,{bold:true});
 const flow=[['1','Website RisetTI'],['2','Backend aplikasi'],['3','Ollama di host lokal'],['4','Gemma 4 E2B']];
 let fy=272;
 for(let i=0;i<flow.length;i++){
   text(s,flow[i][0],680,fy+4,30,28,18,{bold:true,color:C.gray});
   text(s,flow[i][1],724,fy,390,34,23,{bold:true});
   if(i<flow.length-1){ line(s,698,fy+34,698,fy+57,C.line,1.2); }
   fy+=69;
 }
 line(s,675,555,1180,555,C.line,1);
 text(s,'Mulai dengan gemma4:e2b-it-q4_K_M (file model sekitar 4,6 GB). Perangkat yang menjalankan Ollama harus aktif dan dapat diakses backend; localhost di laptop anggota tidak otomatis tersedia bagi pengguna lain.',675,574,505,70,17,{color:C.gray,lineSpacing:1.1});
 text(s,'Batas: AI hanya menyarankan draf dari referensi yang diambil katalog. Tampilkan sumbernya; jangan keluarkan penilaian kelayakan final.',80,566,505,65,18,{bold:true});
 notes(s,'Model yang dipilih mengikuti keputusan pengguna: Gemma 4 dijalankan secara lokal. Gemma 4 berlisensi Apache 2.0 dan tersedia sebagai open weights dengan varian E2B/E4B yang ditujukan untuk deployment perangkat edge. Varian Ollama gemma4:e2b-it-q4_K_M tercatat berukuran sekitar 4.6 GB. Ukuran file model bukan jaminan kebutuhan RAM runtime. Sumber: https://ai.google.dev/gemma/docs/core/model_card_4 ; https://ai.google.dev/gemma/docs/core ; https://ollama.com/library/gemma4/tags.');
}
// 8 — work plan and members
{
 const s=base('Rencana awal dan pembagian kerja',8);
 text(s,'Empat tahap awal membawa tim dari validasi masalah ke prototipe yang dapat dicoba.',70,158,1100,40,25,{color:C.gray});
 const data=[
  ['Minggu 1','Validasi kebutuhan','Wawancara pengguna, charter, data referensi'],
  ['Minggu 2','Rancang proses','Alur pencarian, kriteria metadata, wireframe'],
  ['Minggu 3','Bangun inti','Katalog dan pencarian/filter'],
  ['Minggu 4','Uji formulir ide','Lembar kebutuhan/risiko dan evaluasi pengguna'],
 ];
 let y=220;
 data.forEach((r,i)=>{
  text(s,r[0],80,y,130,28,18,{bold:true,color:C.gray});
  text(s,r[1],230,y,240,30,22,{bold:true});
  text(s,r[2],485,y,675,40,19,{color:C.gray});
  line(s,80,y+50,1180,y+50,'#AAAAAA',0.8);
  y+=67;
 });
 text(s,'ANGGOTA DAN TANGGUNG JAWAB',80,505,540,26,18,{bold:true});
 const team=[
  ['20240140037','Koordinasi produk dan analisis kebutuhan'],
  ['20240140125','Riset pengguna dan desain alur'],
  ['20240140005','Pengembangan frontend'],
  ['20240140031','Backend dan basis data'],
  ['20240140025','Kurasi metadata katalog'],
  ['20240140154','QA, integrasi, dan deployment'],
 ];
 const cols=[[80,570],[660,570]];
 team.forEach((item,i)=>{
  const col=i<3?0:1, row=i%3, xx=cols[col][0], yy=545+row*40;
  text(s,item[0],xx,yy,150,26,17,{bold:true}); text(s,item[1],xx+150,yy,390,34,17,{color:C.gray});
 });
 notes(s,'Jadwal empat minggu merupakan rancangan awal untuk membantu perencanaan. Perlu disesuaikan setelah beban kuliah, ketersediaan anggota, dan akses data dikonfirmasi. Pembagian peran mengikuti struktur yang sudah tercantum dalam proposal.');
}

const candidatePath=path.join(TMP_DIR,'candidate.pptx');
await (await PresentationFile.exportPptx(ppt)).save(candidatePath);
for (let i=0;i<ppt.slides.items.length;i++) {
 const slide=ppt.slides.items[i];
 const png=await ppt.export({slide,format:'png',scale:1});
 await fs.writeFile(path.join(TMP_DIR,`slide-${i+1}.png`),new Uint8Array(await png.arrayBuffer()));
 const layout=await slide.export({format:'layout'});
 await fs.writeFile(path.join(TMP_DIR,`slide-${i+1}.layout.json`),await layout.text());
}
const finalizerDir=path.join(workspaceDir,'.pptx-build/risetti-validation');
await fs.mkdir(finalizerDir,{recursive:true});
const result=await finalizePresentation({
 workspaceDir,
 candidatePath,
 finalPath:FINAL_PPTX,
 pythonExecutable:RUNTIME_PYTHON,
 integrityValidatorPath:path.join(SKILL_DIR,'container_tools/inspect_presentation_package_integrity.py'),
 layoutValidatorPath:path.join(SKILL_DIR,'container_tools/inspect_presentation_layout_geometry.py'),
 layoutArgs:['--expected-slide-size-emu','12192000,6858000','--validate-heading-fit'],
 explicitTotalSlideCount:8,
 fontPolicy:{basis:'user_request',families:[family]},
 verifyArtifactToolImport:true,
 receiptPath:path.join(finalizerDir,'risetti-perencanaan-inisiasi-gemma4.validation.json'),
});
console.log(JSON.stringify(result,null,2));
