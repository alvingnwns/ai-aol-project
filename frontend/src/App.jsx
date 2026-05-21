import { useState, useCallback } from 'react'
import './index.css'
import Header from './components/Header'
import PredictForm from './components/PredictForm'
import PredictionResult from './components/PredictionResult'
import ChatPanel from './components/ChatPanel'

function App() {
  const [prediction, setPrediction] = useState(null)
  const [sessionKey, setSessionKey] = useState(0)

  const handleNewSession = useCallback(() => {
    setPrediction(null)
    setSessionKey(k => k + 1)
  }, [])

  return (
    <div className="min-h-screen bg-[#0a160a] flex flex-col">
      <Header onNewSession={handleNewSession} />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero text */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-green-100 mb-2">
            Crop Yield Predictor
          </h1>
          <p className="text-green-500 text-sm sm:text-base max-w-xl mx-auto">
            Enter agricultural parameters to predict crop yield using AI, then ask our Gemini-powered assistant for insights.
          </p>
        </div>

        {/* 3-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Form */}
          <div className="lg:col-span-1">
            <PredictForm key={`form-${sessionKey}`} onPrediction={setPrediction} />
          </div>

          {/* Center + Right */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* Result card */}
            <PredictionResult result={prediction} />

            {/* Chat panel */}
            <ChatPanel key={`chat-${sessionKey}`} predictionContext={prediction} />
          </div>
        </div>
      </main>

      <footer className="text-center text-green-800 text-xs py-4 border-t border-green-900/50">
        CropSense © 2026 · XGBoost Model (R² 0.971) · Gemini AI
      </footer>
    </div>
  )
}

export default App
