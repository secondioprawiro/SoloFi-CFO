Panduan singkat: menggunakan RTK dan Caveman di proyek ini

Opsi A — Jalankan lewat npx (tanpa install global)
- Contoh menjalankan Caveman: `npx caveman <args>`
- Contoh menjalankan RTK: `npx rtk <args>`

Opsi B — Install lokal/ global dari npm/GitHub
- Dari npm (jika tersedia):
  - `npm install -g rtk` atau `npm install -g caveman`
- Dari GitHub (build dan link):
  - `git clone https://github.com/rtk-ai/rtk.git && cd rtk && npm install && npm link`
  - `git clone https://github.com/juliusbrussee/caveman.git && cd caveman && npm install && npm link`
  - Setelah `npm link` di masing repo, jalankan `npm link rtk` atau `npm link caveman` di folder proyek untuk menghubungkan.

Opsi C — Menggunakan skrip npm di `package.json`
- Sudah ditambahkan skrip:
  - `npm run caveman` — menjalankan `caveman`
  - `npm run rtk:caveman` — menjalankan `rtk caveman`
- Jika Anda tidak menginstal biner, jalankan lewat npx: `npx rtk caveman` atau `npx caveman`.

Catatan:
- `npm install` gagal ketika mencoba mengunduh langsung dari GitHub jika repositori tidak memiliki `package.json` atau tidak kompatibel.
- Jika Anda mau, saya bisa mencoba menginstal paket secara manual di lingkungan ini, atau menyiapkan skrip yang menggunakan `git clone` + `npm link` otomatis.
