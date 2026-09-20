# InterviAI

**Adaptive AI Interview & Candidate Intelligence Platform**

InterviAI helps candidates understand and improve their interview readiness through adaptive technical interviews, project defense, resume evidence analysis, and candidate intelligence reporting.

## What it does

InterviAI combines an adaptive interview engine with resume and project evidence workflows:

- Extracts skills and role-relevant gaps from candidate profiles
- Generates and evaluates adaptive technical interview questions
- Adjusts difficulty, question type, and focus based on performance
- Builds project-defense context from uploaded project material using local retrieval
- Verifies resume claims against available evidence
- Runs resume claim cross-examination workflows
- Produces candidate intelligence and readiness insights
- Persists candidate, interview, answer, claim, account, session, and uploaded-file data through the backend

## Core architecture

```text
Next.js Frontend
        |
        v
FastAPI Backend
        |
        v
PostgreSQL (or SQLite for local fallback)
        |
        v
AI + RAG Services
```

The repository currently contains two frontend/application surfaces:

1. A Streamlit prototype in `app.py`
2. A Next.js application in `frontend/`

The Next.js application uses the FastAPI service for authentication, dashboard data, and file uploads. The Streamlit prototype remains available for the original end-to-end interview workflow.

## Intelligence workflow

```text
Resume
  |
  v
Skill Extraction
  |
  v
Adaptive Interview
  |
  v
Project Defense RAG
  |
  v
Resume Claim Verification
  |
  v
Cross-Examination
  |
  v
Candidate Intelligence
```

The exact workflow depends on which application surface is being used and which candidate materials are available. The FastAPI API currently exposes dashboard, authentication, and upload functionality; the Streamlit prototype orchestrates more of the interview intelligence workflow directly.

## Tech stack

### Backend and AI

- Python
- FastAPI
- SQLAlchemy
- PostgreSQL support through `psycopg2-binary`
- SQLite fallback for local development
- Google GenAI SDK
- PyMuPDF for PDF extraction
- scikit-learn TF-IDF retrieval for project evidence
- Streamlit prototype UI

### Frontend

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- Lucide React icons

## Project structure

```text
InterviAI/
├── frontend/
│   ├── app/
│   │   ├── interview/
│   │   ├── projects/
│   │   ├── reports/
│   │   ├── resume/
│   │   ├── settings/
│   │   ├── login/
│   │   └── page.tsx
│   ├── components/
│   │   ├── dashboard/
│   │   ├── interview/
│   │   ├── layout/
│   │   ├── reports/
│   │   └── ui/
│   ├── lib/
│   │   ├── api.ts
│   │   └── auth.ts
│   ├── package.json
│   └── package-lock.json
├── Skill_extractor.py
├── adaptive_engine.py
├── app.py
├── candidate_intelligence.py
├── candidate_profile.py
├── concept_normalizer.py
├── concept_taxonomy.py
├── cross_examination.py
├── database.py
├── fast_evaluator.py
├── fast_interview_bank.py
├── gemini_service.py
├── interviai_api.py
├── interview_engine.py
├── project_defense_rag.py
├── question_bank.py
├── resume_claim_verifier.py
├── role_skills.py
├── requirements.txt
├── .env.example
├── .gitignore
└── README.md
```

Generated and local-only files such as `.env`, `*.db`, `__pycache__/`, `frontend/node_modules/`, and `frontend/.next/` are intentionally excluded from Git.

## Prerequisites

- Python 3.10 or newer
- Node.js 18 or newer
- npm
- PostgreSQL 14 or newer for the recommended database setup
- A Google GenAI API key for AI-powered generation and evaluation

## Backend setup

From the repository root:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
```

Update `.env` with real local values. Never commit `.env`.

Start FastAPI:

```powershell
python -m uvicorn interviai_api:app --reload --host 127.0.0.1 --port 8000
```

The API starts at `http://127.0.0.1:8000`.

## Frontend setup

From the `frontend` directory:

```powershell
cd frontend
npm install
```

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

Start the Next.js application:

```powershell
npm run dev
```

The application starts at `http://127.0.0.1:3000`.

Build for validation:

```powershell
npm run build
```

## Running the Streamlit prototype

The original prototype remains available from the repository root:

```powershell
streamlit run app.py
```

The Streamlit prototype uses `INTERVIAI_API_URL` when configured and otherwise defaults to `http://127.0.0.1:8000`.

## Environment variables

The safe variable template is [.env.example](./.env.example). It contains placeholders only.

| Variable | Used by | Purpose |
|---|---|---|
| `GEMINI_API_KEY` | Python AI services | Google GenAI authentication |
| `DATABASE_URL` | SQLAlchemy database layer | PostgreSQL or SQLite connection |
| `NEXT_PUBLIC_API_URL` | Next.js frontend | FastAPI base URL |
| `INTERVIAI_API_URL` | Streamlit prototype | FastAPI base URL |

## API documentation

When FastAPI is running, interactive Swagger documentation is available at:

```text
http://127.0.0.1:8000/docs
```

Current API areas include:

- `GET /health`
- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me`
- `POST /auth/logout`
- `GET /dashboard/latest`
- `POST /uploads/resume`
- `POST /uploads/project`

## PostgreSQL setup

Create a database named `interviai`, then configure a SQLAlchemy URL in `.env`:

```env
DATABASE_URL=postgresql+psycopg2://postgres:your_password@localhost:5432/interviai
```

The application initializes missing tables through SQLAlchemy on backend startup. For production use, add a migration strategy before making schema changes. Local SQLite is supported as a fallback when `DATABASE_URL` is omitted.

## High-level local workflow

1. Start PostgreSQL, or use the local SQLite fallback.
2. Start FastAPI on port 8000.
3. Start Next.js on port 3000.
4. Create an account at `/login`.
5. Review the dashboard and candidate readiness signals.
6. Configure an interview at `/interview`.
7. Upload a resume or project report from `/resume` or `/projects`.
8. Use the reports and readiness simulator to plan preparation.

## Future deployment

Deployment is intentionally not configured in this V1 repository-preparation task. Before deployment, add:

- Production secrets through the hosting provider's secret manager
- PostgreSQL migrations and backups
- HTTPS and secure cookie configuration
- Environment-specific CORS origins
- Object storage for larger uploaded files
- Background processing for resume parsing and project indexing
- Observability, rate limiting, and structured error monitoring
- CI checks for backend syntax, frontend type-checking, and builds

## License

No license has been selected for this repository yet. Choose and add an appropriate license before public publication.
