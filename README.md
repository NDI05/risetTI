# RisetTI

RisetTI membantu mahasiswa TI menelusuri katalog tugas akhir dan menyusun lembar informasi awal untuk ide yang sedang dipertimbangkan. Aplikasi ini tidak melacak progres skripsi, mengatur bimbingan, atau menilai persetujuan akademik.

## Kebutuhan

- Node.js 22 atau lebih baru dan npm.
- SQLite disimpan lokal di komputer yang menjalankan aplikasi.
- Ollama dan model Gemma 4 hanya diperlukan untuk bantuan AI. Katalog, shortlist, dan lembar ide manual tetap berfungsi tanpa Ollama.

## Menjalankan aplikasi

```sh
npm install
cp .env.example .env
```

Isi `ADMIN_EMAIL` dan `ADMIN_PASSWORD` pada `.env` untuk membuat akun admin katalog awal. Kata sandi minimal 12 karakter. Akun dibuat ketika aplikasi pertama kali berjalan dengan alamat email tersebut; mengubah nilai environment setelah akun dibuat tidak mengganti kata sandi akun yang sudah ada. Pendaftaran di aplikasi selalu membuat peran mahasiswa.

Gunakan alamat admin yang belum terdaftar sebagai mahasiswa. Jika email itu sudah memiliki akun mahasiswa, proses bootstrap tidak menaikkan perannya.

Jalankan mode pengembangan:

```sh
npm run dev
```

Buka <http://127.0.0.1:3000>. Aplikasi mengikat `127.0.0.1` secara default agar tidak terbuka ke jaringan. Untuk alamat lain, atur `HOST` secara sengaja. Gunakan HTTPS sebelum mengatur `COOKIE_SECURE=true`.

Basis data dibuat otomatis pada `./data/risetti.sqlite`. Atur `DATABASE_PATH` bila ingin menyimpannya di tempat lain. Database baru diisi 32 metadata karya akhir bidang TI dari [repositori ETD Universitas Gadjah Mada](https://etd.repository.ugm.ac.id/). Setiap entri memuat tautan ke rekaman sumber; ringkasan katalog ditulis ulang secara singkat dari abstrak sumber. Ini adalah koleksi awal dari satu repositori, bukan katalog nasional, dan admin dapat menambahkan metadata dari kampus lain.

Saat startup pertama setelah pembaruan katalog, lima baris sintetis dari versi demo lama dikeluarkan dari katalog. Referensi demo yang tersimpan di shortlist atau lembar ide dipindahkan ke rekaman nyata bertopik paling dekat. Akun, sesi, dan isi lembar ide dipertahankan. Pencarian beberapa kata mencocokkan setiap kata di judul, ringkasan, penulis, institusi, sumber, atau tag; filter bidang, metode, dan teknologi tetap digabungkan dengan kondisi AND.

## Mengaktifkan AI lokal

Instal Ollama, jalankan layanan Ollama di komputer yang sama, lalu tarik model yang dikonfigurasi:

```sh
ollama pull gemma4:e2b-it-q4_K_M
```

Nilai awal di `.env.example` adalah:

```dotenv
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=gemma4:e2b-it-q4_K_M
```

Keduanya dapat diubah melalui environment variable. Untuk mencegah data mahasiswa terkirim ke layanan eksternal, server hanya menerima alamat Ollama loopback (`localhost`, `127.0.0.1`, atau `::1`). Browser hanya memanggil API RisetTI; URL Ollama tidak pernah dikirim ke browser.

AI hanya aktif saat mahasiswa memintanya. AI dapat menyarankan kata kunci, membandingkan ringkasan referensi terpilih, atau memandu penyusunan ide. Alur ide dimulai dari satu kalimat; AI membuat 3–5 pertanyaan kontekstual yang dapat ditambah atau dihapus (maksimal delapan), lalu menyusun hasil terstruktur yang dibaca sebagai dokumen dan dapat disunting sebelum disimpan. Setidaknya satu jawaban diperlukan agar hasil tidak hanya mengulang judul. Referensi untuk alur ide bersifat opsional; bila dipilih, backend mengambil rekaman aktif dari katalog dan mengirim hanya metadata tersebut kepada model. Tautan sumber ditambahkan kembali dari basis data oleh server.

Jika Ollama atau model tidak tersedia, header menampilkan statusnya. Pencarian/filter katalog, shortlist, dan pengisian manual tetap dapat dipakai.

## Alur yang tersedia

- **Katalog:** pencarian kata kunci serta filter bidang, metode, dan teknologi; halaman detail menunjukkan metadata sumber.
- **Shortlist:** simpan referensi, pilih maksimal delapan untuk ringkasan perbandingan, dan hapus pilihan.
- **Lembar ide:** tulis ide awal, jawab pertanyaan panduan yang sesuai konteks, lalu baca dan sunting rancangan masalah, konteks/pengguna, data, metode, teknologi, kebutuhan, sumber daya, serta risiko dan validasi.
- **Admin katalog:** tambah, sunting, dan arsipkan metadata; hanya akun berperan admin yang dapat mengakses API ini.
- **Bantuan AI:** semua panggilan dilakukan oleh server ke Ollama lokal dan memerlukan tindakan eksplisit mahasiswa.

## Pemeriksaan proyek

```sh
npm run lint
npm run typecheck
npm test
npm run build
```

Jalankan hasil build dengan `npm start`. Build menyalin antarmuka ke `dist/public`; basis data tetap menggunakan `DATABASE_PATH`.

## Catatan keamanan dan batasan

- Validasi input dilakukan pada server, query SQLite menggunakan parameter, sesi disimpan dalam SQLite, kata sandi di-hash dengan scrypt, dan perubahan data memerlukan token CSRF.
- Pembuatan akun publik hanya memberikan peran mahasiswa. Admin awal dibuat melalui environment variable saat startup pertama.
- Data contoh tidak boleh dianggap sebagai penelitian sungguhan. Metadata penelitian nyata harus dikurasi admin dari sumber yang memang boleh ditampilkan.
- Aplikasi ini adalah MVP lokal dengan satu proses server dan satu berkas SQLite; belum mencakup deployment multi-server, reset kata sandi, verifikasi email, atau backup basis data otomatis.
