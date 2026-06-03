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
      <span className="flex items-center gap-1 bg-[#0D1F1B] border border-[#1D3830] text-[#94A3A0] text-xs px-3 py-1 rounded-full">
        <MapPin className="w-3 h-3" /> {provinsi}
      </span>
      <span className="flex items-center gap-1 bg-[#0D1F1B] border border-[#1D3830] text-[#94A3A0] text-xs px-3 py-1 rounded-full">
        <Leaf className="w-3 h-3" /> {CROP_LABELS[jenis_tanaman] ?? jenis_tanaman}
      </span>
      <span className="flex items-center gap-1 bg-[#0D1F1B] border border-[#1D3830] text-[#94A3A0] text-xs px-3 py-1 rounded-full">
        <Calendar className="w-3 h-3" /> {tahun}
      </span>
    </div>
  )
}

export default function PredictionResult({ result }) {
  if (!result) {
    return (
      <div className="bg-[#142421]/50 border border-[#1D3830] border-dashed rounded-2xl p-10 text-center">
        <BarChart3 className="w-10 h-10 text-[#2D5447] mx-auto mb-3" />
        <p className="text-[#4A7065] text-sm">Isi form dan klik "Prediksi Sekarang" untuk melihat hasil di sini.</p>
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
    <div className={`rounded-2xl p-6 animate-fade-in ${
      isWarning
        ? 'bg-gradient-to-br from-amber-950/30 to-[#142421] border border-amber-600/50 warning-glow'
        : 'bg-gradient-to-br from-[#1B4332]/50 to-[#142421] border border-[#38A169]/60 result-glow'
    }`}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        {isWarning
          ? <AlertTriangle className="w-5 h-5 text-amber-400" />
          : <CheckCircle2 className="w-5 h-5 text-[#38A169]" />
        }
        <h2 className="text-[#F0FDF4] font-semibold text-base">
          {isWarning ? 'Hasil Prediksi — Perhatian Diperlukan' : 'Hasil Prediksi'}
        </h2>
        <span className="ml-auto text-xs text-[#6EE7B7] bg-[#0D1F1B] px-2 py-0.5 rounded-full border border-[#1D3830]">
          R² {model_r2}
        </span>
      </div>

      <MetaTags provinsi={provinsi} jenis_tanaman={jenis_tanaman} tahun={tahun} />

      {/* Main result */}
      <div className="bg-[#0D1F1B]/80 border border-[#1D3830] rounded-xl p-5 mb-4 text-center">
        <p className="text-[#6EE7B7] text-xs uppercase tracking-wider mb-2">Prediksi Produksi</p>
        <p className="text-[#F0FDF4] text-4xl font-bold tracking-tight">
          {(predicted_produksi_ton / 1_000_000).toLocaleString('id', { maximumFractionDigits: 3 })}
          <span className="text-[#38A169] text-xl font-medium ml-1">juta ton</span>
        </p>
        <p className="text-[#4A7065] text-xs mt-1">
          = {predicted_produksi_ton.toLocaleString('id', { maximumFractionDigits: 0 })} ton/tahun
        </p>
        <p className="text-[#4A7065] text-xs mt-0.5">Referensi total lahan Indonesia ±7 juta ha</p>
      </div>

      {/* Outlier warning */}
      {isWarning && outlier_features?.length > 0 && (
        <div className="bg-amber-950/30 border border-amber-600/40 rounded-xl p-4 mb-4">
          <p className="text-amber-300 text-xs font-semibold mb-2">Kondisi di Luar Rentang Normal</p>
          <p className="text-[#94A3A0] text-xs mb-3">
            Fitur berikut berada di luar batas historis untuk{' '}
            <strong className="text-[#F0FDF4]">{CROP_LABELS[jenis_tanaman] ?? jenis_tanaman}</strong> di{' '}
            <strong className="text-[#F0FDF4]">{provinsi}</strong>:
          </p>
          <div className="flex flex-wrap gap-2">
            {outlier_features.map(f => (
              <span key={f} className="bg-amber-900/40 border border-amber-600/60 text-amber-300 text-xs px-2.5 py-1 rounded-full">
                ⚠ {f}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* AI Reasoning */}
      {ai_reasoning && (
        <div className="bg-[#0D1F1B]/60 border border-[#1D3830] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Brain className="w-4 h-4 text-[#6EE7B7]" />
            <span className="text-[#6EE7B7] text-xs font-semibold uppercase tracking-wider">Analisis & Rekomendasi AI</span>
          </div>
          <div className="prose prose-sm prose-invert max-w-none
            prose-p:text-[#94A3A0] prose-p:text-xs prose-p:leading-relaxed prose-p:my-1.5
            prose-strong:text-[#6EE7B7] prose-ul:text-[#94A3A0] prose-li:text-xs prose-li:my-0.5
            prose-h1:text-[#F0FDF4] prose-h2:text-[#F0FDF4] prose-h3:text-[#6EE7B7]">
            <ReactMarkdown>{ai_reasoning}</ReactMarkdown>
          </div>
        </div>
      )}

      <p className="text-[#2D5447] text-xs mt-4 text-center">
        Tanya lebih lanjut di tab Chatbot AI →
      </p>
    </div>
  )
}
