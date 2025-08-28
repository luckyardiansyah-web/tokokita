Toko Kita Inventory
Aplikasi manajemen stok & penjualan menggunakan Next.js 15, TypeScript, Supabase, dan Shadcn/UI.  
Mendukung pencatatan stok dengan metode FIFO untuk menghitung COGS, pencatatan penjualan, serta laporan profit.


Fitur
- Manajemen stok barang  
- FIFO (First In First Out) untuk menghitung COGS  
- Pencatatan penjualan dengan detail profit & margin  
- Statistik penjualan (total revenue, profit, per produk, per hari)  
- Integrasi Supabase (database & auth)  
- Komponen UI modern berbasis **Shadcn/UI**  

=======================

Instalasi Run
1. Clone repo ini
   ```bash
   git clone https://github.com/username/toko-kita-inventory.git
   cd toko-kita-inventory
2. pnpm install
3. pnpm dev

Testing
1. pnpm test

=======================

.env.local
NEXT_PUBLIC_SUPABASE_URL=https://fteqggzbbzunueqabdfy.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0ZXFnZ3piYnp1bnVlcWFiZGZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMDExNTAsImV4cCI6MjA3MTg3NzE1MH0.-CBhqZGTePck_x6elcBU9yk6MV5mQRoe2vIPBPbsKEI
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

=======================

Storage (Supabase)
Project ini menggunakan Supabase (PostgreSQL cloud) sebagai storage utama karena:
- Mudah diintegrasikan dengan Next.js
- Mendukung autentikasi & Row Level Security (RLS)
- Cocok untuk data relasional (produk, batch, penjualan)
- Mendukung real-time bila dibutuhkan
Struktur tabel utama:
- products → daftar produk
- stock_batches → batch stok masuk (FIFO calculation)
- sales → catatan penjualan
- sale_batch_items → detail batch yang terpakai saat penjualan

Testing (Stub Service)
Untuk testing dengan Vitest, digunakan stub/mock service:
- Supabase client dimock → agar test tidak benar-benar mengakses database.
- stockBatchService bisa dibuat versi stub yang mengembalikan data dummy (stok tersedia, FIFO cogs, dll).
- Hal ini memungkinkan pengujian logika bisnis (misalnya perhitungan profit, validasi stok) tanpa ketergantungan ke database.