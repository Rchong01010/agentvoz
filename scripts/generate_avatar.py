#!/usr/bin/env python3
"""
Generate Sofia's avatar image and animate it with Veo 3.1.

Usage:
    python scripts/generate_avatar.py

Produces:
    public/sofia-still.png   — Gemini Flash Image still
    public/sofia-loop.mp4    — Veo 3.1 animated 3s loop
"""

import os
import sys
import time
import json
import base64
from pathlib import Path

try:
    import httpx
except ImportError:
    print("Installing httpx...")
    os.system(f"{sys.executable} -m pip install httpx")
    import httpx

from dotenv import load_dotenv

# Load from parent .env or ateam-content .env
load_dotenv(Path(__file__).parent.parent / ".env")
if not os.getenv("GEMINI_API_KEY"):
    load_dotenv(Path.home() / "ateam-content" / ".env")

GEMINI_API_KEY = os.environ["GEMINI_API_KEY"]
GOOGLE_API_ORIGIN = "https://generativelanguage.googleapis.com/"

OUTPUT_DIR = Path(__file__).parent.parent / "public"
OUTPUT_DIR.mkdir(exist_ok=True)

# ---------------------------------------------------------------------------
# Step 1: Generate Sofia still with Gemini 2.5 Flash Image
# ---------------------------------------------------------------------------

SOFIA_PROMPT = """Generate a photo of a Latina woman in her mid-20s.

CRITICAL REQUIREMENTS:
- Natural iPhone selfie style, slightly off-center framing
- Warm, genuine smile — friendly and approachable, like a tutor greeting a student
- Dark brown wavy hair, casual professional look (simple top, small earrings)
- Soft natural window light from the left side
- Visible skin texture: pores, slight under-eye shadows, baby hairs at hairline
- Background: blurred warm-toned room (bookshelves or living room)
- 9:16 vertical portrait orientation
- She is looking slightly past the camera with a welcoming expression
- NO heavy makeup, NO perfect skin, NO studio lighting
- Must look like a real person took this with their phone
- Warm color temperature, slight film grain feel"""


def generate_still(output_path, max_retries=3):
    """Generate Sofia's still image using Gemini Flash Image."""
    url = f"{GOOGLE_API_ORIGIN}v1beta/models/gemini-2.5-flash-image:generateContent?key={GEMINI_API_KEY}"

    payload = {
        "contents": [{"parts": [{"text": SOFIA_PROMPT}]}],
        "generationConfig": {"responseModalities": ["IMAGE", "TEXT"]},
    }

    for attempt in range(max_retries):
        try:
            print(f"  Generating Sofia still (attempt {attempt + 1})...")
            resp = httpx.post(
                url,
                json=payload,
                headers={"Content-Type": "application/json"},
                timeout=90,
            )
            resp.raise_for_status()
            result = resp.json()

            candidates = result.get("candidates", [])
            if candidates:
                parts = candidates[0].get("content", {}).get("parts", [])
                for part in parts:
                    if "inlineData" in part:
                        img_data = base64.b64decode(part["inlineData"]["data"])
                        with open(output_path, "wb") as f:
                            f.write(img_data)
                        print(f"  Sofia still saved: {output_path}")
                        return True

            print(f"  No image in response")
            if attempt < max_retries - 1:
                time.sleep(10)

        except httpx.HTTPStatusError as e:
            if e.response.status_code == 429 and attempt < max_retries - 1:
                wait = 30 * (attempt + 1)
                print(f"  Rate limited — waiting {wait}s...")
                time.sleep(wait)
            else:
                print(f"  HTTP Error {e.response.status_code}: {e.response.text[:300]}")
                return False

    return False


# ---------------------------------------------------------------------------
# Step 2: Animate still with Veo 3.1 image-to-video
# ---------------------------------------------------------------------------

ANIMATION_PROMPT = (
    "Very subtle natural breathing movement and slight friendly head tilt. "
    "Warm, welcoming expression. She blinks naturally once. "
    "Minimal motion. No special effects. No sparkle. No lens flare. 3 seconds."
)


def animate_still(still_path, output_path, max_retries=3):
    """Animate the still image using Veo 3.1."""
    with open(still_path, "rb") as f:
        img_b64 = base64.b64encode(f.read()).decode("utf-8")

    ext = Path(still_path).suffix.lower()
    mime = "image/png" if ext == ".png" else "image/jpeg"

    url = f"{GOOGLE_API_ORIGIN}v1beta/models/veo-3.1-generate-preview:predictLongRunning?key={GEMINI_API_KEY}"

    payload = {
        "instances": [
            {
                "prompt": ANIMATION_PROMPT,
                "image": {"bytesBase64Encoded": img_b64, "mimeType": mime},
            }
        ],
        "parameters": {"sampleCount": 1, "aspectRatio": "9:16"},
    }

    # Submit generation request
    for attempt in range(max_retries):
        try:
            print(f"  Submitting Veo 3.1 animation (attempt {attempt + 1})...")
            resp = httpx.post(
                url,
                json=payload,
                headers={"Content-Type": "application/json"},
                timeout=30,
            )
            resp.raise_for_status()
            result = resp.json()
            break
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 429 and attempt < max_retries - 1:
                wait = 60 * (attempt + 1)
                print(f"  Rate limited — waiting {wait}s...")
                time.sleep(wait)
            else:
                print(f"  HTTP Error {e.response.status_code}: {e.response.text[:300]}")
                return False
    else:
        return False

    op_name = result["name"]
    print(f"  Veo 3.1 operation: {op_name}")

    # Poll for completion (up to 10 minutes)
    for i in range(60):
        poll_url = f"{GOOGLE_API_ORIGIN}v1beta/{op_name}?key={GEMINI_API_KEY}"
        poll_resp = httpx.get(poll_url, timeout=15)
        poll_resp.raise_for_status()
        result = poll_resp.json()

        if result.get("done", False):
            if "response" in result:
                videos = (
                    result["response"]
                    .get("generateVideoResponse", {})
                    .get("generatedSamples", [])
                )
                if videos:
                    uri = videos[0].get("video", {}).get("uri", "")
                    if not uri.startswith(GOOGLE_API_ORIGIN):
                        print(f"  Rejected download URI: unexpected origin")
                        return False
                    dl_url = f"{uri}&key={GEMINI_API_KEY}"
                    dl_resp = httpx.get(dl_url, timeout=120, follow_redirects=True)
                    dl_resp.raise_for_status()
                    with open(output_path, "wb") as f:
                        f.write(dl_resp.content)
                    print(f"  Animated clip saved: {output_path}")
                    return True
                else:
                    print(f"  No videos in response")
                    return False
            elif "error" in result:
                print(f"  Error: {result['error']}")
                return False

        if i % 3 == 0:
            print(f"  Animating... ({i * 10}s elapsed)")
        time.sleep(10)

    print("  Timed out after 10 minutes")
    return False


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    still_path = OUTPUT_DIR / "sofia-still.png"
    video_path = OUTPUT_DIR / "sofia-loop.mp4"

    print("=" * 50)
    print("AgentVoz — Sofia Avatar Generator")
    print("=" * 50)

    # Step 1: Generate still
    if still_path.exists():
        print(f"\nStill already exists: {still_path}")
        regen = input("Regenerate? (y/N): ").strip().lower()
        if regen != "y":
            print("  Skipping still generation.")
        else:
            if not generate_still(still_path):
                print("FAILED to generate still.")
                sys.exit(1)
    else:
        print("\nStep 1: Generating Sofia still image...")
        if not generate_still(still_path):
            print("FAILED to generate still.")
            sys.exit(1)

    # Step 2: Animate
    if video_path.exists():
        print(f"\nVideo already exists: {video_path}")
        regen = input("Regenerate? (y/N): ").strip().lower()
        if regen != "y":
            print("  Skipping animation.")
            sys.exit(0)

    print("\nStep 2: Animating with Veo 3.1...")
    if not animate_still(still_path, video_path):
        print("FAILED to animate. You can still use the still image.")
        sys.exit(1)

    print(f"\nDone! Files:")
    print(f"  Still: {still_path}")
    print(f"  Video: {video_path}")
