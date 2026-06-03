# Development Logs

## [2026-05-21] — Project Initialization (CropSense AI — ARCHIVED)

### Phase 1–4: Setup & Initial Build
- Dataset: `yield_df.csv` — 28,242 rows, 101 countries, 10 crops, 1990–2013
- Model: XGBoost + linear trend hybrid, R²=0.9401
- Stack: FastAPI + React + Vite + TailwindCSS + Gemini LLM
- **Catatan: Versi ini berbasis data global (bukan Indonesia). Diarsipkan.**

---

## [2026-06-03] — Full Overhaul: PanenAI (Data BPS Indonesia)

### Overview
Proyek dirombak total dari "CropSense AI" (global) → "PanenAI" (Indonesia per provinsi).
Dataset baru: `prediksi_hasil_panen_2000-2015.csv` (BPS + BMKG Indonesia).

### Dataset Baru
- 3,808 baris | 9 kolom | 0 null values
- 34 Provinsi Indonesia
- 7 Jenis Tanaman: Jagung, Kacang_Hijau, Kacang_Tanah, Kedelai, Padi, Ubi_Jalar, Ubi_Kayu
- Tahun: 2000–2015
- Fitur: Curah_Hujan_mm, Hari_Hujan, Suhu_Rata_C, Tekanan_Udara_mb, Penyinaran_Matahari_pct
- Target: Produksi (ton/tahun)

### Architecture Decisions
- Model: Hybrid Linear Trend per (Provinsi, Jenis_Tanaman) + XGBoost residuals
- Output unit: ton/tahun (Produksi total provinsi), bukan hg/ha
- Kalkulator: referensi 7 juta ha total lahan Indonesia
- UI: Redesign total — tab-based (Prediksi | Kalkulator | Chatbot), tema hijau/amber
- Branding baru: "PanenAI — Prediksi Cerdas Hasil Panen Indonesia"

## [2026-06-03] — Phase 3: Frontend Redesign Total

### Changes
- Branding baru: PanenAI, color palette hijau gelap (#0D1F1B) + amber
- Layout tab-based: Prediksi | Kalkulator | Chatbot
- PredictForm: Input field Indonesia (Provinsi, Jenis_Tanaman, dll.) + range hint historis per (Provinsi, Tanaman)
- PredictionResult: Menampilkan Produksi ton/tahun + section AI Reasoning dari Gemini
- Calculator.jsx (BARU): Hitung produksi untuk X ha, konversi ke kg/kwintal, estimasi pendapatan
- ChatPanel: Update ke tema PanenAI, pertanyaan saran disesuaikan ke Indonesia
- api.js: Rename predictYield → predictPanen, field disesuaikan
- Build: 469ms, 0 errors, gzip 120KB

### Feature Ranges
- Form menampilkan rentang historis (min/max/mean) per (Provinsi, Jenis_Tanaman) dari model_meta.json
- Data otomatis update saat user ganti pilihan provinsi atau jenis tanaman

