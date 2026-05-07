import os
import uuid

from fastapi import APIRouter, UploadFile, File

from app.core.speech import transcribe_audio

router = APIRouter()


UPLOAD_DIR = "uploads"

os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/transcribe")
async def transcribe(file: UploadFile = File(...)):

    try:

        # Unique filename
        filename = f"{uuid.uuid4()}.webm"

        file_path = os.path.join(
            UPLOAD_DIR,
            filename
        )

        # Save uploaded audio
        with open(file_path, "wb") as buffer:

            content = await file.read()

            buffer.write(content)

        # Whisper transcription
        result = transcribe_audio(file_path)

        return {
            "transcription": result["text"],
            "status": result["status"],
            "job_id": result["job_id"]
        }

    except Exception as e:

        return {
            "transcription": str(e),
            "status": "failed"
        }