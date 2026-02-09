"""
Love Fortune Mascot Generator
ComfyUI Flux Schnell API를 사용하여 마스코트 이미지 생성
Signal Geometry 철학: 미니멀 기하학적 형태, 구조적 색상, 볼드 형태
"""
import json
import urllib.request
import urllib.error
import time
import os
import uuid
from pathlib import Path

COMFYUI_URL = "http://127.0.0.1:8188"
OUTPUT_DIR = Path(__file__).parent / "public" / "mascot"

# Flux Schnell GGUF workflow template
def make_workflow(prompt_text: str, seed: int = 0, width: int = 1024, height: int = 1024):
    return {
        "1": {
            "class_type": "UnetLoaderGGUF",
            "inputs": {
                "unet_name": "flux1-schnell-Q4_K_S.gguf"
            }
        },
        "2": {
            "class_type": "DualCLIPLoaderGGUF",
            "inputs": {
                "clip_name1": "clip_l.safetensors",
                "clip_name2": "t5-v1_1-xxl-encoder-Q4_K_M.gguf",
                "type": "flux"
            }
        },
        "3": {
            "class_type": "CLIPTextEncodeFlux",
            "inputs": {
                "clip": ["2", 0],
                "clip_l": prompt_text,
                "t5xxl": prompt_text,
                "guidance": 3.5
            }
        },
        "4": {
            "class_type": "EmptySD3LatentImage",
            "inputs": {
                "width": width,
                "height": height,
                "batch_size": 1
            }
        },
        "5": {
            "class_type": "KSampler",
            "inputs": {
                "model": ["1", 0],
                "positive": ["3", 0],
                "negative": ["6", 0],
                "latent_image": ["4", 0],
                "seed": seed,
                "steps": 4,
                "cfg": 1.0,
                "sampler_name": "euler",
                "scheduler": "normal",
                "denoise": 1.0
            }
        },
        "6": {
            "class_type": "CLIPTextEncodeFlux",
            "inputs": {
                "clip": ["2", 0],
                "clip_l": "",
                "t5xxl": "",
                "guidance": 3.5
            }
        },
        "7": {
            "class_type": "VAELoader",
            "inputs": {
                "vae_name": "ae.safetensors"
            }
        },
        "8": {
            "class_type": "VAEDecode",
            "inputs": {
                "samples": ["5", 0],
                "vae": ["7", 0]
            }
        },
        "9": {
            "class_type": "SaveImage",
            "inputs": {
                "images": ["8", 0],
                "filename_prefix": "mascot"
            }
        }
    }


# Cute winged baby pig mascot prompts
# Character: adorable baby pig with small angel wings, consistent across all icons
BASE_STYLE = (
    "cute kawaii baby pig character with tiny angel wings, round chubby body, "
    "big sparkling eyes, pink skin, tiny curly tail, chibi proportions, "
    "flat design, solid dark background (#1A0A14), centered composition, "
    "clean vector art style, app mascot icon, no text, high quality"
)

MASCOTS = {
    "mascot-main": (
        f"A {BASE_STYLE}, the piglet is floating happily with wings spread, "
        "holding a glowing pink heart, joyful expression, romantic pink color scheme, "
        "soft warm lighting, main character pose"
    ),
    "grade-s": (
        f"A {BASE_STYLE}, the piglet wearing a golden crown, surrounded by golden sparkles and stars, "
        "proud confident expression, eyes closed smiling, golden aura glow, "
        "premium S-tier feeling, gold and pink color scheme"
    ),
    "grade-a": (
        f"A {BASE_STYLE}, the piglet blushing with heart-shaped eyes, "
        "surrounded by pink sparkle stars, excited happy expression, "
        "bright pink (#E91E63) accent colors, warm romantic energy"
    ),
    "grade-b": (
        f"A {BASE_STYLE}, the piglet with gentle smile and soft lavender wings, "
        "small hearts floating nearby, calm peaceful expression, "
        "soft purple and pastel pink colors, serene mood"
    ),
    "grade-c": (
        f"A {BASE_STYLE}, the piglet sitting quietly with a thoughtful expression, "
        "small cloud above head, slightly muted colors, grey-ish pink tone, "
        "calm neutral mood, subdued lighting"
    ),
    "grade-d": (
        f"A {BASE_STYLE}, the piglet sleeping peacefully curled up, eyes closed, "
        "tiny z z z floating above, wearing a small nightcap, "
        "dark muted colors, peaceful sleepy mood, cozy and restful"
    ),
    "lucky-heart": (
        f"A {BASE_STYLE}, the piglet holding a four-leaf clover in one hand "
        "and a shining star in the other, lucky excited expression, "
        "green and pink sparkles, fortune and luck theme"
    ),
    "premium-key": (
        f"A {BASE_STYLE}, the piglet holding a golden heart-shaped key, "
        "mysterious excited expression, golden key glowing, "
        "gold and rose pink colors, treasure unlock theme"
    ),
    "streak-fire": (
        f"A {BASE_STYLE}, the piglet with determined expression running forward, "
        "small flames trail behind, fiery orange-red aura around wings, "
        "energetic passionate mood, streak and fire theme"
    ),
}


def queue_prompt(workflow: dict) -> str:
    """Queue a prompt and return the prompt_id."""
    client_id = str(uuid.uuid4())
    payload = json.dumps({"prompt": workflow, "client_id": client_id}).encode("utf-8")
    req = urllib.request.Request(
        f"{COMFYUI_URL}/prompt",
        data=payload,
        headers={"Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req) as resp:
        result = json.loads(resp.read())
    return result["prompt_id"]


def wait_for_completion(prompt_id: str, timeout: int = 300) -> dict:
    """Poll history until the prompt completes."""
    start = time.time()
    while time.time() - start < timeout:
        try:
            req = urllib.request.Request(f"{COMFYUI_URL}/history/{prompt_id}")
            with urllib.request.urlopen(req) as resp:
                history = json.loads(resp.read())
            if prompt_id in history:
                return history[prompt_id]
        except Exception:
            pass
        time.sleep(2)
    raise TimeoutError(f"Prompt {prompt_id} did not complete within {timeout}s")


def get_image(filename: str, subfolder: str = "", folder_type: str = "output") -> bytes:
    """Download generated image from ComfyUI."""
    params = urllib.parse.urlencode({"filename": filename, "subfolder": subfolder, "type": folder_type})
    req = urllib.request.Request(f"{COMFYUI_URL}/view?{params}")
    with urllib.request.urlopen(req) as resp:
        return resp.read()


def resize_image(img_data: bytes, size: int) -> bytes:
    """Resize image using PIL."""
    from PIL import Image
    import io
    img = Image.open(io.BytesIO(img_data))
    img = img.resize((size, size), Image.LANCZOS)
    buf = io.BytesIO()
    img.save(buf, format="PNG", optimize=True)
    return buf.getvalue()


def generate_mascot(name: str, prompt: str, seed: int = 42):
    """Generate a single mascot with 3 sizes."""
    print(f"\n{'='*50}")
    print(f"Generating: {name}")
    print(f"Prompt: {prompt[:80]}...")

    workflow = make_workflow(prompt, seed=seed, width=1024, height=1024)
    prompt_id = queue_prompt(workflow)
    print(f"  Queued: {prompt_id}")

    result = wait_for_completion(prompt_id, timeout=300)
    print(f"  Completed!")

    # Find the output image
    outputs = result.get("outputs", {})
    for node_id, node_output in outputs.items():
        images = node_output.get("images", [])
        for img_info in images:
            filename = img_info["filename"]
            subfolder = img_info.get("subfolder", "")
            img_data = get_image(filename, subfolder)
            print(f"  Downloaded: {filename} ({len(img_data)} bytes)")

            # Save 3 sizes
            sizes = {
                f"{name}.png": 256,       # full
                f"{name}-sm.png": 128,     # small
                f"{name}-xs.png": 48,      # extra small
            }
            for fname, size in sizes.items():
                resized = resize_image(img_data, size)
                outpath = OUTPUT_DIR / fname
                outpath.write_bytes(resized)
                print(f"  Saved: {fname} ({size}x{size}, {len(resized)} bytes)")
            return True
    return False


def main():
    # Create output directory
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    print(f"Output directory: {OUTPUT_DIR}")

    # Check ComfyUI
    try:
        req = urllib.request.Request(f"{COMFYUI_URL}/system_stats")
        with urllib.request.urlopen(req) as resp:
            stats = json.loads(resp.read())
        gpu = stats.get("devices", [{}])[0].get("name", "unknown")
        print(f"ComfyUI connected: {gpu}")
    except Exception as e:
        print(f"ComfyUI not available: {e}")
        return

    # Generate all mascots
    success = 0
    total = len(MASCOTS)
    for i, (name, prompt) in enumerate(MASCOTS.items()):
        seed = 42 + i * 7  # Different seed per mascot
        try:
            if generate_mascot(name, prompt, seed):
                success += 1
        except Exception as e:
            print(f"  ERROR generating {name}: {e}")
        print(f"  Progress: {success}/{total}")

    print(f"\n{'='*50}")
    print(f"Done! Generated {success}/{total} mascots")
    print(f"Output: {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
