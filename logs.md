# Development Logs

## [2026-05-21] — Project Initialization

### Phase 1: EDA
- Dataset: `yield_df.csv` — 28,242 rows × 8 columns
- 101 countries, 10 crop types, Year 1990–2013
- No missing values
- Target: `hg/ha_yield` (right-skewed, log-transform recommended)
- Key finding: `pesticides_tonnes` has highest correlation with yield

### Phase 2: Project Setup
- Initialized Git repo at project root
- Updated `.gitignore` for Python/data-science project
- Pushed initial commit to GitHub

### Phase 3: Backend Setup (In Progress)
- Tech stack: FastAPI + XGBoost + Gemini LLM
- ML model: XGBoost Regressor (chosen for tabular regression with temporal feature)
- Created `requirements.txt`, `.env.example`
- Training script: `backend/train.py`
- Model saved to: `backend/models/xgboost_yield_model.pkl`

### Phase 4: Frontend Setup ✅ COMPLETED
- Tech stack: React + Vite + TailwindCSS
- Theme: Green agricultural
- Components: Header, PredictForm, PredictionResult, ChatPanel
- react-markdown + @tailwindcss/typography for AI response rendering
- Vite proxy configured for /api → http://localhost:8000

### Integration Test ✅ PASSED
- Backend: FastAPI on port 8000
  - GET  /api/meta     → 200 OK (area/item classes + model metrics)
  - POST /api/predict  → 200 OK (Albania/Maize/2010 → 50,710.99 hg/ha)
  - POST /api/chat     → Gemini (requires API key in .env)
- Frontend: Vite dev server on port 5173
  - Build: ✅ 651ms, 0 errors

### How to Run
```bash
# Backend
cd backend
.\.ai_venv\Scripts\Activate.ps1
uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# Frontend (new terminal)
cd frontend
npm run dev
```

