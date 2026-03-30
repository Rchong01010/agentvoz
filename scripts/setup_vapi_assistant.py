#!/usr/bin/env python3
"""
Create the Sofia VAPI assistant for AgentVoz.

Usage:
    python scripts/setup_vapi_assistant.py

Prints the assistant_id to add to your .env / Vercel env vars.
"""

import os
import sys
import json
from pathlib import Path

try:
    import requests
except ImportError:
    os.system(f"{sys.executable} -m pip install requests")
    import requests

from dotenv import load_dotenv

# Load VAPI key from voice agent .env
load_dotenv(Path(__file__).parent.parent / ".env")
if not os.getenv("VAPI_API_KEY"):
    load_dotenv(Path.home() / "ateam-pi-voice-agent" / ".env")

VAPI_API_KEY = os.environ["VAPI_API_KEY"]
VAPI_BASE = "https://api.vapi.ai"


def vapi_headers():
    return {
        "Authorization": f"Bearer {VAPI_API_KEY}",
        "Content-Type": "application/json",
    }


SYSTEM_PROMPT = """You are Sofia, a warm and encouraging AI Spanish language tutor on AgentVoz.
You are a native Spanish speaker from Mexico City. You are patient, fun, and adaptive.

The student is learning Spanish through real conversation with you. This is NOT a classroom.
You are having a natural, friendly chat — like talking to a friend who helps you practice.

RULES:
1. Speak ONLY in Spanish. This is immersive learning.
2. Keep responses SHORT — 1-3 sentences max. This is a conversation, not a lecture.
3. Adapt to the student's level. If they speak English, respond with simple Spanish and repeat key words.
4. If they make a mistake, gently correct by naturally using the correct form in your response.
5. Ask follow-up questions to keep the conversation flowing.
6. Be encouraging! Use "Muy bien!", "Excelente!", "Perfecto!" when they try.
7. Start with greetings and simple topics. Escalate complexity as they improve.
8. Use common Mexican Spanish expressions to sound natural (no textbook Spanish).
9. If the student seems stuck, offer the English word and teach the Spanish equivalent.
10. NEVER break character. You are Sofia, not an AI.
11. NEVER speak more than 3 sentences at a time. Brevity is key for conversation flow.

Your personality: Warm, patient, slightly playful, genuinely excited when the student improves.
You laugh easily and make jokes to keep the mood light."""


def create_assistant():
    """Create Sofia assistant on VAPI."""

    payload = {
        "name": "Sofia — AgentVoz Spanish Tutor",
        "firstMessage": "¡Hola! Me llamo Sofia. Soy tu tutora de español. ¿Cómo te llamas?",
        "firstMessageMode": "assistant-speaks-first",
        # STT — AssemblyAI, multilingual (handles English + Spanish mix)
        "transcriber": {
            "provider": "assembly-ai",
            "language": "en",  # Handles code-switching (English/Spanish)
        },
        # LLM — Groq for speed
        "model": {
            "provider": "groq",
            "model": "llama-3.3-70b-versatile",
            "messages": [{"role": "system", "content": SYSTEM_PROMPT}],
            "temperature": 0.7,
            "maxTokens": 150,
        },
        # Voice — ElevenLabs multilingual v2 (excellent Spanish)
        "voice": {
            "provider": "11labs",
            "voiceId": "XrExE9yKIg1WjnnlVkGX",  # Matilda — warm, multilingual
            "model": "eleven_multilingual_v2",
        },
        # Background denoising
        "backgroundDenoisingEnabled": True,
        # Call behavior — language learners need more time to think
        "silenceTimeoutSeconds": 15,
        "maxDurationSeconds": 600,  # 10 minutes per session
        "endCallMessage": "¡Fue un placer practicar contigo! ¡Hasta la próxima! Bye!",
        # Metadata for routing
        "metadata": {"client_id": "agentvoz", "product": "language-tutor"},
    }

    print("Creating Sofia assistant on VAPI...")
    resp = requests.post(
        f"{VAPI_BASE}/assistant",
        headers=vapi_headers(),
        json=payload,
    )

    if resp.status_code != 201:
        print(f"ERROR {resp.status_code}: {resp.text}")
        sys.exit(1)

    assistant = resp.json()
    assistant_id = assistant["id"]

    print(f"\nSofia assistant created!")
    print(f"  ID: {assistant_id}")
    print(f"  Name: {assistant['name']}")
    print(f"\nAdd to your .env and Vercel:")
    print(f"  VITE_VAPI_ASSISTANT_ID={assistant_id}")

    return assistant_id


if __name__ == "__main__":
    print("=" * 50)
    print("AgentVoz — VAPI Assistant Setup")
    print("=" * 50)
    create_assistant()
