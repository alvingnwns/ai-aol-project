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

### Phase 4: Frontend Setup (In Progress)
- Tech stack: React + Vite + TailwindCSS
- Theme: Green agricultural
- Features: Input form, prediction display, Gemini chatbot, session management
