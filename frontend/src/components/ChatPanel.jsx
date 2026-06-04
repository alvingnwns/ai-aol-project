import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Loader2, MessageSquare, Sparkles } from 'lucide-react'
import { chatWithAI } from '../api'
import ReactMarkdown from 'react-markdown'

const CROP_LABELS = {
  Jagung:'Jagung', Kacang_Hijau:'Kacang Hijau', Kacang_Tanah:'Kacang Tanah',
  Kedelai:'Kedelai', Padi:'Padi', Ubi_Jalar:'Ubi Jalar', Ubi_Kayu:'Ubi Kayu',
}

export default function ChatPanel({ predictionContext }) {
  const [history, setHistory] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [history, loading])

  const handleSend = async () => {
    const trimmed = input.trim()
    if (!trimmed || loading) return
    const userMsg = { role: 'user', content: trimmed }
    const newHistory = [...history, userMsg]
    setHistory(newHistory)
    setInput('')
    setLoading(true)
    try {
      const data = await chatWithAI(trimmed, history, predictionContext)
      setHistory([...newHistory, { role: 'model', content: data.reply }])
    } catch {
      setHistory([...newHistory, {
        role: 'model',
        content: 'Gagal mendapatkan respons. Periksa API key atau coba lagi.',
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const suggestions = predictionContext ? [
    `Mengapa prediksi produksi ${CROP_LABELS[predictionContext.jenis_tanaman] ?? predictionContext.jenis_tanaman} di ${predictionContext.provinsi} tahun ${predictionContext.tahun} bisa ${(predictionContext.predicted_produksi_ton / 1_000_000).toFixed(2)} juta ton?`,
    'Apa yang bisa dilakukan petani untuk meningkatkan hasil panen?',
    'Bagaimana pengaruh curah hujan terhadap produksi tanaman ini?',
  ] : [
    'Faktor apa yang paling memengaruhi hasil panen di Indonesia?',
    'Tanaman apa yang cocok ditanam di musim kemarau?',
    'Bagaimana cara membaca hasil prediksi CropSense?',
  ]

  return (
    <div className="bg-white border border-[#D8E8CE] border-l-4 border-l-[#3D8050] rounded-2xl flex flex-col h-full min-h-96 max-h-[680px] card-glow">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-[#D8E8CE] bg-[#F4F9F2] rounded-t-2xl">
        <div className="bg-[#3D8050] rounded-lg p-1.5 shadow-md shadow-[#3D8050]/20">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <div>
          <h2 className="text-[#1C3A28] font-bold text-sm">CropSense Chatbot</h2>
          <p className="text-[#5A8A6A] text-xs">Powered by Gemini</p>
        </div>
        {predictionContext && (
          <span className="ml-auto text-xs bg-[#EAF4E6] text-[#2A5C38] px-2 py-0.5 rounded-full border border-[#C2DEBA]">
            Konteks prediksi aktif
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin px-4 py-4 space-y-4">
        {history.length === 0 && (
          <div className="text-center py-8">
            <MessageSquare className="w-8 h-8 text-[#A8C8A0] mx-auto mb-3" />
            <p className="text-[#6B8A74] text-sm mb-4">Tanyakan apa saja tentang pertanian dan hasil panen!</p>
            <div className="space-y-2">
              {suggestions.map(s => (
                <button key={s} onClick={() => setInput(s)}
                  className="block w-full text-left text-xs text-[#4A6A54] bg-[#F4F9F2] hover:bg-[#EAF4E6] border border-[#D8E8CE] hover:border-[#4A8C5C]/50 px-3 py-2 rounded-lg transition-all">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {history.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${msg.role === 'user' ? 'bg-[#3D8050]' : 'bg-[#EAF4E6]'}`}>
              {msg.role === 'user'
                ? <User className="w-3.5 h-3.5 text-white" />
                : <Bot className="w-3.5 h-3.5 text-[#3D8050]" />
              }
            </div>
            <div className={`max-w-[82%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
              msg.role === 'user'
                ? 'bg-[#3D8050] text-white rounded-tr-sm'
                : 'bg-[#F4F9F2] border border-[#D8E8CE] text-[#1C3A28] rounded-tl-sm'
            }`}>
              {msg.role === 'model' ? (
                <div className="prose prose-sm max-w-none
                  prose-p:my-1 prose-p:text-[#3D5E48] prose-p:text-xs prose-p:leading-relaxed
                  prose-ul:my-1 prose-li:my-0.5 prose-li:text-[#3D5E48] prose-li:text-xs
                  prose-strong:text-[#1C3A28]">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              ) : msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-[#EAF4E6] flex items-center justify-center flex-shrink-0">
              <Bot className="w-3.5 h-3.5 text-[#3D8050]" />
            </div>
            <div className="bg-[#F4F9F2] border border-[#D8E8CE] rounded-2xl rounded-tl-sm px-4 py-2.5">
              <Loader2 className="w-4 h-4 text-[#4A8C5C] animate-spin" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="px-4 py-4 border-t border-[#D8E8CE]">
        <div className="flex gap-2">
          <textarea
            value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown}
            placeholder={predictionContext
              ? `Tanyakan tentang prediksi ${CROP_LABELS[predictionContext.jenis_tanaman] ?? predictionContext.jenis_tanaman} di ${predictionContext.provinsi}...`
              : 'Tanyakan tentang pertanian Indonesia...'
            }
            rows={1}
            className="flex-1 bg-[#FAFDF9] border border-[#C8DDD0] text-[#1C3A28] rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#4A8C5C] focus:border-[#4A8C5C] focus:bg-white placeholder-[#A8C0A0] transition-colors"
            style={{ minHeight: '40px', maxHeight: '120px' }}
          />
          <button onClick={handleSend} disabled={!input.trim() || loading}
            className="bg-[#3D8050] hover:bg-[#2A5C38] disabled:bg-[#EAF4E6] disabled:text-[#A8C8A0] text-white rounded-xl px-3 transition-all duration-200 flex-shrink-0">
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[#9AB8A2] text-xs mt-1.5 text-right">Enter kirim · Shift+Enter baris baru</p>
      </div>
    </div>
  )
}
