"""
Natural Language Symptom Note Parser.
Extracts structured clinical indicators from patient free-text check-in notes.

Primary: Groq Cloud LLM (llama-3.1-8b-instant) for high-speed, zero-latency extraction.
Safety Fallback: Keyword & regex rule-based matching (cheap insurance if network/API drops).
"""

import os
import json
import re
from pathlib import Path
from typing import Dict, Any, List

# -------------------------------------------------------------------
# Environment & Groq Client Setup
# -------------------------------------------------------------------
try:
    from dotenv import load_dotenv
    # Look for .env in backend/ or root directory
    candidates = [
        Path(__file__).parent / ".env",
        Path(__file__).parent.parent / ".env",
        Path.cwd() / "backend" / ".env",
        Path.cwd() / ".env",
    ]
    for env_file in candidates:
        if env_file.is_file():
            load_dotenv(dotenv_path=env_file)
            break
except ImportError:
    pass

# Initialize Groq client with graceful error handling
client = None
try:
    from groq import Groq
    api_key = os.environ.get("GROQ_API_KEY")
    if api_key:
        client = Groq(api_key=api_key)
except Exception:
    client = None


# -------------------------------------------------------------------
# Fallback Parser (Deterministic keyword & rule matching)
# -------------------------------------------------------------------
def keyword_fallback_parse(raw_text: str) -> Dict[str, Any]:
    """
    Safety net: Runs locally without network or API dependencies.
    Extracts symptom mentions, rough severity score, and red-flag keywords.
    """
    text_lower = raw_text.lower()

    # Known symptom entities
    symptom_vocab = {
        "facial pain": ["face pain", "facial pain", "cheeks", "cheek", "sinus pressure", "forehead", "jaw", "teeth"],
        "congestion": ["congested", "congestion", "stuffy", "blocked", "runny", "nasal"],
        "fever": ["fever", "chills", "temperature", "hot", "sweating"],
        "energy / fatigue": ["tired", "exhausted", "fatigue", "bedridden", "weak"],
        "rash": ["rash", "hives", "itchy", "red spots", "spots"],
        "diarrhea": ["diarrhea", "loose stools", "stomach cramps"],
        "nausea": ["nausea", "nauseous", "vomiting", "upset stomach"],
    }

    symptom_mentions = []
    for symptom, keywords in symptom_vocab.items():
        if any(kw in text_lower for kw in keywords):
            symptom_mentions.append(symptom)

    # Red-flag keywords
    red_flag_vocab = ["rash", "hives", "swelling", "difficulty breathing", "severe diarrhea", "worse", "worsening"]
    red_flags = [rf for rf in red_flag_vocab if rf in text_lower]

    # Severity guess heuristic (scale 1-5)
    if any(w in text_lower for w in ["unbearable", "severe", "extreme", "worst", "excruciating", "can't bear"]):
        severity_guess = 5
    elif any(w in text_lower for w in ["worse", "worsening", "bad", "high", "heavy"]):
        severity_guess = 4
    elif any(w in text_lower for w in ["moderate", "still there", "same"]):
        severity_guess = 3
    elif any(w in text_lower for w in ["improving", "better", "mild", "slight", "easing"]):
        severity_guess = 2
    elif any(w in text_lower for w in ["normal", "gone", "resolved", "clear", "minimal"]):
        severity_guess = 1
    else:
        severity_guess = 3

    return {
        "symptom_mentions": symptom_mentions,
        "severity_guess": severity_guess,
        "red_flag_keywords": red_flags,
        "source": "keyword_fallback",
    }


# -------------------------------------------------------------------
# Primary Entrypoint
# -------------------------------------------------------------------
def parse_text(raw_text: str) -> Dict[str, Any]:
    """
    Extracts symptom mentions, estimated severity (1-5), and red-flag keywords from patient text.
    Uses Groq (llama-3.1-8b-instant) if available, with automatic fallback to keyword matching.
    """
    if not raw_text or not raw_text.strip():
        return {
            "symptom_mentions": [],
            "severity_guess": 3,
            "red_flag_keywords": [],
            "source": "empty_input",
        }

    # Attempt primary LLM call via Groq
    if client is not None:
        try:
            prompt_system = (
                "Extract symptom mentions, a rough severity guess (1-5), and any red-flag keywords "
                "(rash, swelling, difficulty breathing, severe diarrhea, worsening) from patient text. "
                "Respond ONLY with JSON: "
                '{"symptom_mentions": [string], "severity_guess": int, "red_flag_keywords": [string]}'
            )

            response = client.chat.completions.create(
                model="qwen/qwen3.8-27b",
                messages=[
                    {"role": "system", "content": prompt_system},
                    {"role": "user", "content": raw_text},
                ],
                response_format={"type": "json_object"},
                temperature=0.1,
                max_tokens=300,
            )

            result = json.loads(response.choices[0].message.content)

            # Ensure all expected keys are present
            return {
                "symptom_mentions": result.get("symptom_mentions", []),
                "severity_guess": int(result.get("severity_guess", 3)),
                "red_flag_keywords": result.get("red_flag_keywords", []),
                "source": "groq_llama_3.1",
            }
        except Exception:
            # Fallback quietly on any API/network failure so the app never crashes
            pass

    # Safety net: deterministic rule-based fallback
    return keyword_fallback_parse(raw_text)


def map_note_to_checkin(raw_text: str) -> Dict[str, Any]:
    """
    Extracts symptoms, side effects, and estimated severity from a patient note
    and formats them directly into check-in fields for one-click form auto-fill.
    """
    parsed = parse_text(raw_text)
    mentions = [m.lower() for m in parsed.get("symptom_mentions", [])]
    red_flags = [rf.lower() for rf in parsed.get("red_flag_keywords", [])]
    raw_lower = raw_text.lower()

    # Side effects
    has_rash = any("rash" in x or "hive" in x for x in red_flags + mentions) or "rash" in raw_lower or "hive" in raw_lower
    has_diarrhea = any("diarrhea" in x for x in mentions) or "diarrhea" in raw_lower
    has_nausea = any("nausea" in x or "vomit" in x for x in mentions) or "nausea" in raw_lower

    # Core symptoms
    has_fever = any("fever" in x or "chill" in x or "temp" in x for x in mentions) or "fever" in raw_lower
    has_facial_pain = any("pain" in x or "pressure" in x or "cheek" in x or "sinus" in x or "forehead" in x or "headache" in x for x in mentions) or "pain" in raw_lower or "pressure" in raw_lower
    has_congestion = any("congestion" in x or "stuffy" in x or "blocked" in x or "runny" in x or "nasal" in x for x in mentions) or "congest" in raw_lower or "stuffy" in raw_lower

    severity = parsed.get("severity_guess", 3)

    return {
        "suggested_symptoms": {
            "facial_pain": severity if has_facial_pain else (1 if "better" in raw_lower or "clear" in raw_lower else 2),
            "congestion": severity if has_congestion else (1 if "clear" in raw_lower else 2),
            "fever": has_fever,
            "energy": max(1, min(5, 6 - severity)),
        },
        "suggested_side_effects": {
            "rash": has_rash,
            "diarrhea": has_diarrhea,
            "nausea": has_nausea,
        },
        "raw_parsed": parsed,
    }


if __name__ == "__main__":
    sample_notes = [
        "Fever broke yesterday. Pressure is still present but starting to ease.",
        "Day 5 on antibiotics and pain is worse. Teeth and forehead ache severely. Still running a fever.",
        "Sinuses feel noticeably clearer, but I woke up this morning with red itchy hives across my chest.",
    ]
    print("--- Testing parser.py ---")
    for note in sample_notes:
        parsed = parse_text(note)
        print(f"\nNote: \"{note}\"")
        print(f"Source: {parsed.get('source')}")
        print(f"Result: {parsed}")
