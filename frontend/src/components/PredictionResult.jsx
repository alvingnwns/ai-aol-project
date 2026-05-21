import { BarChart3, MapPin, Wheat, Calendar, CheckCircle2, AlertTriangle } from 'lucide-react'

export default function PredictionResult({ result }) {
  if (!result) {
    return (
      <div className="bg-[#263333]/50 border border-[#4a5e5e]/50 border-dashed rounded-2xl p-8 text-center">
        <BarChart3 className="w-10 h-10 text-[#4a5e5e] mx-auto mb-3" />
        <p className="text-[#8a9e9e] text-sm">Fill in the form and click "Predict Yield" to see results here.</p>
      </div>
    )
  }

  const { area, item, year, predicted_yield_hg_ha, predicted_yield_tonnes_ha, model_r2, crop_failure, outlier_features } = result

  const MetaTags = () => (
    <div className="flex flex-wrap gap-2 mb-5">
      <span className="flex items-center gap-1 bg-[#1a2626]/70 border border-[#4a5e5e] text-[#c9d1d3] text-xs px-3 py-1 rounded-full">
        <MapPin className="w-3 h-3" /> {area}
      </span>
      <span className="flex items-center gap-1 bg-[#1a2626]/70 border border-[#4a5e5e] text-[#c9d1d3] text-xs px-3 py-1 rounded-full">
        <Wheat className="w-3 h-3" /> {item}
      </span>
      <span className="flex items-center gap-1 bg-[#1a2626]/70 border border-[#4a5e5e] text-[#c9d1d3] text-xs px-3 py-1 rounded-full">
        <Calendar className="w-3 h-3" /> {year}
      </span>
    </div>
  )

  if (crop_failure) {
    return (
      <div className="bg-gradient-to-br from-red-950/40 to-[#263333]/90 border border-red-700/70 rounded-2xl p-6 shadow-lg shadow-[#1a2626]/50">
        {/* Header */}
        <div className="flex items-center gap-2 mb-5">
          <AlertTriangle className="w-5 h-5 text-red-400" />
          <h2 className="text-[#f0f5f1] font-semibold text-base">Gagal Panen</h2>
          <span className="ml-auto text-xs text-[#c9d1d3] bg-[#1a2626] px-2 py-0.5 rounded-full border border-[#4a5e5e]">
            R² {model_r2}
          </span>
        </div>

        <MetaTags />

        {/* Failure detail */}
        <div className="bg-red-950/40 border border-red-800/50 rounded-xl p-4 mb-4">
          <p className="text-red-300 text-sm font-medium mb-1.5">Input di luar batas historis</p>
          <p className="text-[#c9d1d3] text-xs leading-relaxed mb-3">
            Kondisi berikut sangat tidak wajar untuk{' '}
            <strong className="text-[#f0f5f1]">{item}</strong> di{' '}
            <strong className="text-[#f0f5f1]">{area}</strong> berdasarkan data historis:
          </p>
          <div className="flex flex-wrap gap-2">
            {outlier_features.map(feat => (
              <span key={feat} className="bg-red-900/60 border border-red-700 text-red-300 text-xs px-2.5 py-1 rounded-full">
                ⚠ {feat}
              </span>
            ))}
          </div>
        </div>

        <p className="text-[#8a9e9e] text-xs text-center">
          Coba masukkan nilai yang lebih realistis untuk mendapatkan prediksi yang akurat.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-[#364747]/70 to-[#263333]/90 border border-[#a4b16d] rounded-2xl p-6 shadow-lg shadow-[#1a2626]/50">
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <CheckCircle2 className="w-5 h-5 text-[#a4b16d]" />
        <h2 className="text-[#f0f5f1] font-semibold text-base">Prediction Result</h2>
        <span className="ml-auto text-xs text-[#c9d1d3] bg-[#1a2626] px-2 py-0.5 rounded-full border border-[#4a5e5e]">
          R² {model_r2}
        </span>
      </div>

      <MetaTags />

      {/* Main result */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#1a2626]/70 border border-[#4a5e5e] rounded-xl p-4 text-center">
          <p className="text-[#c9d1d3] text-xs uppercase tracking-wider mb-1">Yield</p>
          <p className="text-[#f0f5f1] text-2xl font-bold">
            {predicted_yield_hg_ha.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </p>
          <p className="text-[#c9d1d3] text-xs mt-0.5">hg / ha</p>
        </div>
        <div className="bg-[#1a2626]/70 border border-[#4a5e5e] rounded-xl p-4 text-center">
          <p className="text-[#c9d1d3] text-xs uppercase tracking-wider mb-1">Converted</p>
          <p className="text-[#f0f5f1] text-2xl font-bold">
            {predicted_yield_tonnes_ha.toFixed(3)}
          </p>
          <p className="text-[#c9d1d3] text-xs mt-0.5">tonnes / ha</p>
        </div>
      </div>

      {/* Hint */}
      <p className="text-[#8a9e9e] text-xs mt-4 text-center">
        Ask the AI assistant below for insights about this prediction ↓
      </p>
    </div>
  )
}
