import { BarChart3, MapPin, Leaf, Calendar, CheckCircle2, AlertTriangle, Brain } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

const CROP_LABELS = {
  Jagung:       'Jagung',
  Kacang_Hijau: 'Kacang Hijau',
  Kacang_Tanah: 'Kacang Tanah',
  Kedelai:      'Kedelai',
  Padi:         'Padi',
  Ubi_Jalar:    'Ubi Jalar',
  Ubi_Kayu:     'Ubi Kayu',
}

function MetaTags({ provinsi, jenis_tanaman, tahun }) {
  return (
    <div className="flex flex-wrap gap-2 mb-5">
      <span className="flex items-center gap-1 bg-white border border-[#D8E8CE] text-[#4A6A54] text-xs px-3 py-1 rounded-full">
        <MapPin className="w-3 h-3" /> {provinsi}
      </span>
      <span className="flex items-center gap-1 bg-white border border-[#D8E8CE] text-[#4A6A54] text-xs px-3 py-1 rounded-full">
        <Leaf className="w-3 h-3" /> {CROP_LABELS[jenis_tanaman] ?? jenis_tanaman}
      </span>
      <span className="flex items-center gap-1 bg-white border border-[#D8E8CE] text-[#4A6A54] text-xs px-3 py-1 rounded-full">
        <Calendar className="w-3 h-3" /> {tahun}
      </span>
    </div>
  )
}

export default function PredictionResult({ result }) {
  if (!result) {
    return (
      <div className="bg-white border border-[#D8E8CE] border-l-4 border-l-[#A8C8A0] border-dashed rounded-2xl p-10 text-center">
        <div className="w-16 h-16 bg-[#EAF4E6] rounded-2xl flex items-center justify-center mx-auto mb-4">
          <BarChart3 className="w-8 h-8 text-[#4A8C5C]" />
        </div>
        <p className="text-[#2A5C38] font-semibold text-sm mb-1">Belum Ada Prediksi</p>
        <p className="text-[#7A9A84] text-sm">Isi form dan klik "Prediksi Sekarang" untuk melihat hasil di sini.</p>
      </div>
    )
  }

  const {
    provinsi, jenis_tanaman, tahun,
    predicted_produksi_ton, model_r2,
    crop_failure, outlier_features, ai_reasoning,
  } = result

  const isWarning = crop_failure || (outlier_features?.length ?? 0) > 0

  return (
    <div className={`bg-white rounded-2xl p-6 animate-fade-in border-l-4 ${
      isWarning
        ? 'bg-gradient-to-br from-amber-50 to-white border border-amber-300 border-l-amber-400 warning-glow'
        : 'border border-[#C2DEBA] border-l-[#3D8050] result-glow'
    }`}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        {isWarning
          ? <AlertTriangle className="w-5 h-5 text-amber-500" />
          : <CheckCircle2 className="w-5 h-5 text-[#3D8050]" />
        }
        <h2 className="text-[#1C3A28] font-bold text-base">
          {isWarning ? 'Hasil Prediksi — Perhatian Diperlukan' : 'Hasil Prediksi'}
        </h2>
        <span className="ml-auto text-xs text-white bg-[#3D8050] px-2.5 py-0.5 rounded-full font-semibold">
          R² {model_r2}
        </span>
      </div>

      <MetaTags provinsi={provinsi} jenis_tanaman={jenis_tanaman} tahun={tahun} />

      {/* Main result */}
      <div className="bg-[#EAF4E6] border border-[#C2DEBA] rounded-xl p-5 mb-4 text-center">
        <p className="text-[#3D8050] text-xs font-bold uppercase tracking-wider mb-2">Prediksi Produksi</p>
        <p className="text-[#1C3A28] text-4xl font-bold tracking-tight">
          {(predicted_produksi_ton / 1_000_000).toLocaleString('id', { maximumFractionDigits: 3 })}
          <span className="text-[#3D8050] text-xl font-semibold ml-1">juta ton</span>
        </p>
        <p className="text-[#5A8A6A] text-xs mt-1">
          = {predicted_produksi_ton.toLocaleString('id', { maximumFractionDigits: 0 })} ton/tahun
        </p>
        <p className="text-[#8A9E84] text-xs mt-0.5">Referensi total lahan Indonesia ±7 juta ha</p>
      </div>

      {/* Outlier warning */}
      {isWarning && outlier_features?.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
          <p className="text-amber-700 text-xs font-semibold mb-2">Kondisi di Luar Rentang Normal</p>
          <p className="text-[#5A7060] text-xs mb-3">
            Fitur berikut berada di luar batas historis untuk{' '}
            <strong className="text-[#1C3A28]">{CROP_LABELS[jenis_tanaman] ?? jenis_tanaman}</strong> di{' '}
            <strong className="text-[#1C3A28]">{provinsi}</strong>:
          </p>
          <div className="flex flex-wrap gap-2">
            {outlier_features.map(f => (
              <span key={f} className="bg-amber-100 border border-amber-300 text-amber-700 text-xs px-2.5 py-1 rounded-full">
                ⚠ {f}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* AI Reasoning */}
      {ai_reasoning && (
        <div className="bg-[#F4F9F2] border border-[#D0E8C8] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[#D0E8C8]">
            <div className="bg-[#3D8050] rounded-md p-1">
              <Brain className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-[#2A5C38] text-xs font-bold uppercase tracking-wider">Analisis &amp; Rekomendasi AI</span>
          </div>
          <div className="prose prose-sm max-w-none
            prose-p:text-[#4A6A54] prose-p:text-xs prose-p:leading-relaxed prose-p:my-1.5
            prose-strong:text-[#2A5C38] prose-ul:text-[#4A6A54] prose-li:text-xs prose-li:my-0.5
            prose-h1:text-[#1C3A28] prose-h2:text-[#1C3A28] prose-h3:text-[#2A5C38]">
            <ReactMarkdown>{ai_reasoning}</ReactMarkdown>
          </div>
        </div>
      )}

      <p className="text-[#8A9E84] text-xs mt-4 text-center">
        Tanya lebih lanjut di tab Chatbot AI →
      </p>
    </div>
  )
}
