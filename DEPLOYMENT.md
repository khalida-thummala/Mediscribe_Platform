# MediScribe Deployment Guide

This guide provides step-by-step instructions for deploying the MediScribe platform to production environments.

## 1. Backend Deployment (Render)

The backend is a FastAPI application that can be deployed to Render using the provided `render.yaml`.

### Steps:
1. **Connect Repository**: Link your GitHub repository to Render.
2. **Select Blueprint**: Render should automatically detect `render.yaml`. Select "Use Blueprint".
3. **Environment Variables**: Configure the following in the Render dashboard:
   - `DATABASE_URL`: Your PostgreSQL connection string (e.g., from Supabase or Render DB).
   - `SECRET_KEY`: A long, random string for JWT signing.
   - `OPENAI_API_KEY`: Your OpenAI API key.
   - `AZURE_SPEECH_KEY`: Your Azure Speech Services key.
   - `AZURE_SPEECH_REGION`: Your Azure Speech region (default: `eastus`).
   - `ALLOWED_ORIGINS`: A comma-separated list of your frontend URLs (e.g., `https://mediscribe.vercel.app`).
4. **Deploy**: Render will build and start the service.

### Database Migrations:
The application is configured to create tables on startup. For more complex schema changes, use the provided migration scripts in the `backend/scripts/` folder.

---

## 2. Frontend Deployment (Vercel)

The frontend is a Vite + React application optimized for Vercel.

### Steps:
1. **Connect Repository**: Link your GitHub repository to Vercel.
2. **Framework Preset**: Select "Vite".
3. **Build Settings**:
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. **Environment Variables**:
   - `VITE_API_BASE_URL`: The URL of your deployed Render backend (e.g., `https://mediscribe-backend.onrender.com/api/v1`).
   - `VITE_AZURE_SPEECH_KEY`: Your Azure Speech Services key.
   - `VITE_AZURE_SPEECH_REGION`: Your Azure Speech region.
5. **Deploy**: Vercel will build and host the application.

---

## 3. Production Checklist

- [ ] **SSL/HTTPS**: Ensure both frontend and backend are served over HTTPS.
- [ ] **PostgreSQL**: Do NOT use SQLite in production as the filesystem is ephemeral on Render.
- [ ] **CORS**: Ensure `ALLOWED_ORIGINS` in the backend matches your Vercel URL.
- [ ] **Rate Limiting**: (Optional) Consider adding rate limiting if usage grows.
- [ ] **Monitoring**: Check Render logs for any 500 errors or startup issues.

---

## 4. Troubleshooting

- **500 Internal Server Error**: Check the backend logs on Render. Usually caused by missing environment variables or database connection issues.
- **CORS Error**: Verify `ALLOWED_ORIGINS` in the backend config.
- **Transcription Fails**: Verify Azure Speech keys and region match.
