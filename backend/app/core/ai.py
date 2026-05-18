import json
import re
import base64
import mimetypes
from typing import Any

import requests

from app.core.config import settings


OPENAI_API_KEY = settings.OPENAI_API_KEY
ENDPOINT = settings.ENDPOINT


SOAP_FALLBACK = {
    "subjective": "",
    "objective": "",
    "assessment": "",
    "plan": "",
    "medications": [],
    "follow_up_needed": False,
    "follow_up_days": None,
}


def _json_error(message: str, transcript: str = "") -> str:
    payload = {
        **SOAP_FALLBACK,
        "_error": message,
    }
    if transcript:
        payload["subjective"] = transcript
    return json.dumps(payload)


def _headers() -> dict[str, str]:
    if ENDPOINT and "openai.azure.com" in ENDPOINT:
        return {
            "api-key": OPENAI_API_KEY or "",
            "Content-Type": "application/json",
        }

    return {
        "Authorization": f"Bearer {OPENAI_API_KEY}",
        "Content-Type": "application/json",
    }


def _extract_json(content: str) -> dict[str, Any]:
    cleaned = content.strip()

    if cleaned.startswith("```json"):
        cleaned = cleaned[7:].strip()
    elif cleaned.startswith("```"):
        cleaned = cleaned[3:].strip()

    if cleaned.endswith("```"):
        cleaned = cleaned[:-3].strip()

    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", cleaned, flags=re.DOTALL)
        if not match:
            raise
        return json.loads(match.group(0))


def _normalize_soap(data: dict[str, Any]) -> dict[str, Any]:
    normalized = {**SOAP_FALLBACK, **data}

    for key in ("subjective", "objective", "assessment", "plan"):
        value = normalized.get(key)
        if isinstance(value, (dict, list)):
            normalized[key] = json.dumps(value, indent=2)
        elif value is None:
            normalized[key] = ""
        else:
            normalized[key] = str(value)

    meds = normalized.get("medications")
    normalized["medications"] = meds if isinstance(meds, list) else []
    normalized["follow_up_needed"] = bool(normalized.get("follow_up_needed"))

    follow_up_days = normalized.get("follow_up_days")
    try:
        normalized["follow_up_days"] = int(follow_up_days) if follow_up_days is not None else None
    except (TypeError, ValueError):
        normalized["follow_up_days"] = None

    return normalized


def _post_chat(body: dict[str, Any], timeout: int = 90):
    attempts = [body]

    completion_token_body = dict(body)
    if "max_tokens" in completion_token_body:
        completion_token_body["max_completion_tokens"] = completion_token_body.pop("max_tokens")
        attempts.append(completion_token_body)

    no_json_body = dict(body)
    no_json_body.pop("response_format", None)
    attempts.append(no_json_body)

    no_temp_body = dict(body)
    no_temp_body.pop("temperature", None)
    attempts.append(no_temp_body)

    no_temp_json_body = dict(completion_token_body)
    no_temp_json_body.pop("temperature", None)
    no_temp_json_body.pop("response_format", None)
    attempts.append(no_temp_json_body)

    seen = set()
    last_response = None

    for attempt in attempts:
        marker = json.dumps(attempt, sort_keys=True)
        if marker in seen:
            continue
        seen.add(marker)

        # Ensure we use the correct endpoint for Azure if provided
        target_endpoint = ENDPOINT
        if "openai.azure.com" in target_endpoint and "/openai/deployments/" not in target_endpoint:
             # If user provided base URL but not deployment path
             # This is a fallback, but the user seems to have the full path
             pass

        response = requests.post(
            target_endpoint,
            headers=_headers(),
            json=attempt,
            timeout=timeout,
        )
        last_response = response

        if response.status_code != 400:
            return response

        error_text = response.text.lower()
        retryable = any(
            token in error_text
            for token in (
                "max_tokens",
                "max_completion_tokens",
                "response_format",
                "temperature",
                "unsupported parameter",
                "unrecognized request argument",
            )
        )

        if not retryable:
            return response

    return last_response


def generate_soap(text: str, historical_context: str = ""):
    transcript = (text or "").strip()

    if not transcript:
        return _json_error("Transcript is empty")

    if not OPENAI_API_KEY or not ENDPOINT:
        fallback = {**SOAP_FALLBACK, "subjective": transcript}
        return json.dumps(fallback)

    system_message = (
        "You are a medical AI assistant. Convert the consultation transcript "
        "into a SOAP note. Return only valid JSON with these exact keys: "
        "subjective, objective, assessment, plan, medications, "
        "follow_up_needed, follow_up_days. Medications must be an array."
    )

    if historical_context:
        system_message += (
            f"\n\n[HISTORICAL CONTEXT]\n{historical_context}\n\n"
            "CRITICAL INSTRUCTION: You MUST actively incorporate the patient's past medical history, "
            "allergies, and previous conditions from the [HISTORICAL CONTEXT] into this new SOAP note. "
            "Do not ignore the historical context. For example, explicitly list known allergies and past "
            "major conditions in the Subjective or Assessment sections, and ensure your Plan does not "
            "contradict known allergies."
        )

    body = {
        "messages": [
            {
                "role": "system",
                "content": system_message,
            },
            {
                "role": "user",
                "content": transcript,
            },
        ],
        "temperature": 0.2,
        "max_tokens": 900,
        "response_format": {"type": "json_object"},
    }

    try:
        response = _post_chat(body)

        print("SOAP STATUS:", response.status_code)

        if response.status_code != 200:
            print("SOAP RESPONSE:", response.text)
            return _json_error(f"AI request failed with status {response.status_code}", transcript)

        data = response.json()
        content = data["choices"][0]["message"]["content"]
        soap = _normalize_soap(_extract_json(content))
        return json.dumps(soap)

    except Exception as e:
        print("SOAP AI ERROR:", str(e))
        return _json_error(f"SOAP generation exception: {str(e)}", transcript)


def generate_soap_from_image(image_path: str, context: str = ""):
    if not OPENAI_API_KEY or not ENDPOINT:
        return _json_error("AI image analysis unavailable")

    try:
        mime_type = mimetypes.guess_type(image_path)[0] or "image/png"
        with open(image_path, "rb") as image_file:
            encoded = base64.b64encode(image_file.read()).decode("utf-8")

        prompt = (
            "Read this medical image or scanned report and generate a SOAP note. "
            "If the image is an X-ray or radiology image, summarize visible/reportable findings carefully "
            "and avoid inventing patient history. Return only JSON with keys: subjective, objective, "
            "assessment, plan, medications, follow_up_needed, follow_up_days."
        )
        if context:
            prompt = f"{prompt}\n\nAdditional context: {context}"

        body = {
            "messages": [
                {
                    "role": "system",
                    "content": "You are a careful medical AI assistant that extracts clinical information into SOAP JSON.",
                },
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:{mime_type};base64,{encoded}"
                            },
                        },
                    ],
                },
            ],
            "temperature": 0.2,
            "max_tokens": 900,
            "response_format": {"type": "json_object"},
        }

        response = _post_chat(body)
        print("IMAGE SOAP STATUS:", response.status_code)

        if response.status_code != 200:
            print("IMAGE SOAP RESPONSE:", response.text)
            return _json_error(f"Image AI request failed with status {response.status_code}")

        data = response.json()
        content = data["choices"][0]["message"]["content"]
        soap = _normalize_soap(_extract_json(content))
        return json.dumps(soap)

    except Exception as e:
        print("IMAGE SOAP ERROR:", str(e))
        return _json_error(f"Image SOAP generation exception: {str(e)}")


def compare_medical_reports(existing_soap: dict, new_analysis: dict):
    if not OPENAI_API_KEY or not ENDPOINT:
        return {
            "summary": "AI comparison unavailable",
            "discrepancies": [],
            "new_info": [],
            "conflicts": [],
        }

    prompt = f"""
    Compare these two medical reports.

    Existing Report:
    {json.dumps(existing_soap)}

    New Report:
    {json.dumps(new_analysis)}

    Return ONLY JSON:
    {{
        "summary": "",
        "discrepancies": [],
        "new_info": [],
        "conflicts": []
    }}
    """

    body = {
        "messages": [
            {"role": "system", "content": "You are a clinical medical auditor."},
            {"role": "user", "content": prompt},
        ],
        "temperature": 0.2,
        "max_tokens": 600,
        "response_format": {"type": "json_object"},
    }

    try:
        response = _post_chat(body)
        print("COMPARE STATUS:", response.status_code)

        if response.status_code != 200:
            print("COMPARE RESPONSE:", response.text)
            return {
                "summary": "Comparison failed",
                "discrepancies": [],
                "new_info": [],
                "conflicts": [],
            }

        data = response.json()
        content = data["choices"][0]["message"]["content"]
        return _extract_json(content)

    except Exception as e:
        print("COMPARE ERROR:", str(e))
        return {
            "summary": f"Exception: {str(e)}",
            "discrepancies": [],
            "new_info": [],
            "conflicts": [],
        }


def check_drug_interactions(medications: list):
    if not medications or not OPENAI_API_KEY or not ENDPOINT:
        return []

    prompt = f"""
    Check for drug interactions in this medication list:

    {json.dumps(medications)}

    Return ONLY JSON:
    {{
        "interactions": [
            {{
                "severity": "",
                "interaction": "",
                "reason": ""
            }}
        ]
    }}
    """

    body = {
        "messages": [
            {"role": "system", "content": "You are a clinical pharmacologist."},
            {"role": "user", "content": prompt},
        ],
        "temperature": 0.2,
        "max_tokens": 500,
        "response_format": {"type": "json_object"},
    }

    try:
        response = _post_chat(body)
        print("DRUG STATUS:", response.status_code)

        if response.status_code != 200:
            print("DRUG RESPONSE:", response.text)
            return []

        data = response.json()
        content = data["choices"][0]["message"]["content"]
        parsed = _extract_json(content)
        interactions = parsed.get("interactions", [])
        return interactions if isinstance(interactions, list) else []

    except Exception as e:
        print("DRUG ERROR:", str(e))
        return []
