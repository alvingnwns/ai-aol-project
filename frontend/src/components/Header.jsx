import { Sprout, RotateCcw } from 'lucide-react'

export default function Header({ onNewSession, activeTab, onTabChange }) {
  const tabs = [
    { id: 'prediksi', label: 'Prediksi Panen' },
    { id: 'kalkulator', label: 'Kalkulator' },
    { id: 'chatbot', label: 'Chatbot AI' },
  ]

  return (
    <header className="bg-white border-b-2 border-[#4A8C5C] shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="bg-[#3D8050] rounded-xl p-2 shadow-md shadow-[#3D8050]/20">
              <Sprout className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-[#1C3A28] font-bold text-lg leading-none tracking-tight">CropSense</h1>
              <p className="text-[#7A8C50] text-xs">Prediksi Cerdas Hasil Panen Indonesia</p>
            </div>
          </div>

          <nav className="hidden sm:flex items-center gap-1 bg-[#EFF6EC] rounded-xl p-1 border border-[#C8DDD0]">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'tab-active'
                    : 'text-[#4A6A54] hover:text-[#1C3A28] hover:bg-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          <button
            onClick={onNewSession}
            className="flex items-center gap-2 bg-[#F4F9F2] hover:bg-[#EAF4E6] text-[#4A6A54] hover:text-[#2A5C38] text-sm font-medium px-3 py-2 rounded-lg transition-all duration-200 border border-[#D8E8CE] hover:border-[#4A8C5C]"
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
                  ? 'tab-active'
                  : 'text-[#6B8A74] bg-[#F4F9F2] border border-[#D8E8CE]'
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
