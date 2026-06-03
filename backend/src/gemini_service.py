import os
from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env"))

_api_key    = os.getenv("GEMINI_API_KEY", "")
_model_name = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")

_REASONING_SYSTEM_PROMPT = """
Kamu adalah konsultan pertanian ahli untuk PanenAI, sebuah sistem prediksi hasil panen Indonesia.
Tugasmu adalah memberikan analisis mendalam dan rekomendasi praktis berdasarkan hasil prediksi model ML.

Panduan respons:
1. ANALISIS HASIL: Evaluasi apakah hasil prediksi tergolong tinggi/sedang/rendah untuk provinsi dan tanaman tersebut. Berikan konteks historis singkat.
2. FAKTOR IKLIM: Analisis dampak data curah hujan, hari hujan, suhu, tekanan udara, dan penyinaran matahari terhadap prediksi. Sebutkan nilai aktualnya.
3. POTENSI RISIKO: Jika ada fitur outlier atau kondisi ekstrem, jelaskan risiko spesifiknya (kekeringan, banjir, hama, dll).
4. REKOMENDASI PETANI: Berikan 3-5 langkah konkret dan spesifik yang dapat dilakukan petani berdasarkan kondisi data yang diinput.
5. STRATEGI PENCEGAHAN GAGAL PANEN: Jika prediksi rendah atau ada outlier, berikan saran mitigasi khusus.

Aturan penting:
- WAJIB menggunakan Bahasa Indonesia
- Gunakan angka dan data aktual dari input dalam analisis
- Bersikap spesifik untuk jenis tanaman dan provinsi yang disebutkan
- Praktis dan actionable, hindari saran generik
- Format: paragraf berstruktur (bukan bullet list panjang)
- Panjang: 200-350 kata
"""

_CHAT_SYSTEM_PROMPT = """
Kamu adalah asisten AI PanenAI, platform cerdas prediksi hasil panen Indonesia berbasis data BPS & BMKG.
Model ML yang digunakan adalah XGBoost dengan akurasi R2=0.99 pada data pengujian.

Peranmu:
- Jelaskan nilai prediksi produksi tanaman (dalam ton/tahun per provinsi) dengan jelas
- Bantu pengguna memahami faktor-faktor iklim yang memengaruhi hasil panen
- Berikan wawasan tentang pertanian di provinsi-provinsi Indonesia
- Jawab pertanyaan tentang teknik bercocok tanam, musim, dan pengelolaan lahan
- Bandingkan hasil prediksi dengan rata-rata historis jika relevan

Aturan:
- Selalu jawab dalam bahasa yang sama dengan pertanyaan user (Indonesia atau Inggris)
- Jangan mengarang data statistik spesifik, hanya gunakan data yang disediakan dalam konteks
- Ramah, informatif, dan profesional
"""


def _check_api_key():
    if not _api_key or _api_key == "your_gemini_api_key_here":
        return "Gemini API key belum dikonfigurasi. Tambahkan GEMINI_API_KEY pada file .env."
    return None


def get_ai_reasoning(prediction_data: dict) -> str:
    err = _check_api_key()
    if err:
        return err

    client = genai.Client(api_key=_api_key)

    outlier_info = ""
    if prediction_data.get("outlier_features"):
        outlier_info = f"\n  Fitur Outlier    : {', '.join(prediction_data['outlier_features'])} (di luar rentang normal historis)"

    context = (
        f"[Data Prediksi Panen]\n"
        f"  Provinsi         : {prediction_data.get('provinsi')}\n"
        f"  Jenis Tanaman    : {prediction_data.get('jenis_tanaman')}\n"
        f"  Tahun Prediksi   : {prediction_data.get('tahun')}\n"
        f"  Prediksi Produksi: {prediction_data.get('predicted_produksi_ton'):,.2f} ton/tahun\n"
        f"  Curah Hujan      : {prediction_data.get('curah_hujan_mm')} mm/tahun\n"
        f"  Hari Hujan       : {prediction_data.get('hari_hujan')} hari/tahun\n"
        f"  Suhu Rata-rata   : {prediction_data.get('suhu_rata_c')} C\n"
        f"  Tekanan Udara    : {prediction_data.get('tekanan_udara_mb')} mb\n"
        f"  Penyinaran Mat.  : {prediction_data.get('penyinaran_matahari_pct')}%\n"
        f"  Akurasi Model    : R2 = {prediction_data.get('model_r2')}"
        f"{outlier_info}\n\n"
        f"Berikan analisis dan rekomendasi lengkap berdasarkan data di atas."
    )

    response = client.models.generate_content(
        model=_model_name,
        contents=[types.Content(role="user", parts=[types.Part(text=context)])],
        config=types.GenerateContentConfig(system_instruction=_REASONING_SYSTEM_PROMPT),
    )
    return response.text


def chat_with_gemini(message: str, history: list, prediction_context: dict = None) -> str:
    err = _check_api_key()
    if err:
        return err

    client = genai.Client(api_key=_api_key)

    gemini_history = []
    for msg in history:
        role = "user" if msg["role"] == "user" else "model"
        gemini_history.append(
            types.Content(role=role, parts=[types.Part(text=msg["content"])])
        )

    context_prefix = ""
    if prediction_context:
        context_prefix = (
            f"[Konteks Prediksi Aktif]\n"
            f"  Provinsi      : {prediction_context.get('provinsi')}\n"
            f"  Tanaman       : {prediction_context.get('jenis_tanaman')}\n"
            f"  Tahun         : {prediction_context.get('tahun')}\n"
            f"  Produksi      : {prediction_context.get('predicted_produksi_ton'):,.2f} ton/tahun\n"
            f"  Akurasi Model : R2 = {prediction_context.get('model_r2')}\n\n"
        )

    full_message = context_prefix + message

    response = client.models.generate_content(
        model=_model_name,
        contents=gemini_history + [types.Content(role="user", parts=[types.Part(text=full_message)])],
        config=types.GenerateContentConfig(system_instruction=_CHAT_SYSTEM_PROMPT),
    )
    return response.text
