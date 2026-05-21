import { useState, useEffect } from 'react'
import { Loader2, TrendingUp } from 'lucide-react'
import { getMeta, predictYield } from '../api'

export default function PredictForm({ onPrediction }) {
  const [meta, setMeta] = useState(null)
  const [form, setForm] = useState({
    area: '',
    item: '',
    year: 2020,
    rainfall_mm: '',
    pesticides_tonnes: '',
    avg_temp: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    getMeta()
      .then(data => {
        setMeta(data)
        setForm(f => ({ ...f, area: data.area_classes[0], item: data.item_classes[0] }))
      })
      .catch(() => setError('Failed to load model metadata. Is the backend running?'))
  }, [])

  const handleChange = e => {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
  }

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = await predictYield({
        ...form,
        year: Number(form.year),
        rainfall_mm: Number(form.rainfall_mm),
        pesticides_tonnes: Number(form.pesticides_tonnes),
        avg_temp: Number(form.avg_temp),
      })
      onPrediction(result)
    } catch (err) {
      setError(err.response?.data?.detail || 'Prediction failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const inputClass =
    'w-full bg-green-950 border border-green-700 text-green-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder-green-700'
  const labelClass = 'block text-green-400 text-xs font-semibold uppercase tracking-wider mb-1'
  const selectClass =
    'w-full bg-green-950 border border-green-700 text-green-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 cursor-pointer'

  return (
    <div className="bg-green-950/50 border border-green-800 rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp className="w-5 h-5 text-green-400" />
        <h2 className="text-green-100 font-semibold text-base">Predict Crop Yield</h2>
      </div>

      {error && (
        <div className="bg-red-950/50 border border-red-700 text-red-300 text-sm rounded-lg p-3 mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Area */}
        <div>
          <label className={labelClass}>Country / Region</label>
          {meta ? (
            <select name="area" value={form.area} onChange={handleChange} className={selectClass}>
              {meta.area_classes.map(a => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          ) : (
            <div className="h-9 bg-green-900/40 rounded-lg animate-pulse" />
          )}
        </div>

        {/* Item */}
        <div>
          <label className={labelClass}>Crop Type</label>
          {meta ? (
            <select name="item" value={form.item} onChange={handleChange} className={selectClass}>
              {meta.item_classes.map(i => (
                <option key={i} value={i}>{i}</option>
              ))}
            </select>
          ) : (
            <div className="h-9 bg-green-900/40 rounded-lg animate-pulse" />
          )}
        </div>

        {/* Year */}
        <div>
          <label className={labelClass}>Year</label>
          <input
            type="number"
            name="year"
            value={form.year}
            onChange={handleChange}
            min={1990}
            max={2100}
            required
            className={inputClass}
          />
        </div>

        {/* Rainfall */}
        <div>
          <label className={labelClass}>Rainfall (mm/year)</label>
          <input
            type="number"
            name="rainfall_mm"
            value={form.rainfall_mm}
            onChange={handleChange}
            step="0.1"
            placeholder="e.g. 1485"
            required
            className={inputClass}
          />
        </div>

        {/* Pesticides */}
        <div>
          <label className={labelClass}>Pesticides (tonnes)</label>
          <input
            type="number"
            name="pesticides_tonnes"
            value={form.pesticides_tonnes}
            onChange={handleChange}
            step="0.01"
            placeholder="e.g. 121"
            required
            className={inputClass}
          />
        </div>

        {/* Temp */}
        <div>
          <label className={labelClass}>Avg Temperature (°C)</label>
          <input
            type="number"
            name="avg_temp"
            value={form.avg_temp}
            onChange={handleChange}
            step="0.01"
            placeholder="e.g. 16.37"
            required
            className={inputClass}
          />
        </div>

        <button
          type="submit"
          disabled={loading || !meta}
          className="w-full bg-green-600 hover:bg-green-500 disabled:bg-green-900 disabled:text-green-600 text-green-950 font-semibold py-2.5 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 text-sm mt-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Predicting...
            </>
          ) : (
            <>
              <TrendingUp className="w-4 h-4" />
              Predict Yield
            </>
          )}
        </button>
      </form>
    </div>
  )
}
