# MediScribe — Frontend

AI-powered clinical documentation platform that auto-generates SOAP notes from doctor-patient consultations using speech-to-text and GPT-4.

## Features

- 🎙 **Live Consultation Recording** — real-time audio recording with AssemblyAI transcription
- 📋 **SOAP Note Editor** — AI-generated notes with inline editing and approval workflow
- 🤖 **AI Document Analysis** — upload PDFs/images for clinical review and entity extraction
- 👥 **Patient Management** — full CRUD with medical history
- 📄 **Reports Page** — view all generated reports with PDF & DOCX export
- 📊 **Analytics Dashboard** — KPIs, consultation trends, time saved
- 🛡 **Audit Trail** — event logging for all clinical actions
- ⚙ **Settings** — profile management, security, organization

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + TypeScript + Vite |
| Routing | React Router v6 |
| State | Zustand (persisted auth store) |
| Data Fetching | TanStack Query v5 |
| Styling | Tailwind CSS v3 + CSS Variables |
| HTTP | Axios with JWT interceptors + auto-refresh |
| Notifications | React Hot Toast |

## Getting Started

```bash
# Install dependencies
npm install

# Set environment variables
cp .env.example .env
# Set VITE_API_BASE_URL=http://localhost:8000/api/v1

# Start development server
npm run dev

# Build for production
npm run build
```

## Environment Variables

| Variable | Description |
|---|---|
| `VITE_API_BASE_URL` | FastAPI backend base URL (default: `http://localhost:8000/api/v1`) |

## Project Structure

```
src/
├── api/          # Axios API clients (auth, reports, patients, consultations)
├── components/   # Shared UI + feature components (settings, reports, soap)
├── hooks/        # Custom hooks (useRecording)
├── pages/        # One file per route
├── store/        # Zustand auth store
├── styles/       # Global CSS + Tailwind config
├── types/        # TypeScript interfaces
└── utils/        # Helper functions
```

## Backend

Works with the FastAPI + PostgreSQL backend in the `/backend` directory.  
All API calls use JWT authentication with automatic token refresh.

## Author

**Thummala Khalida** — MediScribe
