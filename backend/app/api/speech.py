import os
import uuid

from fastapi import APIRouter, UploadFile, File

from app.core.speech import transcribe_audio

router = APIRouter()

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/transcribe")
async def transcribe(file: UploadFile = File(...)):
    """
    Accepts an audio file, saves it temporarily, uploads to B2,
    transcribes with AssemblyAI, and returns the transcript.
    """
    local_path = None
    try:
        filename = f"{uuid.uuid4()}.webm"
        local_path = os.path.join(UPLOAD_DIR, filename)

        with open(local_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)

        result = transcribe_audio(local_path)

        return {
            "transcription": result["text"],
            "status": result["status"],
            "job_id": result["job_id"],
            "confidence": result["confidence"],
        }

    except Exception as e:
        return {"transcription": str(e), "status": "failed"}

    finally:
        # Clean up local temp file after upload to B2
        if local_path and os.path.exists(local_path):
            try:
                os.remove(local_path)
            except Exception:
                pass
