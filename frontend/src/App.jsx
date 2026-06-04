import { useState, useCallback } from 'react'
import './index.css'
import Header from './components/Header'
import PredictForm from './components/PredictForm'
import PredictionResult from './components/PredictionResult'
import Calculator from './components/Calculator'
import ChatPanel from './components/ChatPanel'

function App() {
  const [prediction, setPrediction] = useState(null)
  const [activeTab, setActiveTab] = useState('prediksi')
  const [sessionKey, setSessionKey] = useState(0)

  const handleNewSession = useCallback(() => {
    setPrediction(null)
    setActiveTab('prediksi')
    setSessionKey(k => k + 1)
  }, [])

  const handlePrediction = useCallback((result) => {
    setPrediction(result)
  }, [])

  return (
    <div className="min-h-screen bg-[#EFF6EC] flex flex-col">
      <Header
        onNewSession={handleNewSession}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">

        {/* Prediksi Tab */}
        {activeTab === 'prediksi' && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 animate-fade-in">
            <div className="lg:col-span-2">
              <PredictForm
                key={`form-${sessionKey}`}
                onPrediction={handlePrediction}
              />
            </div>
            <div className="lg:col-span-3">
              <PredictionResult result={prediction} />
            </div>
          </div>
        )}

        {/* Kalkulator Tab */}
        {activeTab === 'kalkulator' && (
          <div className="max-w-2xl mx-auto animate-fade-in">
            <Calculator prediction={prediction} />
          </div>
        )}

        {/* Chatbot Tab */}
        {activeTab === 'chatbot' && (
          <div className="max-w-3xl mx-auto h-[calc(100vh-180px)] animate-fade-in">
            <ChatPanel
              key={`chat-${sessionKey}`}
              predictionContext={prediction}
            />
          </div>
        )}
      </main>

      <footer className="text-center text-[#5A8A6A] text-xs py-4 border-t-2 border-[#C8DDD0] bg-white">
        CropSense © 2026 · XGBoost Model (R² 0.9887) · Gemini AI · Data BPS & BMKG Indonesia
      </footer>
    </div>
  )
}

export default App
