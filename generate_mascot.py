"""
우리 케미 - 끌림이(Kkeullimi) 마스코트 + 앱 로고 생성기
ComfyUI Flux Schnell GGUF API

캐릭터: U자석 요정 끌림이
주색: #FF7043 (오렌지-레드), 포인트: #FF1744
"""
import json
import urllib.request
import urllib.parse
import time
import os
import uuid
import io
from pathlib import Path

COMFYUI_URL = "http://127.0.0.1:8188"
PROJECT_DIR = Path(__file__).parent
MASCOT_DIR = PROJECT_DIR / "public" / "mascot"
LOGO_DIR = Path(__file__).parent.parent / "app-logos"


def make_workflow(prompt_text: str, seed: int = 0, width: int = 512, height: int = 512, prefix: str = "mascot"):
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
                "filename_prefix": prefix
            }
        }
    }


# ===== MASCOT PROMPTS =====

MASCOT_PROMPTS = {
    "mascot-main": {
        "prompt": (
            "cute kawaii U-magnet fairy mascot character, horseshoe magnet shaped head ornament "
            "colored red (#FF7043) and blue at each pole tip, round chubby small body in warm "
            "orange-red outfit, big sparkling eyes, gentle friendly smile, chibi proportions "
            "3-head-tall, tiny magnet sparkles floating around, flat minimal design, solid white "
            "background, centered composition, clean vector art style, app mascot icon, no text, "
            "high quality, simple and adorable, standing pose with one hand waving hello"
        ),
        "seed": 42,
    },
    "mascot-happy": {
        "prompt": (
            "cute kawaii U-magnet fairy mascot character, horseshoe magnet shaped head ornament "
            "colored red (#FF7043) and blue at each pole tip, round chubby small body in warm "
            "orange-red outfit, big sparkling eyes with star pupils, wide open mouth laughing "
            "joyfully, chibi proportions 3-head-tall, jumping in the air excited, small hearts "
            "and sparkles bursting around, arms raised in celebration, flat minimal design, solid "
            "white background, centered composition, clean vector art style, app mascot icon, "
            "no text, high quality, simple and adorable"
        ),
        "seed": 49,
    },
    "mascot-thinking": {
        "prompt": (
            "cute kawaii U-magnet fairy mascot character, horseshoe magnet shaped head ornament "
            "colored red (#FF7043) and blue at each pole tip, round chubby small body in warm "
            "orange-red outfit, big sparkling eyes looking upward curiously, one hand on chin "
            "thinking pose, chibi proportions 3-head-tall, small question mark floating above "
            "head, slightly tilted head, curious wondering expression, flat minimal design, solid "
            "white background, centered composition, clean vector art style, app mascot icon, "
            "no text, high quality, simple and adorable"
        ),
        "seed": 56,
    },
    "mascot-sad": {
        "prompt": (
            "cute kawaii U-magnet fairy mascot character, horseshoe magnet shaped head ornament "
            "colored red (#FF7043) and blue at each pole tip, round chubby small body in warm "
            "orange-red outfit, big watery eyes with small tear drop, slightly pouting mouth, "
            "chibi proportions 3-head-tall, droopy posture with slightly lowered magnet ornament, "
            "small broken heart floating nearby, flat minimal design, solid white background, "
            "centered composition, clean vector art style, app mascot icon, no text, high quality, "
            "simple and adorable"
        ),
        "seed": 63,
    },
}

# ===== LOGO PROMPT =====

LOGO_PROMPT = {
    "prompt": (
        "minimalist geometric app icon logo, solid flat #FF7043 orange-red background, "
        "bold white horseshoe U-magnet symbol in center, two small circles at magnet pole "
        "tips suggesting attraction, clean geometric lines, signal geometry style, no text, "
        "no gradients, sharp edges, 600x600 icon design, professional minimal flat design, "
        "single color background with white symbol, high contrast"
    ),
    "seed": 100,
}


def queue_prompt(workflow: dict) -> str:
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
    params = urllib.parse.urlencode({"filename": filename, "subfolder": subfolder, "type": folder_type})
    req = urllib.request.Request(f"{COMFYUI_URL}/view?{params}")
    with urllib.request.urlopen(req) as resp:
        return resp.read()


def resize_image(img_data: bytes, width: int, height: int) -> bytes:
    from PIL import Image
    img = Image.open(io.BytesIO(img_data))
    img = img.resize((width, height), Image.LANCZOS)
    buf = io.BytesIO()
    img.save(buf, format="PNG", optimize=True)
    return buf.getvalue()


def generate_and_save(name: str, prompt: str, seed: int, output_dir: Path,
                      gen_size: int = 512, sizes: dict = None, prefix: str = "mascot"):
    """Generate an image and save at multiple sizes."""
    print(f"\n{'='*50}")
    print(f"Generating: {name}")
    print(f"Seed: {seed}")
    print(f"{'='*50}")

    workflow = make_workflow(prompt, seed=seed, width=gen_size, height=gen_size, prefix=prefix)
    prompt_id = queue_prompt(workflow)
    print(f"  Queued: {prompt_id}")

    result = wait_for_completion(prompt_id, timeout=300)
    print(f"  Completed!")

    outputs = result.get("outputs", {})
    for node_id, node_output in outputs.items():
        images = node_output.get("images", [])
        for img_info in images:
            img_data = get_image(img_info["filename"], img_info.get("subfolder", ""))
            print(f"  Downloaded: {img_info['filename']} ({len(img_data)//1024}KB)")

            if sizes:
                for fname, (w, h) in sizes.items():
                    resized = resize_image(img_data, w, h)
                    outpath = output_dir / fname
                    outpath.write_bytes(resized)
                    print(f"  Saved: {outpath} ({w}x{h}, {len(resized)//1024}KB)")
            return img_data
    return None


def main():
    # Create directories
    MASCOT_DIR.mkdir(parents=True, exist_ok=True)
    LOGO_DIR.mkdir(parents=True, exist_ok=True)

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

    # ===== Generate Mascots (4 images, 3 sizes each) =====
    print("\n" + "="*60)
    print("  MASCOT GENERATION (4 images)")
    print("="*60)

    mascot_success = 0
    for name, config in MASCOT_PROMPTS.items():
        sizes = {
            f"{name}.png": (128, 128),
            f"{name}-64.png": (64, 64),
            f"{name}-48.png": (48, 48),
        }
        try:
            result = generate_and_save(
                name=name,
                prompt=config["prompt"],
                seed=config["seed"],
                output_dir=MASCOT_DIR,
                gen_size=512,
                sizes=sizes,
                prefix=f"chemi_{name}",
            )
            if result:
                mascot_success += 1
        except Exception as e:
            print(f"  ERROR: {e}")

    # ===== Generate Logo (1 image) =====
    print("\n" + "="*60)
    print("  LOGO GENERATION")
    print("="*60)

    logo_success = False
    try:
        logo_sizes = {
            "name-chemi.png": (600, 600),
        }
        result = generate_and_save(
            name="name-chemi-logo",
            prompt=LOGO_PROMPT["prompt"],
            seed=LOGO_PROMPT["seed"],
            output_dir=LOGO_DIR,
            gen_size=512,
            sizes=logo_sizes,
            prefix="chemi_logo",
        )
        if result:
            logo_success = True
    except Exception as e:
        print(f"  ERROR: {e}")

    # ===== Summary =====
    print("\n" + "="*60)
    print("  GENERATION SUMMARY")
    print("="*60)
    print(f"  Mascots: {mascot_success}/4")
    print(f"  Logo: {'OK' if logo_success else 'FAILED'}")
    print(f"\n  Mascot files: {MASCOT_DIR}")
    print(f"  Logo file: {LOGO_DIR / 'name-chemi.png'}")


if __name__ == "__main__":
    main()
