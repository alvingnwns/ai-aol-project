import { BarChart3, MapPin, Wheat, Calendar, CheckCircle2 } from 'lucide-react'

export default function PredictionResult({ result }) {
  if (!result) {
    return (
      <div className="bg-green-950/30 border border-green-800/50 border-dashed rounded-2xl p-8 text-center">
        <BarChart3 className="w-10 h-10 text-green-800 mx-auto mb-3" />
        <p className="text-green-700 text-sm">Fill in the form and click "Predict Yield" to see results here.</p>
      </div>
    )
  }

  const { area, item, year, predicted_yield_hg_ha, predicted_yield_tonnes_ha, model_r2 } = result

  return (
    <div className="bg-gradient-to-br from-green-900/60 to-emerald-950/80 border border-green-600 rounded-2xl p-6 shadow-lg shadow-green-950/50">
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <CheckCircle2 className="w-5 h-5 text-green-400" />
        <h2 className="text-green-100 font-semibold text-base">Prediction Result</h2>
        <span className="ml-auto text-xs text-green-500 bg-green-950 px-2 py-0.5 rounded-full border border-green-700">
          R² {model_r2}
        </span>
      </div>

      {/* Meta tags */}
      <div className="flex flex-wrap gap-2 mb-5">
        <span className="flex items-center gap-1 bg-green-950/70 border border-green-800 text-green-300 text-xs px-3 py-1 rounded-full">
          <MapPin className="w-3 h-3" /> {area}
        </span>
        <span className="flex items-center gap-1 bg-green-950/70 border border-green-800 text-green-300 text-xs px-3 py-1 rounded-full">
          <Wheat className="w-3 h-3" /> {item}
        </span>
        <span className="flex items-center gap-1 bg-green-950/70 border border-green-800 text-green-300 text-xs px-3 py-1 rounded-full">
          <Calendar className="w-3 h-3" /> {year}
        </span>
      </div>

      {/* Main result */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-green-950/70 border border-green-700 rounded-xl p-4 text-center">
          <p className="text-green-500 text-xs uppercase tracking-wider mb-1">Yield</p>
          <p className="text-green-100 text-2xl font-bold">
            {predicted_yield_hg_ha.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </p>
          <p className="text-green-500 text-xs mt-0.5">hg / ha</p>
        </div>
        <div className="bg-green-950/70 border border-green-700 rounded-xl p-4 text-center">
          <p className="text-green-500 text-xs uppercase tracking-wider mb-1">Converted</p>
          <p className="text-green-100 text-2xl font-bold">
            {predicted_yield_tonnes_ha.toFixed(3)}
          </p>
          <p className="text-green-500 text-xs mt-0.5">tonnes / ha</p>
        </div>
      </div>

      {/* Hint */}
      <p className="text-green-600 text-xs mt-4 text-center">
        Ask the AI assistant below for insights about this prediction ↓
      </p>
    </div>
  )
}
