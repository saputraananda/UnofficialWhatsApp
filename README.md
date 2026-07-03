# Unofficial WhatsApp Multi-Session Gateway

Aplikasi WhatsApp Gateway multi-sesi tidak resmi (unofficial) berbasis Node.js yang menggunakan library **@whiskeysockets/baileys** dan **Express.js**. Proyek ini dirancang untuk mempermudah integrasi pengiriman pesan WhatsApp otomatis dan pengelolaan sesi untuk bisnis **Alora** dan **Cleanox**.

Aplikasi ini dilengkapi dengan dashboard berbasis web yang responsif dan modern untuk memudahkan inisialisasi sesi, pemindaian QR Code, pemantauan status koneksi secara real-time, serta pengiriman pesan uji coba.

---

## Fitur Utama

- **Multi-Session Support**: Mendukung dua sesi bawaan yang terpisah: `alora` (Alora Business) dan `cleanox` (Cleanox Business).
- **Web UI Dashboard**: Antarmuka dashboard modern dengan visualisasi status sesi, pemindai QR Code dinamis, detail akun terhubung, dan form uji coba pengiriman pesan langsung dari browser.
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
│   ├── app.js                # Logika front-end (fetch API & rendering UI)
│   ├── index.html            # Desain dashboard HTML
│   └── style.css             # Styling UI Dashboard (Glassmorphism & animations)
├── sessions/                 # Folder penyimpanan sesi/auth token Baileys (auto-generated)
│   ├── alora/
│   └── cleanox/
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

1. **Inisialisasi Sesi**: Klik tombol **Initialize Session** pada sesi yang ingin diaktifkan (`Alora Business` atau `Cleanox Business`).
2. **Scan QR Code**: Tunggu beberapa detik sampai QR Code muncul di dashboard, lalu buka aplikasi WhatsApp di ponsel Anda -> **Linked Devices (Perangkat Tertaut)** -> **Link a Device (Tautkan Perangkat)**, lalu scan QR Code tersebut.
3. **Kirim Uji Coba**: Setelah berhasil terhubung, bagian **Send Test Message** akan muncul di bawah kartu sesi. Anda dapat memasukkan nomor tujuan (contoh: `628123456789`) dan isi pesan untuk mencoba pengiriman langsung.
4. **Disconnect**: Klik tombol **Disconnect Session** jika ingin mengeluarkan WhatsApp dari gateway.

---

## Dokumentasi API (RESTful Endpoints)

Semua request REST API menggunakan format JSON pada request body dan mengembalikan response JSON.

### 1. Mendapatkan Status Semua Sesi
Mendapatkan status koneksi, data URL QR Code (jika ada), dan info akun yang terhubung untuk seluruh sesi.

- **Endpoint**: `GET /api/sessions`
- **Response Sukses (200)**:
  ```json
  {
    "success": true,
    "sessions": {
      "alora": {
        "status": "connected",
        "qrImage": null,
        "info": {
          "id": "628123456789@s.whatsapp.net",
          "name": "Alora Business"
        }
      },
      "cleanox": {
        "status": "disconnected",
        "qrImage": null,
        "info": null
      }
    }
  }
  ```

---

### 2. Mendapatkan Status Satu Sesi
Mendapatkan status koneksi detail untuk satu sesi tertentu (`alora` atau `cleanox`).

- **Endpoint**: `GET /api/sessions/:id` (Ganti `:id` dengan `alora` atau `cleanox`)
- **Response Sukses (200)**:
  ```json
  {
    "success": true,
    "session": {
      "status": "qr",
      "qrImage": "data:image/png;base64,...",
      "info": null
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
    "message": "Session alora initialization triggered"
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
    "message": "Session alora logged out successfully"
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
    "session": "alora",
    "to": "628123456789",
    "message": "Halo, ini adalah pesan otomatis dari Gateway Alora!"
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
    "message": "Halo, ini adalah pesan langsung melalui endpoint Cleanox!"
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
