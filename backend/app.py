from flask import Flask, request, jsonify
from flask_cors import CORS
import requests, base64, os, time, uuid
from PIL import Image
import exifread
from io import BytesIO
import psycopg  # <-- Downgraded from psycopg2
import json

app = Flask(__name__)
CORS(app)

# ---------------- CONFIG ----------------
HF_API_TOKEN = os.getenv("HF_TOKEN")
HEADERS = {"Authorization": f"Bearer {HF_API_TOKEN}"} if HF_API_TOKEN else {}

EMBEDDING_MODEL_URL = os.getenv("EMBEDDING_MODEL_URL")
SCENE_MODEL_URL = os.getenv("SCENE_MODEL_URL")
OCR_MODEL_URL = os.getenv("OCR_MODEL_URL")
FACE_MODEL_URL = os.getenv("FACE_MODEL_URL")

BING_API_KEY = os.getenv("BING_API_KEY")
BING_ENDPOINT = os.getenv("BING_ENDPOINT")
SERPAPI_KEY = os.getenv("SERPAPI_KEY")

# ---------------- DATABASE CONFIG ----------------
DB_URL = os.getenv("DATABASE_URL") or "postgresql://geointel_database_user:0iT7TxP7eaUX7MMAilZQ5acTwSdmBSXE@dpg-d32vbvvdiees7394u580-a.oregon-postgres.render.com/geointel_database"

conn = psycopg.connect(DB_URL)
conn.autocommit = True
cur = conn.cursor()

# Create table if not exists
cur.execute("""
CREATE TABLE IF NOT EXISTS cases (
    case_id UUID PRIMARY KEY,
    created_at TIMESTAMP,
    notes TEXT,
    embedding JSONB,
    scene_inferences JSONB,
    ocr_text TEXT,
    face_data JSONB,
    face_attributes JSONB,
    geolocation JSONB,
    geo_guesses JSONB,
    queries JSONB,
    search_provider JSONB,
    search_results JSONB,
    ai_insights TEXT,
    osint JSONB
)
""")

# ---------------- HELPERS ----------------
def image_to_base64(image_bytes):
    return base64.b64encode(image_bytes).decode("utf-8")

def call_hf_model(url, image_bytes):
    if not HF_API_TOKEN or not url:
        return {"error": "HF_TOKEN or model URL not set"}
    data = {"inputs": image_to_base64(image_bytes)}
    try:
        r = requests.post(url, headers=HEADERS, json=data, timeout=40)
        r.raise_for_status()
        return r.json()
    except Exception as e:
        return {"error": str(e)}

def call_embedding(image_bytes): return call_hf_model(EMBEDDING_MODEL_URL, image_bytes)
def call_scene(image_bytes): return call_hf_model(SCENE_MODEL_URL, image_bytes)
def call_ocr(image_bytes): return call_hf_model(OCR_MODEL_URL, image_bytes)
def call_face_embedding(image_bytes): return call_hf_model(FACE_MODEL_URL, image_bytes)

def extract_face_attributes(face_data):
    if not face_data or (isinstance(face_data, dict) and "error" in face_data):
        return {}
    if isinstance(face_data, list) and len(face_data) > 0:
        first_face = face_data[0]
        return {
            "age": first_face.get("age"),
            "gender": first_face.get("gender"),
            "ethnicity": first_face.get("ethnicity")
        }
    return {}

def generate_social_queries(face_attributes):
    if not face_attributes:
        return []
    desc = " ".join(f"{k} {v}" for k, v in face_attributes.items() if v)
    if not desc:
        return []
    return [f"{desc} site:{site}" for site in ["linkedin.com","instagram.com","twitter.com","facebook.com"]]

def extract_gps(image_bytes):
    try:
        img = BytesIO(image_bytes)
        tags = exifread.process_file(img, details=False)
        gps_lat = tags.get("GPS GPSLatitude")
        gps_lat_ref = tags.get("GPS GPSLatitudeRef")
        gps_lon = tags.get("GPS GPSLongitude")
        gps_lon_ref = tags.get("GPS GPSLongitudeRef")
        if gps_lat and gps_lon and gps_lat_ref and gps_lon_ref:
            lat = sum(float(x.num)/float(x.den)/60**i for i, x in enumerate(gps_lat.values[::-1]))
            lon = sum(float(x.num)/float(x.den)/60**i for i, x in enumerate(gps_lon.values[::-1]))
            lat = -lat if gps_lat_ref.values[0] != "N" else lat
            lon = -lon if gps_lon_ref.values[0] != "E" else lon
            return {"latitude": lat, "longitude": lon}
    except:
        return None
    return None

def generate_geo_guesses(scene=None, ocr_text=None, face_attributes=None):
    guesses = []
    if scene and isinstance(scene, list):
        for s in scene[:3]:
            if isinstance(s, dict) and "label" in s:
                guesses.append(f"Possible location related to: {s['label']}")
    if ocr_text:
        for line in ocr_text.splitlines()[:3]:
            guesses.append(f"Text hint: {line.strip()}")
    if face_attributes:
        desc = ", ".join(f"{k}:{v}" for k,v in face_attributes.items() if v)
        if desc:
            guesses.append(f"Demographic hint: {desc}")
    if not guesses:
        guesses = ["No explicit geo hints available"]
    return guesses[:5]

def build_queries(ocr_text, scene_labels, notes, face_attributes=None):
    queries = [notes] if notes else []
    if ocr_text:
        lines = [l.strip() for l in ocr_text.splitlines() if l.strip()]
        if lines:
            queries.append(" ".join(lines[:5]))
            queries += lines[:3]
    if isinstance(scene_labels, list):
        queries += [str(lbl) for lbl in scene_labels[:5]]
    elif isinstance(scene_labels, dict) and "label" in scene_labels:
        queries.append(scene_labels["label"])
    if face_attributes:
        desc = "Person detected"
        for k in ["age","gender","ethnicity"]:
            if k in face_attributes:
                desc += f", {k} ~{face_attributes[k]}"
        queries.append(desc)
        queries += generate_social_queries(face_attributes)
    if not queries:
        queries = ["image forensic analysis", "possible identification from image"]
    return list(dict.fromkeys(queries))[:10]

def bing_search(query, top_k=5):
    try:
        if not BING_API_KEY:
            return [{"error": "BING_API_KEY not set"}]
        base = BING_ENDPOINT.rstrip("/") if BING_ENDPOINT else "https://api.bing.microsoft.com"
        url = f"{base}/v7.0/search"
        headers = {"Ocp-Apim-Subscription-Key": BING_API_KEY}
        params = {"q": query, "count": top_k}
        r = requests.get(url, headers=headers, params=params, timeout=15)
        r.raise_for_status()
        data = r.json()
        return [{"title": i.get("name"), "snippet": i.get("snippet"), "url": i.get("url")}
                for i in data.get("webPages", {}).get("value", [])[:top_k]]
    except Exception as e:
        return [{"error": str(e)}]

def serpapi_search(query, top_k=5):
    try:
        if not SERPAPI_KEY:
            return [{"error": "SERPAPI_KEY not set"}]
        r = requests.get("https://serpapi.com/search.json", params={"q": query, "api_key": SERPAPI_KEY, "num": top_k}, timeout=15)
        r.raise_for_status()
        data = r.json()
        return [{"title": i.get("title"), "snippet": i.get("snippet"), "url": i.get("link")} for i in data.get("organic_results", [])[:top_k]]
    except Exception as e:
        return [{"error": str(e)}]

def perform_search(queries):
    provider = "serpapi" if SERPAPI_KEY else "bing" if BING_API_KEY else None
    if not provider:
        return {"warning": "No search API key provided"}, []
    aggregated = []
    for q in queries[:3]:
        hits = serpapi_search(q) if provider=="serpapi" else bing_search(q)
        aggregated.append({"query": q, "hits": hits})
    return {"provider": provider}, aggregated

def generate_ai_insights(ocr_text, scene, search_results, face_attributes=None):
    insights = []
    try:
        if scene and isinstance(scene, list) and len(scene) > 0 and "label" in scene[0]:
            insights.append(f"Scene: {scene[0]['label']} ({scene[0].get('score',0):.2f})")
        if ocr_text:
            insights.append(f"OCR text: {ocr_text[:100]}...")
        if face_attributes:
            fa_desc = ", ".join(f"{k}: {v}" for k,v in face_attributes.items() if v)
            if fa_desc:
                insights.append(f"Face attributes: {fa_desc}")
        if search_results:
            insights.append(f"Found {sum(len(s.get('hits',[])) for s in search_results)} references")
    except Exception as e:
        insights.append("Partial AI insights available")
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
    notes = request.form.get("notes","").strip()
    image_bytes = file.read()

    geolocation = extract_gps(image_bytes) or {"info": "No GPS data"}
    embedding = call_embedding(image_bytes)
    scene = call_scene(image_bytes) or []
    ocr_raw = call_ocr(image_bytes) or ""
    face_data = call_face_embedding(image_bytes) or []
    face_attributes = extract_face_attributes(face_data)

    ocr_text = ""
    try:
        if isinstance(ocr_raw, dict) and "text" in ocr_raw:
            ocr_text = ocr_raw["text"]
        elif isinstance(ocr_raw, str):
            ocr_text = ocr_raw
        elif isinstance(ocr_raw, list):
            texts = [b.get("text",b) if isinstance(b,dict) else b for b in ocr_raw]
            ocr_text = "\n".join(texts)
    except:
        ocr_text = ""

    queries = build_queries(ocr_text, scene, notes, face_attributes)
    provider_info, search_results = perform_search(queries)
    ai_insights = generate_ai_insights(ocr_text, scene, search_results, face_attributes)
    geo_guesses = generate_geo_guesses(scene, ocr_text, face_attributes) if geolocation.get("info") else []

    case_id = str(uuid.uuid4())
    created_at = time.strftime("%Y-%m-%d %H:%M:%S")
    case_record = {
        "case_id": case_id,
        "created_at": created_at,
        "notes": notes or "",
        "embedding": embedding,
        "scene_inferences": scene,
        "ocr_text": ocr_text or "No OCR data",
        "face_data": face_data or [],
        "face_attributes": face_attributes or {},
        "geolocation": geolocation,
        "geo_guesses": geo_guesses or [],
        "queries": queries or [],
        "search_provider": provider_info,
        "search_results": search_results or [],
        "ai_insights": ai_insights or "No AI insights available",
        "osint": [hit for batch in search_results for hit in batch.get("hits",[])] if search_results else []
    }

    # Insert into database
    cur.execute("""
        INSERT INTO cases (case_id, created_at, notes, embedding, scene_inferences, ocr_text, face_data, face_attributes, geolocation, geo_guesses, queries, search_provider, search_results, ai_insights, osint)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """, (
        case_id,
        created_at,
        notes,
        json.dumps(embedding),
        json.dumps(scene),
        ocr_text,
        json.dumps(face_data),
        json.dumps(face_attributes),
        json.dumps(geolocation),
        json.dumps(geo_guesses),
        json.dumps(queries),
        json.dumps(provider_info),
        json.dumps(search_results),
        ai_insights,
        json.dumps([hit for batch in search_results for hit in batch.get("hits",[])] if search_results else [])
    ))

    print("Created case ID:", case_id)
    return jsonify(case_record)

@app.route("/analyze_face", methods=["POST"])
def analyze_face():
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400
    file = request.files["file"]
    image_bytes = file.read()
    face_data = call_face_embedding(image_bytes)
    face_attributes = extract_face_attributes(face_data)
    num_faces = len(face_data) if isinstance(face_data,list) else 0
    return jsonify({
        "faces_detected": num_faces,
        "face_data": face_data,
        "face_attributes": face_attributes
    })

@app.route("/cases/<case_id>", methods=["GET"])
def get_case(case_id):
    cur.execute("SELECT * FROM cases WHERE case_id=%s", (case_id,))
    row = cur.fetchone()
    if not row:
        return jsonify({"error": "Case not found"}), 404
    keys = ["case_id","created_at","notes","embedding","scene_inferences","ocr_text","face_data","face_attributes","geolocation","geo_guesses","queries","search_provider","search_results","ai_insights","osint"]
    case = {k: json.loads(v) if k not in ["case_id","created_at","ocr_text","ai_insights","notes"] and v else v for k,v in zip(keys,row)}
    return jsonify(case)

# ---------------- MAIN ----------------
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", 5000)), debug=True)
