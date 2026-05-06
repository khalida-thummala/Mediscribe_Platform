# MediScribe Platform

**MediScribe** is a state-of-the-art, full-stack healthcare documentation platform designed to revolutionize clinical workflows. By leveraging advanced AI and speech-to-text technologies, MediScribe automatically transcribes medical consultations and generates accurate, professional SOAP (Subjective, Objective, Assessment, Plan) reports, drastically reducing manual documentation time for healthcare practitioners.

## 🚀 Features

- **Automated Transcription**: Record live consultations and instantly transcribe patient-doctor interactions.
- **AI-Powered SOAP Generation**: Automatically synthesize complex consultation transcripts into structured, clinical SOAP notes.
- **Secure Authentication**: Enterprise-grade JWT authentication with secure password hashing and strict Role-Based Access Control (RBAC).
- **Patient Management**: Complete end-to-end management of patient demographics, medical histories, and clinical records.
- **Comprehensive Analytics Dashboard**: Real-time insights into hospital performance, compliance metrics, and time saved through AI automation.
- **Modern UI/UX**: A highly responsive, premium interface built with React and dynamic CSS for a seamless user experience.

## 🛠️ Technology Stack

### Frontend (User Interface)
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **State Management**: Zustand (with persistent local storage)
- **Data Fetching**: React Query & Axios
- **Routing**: React Router DOM
- **Styling**: Vanilla CSS / Custom Design System

### Backend (API Services)
- **Framework**: FastAPI (Python 3)
- **Database**: PostgreSQL 15
- **ORM**: SQLAlchemy
- **Data Validation**: Pydantic
- **Security**: JWT (JSON Web Tokens), bcrypt cryptography

## 📋 Prerequisites

Before running the project locally, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v18 or higher)
- [Python](https://www.python.org/) (3.10 or higher)
- [PostgreSQL](https://www.postgresql.org/) (Local Windows Installation or via Docker)

## ⚙️ Local Development Setup

### 1. Database Configuration
1. Open pgAdmin (or your preferred PostgreSQL client).
2. Create a new database named `mediscribe`.
3. Ensure the local PostgreSQL service is running on port `5432` with username `postgres` and password `postgres` (or adjust the `.env` accordingly).

### 2. Backend Setup
Navigate to the backend directory, install the dependencies, and configure the environment:

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

Create a `.env` file in the `backend` directory:
```env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/mediscribe

# Security
SECRET_KEY=supersecretkeythatisverylongandsecure
ALGORITHM=HS256

# AI & External Services (Currently using mock-keys for local demo functionality)
AZURE_SPEECH_KEY=mock-key
AZURE_SPEECH_REGION=eastus
OPENAI_API_KEY=sk-mock-key
```

Start the FastAPI server:
```bash
uvicorn app.main:app --reload
```
The backend API will be available at `http://127.0.0.1:8000`. You can access the automatic interactive API documentation at `http://127.0.0.1:8000/docs`.

### 3. Frontend Setup
Navigate to the frontend directory, install the packages, and run the development server:

```bash
cd frontend
npm install
npm run dev
```
The React application will be available at `http://localhost:5173` (or the port specified by Vite in the terminal).

## 🛡️ Security & Compliance
- **Data Privacy**: MediScribe utilizes strict role checks to ensure patient data is only accessible to authorized practitioners.
- **HIPAA Considerations**: The UI is designed with HIPAA compliance standards in mind, utilizing audit trails and session-based timeouts.

## Author

**Thummala Khalida**

Frontend Developer – MediScribe
