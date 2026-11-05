INSERT OR IGNORE INTO catalog_references
  (title, authors, year, institution, summary, source_name, source_url, external_id, doi, license, language, is_demo, created_at, updated_at)
  VALUES ('PENGEMBANGAN SISTEM INFORMASI LABORATORIUM RSH. PROF. SOEPARWI BERBASIS WEBSITE', 'Fransiskus Xaverius A.H.', 2018, 'Universitas Gadjah Mada', 'Mengembangkan aplikasi web untuk pencatatan pasien dan dokumentasi hasil pemeriksaan laboratorium rumah sakit hewan. Sumber menyebut Rapid Application Development, prototipe dengan umpan balik pengguna, dan uji black-box.', 'ETD Universitas Gadjah Mada', 'https://etd.repository.ugm.ac.id/penelitian/detail/159732', 'ugm-etd:159732', NULL, NULL, NULL, 0, '2026-11-05T14:14:56.630Z', '2026-11-05T14:14:56.630Z');

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'domain', 'Sistem Informasi' FROM catalog_references WHERE external_id = 'ugm-etd:159732';

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'method', 'Rapid Application Development' FROM catalog_references WHERE external_id = 'ugm-etd:159732';

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'method', 'Prototyping' FROM catalog_references WHERE external_id = 'ugm-etd:159732';

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'method', 'Black-box testing' FROM catalog_references WHERE external_id = 'ugm-etd:159732';

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'technology', 'Web' FROM catalog_references WHERE external_id = 'ugm-etd:159732';

INSERT OR IGNORE INTO catalog_references
  (title, authors, year, institution, summary, source_name, source_url, external_id, doi, license, language, is_demo, created_at, updated_at)
  VALUES ('Pengembangan Back-end dan Pengelolaan Database Sistem Informasi', 'M. Hassan Fauzi N.', 2020, 'Universitas Gadjah Mada', 'Membahas sistem SIGURU untuk pengarsipan digital dan pengumuman sekolah. Pengembangannya menggunakan pendekatan lean startup dan kebutuhan pengguna digali melalui wawancara.', 'ETD Universitas Gadjah Mada', 'https://etd.repository.ugm.ac.id/penelitian/detail/192209', 'ugm-etd:192209', NULL, NULL, NULL, 0, '2026-11-05T14:14:56.630Z', '2026-11-05T14:14:56.630Z');

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'domain', 'Sistem Informasi' FROM catalog_references WHERE external_id = 'ugm-etd:192209';

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'method', 'Lean startup' FROM catalog_references WHERE external_id = 'ugm-etd:192209';

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'method', 'Wawancara pengguna' FROM catalog_references WHERE external_id = 'ugm-etd:192209';

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'technology', 'Web' FROM catalog_references WHERE external_id = 'ugm-etd:192209';

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'technology', 'Cloud storage' FROM catalog_references WHERE external_id = 'ugm-etd:192209';

INSERT OR IGNORE INTO catalog_references
  (title, authors, year, institution, summary, source_name, source_url, external_id, doi, license, language, is_demo, created_at, updated_at)
  VALUES ('Pengembangan Fitur Pelaporan Sistem Informasi Internal Untuk Subsistem Penerbitan UGM Press Menggunakan Teknologi Chart.js', 'Syuhada Sipayung', 2019, 'Universitas Gadjah Mada', 'Membangun pelaporan daring untuk mengotomatiskan rekap penerbitan buku UGM Press dan menyajikannya dalam grafik pada Sistem Informasi GAMA Press (SIGAP).', 'ETD Universitas Gadjah Mada', 'https://etd.repository.ugm.ac.id/penelitian/detail/171813', 'ugm-etd:171813', NULL, NULL, NULL, 0, '2026-11-05T14:14:56.630Z', '2026-11-05T14:14:56.630Z');

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'domain', 'Sistem Informasi' FROM catalog_references WHERE external_id = 'ugm-etd:171813';

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'method', 'Pengembangan fitur' FROM catalog_references WHERE external_id = 'ugm-etd:171813';

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'technology', 'Chart.js' FROM catalog_references WHERE external_id = 'ugm-etd:171813';

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'technology', 'Web' FROM catalog_references WHERE external_id = 'ugm-etd:171813';

INSERT OR IGNORE INTO catalog_references
  (title, authors, year, institution, summary, source_name, source_url, external_id, doi, license, language, is_demo, created_at, updated_at)
  VALUES ('Pengembangan Sistem Informasi Manajemen Obat-Obatan Berbasis Web pada Fasilitas Pelayanan Kesehatan', 'Agustina Asmoro Putri', 2024, 'Universitas Gadjah Mada', 'Mengembangkan sistem web untuk pengelolaan obat, pembelian, penjualan, stok, dan laporan apotek. Abstrak menyebut arsitektur three-tier, pola MVC, CodeIgniter, MySQL, dan SDLC hybrid agile-waterfall.', 'ETD Universitas Gadjah Mada', 'https://etd.repository.ugm.ac.id/penelitian/detail/246873', 'ugm-etd:246873', NULL, NULL, NULL, 0, '2026-11-05T14:14:56.630Z', '2026-11-05T14:14:56.630Z');

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'domain', 'Sistem Informasi' FROM catalog_references WHERE external_id = 'ugm-etd:246873';

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'method', 'Agile-waterfall' FROM catalog_references WHERE external_id = 'ugm-etd:246873';

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'method', 'Pengembangan sistem' FROM catalog_references WHERE external_id = 'ugm-etd:246873';

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'technology', 'Web' FROM catalog_references WHERE external_id = 'ugm-etd:246873';

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'technology', 'CodeIgniter' FROM catalog_references WHERE external_id = 'ugm-etd:246873';

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'technology', 'MySQL' FROM catalog_references WHERE external_id = 'ugm-etd:246873';

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'technology', 'MVC' FROM catalog_references WHERE external_id = 'ugm-etd:246873';

INSERT OR IGNORE INTO catalog_references
  (title, authors, year, institution, summary, source_name, source_url, external_id, doi, license, language, is_demo, created_at, updated_at)
  VALUES ('Pengembangan dan Evaluasi Prototipe Sub Sistem Billing Sistem Informasi Manajemen Rumah Sakit Hewan Prof. Soeparwi', 'Farida Setianingsih', 2016, 'Universitas Gadjah Mada', 'Merancang prototipe billing untuk mencatat transaksi rumah sakit hewan, menghasilkan nota, dan menyimpan dokumentasi. Sumber menyebut UML, Rapid Application Development, kuesioner, serta black-box testing.', 'ETD Universitas Gadjah Mada', 'https://etd.repository.ugm.ac.id/penelitian/detail/104613', 'ugm-etd:104613', NULL, NULL, NULL, 0, '2026-11-05T14:14:56.630Z', '2026-11-05T14:14:56.630Z');

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'domain', 'Sistem Informasi' FROM catalog_references WHERE external_id = 'ugm-etd:104613';

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'method', 'Rapid Application Development' FROM catalog_references WHERE external_id = 'ugm-etd:104613';

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'method', 'Prototyping' FROM catalog_references WHERE external_id = 'ugm-etd:104613';

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'method', 'Black-box testing' FROM catalog_references WHERE external_id = 'ugm-etd:104613';

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'method', 'Kuesioner' FROM catalog_references WHERE external_id = 'ugm-etd:104613';

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'technology', 'PHP' FROM catalog_references WHERE external_id = 'ugm-etd:104613';

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'technology', 'CodeIgniter' FROM catalog_references WHERE external_id = 'ugm-etd:104613';

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'technology', 'MySQL' FROM catalog_references WHERE external_id = 'ugm-etd:104613';

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'technology', 'Web' FROM catalog_references WHERE external_id = 'ugm-etd:104613';

INSERT OR IGNORE INTO catalog_references
  (title, authors, year, institution, summary, source_name, source_url, external_id, doi, license, language, is_demo, created_at, updated_at)
  VALUES ('PENGEMBANGAN FRONT-END SISTEM INFORMASI INVESTIGASI PENYEBARAN WABAH PENYAKIT BERBASIS WEB MENGGUNAKAN FRAMEWORK EXPRESS.JS', 'Kharisma Prasetya', 2018, 'Universitas Gadjah Mada', 'Mengembangkan antarmuka web untuk pertukaran dan visualisasi informasi investigasi wabah penyakit. Judul karya menyebut framework Express.js.', 'ETD Universitas Gadjah Mada', 'https://etd.repository.ugm.ac.id/penelitian/detail/159789', 'ugm-etd:159789', NULL, NULL, NULL, 0, '2026-11-05T14:14:56.630Z', '2026-11-05T14:14:56.630Z');

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'domain', 'Rekayasa Perangkat Lunak' FROM catalog_references WHERE external_id = 'ugm-etd:159789';

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'method', 'Pengembangan aplikasi' FROM catalog_references WHERE external_id = 'ugm-etd:159789';

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'technology', 'Express.js' FROM catalog_references WHERE external_id = 'ugm-etd:159789';

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'technology', 'Web' FROM catalog_references WHERE external_id = 'ugm-etd:159789';

INSERT OR IGNORE INTO catalog_references
  (title, authors, year, institution, summary, source_name, source_url, external_id, doi, license, language, is_demo, created_at, updated_at)
  VALUES ('BACK-END SISTEM INFORMASI BERBASIS RESTFUL WEB SERVICE API MENGGUNAKAN TEKNOLOGI NODE.JS (STUDI KASUS SISTEM INFORMASI INVESTIGASI OUTBREAK PENYAKIT)', 'Muhammad Rifqi Zuliansyah', 2018, 'Universitas Gadjah Mada', 'Mengembangkan back-end dan API RESTful berbasis Node.js untuk sistem investigasi outbreak, dengan fokus pada penyimpanan dan pengolahan data yang lebih terstandar.', 'ETD Universitas Gadjah Mada', 'https://etd.repository.ugm.ac.id/penelitian/detail/132303', 'ugm-etd:132303', NULL, NULL, NULL, 0, '2026-11-05T14:14:56.630Z', '2026-11-05T14:14:56.630Z');

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'domain', 'Rekayasa Perangkat Lunak' FROM catalog_references WHERE external_id = 'ugm-etd:132303';

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'method', 'Pengembangan back-end' FROM catalog_references WHERE external_id = 'ugm-etd:132303';

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'method', 'Perancangan API' FROM catalog_references WHERE external_id = 'ugm-etd:132303';

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'technology', 'Node.js' FROM catalog_references WHERE external_id = 'ugm-etd:132303';

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'technology', 'REST API' FROM catalog_references WHERE external_id = 'ugm-etd:132303';

INSERT OR IGNORE INTO catalog_references
  (title, authors, year, institution, summary, source_name, source_url, external_id, doi, license, language, is_demo, created_at, updated_at)
  VALUES ('Pengembangan Sistem Informasi Penumpang Bus Berbasis Internet of Things Untuk Mendukung Smart Transportation', 'Raditya Chandra Buana', 2016, 'Universitas Gadjah Mada', 'Mengintegrasikan lokasi bus dan informasi bagi penumpang dalam sistem transportasi cerdas berbasis Internet of Things (IoT). Sumber menyebut layanan RESTful untuk beberapa kebutuhan operasional dan penumpang.', 'ETD Universitas Gadjah Mada', 'https://etd.repository.ugm.ac.id/penelitian/detail/104211', 'ugm-etd:104211', NULL, NULL, NULL, 0, '2026-11-05T14:14:56.630Z', '2026-11-05T14:14:56.630Z');

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'domain', 'Internet of Things' FROM catalog_references WHERE external_id = 'ugm-etd:104211';

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'method', 'Pengembangan sistem' FROM catalog_references WHERE external_id = 'ugm-etd:104211';

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'method', 'Intelligent Transportation System' FROM catalog_references WHERE external_id = 'ugm-etd:104211';

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'technology', 'IoT' FROM catalog_references WHERE external_id = 'ugm-etd:104211';

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'technology', 'REST API' FROM catalog_references WHERE external_id = 'ugm-etd:104211';

INSERT OR IGNORE INTO catalog_references
  (title, authors, year, institution, summary, source_name, source_url, external_id, doi, license, language, is_demo, created_at, updated_at)
  VALUES ('PENGEMBANGAN SISTEM BACK-END DAN MODEL MACHINE LEARNING UNTUK SISTEM INFORMASI PENGKLASIFIKASI PUBLIKASI DOSEN', 'Muhammad Aldian Putra', 2022, 'Universitas Gadjah Mada', 'Mengembangkan back-end dan model machine learning untuk mengelompokkan publikasi dosen sekaligus membantu pencarian publikasi berdasarkan topik.', 'ETD Universitas Gadjah Mada', 'https://etd.repository.ugm.ac.id/penelitian/detail/210964', 'ugm-etd:210964', NULL, NULL, NULL, 0, '2026-11-05T14:14:56.630Z', '2026-11-05T14:14:56.630Z');

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'domain', 'Kecerdasan Buatan' FROM catalog_references WHERE external_id = 'ugm-etd:210964';

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'method', 'Machine learning' FROM catalog_references WHERE external_id = 'ugm-etd:210964';

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'method', 'Klasifikasi teks' FROM catalog_references WHERE external_id = 'ugm-etd:210964';

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'technology', 'Python' FROM catalog_references WHERE external_id = 'ugm-etd:210964';

INSERT OR IGNORE INTO catalog_references
  (title, authors, year, institution, summary, source_name, source_url, external_id, doi, license, language, is_demo, created_at, updated_at)
  VALUES ('Prediksi Target Pelanggan Berpotensi pada Kasus Direct Marketing Menggunakan Metode Klasifikasi Data Mining', 'Indira Kusumawardhani', 2016, 'Universitas Gadjah Mada', 'Menerapkan klasifikasi dan data mining untuk mengidentifikasi pelanggan yang berpotensi menjadi sasaran direct marketing dari data yang tersedia.', 'ETD Universitas Gadjah Mada', 'https://etd.repository.ugm.ac.id/penelitian/detail/104242', 'ugm-etd:104242', NULL, NULL, NULL, 0, '2026-11-05T14:14:56.630Z', '2026-11-05T14:14:56.630Z');

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'domain', 'Data Mining' FROM catalog_references WHERE external_id = 'ugm-etd:104242';

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'method', 'Data mining' FROM catalog_references WHERE external_id = 'ugm-etd:104242';

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'method', 'Klasifikasi' FROM catalog_references WHERE external_id = 'ugm-etd:104242';

INSERT OR IGNORE INTO catalog_references
  (title, authors, year, institution, summary, source_name, source_url, external_id, doi, license, language, is_demo, created_at, updated_at)
  VALUES ('Pengembangan Aplikasi Deteksi Bot Pada Media Sosial Twitter Menggunakan Machine Learning dengan Algoritme Random Forest Classifier', 'Aqilah Aini Zahra', 2020, 'Universitas Gadjah Mada', 'Mengembangkan klasifikasi multikelas untuk membedakan akun bot dan non-bot di Twitter menggunakan machine learning dan Random Forest.', 'ETD Universitas Gadjah Mada', 'https://etd.repository.ugm.ac.id/penelitian/detail/183664', 'ugm-etd:183664', NULL, NULL, NULL, 0, '2026-11-05T14:14:56.630Z', '2026-11-05T14:14:56.630Z');

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'domain', 'Kecerdasan Buatan' FROM catalog_references WHERE external_id = 'ugm-etd:183664';

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'method', 'Machine learning' FROM catalog_references WHERE external_id = 'ugm-etd:183664';

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'method', 'Klasifikasi' FROM catalog_references WHERE external_id = 'ugm-etd:183664';

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'method', 'Random Forest' FROM catalog_references WHERE external_id = 'ugm-etd:183664';

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'technology', 'Twitter' FROM catalog_references WHERE external_id = 'ugm-etd:183664';

INSERT OR IGNORE INTO catalog_references
  (title, authors, year, institution, summary, source_name, source_url, external_id, doi, license, language, is_demo, created_at, updated_at)
  VALUES ('KOMPARASI ALGORITME AGGLOMERATIVE HIERARCHICAL CLUSTERING PADA DATASET BREAST TISSUE', 'Irham Abdi Fattah', 2016, 'Universitas Gadjah Mada', 'Membandingkan single, complete, average, dan centroid linkage pada agglomerative hierarchical clustering menggunakan dataset Breast Tissue.', 'ETD Universitas Gadjah Mada', 'https://etd.repository.ugm.ac.id/penelitian/detail/106403', 'ugm-etd:106403', NULL, NULL, NULL, 0, '2026-11-05T14:14:56.630Z', '2026-11-05T14:14:56.630Z');

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'domain', 'Data Mining' FROM catalog_references WHERE external_id = 'ugm-etd:106403';

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'method', 'Clustering' FROM catalog_references WHERE external_id = 'ugm-etd:106403';

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'method', 'Agglomerative hierarchical clustering' FROM catalog_references WHERE external_id = 'ugm-etd:106403';

INSERT OR IGNORE INTO catalog_references
  (title, authors, year, institution, summary, source_name, source_url, external_id, doi, license, language, is_demo, created_at, updated_at)
  VALUES ('ANALISIS PERBANDINGAN METODOLOGI DATA MINING SERTA FAKTOR YANG MEMPENGARUHI PENINGKATAN PERFORMANSI SISWA SEKOLAH PADA DATASET KECIL', 'Kartika Maharani', 2015, 'Universitas Gadjah Mada', 'Menggunakan Educational Data Mining untuk menelaah faktor yang berkaitan dengan performa siswa berdasarkan sampel data dari sebuah sekolah menengah.', 'ETD Universitas Gadjah Mada', 'https://etd.repository.ugm.ac.id/penelitian/detail/82179', 'ugm-etd:82179', NULL, NULL, NULL, 0, '2026-11-05T14:14:56.630Z', '2026-11-05T14:14:56.630Z');

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'domain', 'Data Mining' FROM catalog_references WHERE external_id = 'ugm-etd:82179';

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'method', 'Educational data mining' FROM catalog_references WHERE external_id = 'ugm-etd:82179';

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'method', 'Analisis data' FROM catalog_references WHERE external_id = 'ugm-etd:82179';

INSERT OR IGNORE INTO catalog_references
  (title, authors, year, institution, summary, source_name, source_url, external_id, doi, license, language, is_demo, created_at, updated_at)
  VALUES ('Pengembangan Sistem Prediksi Berbasis Internet of Things dalam Smart Farming: Perbandingan Performa LSTM dan ARIMA pada Smart Farming PIAT UGM', 'Nindi Kusuma Ningrum', 2020, 'Universitas Gadjah Mada', 'Mengolah pembacaan sensor kelembapan tanah dalam sistem smart farming dan membandingkan ARIMA dengan LSTM untuk prediksi satu hari ke depan.', 'ETD Universitas Gadjah Mada', 'https://etd.repository.ugm.ac.id/penelitian/detail/193200', 'ugm-etd:193200', NULL, NULL, NULL, 0, '2026-11-05T14:14:56.630Z', '2026-11-05T14:14:56.630Z');

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'domain', 'Internet of Things' FROM catalog_references WHERE external_id = 'ugm-etd:193200';

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'method', 'Peramalan' FROM catalog_references WHERE external_id = 'ugm-etd:193200';

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'method', 'Perbandingan model' FROM catalog_references WHERE external_id = 'ugm-etd:193200';

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'technology', 'IoT' FROM catalog_references WHERE external_id = 'ugm-etd:193200';

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'technology', 'ARIMA' FROM catalog_references WHERE external_id = 'ugm-etd:193200';

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'technology', 'LSTM' FROM catalog_references WHERE external_id = 'ugm-etd:193200';

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'technology', 'Web service' FROM catalog_references WHERE external_id = 'ugm-etd:193200';

INSERT OR IGNORE INTO catalog_references
  (title, authors, year, institution, summary, source_name, source_url, external_id, doi, license, language, is_demo, created_at, updated_at)
  VALUES ('Pengembangan Sistem Prediksi Berbasis Internet of Things dalam Smart Farming: Pengembangan Aplikasi Web Sistem Prediksi Berbasis Internet of Things dalam Smart Farming', 'Yazid Muhammad H D', 2020, 'Universitas Gadjah Mada', 'Mengembangkan web service prediksi dan aplikasi web untuk menyajikan data sensor lahan. Karya ini merupakan bagian aplikasi web dari proyek smart farming yang membandingkan model ARIMA dan LSTM.', 'ETD Universitas Gadjah Mada', 'https://etd.repository.ugm.ac.id/penelitian/detail/193091', 'ugm-etd:193091', NULL, NULL, NULL, 0, '2026-11-05T14:14:56.630Z', '2026-11-05T14:14:56.630Z');

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'domain', 'Internet of Things' FROM catalog_references WHERE external_id = 'ugm-etd:193091';

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'method', 'Pengembangan aplikasi' FROM catalog_references WHERE external_id = 'ugm-etd:193091';

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'method', 'Peramalan' FROM catalog_references WHERE external_id = 'ugm-etd:193091';

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'technology', 'IoT' FROM catalog_references WHERE external_id = 'ugm-etd:193091';

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'technology', 'ARIMA' FROM catalog_references WHERE external_id = 'ugm-etd:193091';

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'technology', 'LSTM' FROM catalog_references WHERE external_id = 'ugm-etd:193091';

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'technology', 'Web app' FROM catalog_references WHERE external_id = 'ugm-etd:193091';

INSERT OR IGNORE INTO catalog_references
  (title, authors, year, institution, summary, source_name, source_url, external_id, doi, license, language, is_demo, created_at, updated_at)
  VALUES ('Pengembangan Fitur Pelaporan Pemantauan Kondisi Lingkungan, Konsumsi Energi Listrik, dan Suplai Energi dari Solar Cell pada Gedung Mendukung Building Energy Management System (BEMS)', 'Rara Priska Yuniar', 2018, 'Universitas Gadjah Mada', 'Mengembangkan pelaporan BEMS untuk kondisi lingkungan, pemakaian listrik, dan suplai solar cell. Abstrak menyebut Rapid Application Development serta Laravel, AngularJS, PHP, dan MySQL.', 'ETD Universitas Gadjah Mada', 'https://etd.repository.ugm.ac.id/penelitian/detail/159851', 'ugm-etd:159851', NULL, NULL, NULL, 0, '2026-11-05T14:14:56.630Z', '2026-11-05T14:14:56.630Z');

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'domain', 'Internet of Things' FROM catalog_references WHERE external_id = 'ugm-etd:159851';

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'method', 'Rapid Application Development' FROM catalog_references WHERE external_id = 'ugm-etd:159851';

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'method', 'Pengembangan fitur' FROM catalog_references WHERE external_id = 'ugm-etd:159851';

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'technology', 'IoT' FROM catalog_references WHERE external_id = 'ugm-etd:159851';

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'technology', 'Laravel' FROM catalog_references WHERE external_id = 'ugm-etd:159851';

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'technology', 'AngularJS' FROM catalog_references WHERE external_id = 'ugm-etd:159851';

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'technology', 'MySQL' FROM catalog_references WHERE external_id = 'ugm-etd:159851';

INSERT OR IGNORE INTO catalog_references
  (title, authors, year, institution, summary, source_name, source_url, external_id, doi, license, language, is_demo, created_at, updated_at)
  VALUES ('Perancangan Sistem Back-end Platform IoT Berbasis Cloud dengan Integrasi HTTP pada LoRaWAN Network Server', 'Rachmad Eko Pribadi', 2020, 'Universitas Gadjah Mada', 'Merancang platform back-end IoT untuk mengelola perangkat, data uplink, dan jadwal downlink yang terhubung melalui HTTP dengan server LoRaWAN. Sumber menyebut RAD, Laravel, REST, The Things Network, dan LoRaServer.', 'ETD Universitas Gadjah Mada', 'https://etd.repository.ugm.ac.id/penelitian/detail/184047', 'ugm-etd:184047', NULL, NULL, NULL, 0, '2026-11-05T14:14:56.630Z', '2026-11-05T14:14:56.630Z');

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'domain', 'Internet of Things' FROM catalog_references WHERE external_id = 'ugm-etd:184047';

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'method', 'Rapid Application Development' FROM catalog_references WHERE external_id = 'ugm-etd:184047';

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'method', 'Black-box testing' FROM catalog_references WHERE external_id = 'ugm-etd:184047';

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'technology', 'LoRaWAN' FROM catalog_references WHERE external_id = 'ugm-etd:184047';

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'technology', 'Laravel' FROM catalog_references WHERE external_id = 'ugm-etd:184047';

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'technology', 'REST API' FROM catalog_references WHERE external_id = 'ugm-etd:184047';

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'technology', 'The Things Network' FROM catalog_references WHERE external_id = 'ugm-etd:184047';

INSERT OR IGNORE INTO catalog_references
  (title, authors, year, institution, summary, source_name, source_url, external_id, doi, license, language, is_demo, created_at, updated_at)
  VALUES ('PERANCANGAN PROTOTIPE SISTEM PEMETAAN SINYAL LORA PADA FREKUENSI 920-923 MHZ DI LINGKUNGAN KAMPUS UGM', 'Wisang Jati Anggoro', 2020, 'Universitas Gadjah Mada', 'Membuat prototipe pemetaan sinyal LoRa pada pita 920–923 MHz di lingkungan kampus. Sumber membahas bagaimana lokasi dan penghalang berhubungan dengan jangkauan sinyal.', 'ETD Universitas Gadjah Mada', 'https://etd.repository.ugm.ac.id/penelitian/detail/186043', 'ugm-etd:186043', NULL, NULL, NULL, 0, '2026-11-05T14:14:56.630Z', '2026-11-05T14:14:56.630Z');

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'domain', 'Jaringan Komputer' FROM catalog_references WHERE external_id = 'ugm-etd:186043';

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'method', 'Pemetaan sinyal' FROM catalog_references WHERE external_id = 'ugm-etd:186043';

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'method', 'Pengujian lapangan' FROM catalog_references WHERE external_id = 'ugm-etd:186043';

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'technology', 'LoRa' FROM catalog_references WHERE external_id = 'ugm-etd:186043';

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'technology', 'LPWAN' FROM catalog_references WHERE external_id = 'ugm-etd:186043';

INSERT OR IGNORE INTO catalog_references
  (title, authors, year, institution, summary, source_name, source_url, external_id, doi, license, language, is_demo, created_at, updated_at)
  VALUES ('PENGEMBANGAN ANTARMUKA PENGGUNA SISTEM MONITOR DAN PENGENDALI LINGKUNGAN INDOOR DALAM MENDUKUNG SMART BUILDING PADA GEDUNG DTETI FT UGM', 'Nuri Tharra Sanendita', 2017, 'Universitas Gadjah Mada', 'Mengembangkan antarmuka untuk memantau dan mengendalikan perangkat serta kondisi ruang dalam konsep smart building berbasis Internet of Things.', 'ETD Universitas Gadjah Mada', 'https://etd.repository.ugm.ac.id/penelitian/detail/128315', 'ugm-etd:128315', NULL, NULL, NULL, 0, '2026-11-05T14:14:56.630Z', '2026-11-05T14:14:56.630Z');

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'domain', 'Interaksi Manusia-Komputer' FROM catalog_references WHERE external_id = 'ugm-etd:128315';

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'method', 'Pengembangan antarmuka' FROM catalog_references WHERE external_id = 'ugm-etd:128315';

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'method', 'User-centered design' FROM catalog_references WHERE external_id = 'ugm-etd:128315';

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'technology', 'IoT' FROM catalog_references WHERE external_id = 'ugm-etd:128315';

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'technology', 'Smart building' FROM catalog_references WHERE external_id = 'ugm-etd:128315';

INSERT OR IGNORE INTO catalog_references
  (title, authors, year, institution, summary, source_name, source_url, external_id, doi, license, language, is_demo, created_at, updated_at)
  VALUES ('Monitoring Gejala Tanah Longsor Berbasis Internet of Things Dengan Konektivitas LoRa: Pengembangan Node dan Gateway Device Gadjah Mada Landslide Early Warning System (GMLEWS)', 'Aditya Wahyu Rizky P.', 2020, 'Universitas Gadjah Mada', 'Mengembangkan node sensor dan gateway untuk mengumpulkan faktor pemicu longsor sebagai bagian dari prototipe GMLEWS. Karya ini menggunakan sensor dan komunikasi LoRa untuk mengirim data ke server.', 'ETD Universitas Gadjah Mada', 'https://etd.repository.ugm.ac.id/penelitian/detail/192230', 'ugm-etd:192230', NULL, NULL, NULL, 0, '2026-11-05T14:14:56.630Z', '2026-11-05T14:14:56.630Z');

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'domain', 'Internet of Things' FROM catalog_references WHERE external_id = 'ugm-etd:192230';

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'method', 'Pengembangan perangkat' FROM catalog_references WHERE external_id = 'ugm-etd:192230';

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'method', 'Prototyping' FROM catalog_references WHERE external_id = 'ugm-etd:192230';

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'technology', 'IoT' FROM catalog_references WHERE external_id = 'ugm-etd:192230';

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'technology', 'LoRa' FROM catalog_references WHERE external_id = 'ugm-etd:192230';

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'technology', 'REST API' FROM catalog_references WHERE external_id = 'ugm-etd:192230';

INSERT OR IGNORE INTO catalog_references
  (title, authors, year, institution, summary, source_name, source_url, external_id, doi, license, language, is_demo, created_at, updated_at)
  VALUES ('Monitoring Gejala Tanah Longsor Berbasis Internet of Things dengan Konektivitas LoRa', 'Panji Riski Hernanda', 2022, 'Universitas Gadjah Mada', 'Mengembangkan pengiriman ulang data sensor GMLEWS setelah koneksi internet kembali tersedia. Sumber menyebut pengujian komunikasi perangkat, koneksi, dan basis data.', 'ETD Universitas Gadjah Mada', 'https://etd.repository.ugm.ac.id/penelitian/detail/208593', 'ugm-etd:208593', NULL, NULL, NULL, 0, '2026-11-05T14:14:56.630Z', '2026-11-05T14:14:56.630Z');

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'domain', 'Internet of Things' FROM catalog_references WHERE external_id = 'ugm-etd:208593';

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'method', 'White-box testing' FROM catalog_references WHERE external_id = 'ugm-etd:208593';

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'method', 'Pengujian sistem' FROM catalog_references WHERE external_id = 'ugm-etd:208593';

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'technology', 'IoT' FROM catalog_references WHERE external_id = 'ugm-etd:208593';

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'technology', 'LoRa' FROM catalog_references WHERE external_id = 'ugm-etd:208593';

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'technology', 'Database' FROM catalog_references WHERE external_id = 'ugm-etd:208593';

INSERT OR IGNORE INTO catalog_references
  (title, authors, year, institution, summary, source_name, source_url, external_id, doi, license, language, is_demo, created_at, updated_at)
  VALUES ('Perancangan User Interface dan User Experience dari Dasbor Aplikasi Accreditation Logbook dengan menggunakan metode Design Thinking', 'Jeisha Tania Vanka', 2021, 'Universitas Gadjah Mada', 'Merancang dasbor untuk memvisualisasikan capaian program studi. Sumber menyebut metode Design Thinking, Power BI, dan pengujian usability.', 'ETD Universitas Gadjah Mada', 'https://etd.repository.ugm.ac.id/penelitian/detail/207233', 'ugm-etd:207233', NULL, NULL, NULL, 0, '2026-11-05T14:14:56.630Z', '2026-11-05T14:14:56.630Z');

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'domain', 'Interaksi Manusia-Komputer' FROM catalog_references WHERE external_id = 'ugm-etd:207233';

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'method', 'Design Thinking' FROM catalog_references WHERE external_id = 'ugm-etd:207233';

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'method', 'Pengujian usability' FROM catalog_references WHERE external_id = 'ugm-etd:207233';

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'technology', 'Power BI' FROM catalog_references WHERE external_id = 'ugm-etd:207233';

INSERT OR IGNORE INTO catalog_references
  (title, authors, year, institution, summary, source_name, source_url, external_id, doi, license, language, is_demo, created_at, updated_at)
  VALUES ('Analisis dan Pengambangan Panduan Letak Penempatan Objek Situs Pada Situs Toko Daring Berbasis Eye-tracking', 'M. Rafi Fahlevi', 2020, 'Universitas Gadjah Mada', 'Mengkaji posisi objek pada situs toko daring menggunakan data eye-tracking dari beberapa kelompok peserta. Analisisnya mencakup ANOVA dan pengelompokan heatmap.', 'ETD Universitas Gadjah Mada', 'https://etd.repository.ugm.ac.id/penelitian/detail/184203', 'ugm-etd:184203', NULL, NULL, NULL, 0, '2026-11-05T14:14:56.630Z', '2026-11-05T14:14:56.630Z');

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'domain', 'Interaksi Manusia-Komputer' FROM catalog_references WHERE external_id = 'ugm-etd:184203';

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'method', 'Eye-tracking' FROM catalog_references WHERE external_id = 'ugm-etd:184203';

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'method', 'ANOVA' FROM catalog_references WHERE external_id = 'ugm-etd:184203';

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'method', 'Clustering' FROM catalog_references WHERE external_id = 'ugm-etd:184203';

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'technology', 'Eye-tracking' FROM catalog_references WHERE external_id = 'ugm-etd:184203';

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'technology', 'Heatmap' FROM catalog_references WHERE external_id = 'ugm-etd:184203';

INSERT OR IGNORE INTO catalog_references
  (title, authors, year, institution, summary, source_name, source_url, external_id, doi, license, language, is_demo, created_at, updated_at)
  VALUES ('Perancangan dan Implementasi Antarmuka dengan Analisis User Experience pada Sistem Smart Public Display Berbasis Kendali Gerakan Mata untuk Edukasi Covid-19', 'Dhimas Aji S.', 2022, 'Universitas Gadjah Mada', 'Mengembangkan antarmuka web CoviDisplay, media informasi publik yang dikendalikan dengan gerakan mata, lalu mengujinya dengan metrik penyelesaian tugas, waktu, dan pengalaman pengguna.', 'ETD Universitas Gadjah Mada', 'https://etd.repository.ugm.ac.id/penelitian/detail/215590', 'ugm-etd:215590', NULL, NULL, NULL, 0, '2026-11-05T14:14:56.630Z', '2026-11-05T14:14:56.630Z');

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'domain', 'Interaksi Manusia-Komputer' FROM catalog_references WHERE external_id = 'ugm-etd:215590';

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'method', 'Pengujian usability' FROM catalog_references WHERE external_id = 'ugm-etd:215590';

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'method', 'User experience' FROM catalog_references WHERE external_id = 'ugm-etd:215590';

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'technology', 'Vue.js' FROM catalog_references WHERE external_id = 'ugm-etd:215590';

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'technology', 'Eye-tracking' FROM catalog_references WHERE external_id = 'ugm-etd:215590';

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'technology', 'Web' FROM catalog_references WHERE external_id = 'ugm-etd:215590';

INSERT OR IGNORE INTO catalog_references
  (title, authors, year, institution, summary, source_name, source_url, external_id, doi, license, language, is_demo, created_at, updated_at)
  VALUES ('ANALISIS KOMPLEKSITAS TERHADAP KEBERGUNAAN WEB AKADEMIK DAN BEBAN KOGNITIF DENGAN SYSTEM USABILITY SCALE (SUS) DAN EYE TRACKING', 'Nurhabibah', 2016, 'Universitas Gadjah Mada', 'Menguji pengaruh kompleksitas dan navigasi web akademik terhadap usability serta beban kognitif menggunakan System Usability Scale dan eye-tracking.', 'ETD Universitas Gadjah Mada', 'https://etd.repository.ugm.ac.id/penelitian/detail/103839', 'ugm-etd:103839', NULL, NULL, NULL, 0, '2026-11-05T14:14:56.630Z', '2026-11-05T14:14:56.630Z');

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'domain', 'Interaksi Manusia-Komputer' FROM catalog_references WHERE external_id = 'ugm-etd:103839';

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'method', 'System Usability Scale' FROM catalog_references WHERE external_id = 'ugm-etd:103839';

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'method', 'Eye-tracking' FROM catalog_references WHERE external_id = 'ugm-etd:103839';

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'method', 'Pengujian usability' FROM catalog_references WHERE external_id = 'ugm-etd:103839';

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'technology', 'Eye-tracking' FROM catalog_references WHERE external_id = 'ugm-etd:103839';

INSERT OR IGNORE INTO catalog_references
  (title, authors, year, institution, summary, source_name, source_url, external_id, doi, license, language, is_demo, created_at, updated_at)
  VALUES ('Simulasi Penetration Testing terhadap FTP Server untuk Mempelajari Eksploitasi Melalui Kerentanan Buffer Overflow', 'Ivan Muhammad Sidiq', 2020, 'Universitas Gadjah Mada', 'Menggunakan simulasi uji penetrasi pada FTP server sebagai bahan kajian kerentanan buffer overflow dan keamanan sistem informasi.', 'ETD Universitas Gadjah Mada', 'https://etd.repository.ugm.ac.id/penelitian/detail/185924', 'ugm-etd:185924', NULL, NULL, NULL, 0, '2026-11-05T14:14:56.630Z', '2026-11-05T14:14:56.630Z');

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'domain', 'Keamanan Informasi' FROM catalog_references WHERE external_id = 'ugm-etd:185924';

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'method', 'Penetration testing' FROM catalog_references WHERE external_id = 'ugm-etd:185924';

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'method', 'Analisis kerentanan' FROM catalog_references WHERE external_id = 'ugm-etd:185924';

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'technology', 'FTP server' FROM catalog_references WHERE external_id = 'ugm-etd:185924';

INSERT OR IGNORE INTO catalog_references
  (title, authors, year, institution, summary, source_name, source_url, external_id, doi, license, language, is_demo, created_at, updated_at)
  VALUES ('UJI PENETRASI PADA JARINGAN ACCESS POINT UGM-SECURE MENGGUNAKAN METODE SERANGAN PAIRWISE MASTER KEY IDENTIFIER (PMKID)', 'Sayid Syarif Aziz', 2021, 'Universitas Gadjah Mada', 'Menguji ketahanan access point UGM-Secure terhadap serangan PMKID melalui tahapan eksplorasi, analisis, pengujian, dan pelaporan.', 'ETD Universitas Gadjah Mada', 'https://etd.repository.ugm.ac.id/penelitian/detail/205470', 'ugm-etd:205470', NULL, NULL, NULL, 0, '2026-11-05T14:14:56.630Z', '2026-11-05T14:14:56.630Z');

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'domain', 'Keamanan Informasi' FROM catalog_references WHERE external_id = 'ugm-etd:205470';

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'method', 'Penetration testing' FROM catalog_references WHERE external_id = 'ugm-etd:205470';

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'method', 'PMKID' FROM catalog_references WHERE external_id = 'ugm-etd:205470';

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'technology', 'Wi-Fi' FROM catalog_references WHERE external_id = 'ugm-etd:205470';

INSERT OR IGNORE INTO catalog_references
  (title, authors, year, institution, summary, source_name, source_url, external_id, doi, license, language, is_demo, created_at, updated_at)
  VALUES ('Perancangan Jaringan Berbasis Hierarchical Network untuk Meningkatkan Keamanan Jaringan pada Direktorat Pendidikan dan Pengajaran', 'Ismail Abdurrahman Hakim', 2017, 'Universitas Gadjah Mada', 'Merancang segmentasi jaringan hierarkis menggunakan VLAN dan ACL, lalu menyimulasikan konektivitas dan penyaringan paket dengan GNS3 serta Wireshark.', 'ETD Universitas Gadjah Mada', 'https://etd.repository.ugm.ac.id/penelitian/detail/111156', 'ugm-etd:111156', NULL, NULL, NULL, 0, '2026-11-05T14:14:56.630Z', '2026-11-05T14:14:56.630Z');

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'domain', 'Jaringan Komputer' FROM catalog_references WHERE external_id = 'ugm-etd:111156';

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'method', 'Perancangan jaringan' FROM catalog_references WHERE external_id = 'ugm-etd:111156';

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'method', 'Simulasi' FROM catalog_references WHERE external_id = 'ugm-etd:111156';

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'technology', 'VLAN' FROM catalog_references WHERE external_id = 'ugm-etd:111156';

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'technology', 'ACL' FROM catalog_references WHERE external_id = 'ugm-etd:111156';

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'technology', 'GNS3' FROM catalog_references WHERE external_id = 'ugm-etd:111156';

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'technology', 'Wireshark' FROM catalog_references WHERE external_id = 'ugm-etd:111156';

INSERT OR IGNORE INTO catalog_references
  (title, authors, year, institution, summary, source_name, source_url, external_id, doi, license, language, is_demo, created_at, updated_at)
  VALUES ('PERANCANGAN DAN IMPLEMENTASI VIRTUAL PRIVATE NETWORK UNTUK MENGAKSES WEBSITE GISTA DARI JARINGAN PUBLIK (Studi Kasus Pada PT. Telkom Indonesia Unit Kandatel Sleman WITEL Yogyakarta)', 'Mardiyah Rahmah T.', 2015, 'Universitas Gadjah Mada', 'Merancang akses VPN ke aplikasi GISTA saat digunakan dari jaringan publik. Sumber menyebut SoftEther VPN sebagai solusi yang diterapkan.', 'ETD Universitas Gadjah Mada', 'https://etd.repository.ugm.ac.id/penelitian/detail/90893', 'ugm-etd:90893', NULL, NULL, NULL, 0, '2026-11-05T14:14:56.630Z', '2026-11-05T14:14:56.630Z');

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'domain', 'Jaringan Komputer' FROM catalog_references WHERE external_id = 'ugm-etd:90893';

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'method', 'Perancangan jaringan' FROM catalog_references WHERE external_id = 'ugm-etd:90893';

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'method', 'Implementasi' FROM catalog_references WHERE external_id = 'ugm-etd:90893';

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'technology', 'VPN' FROM catalog_references WHERE external_id = 'ugm-etd:90893';

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'technology', 'SoftEther VPN' FROM catalog_references WHERE external_id = 'ugm-etd:90893';

INSERT OR IGNORE INTO catalog_references
  (title, authors, year, institution, summary, source_name, source_url, external_id, doi, license, language, is_demo, created_at, updated_at)
  VALUES ('PERANCANGAN PRAKTIK PEMBELAJARAN KEAMANAN SISTEM INFORMASI BERBASIS SISTEM PENILAIAN CAPTURE THE FLAG', 'Muhammad Fathan K.', 2016, 'Universitas Gadjah Mada', 'Membangun lingkungan latihan keamanan yang aman dan legal menggunakan WebGoat, materi OWASP Top 10, dan sistem penilaian Capture the Flag.', 'ETD Universitas Gadjah Mada', 'https://etd.repository.ugm.ac.id/penelitian/detail/104603', 'ugm-etd:104603', NULL, NULL, NULL, 0, '2026-11-05T14:14:56.630Z', '2026-11-05T14:14:56.630Z');

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'domain', 'Keamanan Informasi' FROM catalog_references WHERE external_id = 'ugm-etd:104603';

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'method', 'Pengembangan pembelajaran' FROM catalog_references WHERE external_id = 'ugm-etd:104603';

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'method', 'Capture the Flag' FROM catalog_references WHERE external_id = 'ugm-etd:104603';

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'technology', 'WebGoat' FROM catalog_references WHERE external_id = 'ugm-etd:104603';

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'technology', 'OWASP' FROM catalog_references WHERE external_id = 'ugm-etd:104603';

INSERT OR IGNORE INTO catalog_references
  (title, authors, year, institution, summary, source_name, source_url, external_id, doi, license, language, is_demo, created_at, updated_at)
  VALUES ('Analisis Dan Implementasi Konfigurasi Keamanan Web Server', 'Nizar Akbar Meilani', 2020, 'Universitas Gadjah Mada', 'Membahas panduan konfigurasi keamanan web server dan penerapannya untuk membantu pengelola situs mengurangi kesalahan konfigurasi.', 'ETD Universitas Gadjah Mada', 'https://etd.repository.ugm.ac.id/penelitian/detail/195808', 'ugm-etd:195808', NULL, NULL, NULL, 0, '2026-11-05T14:14:56.630Z', '2026-11-05T14:14:56.630Z');

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'domain', 'Keamanan Informasi' FROM catalog_references WHERE external_id = 'ugm-etd:195808';

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'method', 'Analisis keamanan' FROM catalog_references WHERE external_id = 'ugm-etd:195808';

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'method', 'Konfigurasi sistem' FROM catalog_references WHERE external_id = 'ugm-etd:195808';

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'technology', 'Web server' FROM catalog_references WHERE external_id = 'ugm-etd:195808';

INSERT OR IGNORE INTO catalog_references
  (title, authors, year, institution, summary, source_name, source_url, external_id, doi, license, language, is_demo, created_at, updated_at)
  VALUES ('Pengembangan Sistem Informasi Manajemen Permohonan Tanda Tangan Dekan FT UGM dengan Konsep MVC', 'Ahmad Daris', 2020, 'Universitas Gadjah Mada', 'Merancang sistem untuk mengelola permohonan tanda tangan dekan pada proposal penelitian. Sumber menyebut UML, konsep MVC, implementasi web, dan pengujian black-box.', 'ETD Universitas Gadjah Mada', 'https://etd.repository.ugm.ac.id/penelitian/detail/193379', 'ugm-etd:193379', NULL, NULL, NULL, 0, '2026-11-05T14:14:56.630Z', '2026-11-05T14:14:56.630Z');

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'domain', 'Sistem Informasi' FROM catalog_references WHERE external_id = 'ugm-etd:193379';

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'method', 'Perancangan sistem' FROM catalog_references WHERE external_id = 'ugm-etd:193379';

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'method', 'Black-box testing' FROM catalog_references WHERE external_id = 'ugm-etd:193379';

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'technology', 'MVC' FROM catalog_references WHERE external_id = 'ugm-etd:193379';

INSERT OR IGNORE INTO reference_tags (reference_id, tag_type, tag)
        SELECT id, 'technology', 'Web' FROM catalog_references WHERE external_id = 'ugm-etd:193379';

INSERT INTO app_metadata (key, value, updated_at)
  VALUES ('catalog_seed_version', 'ugm-etd-2026-10-v1', '2026-11-05T14:14:56.630Z')
  ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at;
