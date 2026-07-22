Halo! Tentu, saya akan membantu Anda menyusun *draft* README.md yang profesional, rapi, dan komprehensif untuk dipajang di repositori GitHub Anda.

Berikut adalah kode Markdown untuk README proyek Murottal Watch berdasarkan seluruh spesifikasi dan arsitektur yang telah kita rancang. Anda bisa langsung menyalinnya ke dalam file `README.md` di proyek Anda.

---

# 📖 Murottal Watch - Aplikasi Pemantauan Murotal Siswa

Aplikasi berbasis web *mobile-first* yang berfungsi untuk memantau, merekam secara *live*, dan menilai setoran murotal Al-Qur'an siswa secara praktis. Sistem ini dirancang untuk menampung skala pengguna tingkat menengah (sekitar 300 siswa beserta guru penilai) dengan mengutamakan efisiensi penyimpanan dan kemudahan antarmuka.

---

## 🎯 Latar Belakang & Tujuan

Proyek ini dibangun untuk mendigitalisasi proses setoran hafalan Al-Qur'an di sekolah. Aplikasi ini memastikan bahwa:

* Rekaman murotal dilakukan secara langsung melalui kamera perangkat siswa untuk menjaga orisinalitas.


* Waktu penyelesaian tugas dicatat 100% akurat menggunakan waktu server pusat, mencegah manipulasi dari perangkat lokal.


* Pihak sekolah tidak perlu mendaftarkan akun secara manual berkat sistem pendaftaran massal berbasis berkas *spreadsheet*.



---

## ✨ Fitur Utama

### 📱 1. Modul Siswa (*Mobile-First*)

* 
**Perekaman Live Immersive:** Antarmuka difokuskan pada *viewfinder* kamera secara penuh menggunakan MediaRecorder API.


* 
**Optimasi Video Otomatis:** Resolusi video dibatasi ke 480p/720p pada sisi *frontend* untuk menekan ukuran fail di bawah 10 MB per setoran tanpa merusak kejelasan suara.


* 
**Pengumpulan Instan:** Video otomatis terunggah beserta metadatanya (termasuk *timestamp*) segera setelah siswa menghentikan rekaman.



### 👨‍🏫 2. Modul Guru (Pemeriksa)

* 
**Dashboard Terintegrasi:** Daftar setoran masuk tersusun rapi berdasarkan urutan tanggal.


* 
**Penilaian Langsung:** Terdapat pemutar video bawaan aplikasi yang bersebelahan dengan formulir input nilai dan catatan evaluasi tajwid.



### ⚙️ 3. Modul Administrator

* 
**Bulk Register:** Sistem pendaftaran ratusan akun secara massal melalui pembacaan fail Excel/CSV untuk menghindari kesalahan ketik data profil siswa.


* 
**Role-Based Access:** Pemisahan hak akses dan antarmuka yang tegas antara "Siswa", "Guru Tilawah", dan "Administrator".



---

## 🛠️ Teknologi yang Digunakan (Tech Stack)

| Komponen | Teknologi | Deskripsi |
| --- | --- | --- |
| **Frontend** | React.js / Vue.js, Vite | Kerangka kerja *frontend* modern dengan proses *build* yang cepat.

 |
| **Styling** | Tailwind CSS | Penyusunan desain *dashboard* yang rapi dan responsif tanpa menulis CSS dari nol.

 |
| **Backend & Database** | Supabase (PostgreSQL) | Database SQL struktural tangguh untuk menyimpan data profil, tautan video, dan metrik penilaian.

 |
| **Autentikasi** | Supabase Auth | Pengelolaan keamanan sesi dan kata sandi pengguna (*hashing* otomatis).

 |
| **Ikonografi** | Lucide-React | Kumpulan ikon minimalis untuk mempercantik antarmuka pengguna.

 |

---

## 🗄️ Arsitektur Database

Sistem ini menggunakan basis data relasional PostgreSQL dengan dua tabel utama untuk memisahkan kredensial masuk dari data publik:

* 
**Tabel `auth.users**`: Tabel rahasia bawaan yang menyimpan kredensial (Email & Password) yang terenkripsi.


* 
**Tabel `public.profiles**`: Menyimpan detail personal yang saling terhubung dengan tabel autentikasi. Terdiri dari:


* 
`id` (UUID): Kunci utama yang bereferensi ke tabel autentikasi.


* 
`nomor_induk` (Text): NIS atau NIP.


* 
`nama_lengkap` (Text): Nama asli pengguna.


* 
`role` (Text): Peran akses (Siswa/Guru/Admin).


* 
`kelas` (Text): Rombongan belajar.


* 
`created_at` (Timestamp): Waktu akun dibuat.





---

## 🚀 Instalasi & Konfigurasi Lokal

1. **Kloning Repositori**
```bash
git clone https://github.com/username/murottal-watch.git
cd murottal-watch

```


2. **Instalasi Dependensi**
```bash
npm install

```


3. **Konfigurasi Lingkungan (Environment Variables)**
Buat fail `.env` di direktori *root* (luar folder `src`) dan tambahkan kunci API Supabase Anda:


```env
VITE_SUPABASE_URL=https://[YOUR_PROJECT_ID].supabase.co
VITE_SUPABASE_ANON_KEY=[YOUR_ANON_KEY]

```


4. **Jalankan Server Pengembangan**
```bash
npm run dev

```



---

> 
> **Catatan:** Pastikan *browser* yang digunakan memberikan izin (akses kamera dan mikrofon) saat halaman aplikasi dimuat pertama kali agar fitur MediaRecorder dapat berfungsi dengan baik.
> 
>