import whisper
import uuid
import base64

# Load model once
model = whisper.load_model("base")


def transcribe_audio(audio_path: str):
    """
    Transcribes audio using OpenAI Whisper.
    """

    job_id = str(uuid.uuid4())

    try:
        result = model.transcribe(audio_path)

        transcript = result["text"]

        if len(transcript.strip()) < 5:
            transcript = "Low quality transcription"
            status = "failed"
        else:
            status = "completed"

        return {
            "text": transcript,
            "job_id": job_id,
            "status": status,
            "confidence": 0.95
        }

    except Exception as e:
        print(f"Transcription error: {str(e)}")

        return {
            "text": f"Error: {str(e)}",
            "job_id": job_id,
            "status": "failed",
            "confidence": 0
        }


def encrypt_audio(audio_data: bytes) -> bytes:
    """
    Simulates AES-256-GCM encryption before storage.
    """
    return base64.b64encode(audio_data)