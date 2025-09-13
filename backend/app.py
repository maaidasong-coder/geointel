from flask import Flask, request, jsonify
from flask_cors import CORS
import requests, base64, os
from io import BytesIO
from PIL import Image

app = Flask(__name__)
CORS(app)  # ✅ Allow frontend (React) to connect

# 🔑 Load Hugging Face API token from Render environment
HF_API_TOKEN = os.getenv("HF_TOKEN")
HEADERS = {"Authorization": f"Bearer {HF_API_TOKEN}"}

# ✅ Hugging Face model endpoints
# Embedding model: turns image into vector representation
EMBEDDING_MODEL_URL = "https://api-inference.huggingface.co/models/sentence-transformers/all-MiniLM-L6-v2"

# Scene classification model: predicts what's in the image
SCENE_MODEL_URL = "https://api-inference.huggingface.co/models/microsoft/resnet-50"

# Convert image bytes to base64 string
def image_to_base64(image_bytes):
    return base64.b64encode(image_bytes).decode("utf-8")

# Call Hugging Face embedding model
def call_hf_embedding(image_bytes):
    data = {"inputs": image_to_base64(image_bytes)}
    r = requests.post(EMBEDDING_MODEL_URL, headers=HEADERS, json=data)
    return r.json()

# Call Hugging Face scene classifier model
def call_scene_model(image_bytes):
    data = {"inputs": image_to_base64(image_bytes)}
    r = requests.post(SCENE_MODEL_URL, headers=HEADERS, json=data)
    return r.json()

# ✅ Test route
@app.route("/")
def home():
    return jsonify({"message": "GeoIntel Backend is live ✅"})

# ✅ Main analyze route
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
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    # Render automatically assigns PORT → use it instead of hardcoding
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
