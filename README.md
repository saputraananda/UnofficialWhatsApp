# Unofficial WhatsApp Multi-Session Gateway

Aplikasi WhatsApp Gateway multi-sesi tidak resmi (unofficial) berbasis Node.js yang menggunakan library **@whiskeysockets/baileys** dan **Express.js**. Proyek ini dirancang untuk mempermudah integrasi pengiriman pesan WhatsApp otomatis dan pengelolaan sesi untuk bisnis **Alora Group** (Alora, Cleanox, dan jaringan outlet Waschen).

Aplikasi ini dilengkapi dengan dashboard berbasis web yang responsif, modern, dan dinamis untuk memudahkan inisialisasi sesi, pemindaian QR Code dengan scanline animation, pemantauan status koneksi secara real-time, serta pengiriman pesan uji coba.

---

## Fitur Utama

- **Multi-Session Support**: Mendukung delapan sesi bawaan yang berjalan paralel secara mandiri:
  1. `alora` (Alora Business)
  2. `cleanox` (Cleanox Business)
  3. `waschen_utama` (Waschen Utama)
  4. `waschen_legenda` (Waschen Legenda)
  5. `waschen_citra` (Waschen Citra)
  6. `waschen_canadian` (Waschen Canadian)
  7. `waschen_sentra_eropa` (Waschen Sentra Eropa)
  8. `waschen_raffles` (Waschen Raffles)
- **Dynamic Web UI Dashboard**: Antarmuka dashboard modern menggunakan desain Cyber-Glassmorphism dengan visualisasi status sesi, pemindai QR Code dengan efek laser scanline, detail nomor dan nama akun terhubung, serta form uji coba pengiriman pesan langsung dari browser. Elemen kartu di-render secara dinamis dari API backend.
- **RESTful API Endpoint**: Endpoint API untuk mengontrol status sesi (inisialisasi/logout) dan mengirim pesan WhatsApp secara terprogram.
- **Auto-Formatting Phone Number**: Memformat nomor telepon otomatis (misalnya mengonversi format lokal `08xxx` menjadi format internasional `628xxx@s.whatsapp.net`).
- **Persistent Session State**: Menyimpan kredensial otentikasi sesi di folder `sessions/` sehingga koneksi tetap bertahan meskipun server dijalankan ulang (restart).
- **Auto Reconnect**: Mencoba menghubungkan kembali secara otomatis jika koneksi terputus secara tidak sengaja (kecuali jika pengguna melakukan *logout* manual).

---

## Struktur Direktori Proyek

```text
UnofficialWaAlora/
├── agent/
│   └── Self-Hosted-VPS.md    # Panduan lengkap deployment ke VPS Ubuntu
├── public/                   # Asset front-end Dashboard
│   ├── app.js                # Logika front-end (fetch API & rendering dinamis)
│   ├── index.html            # Desain dashboard HTML (Glassmorphism & animations)
│   └── style.css             # Styling UI Dashboard (Glassmorphism & animations)
├── sessions/                 # Folder penyimpanan sesi/auth token Baileys (auto-generated)
│   ├── alora/
│   ├── cleanox/
│   ├── waschen_utama/
│   └── ... (sesi Waschen lainnya)
├── nodemon.json              # Konfigurasi Nodemon untuk pengembangan
├── package.json              # Dependensi & script perintah NPM
├── server.js                 # Entry point Express.js Server & API routing
└── sessionManager.js         # Core logic inisialisasi & manajemen sesi WhatsApp (Baileys)
```

---

## Persyaratan Sistem

Sebelum menjalankan proyek ini, pastikan Anda telah memasang:
- **Node.js** (Versi 20 LTS ke atas direkomendasikan)
- **NPM** (bawaan dari instalasi Node.js)
- **RAM Minimum**: Disarankan memiliki RAM bebas minimal 1GB - 2GB untuk menjalankan 8 sesi secara bersamaan dengan lancar.

---

## Cara Instalasi & Penggunaan Lokal

### 1. Clone atau Unduh Project
Akses folder project melalui terminal Anda:
```bash
cd UnofficialWaAlora
```

### 2. Install Dependensi
Jalankan perintah berikut untuk menginstal seluruh dependensi yang dibutuhkan:
```bash
npm install
```

### 3. Jalankan Aplikasi

#### Mode Pengembangan (Development)
Menggunakan `nodemon` agar server otomatis restart saat ada perubahan file:
```bash
npm run dev
```

#### Mode Produksi (Production)
Menjalankan server langsung dengan Node.js:
```bash
npm start
```

Setelah server berjalan, buka browser dan akses Dashboard di:
👉 **[http://localhost:3000](http://localhost:3000)**

---

## Panduan Penggunaan Dashboard

1. **Inisialisasi Sesi**: Klik tombol **Inisialisasi Sesi** pada sesi yang ingin diaktifkan (misalnya `Waschen Utama`).
2. **Scan QR Code**: Tunggu beberapa detik sampai QR Code muncul di dashboard, lalu buka aplikasi WhatsApp di ponsel Anda -> **Linked Devices (Perangkat Tertaut)** -> **Link a Device (Tautkan Perangkat)**, lalu scan QR Code tersebut.
3. **Kirim Uji Coba**: Setelah berhasil terhubung, bagian **Kirim Uji Coba** akan muncul di bawah kartu sesi. Anda dapat memasukkan nomor tujuan (contoh: `628123456789`) dan isi pesan untuk mencoba pengiriman langsung.
4. **Putuskan Sesi**: Klik tombol **Putuskan Sesi** jika ingin mengeluarkan WhatsApp dari gateway secara permanen.

---

## Dokumentasi API (RESTful Endpoints)

Semua request REST API menggunakan format JSON pada request body dan mengembalikan response JSON.

### 1. Mendapatkan Status Semua Sesi
Mendapatkan status koneksi, data URL QR Code (jika ada), info akun terhubung, serta nama tampilan dan ikon untuk seluruh sesi.

- **Endpoint**: `GET /api/sessions`
- **Response Sukses (200)**:
  ```json
  {
    "success": true,
    "sessions": {
      "waschen_utama": {
        "status": "connected",
        "qrImage": null,
        "info": {
          "id": "628123456789@s.whatsapp.net",
          "name": "Waschen Utama"
        },
        "displayName": "Waschen Utama",
        "icon": "fa-solid fa-soap"
      },
      "alora": {
        "status": "disconnected",
        "qrImage": null,
        "info": null,
        "displayName": "Alora Business",
        "icon": "fa-solid fa-building"
      }
      // ... sesi lainnya
    }
  }
  ```

---

### 2. Mendapatkan Status Satu Sesi
Mendapatkan status koneksi detail untuk satu sesi tertentu.

- **Endpoint**: `GET /api/sessions/:id` (Contoh: `:id` diganti `waschen_utama`)
- **Response Sukses (200)**:
  ```json
  {
    "success": true,
    "session": {
      "status": "qr",
      "qrImage": "data:image/png;base64,...",
      "info": null,
      "displayName": "Waschen Utama",
      "icon": "fa-solid fa-soap"
    }
  }
  ```

---

### 3. Inisialisasi Sesi Secara Manual
Memulai proses koneksi dan pembuatan QR Code untuk sesi tertentu.

- **Endpoint**: `POST /api/sessions/:id/init`
- **Response Sukses (200)**:
  ```json
  {
    "success": true,
    "message": "Session waschen_utama initialization triggered"
  }
  ```

---

### 4. Logout / Disconnect Sesi
Memutuskan koneksi WhatsApp dan menghapus token kredensial sesi dari server secara permanen.

- **Endpoint**: `POST /api/sessions/:id/logout`
- **Response Sukses (200)**:
  ```json
  {
    "success": true,
    "message": "Session waschen_utama logged out successfully"
  }
  ```

---

### 5. Mengirim Pesan (Endpoint Umum)
Mengirimkan pesan teks ke nomor tujuan dengan menentukan sesi di dalam request body.

- **Endpoint**: `POST /api/send-message`
- **Headers**: `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "session": "waschen_utama",
    "to": "628123456789",
    "message": "Halo, ini adalah pesan otomatis dari Gateway Waschen Utama!"
  }
  ```
- **Response Sukses (200)**:
  ```json
  {
    "success": true,
    "result": { ... }
  }
  ```

---

### 6. Mengirim Pesan (Endpoint Spesifik Sesi)
Mengirimkan pesan teks ke nomor tujuan langsung melalui endpoint sesi yang ditentukan di URL path.

- **Endpoint**: `POST /api/sessions/:id/send`
- **Headers**: `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "to": "628123456789",
    "message": "Halo, ini pesan langsung via endpoint Waschen Utama!"
  }
  ```
- **Response Sukses (200)**:
  ```json
  {
    "success": true,
    "result": { ... }
  }
  ```

---

## Panduan Deployment VPS (Self-Hosted)

Untuk memindahkan aplikasi ini dari localhost agar aktif 24 jam penuh di server VPS Anda, silakan ikuti panduan langkah-demi-langkah lengkap yang telah kami sediakan di file berikut:

👉 **[Panduan Deployment VPS (Ubuntu 24.04)](file:///c:/Users/oemar/Music/PT%20Waschen%20Alora%20Indonesia/UnofficialWaAlora/agent/Self-Hosted-VPS.md)**

Panduan tersebut mencakup:
1. Instalasi Node.js & NPM di Ubuntu Server.
2. Transfer file dan persiapan dependensi.
3. Konfigurasi **PM2** agar aplikasi tetap menyala di background.
4. Konfigurasi **Nginx Reverse Proxy** agar dapat diakses melalui domain tanpa port.
5. Pemasangan sertifikat SSL HTTPS gratis dari **Let's Encrypt / Certbot**.

---

## Lisensi

Proyek ini menggunakan lisensi **ISC**.
