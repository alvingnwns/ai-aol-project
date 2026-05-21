import { Leaf, RotateCcw, Sprout } from 'lucide-react'

export default function Header({ onNewSession }) {
  return (
    <header className="bg-gradient-to-r from-green-950 to-emerald-900 border-b border-green-800 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="bg-green-500 rounded-lg p-2">
              <Sprout className="w-5 h-5 text-green-950" />
            </div>
            <div>
              <h1 className="text-green-100 font-bold text-lg leading-none">CropSense</h1>
              <p className="text-green-400 text-xs">AI Crop Yield Predictor</p>
            </div>
          </div>

          {/* New Session Button */}
          <button
            onClick={onNewSession}
            className="flex items-center gap-2 bg-green-700 hover:bg-green-600 text-green-100 text-sm font-medium px-4 py-2 rounded-lg transition-colors duration-200 border border-green-600"
          >
            <RotateCcw className="w-4 h-4" />
            New Session
          </button>
        </div>
      </div>
    </header>
  )
}
