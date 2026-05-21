import { Leaf, RotateCcw, Sprout } from 'lucide-react'

export default function Header({ onNewSession }) {
  return (
    <header className="bg-[#364747] border-b border-[#4a5e5e] shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="bg-[#a4b16d] rounded-lg p-2">
              <Sprout className="w-5 h-5 text-[#1a2626]" />
            </div>
            <div>
              <h1 className="text-[#f0f5f1] font-bold text-lg leading-none">CropSense</h1>
              <p className="text-[#c9d1d3] text-xs">AI Crop Yield Predictor</p>
            </div>
          </div>

          {/* New Session Button */}
          <button
            onClick={onNewSession}
            className="flex items-center gap-2 bg-[#626c32] hover:bg-[#9db16d] hover:text-[#1a2626] text-[#f0f5f1] text-sm font-medium px-4 py-2 rounded-lg transition-colors duration-200 border border-[#a4b16d]"
          >
            <RotateCcw className="w-4 h-4" />
            New Session
          </button>
        </div>
      </div>
    </header>
  )
}
