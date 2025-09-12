from flask import Flask, request, jsonify
import requests, base64
from io import BytesIO
from PIL import Image

app = Flask(__name__)

HF_API_TOKEN = "<YOUR_HF_TOKEN>"
HEADERS = {"Authorization": f"Bearer {HF_API_TOKEN}"}

def image_to_base64(image_bytes):
    return base64.b64encode(image_bytes).decode("utf-8")

def call_hf_embedding(image_bytes):
    url = "https://api-inference.huggingface.co/models/<face-embedding-model>"
    data = {"inputs": image_to_base64(image_bytes)}
    r = requests.post(url, headers=HEADERS, json=data)
    return r.json()

def call_scene_model(image_bytes):
    url = "https://api-inference.huggingface.co/models/<scene-model>"
    data = {"inputs": image_to_base64(image_bytes)}
    r = requests.post(url, headers=HEADERS, json=data)
    return r.json()

@app.route("/analyze", methods=["POST"])
def analyze():
    file = request.files["file"]
    image_bytes = file.read()
    embedding = call_hf_embedding(image_bytes)
    scene = call_scene_model(image_bytes)
    return jsonify({"embedding": embedding, "scene": scene})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
