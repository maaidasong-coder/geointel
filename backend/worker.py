"""
Worker stub (Python) - shows pattern to call HF inference endpoints.
Replace URLs and API keys with your own.

This script demonstrates:
- decode image bytes
- call HF face embedding endpoint
- call scene classifier endpoint
- return embeddings / labels
"""

import requests
import base64
from PIL import Image
from io import BytesIO

HF_API_TOKEN = "<YOUR_HF_TOKEN>"
HEADERS = {"Authorization": f"Bearer {HF_API_TOKEN}"}

def image_to_base64(image_bytes):
    return base64.b64encode(image_bytes).decode("utf-8")

def call_hf_embedding(image_bytes):
    url = "https://api-inference.huggingface.co/models/<face-embedding-model>"
    data = {"inputs": image_to_base64(image_bytes)}
    r = requests.post(url, headers=HEADERS, json=data)
    return r.json()  # parse as needed

def call_scene_model(image_bytes):
    url = "https://api-inference.huggingface.co/models/<scene-model>"
    data = {"inputs": image_to_base64(image_bytes)}
    r = requests.post(url, headers=HEADERS, json=data)
    return r.json()

# Example usage:
if __name__ == "__main__":
    with open("test.jpg", "rb") as f:
        b = f.read()
    emb = call_hf_embedding(b)
    scene = call_scene_model(b)
    print("embedding:", emb)
    print("scene:", scene)
