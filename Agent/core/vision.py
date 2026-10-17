"""OpenCV Image Preprocessor for QuoteFlow AI Multimodal Node 1.

Preprocesses handwritten contractor estimate slips ('parchis'):
1. Downsamples raw high-res images (e.g. 1600x726) to 1 vision patch (max 768px).
2. Applies Contrast Limited Adaptive Histogram Equalization (CLAHE) to sharpen faint pen ink.
3. Eliminates base64 text token leakage into prompt text.
Reduces token consumption by 90%+ (from ~39k tokens down to ~1.2k tokens).
"""

import os
import io
import re
import base64
from typing import Optional, Tuple

def _decode_image_input(image_source: str) -> Tuple[bytes, str]:
    """Decodes file path or base64 data string into raw bytes and mime type."""
    # Check if local file path
    if os.path.exists(image_source):
        mime = "image/jpeg" if image_source.lower().endswith((".jpg", ".jpeg")) else "image/png"
        with open(image_source, "rb") as f:
            return f.read(), mime
    
    # Check if base64 data url
    if image_source.startswith("data:image"):
        match = re.match(r"^data:(image/[a-zA-Z0-9\+\-]+);base64,(.+)$", image_source, re.DOTALL)
        if match:
            mime = match.group(1)
            raw_bytes = base64.b64decode(match.group(2))
            return raw_bytes, mime

    # Assume raw base64 string
    try:
        raw_bytes = base64.b64decode(image_source)
        return raw_bytes, "image/jpeg"
    except Exception:
        raise ValueError("Unsupported or invalid image input source.")

def preprocess_slip_image(image_source: str, max_dimension: int = 768) -> str:
    """Optimizes image for Gemma 4 multimodal vision using OpenCV (with PIL fallback).
    
    Returns a compact data:image/jpeg;base64 URL that fits into a single 
    multimodal vision tile (~258 tokens) with enhanced handwriting contrast.
    """
    raw_bytes, _ = _decode_image_input(image_source)
    
    # Try OpenCV first
    try:
        import cv2
        import numpy as np

        # Decode byte buffer to numpy BGR image
        np_arr = np.frombuffer(raw_bytes, np.uint8)
        img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

        if img is not None:
            h, w = img.shape[:2]

            # 1. Proportional Downscaling with cv2.INTER_AREA (preserves thin pen strokes)
            if max(h, w) > max_dimension:
                scale = max_dimension / float(max(h, w))
                new_w, new_h = int(w * scale), int(h * scale)
                img = cv2.resize(img, (new_w, new_h), interpolation=cv2.INTER_AREA)

            # 2. Contrast Enhancement via CLAHE on Luminance Channel (LAB color space)
            # This makes faded ballpoint pen / smudged pencil text pop on paper background
            lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
            l_channel, a_channel, b_channel = cv2.split(lab)
            clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
            enhanced_l = clahe.apply(l_channel)
            merged_lab = cv2.merge([enhanced_l, a_channel, b_channel])
            img = cv2.cvtColor(merged_lab, cv2.COLOR_LAB2BGR)

            # 3. Compress to optimized JPEG
            encode_params = [int(cv2.IMWRITE_JPEG_QUALITY), 82]
            success, encoded_img = cv2.imencode(".jpg", img, encode_params)
            if success:
                b64_str = base64.b64encode(encoded_img.tobytes()).decode("utf-8")
                return f"data:image/jpeg;base64,{b64_str}"

    except Exception:
        pass  # Fallback to PIL below

    # PIL Fallback if OpenCV is not available
    from PIL import Image, ImageEnhance
    im = Image.open(io.BytesIO(raw_bytes)).convert("RGB")
    orig_w, orig_h = im.size

    if max(orig_w, orig_h) > max_dimension:
        scale = max_dimension / float(max(orig_w, orig_h))
        new_w, new_h = int(orig_w * scale), int(orig_h * scale)
        im = im.resize((new_w, new_h), Image.Resampling.LANCZOS)

    # Enhance contrast for handwriting clarity
    enhancer = ImageEnhance.Contrast(im)
    im_enhanced = enhancer.enhance(1.3)

    out_buf = io.BytesIO()
    im_enhanced.save(out_buf, format="JPEG", quality=82, optimize=True)
    b64_str = base64.b64encode(out_buf.getvalue()).decode("utf-8")
    return f"data:image/jpeg;base64,{b64_str}"
