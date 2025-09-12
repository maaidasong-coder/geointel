from flask import Flask, request, jsonify
from flask_cors import CORS
import requests, base64
from io import BytesIO
from PIL import Image
import os

app = Flask(__name__)
CORS(app)  # Allow frontend (React) to connect

# Hugging Face API token
HF_API_TOKEN = os.environ.get("HF_API_TOKEN", "<YOUR_HF_TOKEN>")
HEADERS = {"Authorization": f"Bearer {HF_API_TOKEN}"}

def image_to_base64(image_bytes):
    """Convert image bytes to base64 string."""
    return base64.b64encode(image_bytes).decode("utf-8")

def call_hf_embedding(image_bytes):
    """Call Hugging Face face embedding model."""
    url = "https://api-inference.huggingface.co/models/<face-embedding-model>"
    data = {"inputs": image_to_base64(image_bytes)}
    response = requests.post(url, headers=HEADERS, json=data)
    response.raise_for_status()
    return response.json()

def call_scene_model(image_bytes):
    """Call Hugging Face scene classifier model."""
    url = "https://api-inference.huggingface.co/models/<scene-model>"
    data = {"inputs": image_to_base64(image_bytes)}
    response = requests.post(url, headers=HEADERS, json=data)
    response.raise_for_status()
    return response.json()

@app.route("/")
def home():
    return jsonify({"message": "GeoIntel Backend is live ✅"})

@app.route("/analyze", methods=["POST"])
def analyze():
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["file"]
    image_bytes = file.read()

    try:
        embedding = call_hf_embedding(image_bytes)
        scene = call_scene_model(image_bytes)
        return jsonify({"embedding": embedding, "scene": scene})
    except requests.HTTPError as http_err:
        return jsonify({"error": f"Hugging Face API error: {http_err}"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
