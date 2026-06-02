import axios from 'axios'

// In dev: VITE_API_URL is not set → uses '/api' → Vite proxy forwards to localhost:8000
// In production (Vercel): VITE_API_URL = https://your-app.onrender.com/api
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL ?? '/api' })

export const getMeta = () => api.get('/meta').then(r => r.data)

export const predictYield = (payload) => api.post('/predict', payload).then(r => r.data)

export const chatWithAI = (message, history, predictionContext) =>
  api.post('/chat', {
    message,
    history,
    prediction_context: predictionContext ?? null,
  }).then(r => r.data)
