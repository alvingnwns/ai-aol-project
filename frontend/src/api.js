import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

export const getMeta = () => api.get('/meta').then(r => r.data)

export const predictYield = (payload) => api.post('/predict', payload).then(r => r.data)

export const chatWithAI = (message, history, predictionContext) =>
  api.post('/chat', {
    message,
    history,
    prediction_context: predictionContext ?? null,
  }).then(r => r.data)
