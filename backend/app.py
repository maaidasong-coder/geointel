from flask import Flask, request, jsonify
from flask_cors import CORS
import requests, base64, os, time, uuid

app = Flask(__name__)
CORS(app)

# ---------------- CONFIG ----------------
HF_API_TOKEN = os.getenv("HF_TOKEN")
HEADERS = {"Authorization": f"Bearer {HF_API_TOKEN}"} if HF_API_TOKEN else {}

# Hugging Face endpoints
EMBEDDING_MODEL_URL = os.getenv(
    "EMBEDDING_MODEL_URL",
    "https://api-inference.huggingface.co/models/sentence-transformers/all-MiniLM-L6-v2",
)
SCENE_MODEL_URL = os.getenv(
    "SCENE_MODEL_URL",
    "https://api-inference.huggingface.co/models/microsoft/resnet-50",
)
OCR_MODEL_URL = os.getenv(
    "OCR_MODEL_URL",
    "https://api-inference.huggingface.co/models/pszemraj/tinyocr",
)

# Search provider keys
BING_API_KEY = os.getenv("BING_API_KEY")
BING_ENDPOINT = os.getenv("BING_ENDPOINT")
SERPAPI_KEY = os.getenv("SERPAPI_KEY")

# ---------------- STORAGE ----------------
# In production you’d use a database
CASES = {}


# ---------------- HELPERS ----------------
def image_to_base64(image_bytes):
    return base64.b64encode(image_bytes).decode("utf-8")


def call_hf_model(url, image_bytes):
    if not HF_API_TOKEN:
        raise RuntimeError("HF_TOKEN not set")
    data = {"inputs": image_to_base64(image_bytes)}
    r = requests.post(url, headers=HEADERS, json=data, timeout=40)
    r.raise_for_status()
    return r.json()


def call_embedding(image_bytes):
    try:
        return call_hf_model(EMBEDDING_MODEL_URL, image_bytes)
    except Exception as e:
        return {"error": str(e)}


def call_scene(image_bytes):
    try:
        return call_hf_model(SCENE_MODEL_URL, image_bytes)
    except Exception as e:
        return {"error": str(e)}


def call_ocr(image_bytes):
    try:
        return call_hf_model(OCR_MODEL_URL, image_bytes)
    except Exception as e:
        return {"error": str(e)}


# ---------------- SEARCH ----------------
def build_queries(ocr_text, scene_labels, notes):
    queries = []
    if notes:
        queries.append(notes)
    if ocr_text:
        lines = [l.strip() for l in ocr_text.splitlines() if l.strip()]
        if lines:
            queries.append(" ".join(lines[:5]))
            queries += lines[:3]
    if isinstance(scene_labels, list):
        queries += [str(lbl) for lbl in scene_labels[:5]]
    elif isinstance(scene_labels, dict) and "label" in scene_labels:
        queries.append(scene_labels["label"])
    if not queries:
        queries = ["image forensic analysis", "possible identification from image"]
    return list(dict.fromkeys(queries))[:6]


def bing_search(query, top_k=5):
    if not BING_API_KEY:
        raise RuntimeError("BING_API_KEY not set")
    base = BING_ENDPOINT.rstrip("/") if BING_ENDPOINT else "https://api.bing.microsoft.com"
    url = f"{base}/v7.0/search"
    headers = {"Ocp-Apim-Subscription-Key": BING_API_KEY}
    params = {"q": query, "count": top_k}
    r = requests.get(url, headers=headers, params=params, timeout=15)
    r.raise_for_status()
    data = r.json()
    results = []
    for item in data.get("webPages", {}).get("value", [])[:top_k]:
        results.append(
            {"title": item.get("name"), "snippet": item.get("snippet"), "url": item.get("url")}
        )
    return results


def serpapi_search(query, top_k=5):
    if not SERPAPI_KEY:
        raise RuntimeError("SERPAPI_KEY not set")
    url = "https://serpapi.com/search.json"
    params = {"q": query, "api_key": SERPAPI_KEY, "num": top_k}
    r = requests.get(url, params=params, timeout=15)
    r.raise_for_status()
    data = r.json()
    results = []
    for item in data.get("organic_results", [])[:top_k]:
        results.append(
            {"title": item.get("title"), "snippet": item.get("snippet"), "url": item.get("link")}
        )
    return results


def perform_search(queries):
    if SERPAPI_KEY:
        provider = "serpapi"
    elif BING_API_KEY:
        provider = "bing"
    else:
        return {"warning": "No search API key provided"}, []
    aggregated = []
    for q in queries[:3]:
        try:
            hits = serpapi_search(q) if provider == "serpapi" else bing_search(q)
        except Exception as e:
            hits = [{"error": str(e)}]
        aggregated.append({"query": q, "hits": hits})
    return {"provider": provider}, aggregated


def generate_ai_insights(ocr_text, scene, search_results):
    insights = []
    if scene and isinstance(scene, list) and "label" in scene[0]:
        insights.append(f"Scene appears to be: {scene[0]['label']} "
                        f"({scene[0].get('score', 0):.2f} confidence).")
    if ocr_text:
        insights.append(f"OCR extracted text: {ocr_text[:100]}...")
    if search_results:
        insights.append(f"Found {sum(len(s.get('hits', [])) for s in search_results)} "
                        f"relevant open-source references.")
    return " ".join(insights) if insights else "No AI insights available."


# ---------------- ROUTES ----------------
@app.route("/")
def home():
    return jsonify({"message": "GeoIntel Backend is live ✅"})


@app.route("/analyze", methods=["POST"])
def analyze():
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["file"]
    notes = request.form.get("notes", "").strip()
    image_bytes = file.read()

    # Step 1: AI analysis
    embedding = call_embedding(image_bytes)
    scene = call_scene(image_bytes)
    ocr_raw = call_ocr(image_bytes)

    # Try to extract OCR text
    ocr_text = None
    if isinstance(ocr_raw, dict) and "text" in ocr_raw:
        ocr_text = ocr_raw["text"]
    elif isinstance(ocr_raw, str):
        ocr_text = ocr_raw
    elif isinstance(ocr_raw, list):
        texts = []
        for b in ocr_raw:
            if isinstance(b, dict) and "text" in b:
                texts.append(b["text"])
            elif isinstance(b, str):
                texts.append(b)
        ocr_text = "\n".join(texts) if texts else None

    # Step 2: Build queries + search
    queries = build_queries(ocr_text or "", scene, notes)
    provider_info, search_results = perform_search(queries)

    # Step 3: AI Insights
    ai_insights = generate_ai_insights(ocr_text, scene, search_results)

    # Step 4: Store in memory
    case_id = str(uuid.uuid4())
    case_record = {
        "case_id": case_id,
        "created_at": time.strftime("%Y-%m-%d %H:%M:%S"),
        "notes": notes,
        "embedding": embedding,
        "scene_inferences": scene,
        "ocr_text": ocr_text,
        "queries": queries,
        "search_provider": provider_info,
        "search_results": search_results,
        "ai_insights": ai_insights,
        "osint": [hit for batch in search_results for hit in batch.get("hits", [])],
    }
    CASES[case_id] = case_record

    return jsonify(case_record)


@app.route("/cases/<case_id>", methods=["GET"])
def get_case(case_id):
    case = CASES.get(case_id)
    if not case:
        return jsonify({"error": "Case not found"}), 404
    return jsonify(case)


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
