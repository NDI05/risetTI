# RisetTI

RisetTI membantu mahasiswa TI menelusuri katalog tugas akhir dan menyusun lembar informasi awal untuk ide yang sedang dipertimbangkan. Aplikasi ini tidak melacak progres skripsi, mengatur bimbingan, atau menilai persetujuan akademik.

## Menjalankan lokal

Kebutuhan: Node.js 22 atau lebih baru dan npm.

```sh
npm ci
cp .env.example .env
```

Isi `ADMIN_EMAIL` dan `ADMIN_PASSWORD` pada `.env` untuk membuat akun admin katalog awal. Kata sandi minimal 12 karakter. Pendaftaran di aplikasi selalu membuat akun mahasiswa. Akun admin yang sudah ada tidak diubah saat aplikasi dimulai ulang.

```sh
npm run dev
```

Buka <http://127.0.0.1:3000>. Aplikasi mengikat loopback secara default. Database dibuat otomatis di `./data/risetti.sqlite`; atur `DATABASE_PATH` untuk mengubah lokasinya. AI menggunakan Ollama lokal jika layanan dan model tersedia. Perintah berikut mengunduh model default:

```sh
ollama pull gemma4:e2b-it-q4_K_M
```

Jika Ollama atau model tidak tersedia, pencarian katalog, shortlist, dan pengisian manual tetap berfungsi.

## Deployment Cloudflare Workers + D1 + Workers AI

Cloudflare memakai backend Worker tersendiri agar API tetap kompatibel dengan antarmuka yang sama. Berkas statis disajikan oleh Workers Assets, data berada di D1, dan model default adalah `@cf/meta/llama-3.1-8b-instruct-fast` untuk menekan biaya inferensi sambil mempertahankan JSON Mode. Jalur Express, SQLite, dan Ollama lokal tetap tersedia untuk pengembangan di Mac.

### Persiapan akun dan database

Perlu Node.js 22+, npm, dan akun Cloudflare. Instal dependensi, masuk lewat Wrangler, lalu buat database D1 baru bernama `risetti-db`:

```sh
npm ci
npx wrangler login
npm run cf:db:create
```

Salin `database_id` yang ditampilkan Wrangler ke objek `d1_databases` di `wrangler.jsonc`. Pastikan namanya tetap `risetti-db`. Buat dua secret acak secara lokal dan simpan dengan perintah berikut; jangan masukkan nilainya ke Git:

```sh
npx wrangler secret put ADMIN_SETUP_TOKEN
npx wrangler secret put AUTH_RATE_LIMIT_SECRET
```

Jalankan `npm run cf:deploy`. Perintah tersebut menerapkan migrasi D1 lalu mengunggah Worker beserta aset web. Migrasi membuat tabel dan menambahkan **32 rekaman katalog awal** dari ETD UGM. Migrasi tidak memindahkan akun, shortlist, atau ide yang tersimpan di SQLite lokal.

Jika katalog cloud perlu diperluas untuk uji pencarian, importer dapat mengambil artikel jurnal yang abstraknya tersedia dan secara eksplisit berlisensi CC BY 4.0 dari Crossref, lalu menulisnya langsung ke D1. Jalur ini tidak memerlukan API key; akun Cloudflare harus sudah terautentikasi di Wrangler dan database D1 sudah termigrasi:

```sh
npm run import:catalog -- --source crossref --target cloudflare --limit 3000
```

Skrip mengirim batch kecil, mencatat nama jurnal dan DOI, mempertahankan rekaman yang sudah ada, dan mengabaikan DOI duplikat. Batas target maksimal 100.000 rekaman per proses. Akun serta ide mahasiswa tidak disentuh. OpenAlex juga tersedia lewat `--source openalex`; API key gratis yang sudah diverifikasi diperlukan untuk kueri skala besar.

### Membuat admin pertama

Setelah deployment selesai, buat akun admin pertama satu kali melalui endpoint penyiapan. Gunakan token yang sama dengan secret `ADMIN_SETUP_TOKEN`; isi email dan kata sandi lewat terminal lokal, jangan lewat chat:

```sh
curl -X POST https://NAMA-WORKER.workers.dev/api/auth/admin-setup \
  -H 'Content-Type: application/json' \
  -d '{"setupToken":"TOKEN-ANDA","name":"Admin RisetTI","email":"admin@example.org","password":"KATA-SANDI-PANJANG-UNIK"}'
```

Endpoint otomatis tertutup setelah admin pertama dibuat. Setelah itu, masuk melalui tombol **Masuk** di website. Pendaftaran umum hanya membuat akun mahasiswa.

### Preview dan pembaruan

Untuk memakai D1 lokal Wrangler:

```sh
npm run cf:migrate:local
npm run cf:dev
```

Workers AI memakai model yang ditetapkan pada `AI_MODEL` di `wrangler.jsonc`. Ganti model hanya dengan model yang tersedia untuk akun dan mendukung JSON Mode. Inferensi AI selalu menghubungi Cloudflare, termasuk saat `wrangler dev`, dan menggunakan kuota akun. Worker memeriksa bentuk JSON dan ID sitasi sebelum mengembalikan hasil. Keluaran AI tetap draf, bukan penilaian kelayakan.

Untuk memeriksa tipe Worker setelah mengubah binding:

```sh
npm run cf:typegen
npm run cf:typecheck
```

Workers Free memiliki batas CPU 10 ms per request; Workers AI gratis memiliki alokasi 10.000 Neurons per hari, dan penggunaan yang melebihi batas harian berhenti sampai kuota direset. D1 Free mencakup 5 juta baris terbaca dan 100.000 baris tertulis per hari. Beban, panjang masukan katalog, dan model AI dapat membuat kuota ini cepat habis saat dipakai banyak orang. Hash kata sandi menggunakan PBKDF2 310.000 iterasi melalui Web Crypto; karena CPU Worker Free dibatasi 10 ms, pastikan signup dan login lolos pada deployment akun Anda. Untuk penggunaan produksi yang stabil, Workers Paid memberi batas CPU yang lebih longgar dan mulai dari biaya bulanan $5. Pantau metrik dan error di dashboard Cloudflare.

Kata sandi pada D1 memakai PBKDF2 melalui Web Crypto; akun lokal memakai scrypt. Data akun lokal tidak kompatibel untuk disalin langsung ke D1 dan sengaja tidak dimigrasikan otomatis.

## Deployment satu server

Deployment yang disediakan memakai Docker Compose, satu proses aplikasi, satu file SQLite di volume persisten, Ollama pada jaringan internal, Caddy untuk HTTPS, dan layanan backup harian. Arsitektur ini sesuai untuk pilot atau penggunaan satu server. Jangan menjalankan beberapa replika aplikasi yang berbagi file SQLite.

Siapkan server Linux dengan Docker Engine dan Docker Compose v2. Arahkan DNS domain ke server dan izinkan koneksi masuk TCP 80/443. Siapkan `.env` dari contoh, lalu isi domain dan kredensial admin:

```sh
cp .env.example .env
```

Atur `DOMAIN`, `ADMIN_EMAIL`, dan `ADMIN_PASSWORD` di `.env`. Gunakan kata sandi unik yang disimpan di password manager. `COOKIE_SECURE=true` dan `TRUST_PROXY_HOPS=1` diterapkan oleh Compose; aplikasi production menolak startup jika cookie aman atau akun admin belum dikonfigurasi.

Bangun dan jalankan layanan:

```sh
docker compose config --quiet
docker compose up -d --build
docker compose --profile setup run --rm ollama-model
docker compose ps
```

Unduhan model dapat memerlukan beberapa gigabyte dan waktunya tergantung koneksi serta perangkat server. Status AI terlihat pada aplikasi; endpoint pemeriksaan operasi tersedia di `/health/live` dan `/health/ready`. App hanya dapat diakses melalui Caddy; Ollama tidak dipetakan ke port publik.

Periksa log dengan:

```sh
docker compose logs -f app ollama caddy backup
```

Untuk rilis berikutnya, tarik source terbaru lalu jalankan `docker compose up -d --build`. Jangan gunakan `docker compose down --volumes` saat pembaruan karena perintah tersebut menghapus database, model, dan backup di volume.

### Backup dan pemulihan

Layanan backup membuat snapshot SQLite saat mulai, lalu mengulanginya setiap 24 jam dan menghapus snapshot lokal yang lebih lama dari `BACKUP_RETENTION_DAYS` (default 30). Snapshot dibuat melalui SQLite online backup agar konsisten dengan database yang sedang berjalan. Perintah manual:

```sh
npm run backup
```

Backup Compose tersimpan pada volume `risetti_backups` di host yang sama. Salin backup secara berkala ke penyimpanan terpisah dan terenkripsi untuk melindungi dari kerusakan atau kehilangan server.

Untuk memulihkan snapshot, hentikan aplikasi dan backup, salin file yang diinginkan dari volume backup, lalu hidupkan kembali:

```sh
docker compose stop app backup
docker compose run --rm --no-deps --entrypoint sh backup -c 'cp /backups/risetti-YYYYMMDDTHHMMSSZ.sqlite /data/risetti.sqlite && rm -f /data/risetti.sqlite-wal /data/risetti.sqlite-shm'
docker compose start app backup
```

Ganti nama file placeholder dengan snapshot yang tersedia. Pastikan pemeriksaan `/health/ready` berhasil setelah pemulihan.

## Fitur

- **Katalog:** pencarian kata kunci serta filter bidang, metode, dan teknologi; detail menunjukkan metadata sumber.
- **Shortlist:** simpan referensi, pilih maksimal delapan untuk ringkasan, dan hapus pilihan.
- **Lembar ide:** mulai dari satu kalimat, jawab pertanyaan panduan yang kontekstual, lalu sunting rancangan sebagai dokumen sebelum disimpan.
- **Admin katalog:** tambah, sunting, dan arsipkan metadata; API hanya dapat diakses akun admin.
- **Bantuan AI:** server menghubungi Ollama pada loopback atau layanan `ollama` di jaringan Compose internal. Permintaan AI dibatasi satu proses aktif dan dua antrean.

Katalog awal memuat 32 metadata karya akhir bidang TI dari [repositori ETD Universitas Gadjah Mada](https://etd.repository.ugm.ac.id/), bukan katalog nasional. Ringkasan katalog ditulis ulang secara singkat dari abstrak sumber dan tautan sumber disimpan pada tiap rekaman. Admin dapat menambah metadata dari kampus lain. Data contoh tidak boleh dianggap sebagai penelitian sungguhan.

## Pemeriksaan dan batasan

```sh
npm run lint
npm run typecheck
npm run build
npm test
```

GitHub Actions menjalankan lint, typecheck, tes API, build, dan audit dependensi production pada push ke `main` dan pull request. Aplikasi masih menggunakan SQLite satu server; untuk beberapa replika diperlukan database server dan rate-limit store bersama. Backup volume lokal bukan pengganti salinan off-site. Reset kata sandi dan verifikasi email belum tersedia.

Sesi disimpan di SQLite, kata sandi di-hash dengan scrypt, perubahan data memerlukan token CSRF, input divalidasi server-side, dan query database menggunakan parameter. Rate limiter login memakai IP yang diproses Express; secara default proxy tidak dipercaya. Atur jumlah hop hanya jika server berada di belakang reverse proxy tepercaya.
