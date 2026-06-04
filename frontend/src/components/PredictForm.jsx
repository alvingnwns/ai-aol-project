import { useState, useEffect } from 'react'
import { Loader2, TrendingUp, Info } from 'lucide-react'
import { getMeta, predictPanen } from '../api'

const CROP_LABELS = {
  Jagung:       'Jagung — Pipilan Kering',
  Kacang_Hijau: 'Kacang Hijau — Biji Kering',
  Kacang_Tanah: 'Kacang Tanah — Biji Kering',
  Kedelai:      'Kedelai — Biji Kering',
  Padi:         'Padi — Gabah Kering Giling',
  Ubi_Jalar:    'Ubi Jalar — Umbi Basah',
  Ubi_Kayu:     'Ubi Kayu — Umbi Basah',
}

const FIELD_META = {
  curah_hujan_mm: {
    label: 'Curah Hujan',
    unit: 'mm/tahun',
    desc: 'Total curah hujan selama satu tahun. Nilai normal di Indonesia berkisar 1.000–4.000 mm.',
    step: '1',
    min: '0',
  },
  hari_hujan: {
    label: 'Hari Hujan',
    unit: 'hari/tahun',
    desc: 'Jumlah hari yang terdapat hujan dalam satu tahun.',
    step: '1',
    min: '0',
    max: '366',
    isInt: true,
  },
  suhu_rata_c: {
    label: 'Suhu Rata-rata',
    unit: '°C',
    desc: 'Suhu udara rata-rata tahunan. Indonesia umumnya 23–30°C.',
    step: '0.01',
    min: '15',
    max: '45',
  },
  tekanan_udara_mb: {
    label: 'Tekanan Udara',
    unit: 'mb',
    desc: 'Tekanan udara rata-rata tahunan. Di Indonesia umumnya 1.007–1.013 mb.',
    step: '0.01',
    min: '990',
    max: '1030',
  },
  penyinaran_matahari_pct: {
    label: 'Penyinaran Matahari',
    unit: '%',
    desc: 'Persentase lama penyinaran matahari aktual terhadap lama penyinaran maksimum.',
    step: '0.1',
    min: '0',
    max: '100',
  },
}

function RangeHint({ field, ranges }) {
  if (!ranges) return null
  const r = ranges[field]
  if (!r) return null
  return (
    <span className="text-[#4A8C5C] text-xs">
      Historis: {r.min.toLocaleString('id')}–{r.max.toLocaleString('id')} (rata-rata {r.mean.toLocaleString('id')})
    </span>
  )
}

export default function PredictForm({ onPrediction }) {
  const [meta, setMeta] = useState(null)
  const [form, setForm] = useState({
    provinsi: '',
    jenis_tanaman: '',
    tahun: 2025,
    curah_hujan_mm: '',
    hari_hujan: '',
    suhu_rata_c: '',
    tekanan_udara_mb: '',
    penyinaran_matahari_pct: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    getMeta()
      .then(data => {
        setMeta(data)
        setForm(f => ({
          ...f,
          provinsi: data.provinsi_classes[0],
          jenis_tanaman: data.tanaman_classes[0],
        }))
      })
      .catch(() => setError('Gagal memuat metadata. Pastikan backend sudah berjalan.'))
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
      const result = await predictPanen({
        provinsi:                 form.provinsi,
        jenis_tanaman:            form.jenis_tanaman,
        tahun:                    Number(form.tahun),
        curah_hujan_mm:           Number(form.curah_hujan_mm),
        hari_hujan:               Number(form.hari_hujan),
        suhu_rata_c:              Number(form.suhu_rata_c),
        tekanan_udara_mb:         Number(form.tekanan_udara_mb),
        penyinaran_matahari_pct:  Number(form.penyinaran_matahari_pct),
      })
      onPrediction(result)
    } catch (err) {
      setError(err.response?.data?.detail || 'Prediksi gagal. Coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  const rangeKey = `${form.provinsi}|${form.jenis_tanaman}`
  const currentRanges = meta?.feature_ranges?.[rangeKey] ?? null

  const inputCls = 'w-full bg-[#FAFDF9] border border-[#C8DDD0] text-[#1C3A28] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4A8C5C] focus:border-[#4A8C5C] focus:bg-white placeholder-[#A8C0A0] transition-colors'
  const selectCls = 'w-full bg-[#FAFDF9] border border-[#C8DDD0] text-[#1C3A28] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4A8C5C] focus:border-[#4A8C5C] cursor-pointer transition-colors'
  const labelCls = 'block text-[#2A5C38] text-xs font-bold uppercase tracking-wider mb-1'
  const descCls = 'text-[#7A9A84] text-xs mt-0.5 leading-relaxed'

  return (
    <div className="bg-white border border-[#D8E8CE] border-l-4 border-l-[#3D8050] rounded-2xl p-5 card-glow">
      <div className="flex items-center gap-2 mb-5">
        <div className="bg-[#3D8050] rounded-lg p-1.5 shadow-sm">
          <TrendingUp className="w-4 h-4 text-white" />
        </div>
        <h2 className="text-[#1C3A28] font-bold text-sm">Input Data Prediksi</h2>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg p-3 mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Provinsi */}
        <div>
          <label className={labelCls}>Provinsi</label>
          {meta ? (
            <select name="provinsi" value={form.provinsi} onChange={handleChange} className={selectCls}>
              {meta.provinsi_classes.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          ) : (
            <div className="h-9 bg-[#EEF5EB] rounded-lg animate-pulse" />
          )}
          <p className={descCls}>Pilih provinsi lokasi lahan pertanian.</p>
        </div>

        {/* Jenis Tanaman */}
        <div>
          <label className={labelCls}>Jenis Tanaman</label>
          {meta ? (
            <select name="jenis_tanaman" value={form.jenis_tanaman} onChange={handleChange} className={selectCls}>
              {meta.tanaman_classes.map(t => (
                <option key={t} value={t}>{CROP_LABELS[t] ?? t}</option>
              ))}
            </select>
          ) : (
            <div className="h-9 bg-[#EEF5EB] rounded-lg animate-pulse" />
          )}
          <p className={descCls}>Kualitas produksi sesuai standar BPS.</p>
        </div>

        {/* Tahun */}
        <div>
          <label className={labelCls}>Tahun Prediksi</label>
          <input
            type="number"
            name="tahun"
            value={form.tahun}
            onChange={handleChange}
            min={2000}
            max={2100}
            required
            className={inputCls}
          />
          <p className={descCls}>Tahun yang ingin diprediksi hasilnya. Data historis: 2000–2015.</p>
        </div>

        <div className="border-t border-[#D8E8CE] pt-4">
          <div className="flex items-center gap-1.5 mb-3 bg-[#EAF4E6] rounded-lg px-3 py-2">
            <Info className="w-3.5 h-3.5 text-[#3D8050]" />
            <span className="text-[#2A5C38] text-xs font-bold">Data Iklim & Cuaca</span>
            {currentRanges && (
              <span className="ml-auto text-[#5A8A6A] text-xs">rentang historis ditampilkan</span>
            )}
          </div>

          {Object.entries(FIELD_META).map(([field, meta_]) => (
            <div key={field} className="mb-3">
              <div className="flex items-center justify-between mb-1">
                <label className={labelCls}>{meta_.label} <span className="text-[#7A9A84] normal-case font-normal">({meta_.unit})</span></label>
                <RangeHint field={field} ranges={currentRanges} />
              </div>
              <input
                type="number"
                name={field}
                value={form[field]}
                onChange={handleChange}
                min={meta_.min}
                max={meta_.max}
                step={meta_.step}
                required
                className={inputCls}
                placeholder={currentRanges?.[field] ? `mis. ${currentRanges[field].mean.toLocaleString('id')}` : ''}
              />
              <p className={descCls}>{meta_.desc}</p>
            </div>
          ))}
        </div>

        <button
          type="submit"
          disabled={loading || !meta}
          className="w-full bg-[#3D8050] hover:bg-[#2A5C38] disabled:bg-[#D8E8CE] disabled:text-[#9AB8A2] text-white font-semibold py-2.5 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 text-sm shadow-md shadow-[#3D8050]/20 mt-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Memproses Prediksi &amp; AI Insight...
            </>
          ) : (
            <>
              <TrendingUp className="w-4 h-4" />
              Prediksi Sekarang
            </>
          )}
        </button>

        {loading && (
          <p className="text-[#6B8A74] text-xs text-center">
            Menganalisis data dengan AI... Mohon tunggu ~10–15 detik.
          </p>
        )}
      </form>
    </div>
  )
}
