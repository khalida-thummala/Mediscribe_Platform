import requests
import json
from app.core.config import settings

OPENAI_API_KEY = settings.OPENAI_API_KEY
ENDPOINT = settings.ENDPOINT
print("OPENAI_API_KEY:", OPENAI_API_KEY)
print("ENDPOINT:", ENDPOINT)

def generate_soap(text: str):

    # Fallback if no AI key
    if not OPENAI_API_KEY or not ENDPOINT:

        return json.dumps({
            "subjective": text,
            "objective": "",
            "assessment": "",
            "plan": "",
            "medications": [],
            "follow_up_needed": False,
            "follow_up_days": None
        })

    headers = {
        "api-key": OPENAI_API_KEY,
        "Content-Type": "application/json"
    }

    body = {
        "messages": [
            {
                "role": "system",
                "content": (
                    "You are a medical AI assistant. "
                    "Convert the consultation transcript into SOAP format. "
                    "Return ONLY valid JSON with keys: "
                    "subjective, objective, assessment, plan, medications, "
                    "follow_up_needed, follow_up_days"
                )
            },
            {
                "role": "user",
                "content": text
            }
        ],
        "temperature": 0.2,
        "max_tokens": 800
    }

    try:

        response = requests.post(
            ENDPOINT,
            headers=headers,
            json=body,
            timeout=60
        )

        print("SOAP STATUS:", response.status_code)
        print("SOAP RESPONSE:", response.text)

        if response.status_code != 200:

            return json.dumps({
                "subjective": f"AI Error {response.status_code}",
                "objective": response.text,
                "assessment": "",
                "plan": "",
                "medications": [],
                "follow_up_needed": False,
                "follow_up_days": None
            })

        data = response.json()

        content = data["choices"][0]["message"]["content"].strip()

        # Remove markdown wrappers
        if content.startswith("```json"):
            content = content[7:]

        elif content.startswith("```"):
            content = content[3:]

        if content.endswith("```"):
            content = content[:-3]

        return content.strip()

    except Exception as e:

        print("SOAP AI ERROR:", str(e))

        return json.dumps({
            "subjective": f"Exception: {str(e)}",
            "objective": "",
            "assessment": "",
            "plan": "",
            "medications": [],
            "follow_up_needed": False,
            "follow_up_days": None
        })


def compare_medical_reports(
    existing_soap: dict,
    new_analysis: dict
):

    if not OPENAI_API_KEY or not ENDPOINT:
        return {
            "summary": "AI comparison unavailable",
            "discrepancies": [],
            "new_info": [],
            "conflicts": []
        }

    headers = {
        "api-key": OPENAI_API_KEY,
        "Content-Type": "application/json"
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
            {
                "role": "system",
                "content": "You are a clinical medical auditor."
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
        "temperature": 0.2,
        "max_tokens": 600
    }

    try:

        response = requests.post(
            ENDPOINT,
            headers=headers,
            json=body,
            timeout=60
        )

        print("COMPARE STATUS:", response.status_code)
        print("COMPARE RESPONSE:", response.text)

        if response.status_code != 200:
            return {
                "summary": "Comparison failed",
                "discrepancies": [],
                "new_info": [],
                "conflicts": []
            }

        data = response.json()

        content = data["choices"][0]["message"]["content"].strip()

        if content.startswith("```json"):
            content = content[7:]

        elif content.startswith("```"):
            content = content[3:]

        if content.endswith("```"):
            content = content[:-3]

        return json.loads(content)

    except Exception as e:

        print("COMPARE ERROR:", str(e))

        return {
            "summary": f"Exception: {str(e)}",
            "discrepancies": [],
            "new_info": [],
            "conflicts": []
        }


def check_drug_interactions(medications: list):

    if not OPENAI_API_KEY or not ENDPOINT:
        return []

    headers = {
        "api-key": OPENAI_API_KEY,
        "Content-Type": "application/json"
    }

    prompt = f"""
    Check for drug interactions in this medication list:

    {json.dumps(medications)}

    Return ONLY JSON array:
    [
        {{
            "severity": "",
            "interaction": "",
            "reason": ""
        }}
    ]
    """

    body = {
        "messages": [
            {
                "role": "system",
                "content": "You are a clinical pharmacologist."
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
        "temperature": 0.2,
        "max_tokens": 500
    }

    try:

        response = requests.post(
            ENDPOINT,
            headers=headers,
            json=body,
            timeout=60
        )

        print("DRUG STATUS:", response.status_code)
        print("DRUG RESPONSE:", response.text)

        if response.status_code != 200:
            return []

        data = response.json()

        content = data["choices"][0]["message"]["content"].strip()

        if content.startswith("```json"):
            content = content[7:]

        elif content.startswith("```"):
            content = content[3:]

        if content.endswith("```"):
            content = content[:-3]

        return json.loads(content)

    except Exception as e:

        print("DRUG ERROR:", str(e))

        return []