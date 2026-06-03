import { useState } from 'react'
import { Calculator as CalculatorIcon, Leaf, MapPin, TrendingUp } from 'lucide-react'

const REFERENCE_LAHAN_HA = 7_000_000

const HARGA_PER_KG = {
  Padi:         5_000,
  Jagung:       4_500,
  Kedelai:      9_000,
  Kacang_Tanah: 14_000,
  Kacang_Hijau: 13_000,
  Ubi_Kayu:     1_200,
  Ubi_Jalar:    2_000,
}

const CROP_LABELS = {
  Jagung:       'Jagung',
  Kacang_Hijau: 'Kacang Hijau',
  Kacang_Tanah: 'Kacang Tanah',
  Kedelai:      'Kedelai',
  Padi:         'Padi',
  Ubi_Jalar:    'Ubi Jalar',
  Ubi_Kayu:     'Ubi Kayu',
}

function StatCard({ label, value, unit, accent }) {
  return (
    <div className={`bg-[#0D1F1B] border rounded-xl p-4 text-center ${accent ? 'border-[#38A169]/60' : 'border-[#1D3830]'}`}>
      <p className="text-[#4A7065] text-xs uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-2xl font-bold ${accent ? 'text-[#6EE7B7]' : 'text-[#F0FDF4]'}`}>{value}</p>
      {unit && <p className="text-[#4A7065] text-xs mt-0.5">{unit}</p>}
    </div>
  )
}

export default function Calculator({ prediction }) {
  const [hectares, setHectares] = useState('')

  if (!prediction) {
    return (
      <div className="bg-[#142421] border border-[#1D3830] rounded-2xl p-10 text-center card-glow">
        <CalculatorIcon className="w-10 h-10 text-[#2D5447] mx-auto mb-4" />
        <h3 className="text-[#F0FDF4] font-semibold mb-2">Kalkulator Hasil Panen</h3>
        <p className="text-[#4A7065] text-sm">
          Lakukan prediksi di tab <strong className="text-[#6EE7B7]">Prediksi Panen</strong> terlebih dahulu,
          kemudian kembali ke sini untuk menghitung hasil berdasarkan luas lahan Anda.
        </p>
      </div>
    )
  }

  const { predicted_produksi_ton, provinsi, jenis_tanaman, tahun } = prediction
  const ha = parseFloat(hectares)
  const isValid = !isNaN(ha) && ha > 0

  const produksi_ton    = isValid ? predicted_produksi_ton * (ha / REFERENCE_LAHAN_HA) : 0
  const produksi_kg     = produksi_ton * 1_000
  const produksi_kwintal = produksi_ton * 10
  const harga            = HARGA_PER_KG[jenis_tanaman] ?? 5_000
  const estimasi_pendapatan = produksi_kg * harga

  const fmt = (n, digits = 0) => n.toLocaleString('id-ID', { maximumFractionDigits: digits })
  const fmtRp = (n) => {
    if (n >= 1_000_000_000) return `Rp ${fmt(n / 1_000_000_000, 2)} M`
    if (n >= 1_000_000)     return `Rp ${fmt(n / 1_000_000, 2)} jt`
    return `Rp ${fmt(n)}`
  }

  return (
    <div className="bg-[#142421] border border-[#1D3830] rounded-2xl p-6 card-glow animate-fade-in">
      <div className="flex items-center gap-2 mb-6">
        <div className="bg-[#38A169]/20 rounded-lg p-1.5">
          <CalculatorIcon className="w-4 h-4 text-[#38A169]" />
        </div>
        <h2 className="text-[#F0FDF4] font-semibold text-sm">Kalkulator Hasil Panen</h2>
      </div>

      {/* Context */}
      <div className="bg-[#0D1F1B] border border-[#1D3830] rounded-xl p-4 mb-6">
        <p className="text-[#4A7065] text-xs uppercase tracking-wider mb-2">Berdasarkan Prediksi</p>
        <div className="flex flex-wrap gap-2">
          <span className="flex items-center gap-1 text-[#94A3A0] text-xs">
            <MapPin className="w-3 h-3 text-[#38A169]" /> {provinsi}
          </span>
          <span className="flex items-center gap-1 text-[#94A3A0] text-xs">
            <Leaf className="w-3 h-3 text-[#38A169]" /> {CROP_LABELS[jenis_tanaman] ?? jenis_tanaman}
          </span>
          <span className="flex items-center gap-1 text-[#94A3A0] text-xs">
            <TrendingUp className="w-3 h-3 text-[#38A169]" />
            {fmt(predicted_produksi_ton)} ton/tahun (ref. {fmt(REFERENCE_LAHAN_HA / 1_000_000)} jt ha)
          </span>
        </div>
      </div>

      {/* Input */}
      <div className="mb-6">
        <label className="block text-[#94A3A0] text-xs font-semibold uppercase tracking-wider mb-1">
          Luas Lahan Anda (Hektare)
        </label>
        <input
          type="number"
          value={hectares}
          onChange={e => setHectares(e.target.value)}
          min="0.01"
          step="0.01"
          placeholder="mis. 5000"
          className="w-full bg-[#0D1F1B] border border-[#1D3830] text-[#F0FDF4] rounded-xl px-4 py-3 text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-[#38A169] placeholder-[#2D5447]"
        />
        <p className="text-[#4A7065] text-xs mt-1">
          Masukkan luas lahan untuk menghitung estimasi produksi. Referensi total: {fmt(REFERENCE_LAHAN_HA / 1_000_000)} juta ha.
        </p>
      </div>

      {/* Results */}
      {isValid ? (
        <div className="space-y-4 animate-fade-in">
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              label="Produksi"
              value={produksi_ton >= 1000 ? fmt(produksi_ton / 1000, 2) + ' ribu' : fmt(produksi_ton, 2)}
              unit="ton/tahun"
              accent
            />
            <StatCard
              label="Berat"
              value={produksi_kg >= 1_000_000 ? fmt(produksi_kg / 1_000_000, 2) + ' jt' : fmt(produksi_kg, 1)}
              unit="kilogram"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              label="Kuintal"
              value={produksi_kwintal >= 1000 ? fmt(produksi_kwintal / 1000, 2) + ' ribu' : fmt(produksi_kwintal, 1)}
              unit="kwintal (1 ton = 10 kwintal)"
            />
            <StatCard
              label="Est. Pendapatan"
              value={fmtRp(estimasi_pendapatan)}
              unit={`@ Rp ${fmt(harga)}/kg (est. harga ${CROP_LABELS[jenis_tanaman] ?? jenis_tanaman})`}
              accent
            />
          </div>

          <div className="bg-[#1B4332]/30 border border-[#38A169]/20 rounded-xl p-3 mt-2">
            <p className="text-[#6EE7B7] text-xs font-medium mb-0.5">Cara Perhitungan</p>
            <p className="text-[#4A7065] text-xs leading-relaxed">
              Produksi = {fmt(predicted_produksi_ton)} ton × ({fmt(ha)} ha ÷ {fmt(REFERENCE_LAHAN_HA / 1_000_000)} jt ha) = <strong className="text-[#94A3A0]">{fmt(produksi_ton, 2)} ton</strong>.
              Estimasi pendapatan menggunakan harga referensi pasar, bukan harga resmi.
            </p>
          </div>
        </div>
      ) : (
        <div className="border border-dashed border-[#1D3830] rounded-xl p-6 text-center">
          <p className="text-[#4A7065] text-sm">Masukkan luas lahan di atas untuk melihat hasil perhitungan.</p>
        </div>
      )}
    </div>
  )
}
