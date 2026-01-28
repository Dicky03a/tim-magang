
# Panduan Setup EduTask - Sistem Manajemen Tugas

## 1. Persyaratan Sistem
- **Node.js**: Versi 18 ke atas.
- **npm** atau **pnpm** (sebagai package manager).
- **Akun Supabase**: Untuk database dan autentikasi.

## 2. Langkah Instalasi Lokal
1. **Clone Repositori**:
   ```bash
   git clone <url-repo>
   cd edutask
   ```
2. **Install Dependensi**:
   ```bash
   npm install
   ```
3. **Konfigurasi Environment**:
   Buat file `.env` di root folder dan tambahkan kunci dari Supabase:
   ```env
   SUPABASE_URL=https://project-id.supabase.co
   SUPABASE_ANON_KEY=your-anon-key-here
   ```
4. **Jalankan Aplikasi**:
   ```bash
   npm run dev
   ```

## 3. Setup Supabase
1. Buat proyek baru di [Supabase Dashboard](https://app.supabase.com).
2. Buka bagian **SQL Editor**.
3. Copy-paste isi file `supabase_schema.sql` (yang disertakan dalam proyek ini) dan tekan **Run**.
4. Di bagian **Authentication**, matikan "Confirm Email" di bawah *Auth Settings* jika ingin login langsung tanpa verifikasi email (untuk keperluan development).

## 4. Struktur Proyek
- `App.tsx`: Routing utama (Admin, Mahasiswa, Login).
- `pages/`: Halaman individual aplikasi.
- `lib/supabase.ts`: Konfigurasi koneksi ke backend.
- `components/`: Komponen UI yang dapat digunakan kembali.
- `types.ts`: Definisi interface TypeScript untuk data akademik.

## 5. Alur Penggunaan
- **Admin**: Login dengan akun ber-role `ADMIN`. Dapat membuat Semester, Mata Kuliah, Kelas, dan mengunggah Tugas beserta Soal Pilihan Ganda.
- **Mahasiswa**: Login dengan akun ber-role `STUDENT`. Mahasiswa akan melihat tugas yang sesuai dengan Kelas dan Semesternya. Nilai akan muncul otomatis setelah submit.

## 6. Catatan Keamanan
- Penilaian dilakukan secara otomatis di sisi klien saat pengiriman (submit), namun idealnya divalidasi ulang di backend/Edge Function untuk mencegah manipulasi.
- Gunakan RLS (Row Level Security) Supabase untuk membatasi mahasiswa agar hanya bisa melihat tugas di kelas mereka sendiri.
