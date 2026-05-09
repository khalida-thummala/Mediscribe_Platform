# MediScribe

AI-powered clinical documentation platform that auto-generates SOAP notes from doctor-patient consultations using speech-to-text and GPT-4.

## Features

- 🎙 **Live Consultation Recording** — real-time audio with AssemblyAI transcription
- 📋 **SOAP Note Generation** — GPT-4 powered, with inline editing and approval workflow
- 🤖 **AI Document Analysis** — upload PDFs/images for clinical review
- 👥 **Patient Management** — full CRUD with medical history
- 📄 **Reports** — view, edit, export as PDF or DOCX
- 📊 **Analytics Dashboard** — KPIs, trends, time saved
- 🛡 **Audit Trail** — event logging for all clinical actions
- 🔐 **Auth** — JWT with role-based access control (Admin, Practitioner, Supervisor)

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript + Vite |
| Backend | FastAPI (Python 3.11) |
| Database | PostgreSQL |
| AI | OpenAI GPT-4 / Azure OpenAI |
| Transcription | AssemblyAI |
| Storage | Backblaze B2 |

## Getting Started

See [DEPLOYMENT.md](./DEPLOYMENT.md) for full setup instructions.

```bash
# Backend
cd backend && pip install -r requirements.txt
uvicorn app.main:app --reload

# Frontend
cd frontend && npm install && npm run dev
```

## Author

**Thummala Khalida** — MediScribe
