import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Loader2, MessageSquare, Sparkles } from 'lucide-react'
import { chatWithAI } from '../api'
import ReactMarkdown from 'react-markdown'

// Fallback if ReactMarkdown not installed — plain text
function SafeMarkdown({ children }) {
  try {
    return <ReactMarkdown>{children}</ReactMarkdown>
  } catch {
    return <span>{children}</span>
  }
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
        content: '⚠️ Failed to get response. Please check your API key or try again.',
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="bg-green-950/50 border border-green-800 rounded-2xl flex flex-col h-full min-h-96 max-h-[600px]">
      {/* Header */}
      <div className="flex items-center gap-2 px-5 py-4 border-b border-green-800">
        <div className="bg-green-600 rounded-lg p-1.5">
          <Sparkles className="w-4 h-4 text-green-950" />
        </div>
        <div>
          <h2 className="text-green-100 font-semibold text-sm">CropSense AI</h2>
          <p className="text-green-600 text-xs">Powered by Gemini</p>
        </div>
        {predictionContext && (
          <span className="ml-auto text-xs bg-green-800/50 text-green-400 px-2 py-0.5 rounded-full border border-green-700">
            Prediction loaded
          </span>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto scrollbar-thin px-4 py-4 space-y-4">
        {history.length === 0 && (
          <div className="text-center py-8">
            <MessageSquare className="w-8 h-8 text-green-800 mx-auto mb-3" />
            <p className="text-green-700 text-sm">Ask me anything about crop yield predictions!</p>
            <div className="mt-4 space-y-2">
              {[
                predictionContext
                  ? `Why is the yield for ${predictionContext.item} in ${predictionContext.area} ${predictionContext.predicted_yield_hg_ha?.toLocaleString()} hg/ha?`
                  : 'What factors affect crop yield the most?',
                'What does hg/ha mean?',
                'How can I improve yield for this crop?',
              ].map(suggestion => (
                <button
                  key={suggestion}
                  onClick={() => setInput(suggestion)}
                  className="block w-full text-left text-xs text-green-600 bg-green-950/60 hover:bg-green-900/60 border border-green-800 px-3 py-2 rounded-lg transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {history.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            {/* Avatar */}
            <div
              className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${
                msg.role === 'user' ? 'bg-green-600' : 'bg-emerald-700'
              }`}
            >
              {msg.role === 'user'
                ? <User className="w-3.5 h-3.5 text-green-950" />
                : <Bot className="w-3.5 h-3.5 text-green-100" />
              }
            </div>

            {/* Bubble */}
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-green-700 text-green-50 rounded-tr-sm'
                  : 'bg-green-900/70 border border-green-800 text-green-100 rounded-tl-sm prose prose-invert prose-sm max-w-none'
              }`}
            >
              {msg.role === 'model' ? (
                <div className="prose prose-sm prose-invert max-w-none
                  prose-p:my-1 prose-ul:my-1 prose-li:my-0.5
                  prose-strong:text-green-300 prose-code:text-green-300">
                  <SafeMarkdown>{msg.content}</SafeMarkdown>
                </div>
              ) : (
                msg.content
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-emerald-700 flex items-center justify-center flex-shrink-0">
              <Bot className="w-3.5 h-3.5 text-green-100" />
            </div>
            <div className="bg-green-900/70 border border-green-800 rounded-2xl rounded-tl-sm px-4 py-2.5">
              <Loader2 className="w-4 h-4 text-green-500 animate-spin" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-4 border-t border-green-800">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              predictionContext
                ? `Ask about the ${predictionContext.item} yield prediction...`
                : 'Ask about crop yield, agriculture, or predictions...'
            }
            rows={1}
            className="flex-1 bg-green-950 border border-green-700 text-green-100 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-500 placeholder-green-700"
            style={{ minHeight: '40px', maxHeight: '120px' }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="bg-green-600 hover:bg-green-500 disabled:bg-green-900 disabled:text-green-700 text-green-950 rounded-xl px-3 transition-colors duration-200 flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-green-800 text-xs mt-1.5 text-right">Enter to send · Shift+Enter for newline</p>
      </div>
    </div>
  )
}
