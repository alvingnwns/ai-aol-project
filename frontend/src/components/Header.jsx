import { Sprout, RotateCcw } from 'lucide-react'

export default function Header({ onNewSession, activeTab, onTabChange }) {
  const tabs = [
    { id: 'prediksi', label: 'Prediksi Panen' },
    { id: 'kalkulator', label: 'Kalkulator' },
    { id: 'chatbot', label: 'Chatbot AI' },
  ]

  return (
    <header className="bg-[#0F2520] border-b border-[#1D3830] shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="bg-[#38A169] rounded-xl p-2 shadow-lg shadow-[#38A169]/20">
              <Sprout className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-[#F0FDF4] font-bold text-lg leading-none tracking-tight">PanenAI</h1>
              <p className="text-[#6EE7B7] text-xs">Prediksi Cerdas Hasil Panen Indonesia</p>
            </div>
          </div>

          <nav className="hidden sm:flex items-center gap-1 bg-[#0D1F1B] rounded-xl p-1 border border-[#1D3830]">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-[#1B4332] border border-[#38A169] text-[#6EE7B7]'
                    : 'text-[#94A3A0] hover:text-[#F0FDF4] hover:bg-[#142421]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          <button
            onClick={onNewSession}
            className="flex items-center gap-2 bg-[#142421] hover:bg-[#1B4332] text-[#94A3A0] hover:text-[#6EE7B7] text-sm font-medium px-3 py-2 rounded-lg transition-all duration-200 border border-[#1D3830] hover:border-[#38A169]"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sesi Baru</span>
          </button>
        </div>

        {/* Mobile tabs */}
        <div className="sm:hidden flex gap-1 pb-3">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-[#1B4332] border border-[#38A169] text-[#6EE7B7]'
                  : 'text-[#94A3A0] bg-[#0D1F1B] border border-[#1D3830]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </header>
  )
}
