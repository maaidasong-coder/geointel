
from flask import Flask, request, jsonify
from flask_cors import CORS
import requests, base64, os, uuid
from PIL import Image
import exifread
from io import BytesIO
from datetime import datetime
from flask_sqlalchemy import SQLAlchemy
import json
import psycopg

# ---------------- APP INIT ----------------
app = Flask(__name__)
CORS(app)

# ---------------- DATABASE CONFIG ----------------
DATABASE_URL = os.getenv("DATABASE_URL")

# If DATABASE_URL is not set (local dev), fallback to SQLite
if DATABASE_URL:
    app.config["SQLALCHEMY_DATABASE_URI"] = DATABASE_URL
else:
    BASE_DIR = os.path.abspath(os.path.dirname(__file__))
    db_path = os.path.join(BASE_DIR, 'geointel.db')
    app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///{db_path}"

app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

# Initialize DB once
db = SQLAlchemy(app)

# ---------------- DATABASE MODEL ----------------
class Evidence(db.Model):
    __tablename__ = "evidence"
    id = db.Column(db.Integer, primary_key=True)
    filename = db.Column(db.String(255))
    notes = db.Column(db.Text)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "filename": self.filename,
            "notes": self.notes,
            "timestamp": self.timestamp.isoformat()
        }

# ---------------- CONNECTION TEST ----------------
try:
    if DATABASE_URL:
        with psycopg.connect(DATABASE_URL) as conn:
            print("✅ Database connected successfully")
    else:
        print("⚠️ Using SQLite fallback (no DATABASE_URL found)")
except Exception as e:
    print("❌ Database connection failed:", e)

# ---------------- CREATE TABLES ----------------
with app.app_context():
    db.create_all()
    print("📦 Tables created (if not exist)")

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
DB_URL = os.getenv("DATABASE_URL")
conn = None
cur = None

try:
    if DB_URL:
        conn = psycopg.connect(DB_URL)
        conn.autocommit = True
        cur = conn.cursor()
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
        print("✅ Database connected and table ready.")
    else:
        print("⚠️ DATABASE_URL not set. Using SQLite fallback.")
except Exception as e:
    print(f"❌ Database connection failed: {e}")


# ---------------- HELPERS ----------------
def image_to_base64(image_bytes):
    return base64.b64encode(image_bytes).decode("utf-8")


def call_hf_model(url, image_bytes):
    if not HF_API_TOKEN or not url:
        return {"error": "HF_TOKEN or model URL not set"}
    try:
        data = {"inputs": image_to_base64(image_bytes)}
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
            "age": first_face.get("age", "unknown"),
            "gender": first_face.get("gender", "unknown"),
            "ethnicity": first_face.get("ethnicity", "unknown")
        }
    return {}


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
        pass
    return {"info": "No GPS data"}


def generate_geo_guesses(scene=None, ocr_text=None, face_attributes=None):
    guesses = []
    if scene and isinstance(scene, list):
        for s in scene[:3]:
            if isinstance(s, dict) and "label" in s:
                guesses.append(f"Possible location related to: {s['label']}")
    if ocr_text and ocr_text != "N/A":
        for line in ocr_text.splitlines()[:3]:
            guesses.append(f"Text hint: {line.strip()}")
    if face_attributes:
        desc = ", ".join(f"{k}:{v}" for k, v in face_attributes.items() if v)
        if desc:
            guesses.append(f"Demographic hint: {desc}")
    if not guesses:
        guesses = ["No explicit geo hints available"]
    return guesses[:5]


def build_queries(ocr_text, scene_labels, notes, face_attributes=None):
    queries = [notes] if notes else []
    if ocr_text and ocr_text != "N/A":
        lines = [l.strip() for l in ocr_text.splitlines() if l.strip()]
        if lines:
            queries.append(" ".join(lines[:5]))
        queries += lines[:3]
    if isinstance(scene_labels, list):
        queries += [str(lbl.get('label', lbl)) if isinstance(lbl, dict) else str(lbl) for lbl in scene_labels[:5]]
    elif isinstance(scene_labels, dict) and "label" in scene_labels:
        queries.append(scene_labels["label"])
    if face_attributes:
        desc = "Person detected"
        for k in ["age", "gender", "ethnicity"]:
            if k in face_attributes:
                desc += f", {k} ~{face_attributes[k]}"
        queries.append(desc)
    if not queries:
        queries = ["image forensic analysis", "possible identification from image"]
    return list(dict.fromkeys(queries))[:10]


# ---------------- SEARCH ----------------
def bing_search(query, top_k=5):
    try:
        if not BING_API_KEY:
            return []
        base = BING_ENDPOINT.rstrip("/") if BING_ENDPOINT else "https://api.bing.microsoft.com"
        url = f"{base}/v7.0/search"
        headers = {"Ocp-Apim-Subscription-Key": BING_API_KEY}
        params = {"q": query, "count": top_k}
        r = requests.get(url, headers=headers, params=params, timeout=15)
        r.raise_for_status()
        data = r.json()
        return [{"title": i.get("name"), "snippet": i.get("snippet"), "url": i.get("url")} for i in data.get("webPages", {}).get("value", [])[:top_k]]
    except:
        return []


def serpapi_search(query, top_k=5):
    try:
        if not SERPAPI_KEY:
            return []
        r = requests.get("https://serpapi.com/search.json", params={"q": query, "api_key": SERPAPI_KEY, "num": top_k}, timeout=15)
        r.raise_for_status()
        data = r.json()
        return [{"title": i.get("title"), "snippet": i.get("snippet"), "url": i.get("link")} for i in data.get("organic_results", [])[:top_k]]
    except:
        return []


def perform_search(queries):
    provider = "serpapi" if SERPAPI_KEY else "bing" if BING_API_KEY else None
    if not provider:
        return {"provider": "none"}, []
    aggregated = []
    for q in queries[:3]:
        hits = serpapi_search(q) if provider == "serpapi" else bing_search(q)
        aggregated.append({"query": q, "hits": hits})
    return {"provider": provider}, aggregated


# ---------------- AI INSIGHTS ----------------
def generate_ai_insights(ocr_text, scene, search_results, face_attributes=None):
    insights = []
    if scene and isinstance(scene, list) and len(scene) > 0 and isinstance(scene[0], dict) and "label" in scene[0]:
        insights.append(f"Scene: {scene[0]['label']}")
    if ocr_text and ocr_text != "N/A":
        insights.append(f"OCR text: {ocr_text[:100]}...")
    if face_attributes:
        fa_desc = ", ".join(f"{k}: {v}" for k, v in face_attributes.items() if v)
        if fa_desc:
            insights.append(f"Face attributes: {fa_desc}")
    if search_results:
        insights.append(f"Found {sum(len(s.get('hits', [])) for s in search_results)} search references")
    return " ".join(insights) if insights else "No AI insights available."


# ---------------- ROUTES ----------------
@app.route("/")
def home():
    return jsonify({"message": "GeoIntel Backend is live ✅"})


@app.route("/health")
def health():
    return jsonify({"status": "ok"})


@app.route("/analyze", methods=["POST"])
def analyze():
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400
    file = request.files["file"]
    notes = request.form.get("notes", "").strip()
    image_bytes = file.read()

    geolocation = extract_gps(image_bytes)
    embedding = call_embedding(image_bytes)
    scene = call_scene(image_bytes)
    ocr_raw = call_ocr(image_bytes)
    face_data = call_face_embedding(image_bytes)
    face_attributes = extract_face_attributes(face_data)

    ocr_text = "N/A"
    if isinstance(ocr_raw, dict) and "text" in ocr_raw:
        ocr_text = ocr_raw["text"]
    elif isinstance(ocr_raw, str):
        ocr_text = ocr_raw
    elif isinstance(ocr_raw, list):
        texts = [b.get("text", b) if isinstance(b, dict) else b for b in ocr_raw]
        ocr_text = "\n".join(texts)

    queries = build_queries(ocr_text, scene, notes, face_attributes)
    geo_guesses = generate_geo_guesses(scene, ocr_text, face_attributes)
    search_provider, search_results = perform_search(queries)
    ai_insights = generate_ai_insights(ocr_text, scene, search_results, face_attributes)

    case_id = str(uuid.uuid4())

    try:
        if cur:
            cur.execute("""
                INSERT INTO cases (case_id, created_at, notes, embedding, scene_inferences, ocr_text,
                face_data, face_attributes, geolocation, geo_guesses, queries, search_provider,
                search_results, ai_insights)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                case_id, datetime.utcnow(), notes or "N/A", json.dumps(embedding), json.dumps(scene),
                ocr_text, json.dumps(face_data), json.dumps(face_attributes), json.dumps(geolocation),
                json.dumps(geo_guesses), json.dumps(queries), json.dumps(search_provider),
                json.dumps(search_results), ai_insights
            ))
        else:
            new_evidence = Evidence(filename=file.filename, notes=notes)
            db.session.add(new_evidence)
            db.session.commit()
            print("🟢 Saved locally to SQLite.")
    except Exception as e:
        print(f"❌ Database save failed: {e}")

    return jsonify({
        "case_id": case_id,
        "ai_insights": ai_insights,
        "queries": queries,
        "geolocation": geolocation,
        "geo_guesses": geo_guesses
    })


@app.route("/cases", methods=["GET"])
def list_cases():
    if cur:
        cur.execute("SELECT case_id, created_at, notes, ai_insights FROM cases ORDER BY created_at DESC LIMIT 10")
        rows = cur.fetchall()
        if not rows:
            return jsonify({"message": "No cases found yet"}), 200
        return jsonify([{"case_id": r[0], "created_at": r[1], "notes": r[2], "ai_insights": r[3]} for r in rows])
    else:
        cases = Evidence.query.order_by(Evidence.timestamp.desc()).limit(10).all()
        return jsonify([c.to_dict() for c in cases])


@app.route("/cases/<case_id>", methods=["GET"])
def get_case(case_id):
    if cur:
        cur.execute("SELECT * FROM cases WHERE case_id=%s", (case_id,))
        row = cur.fetchone()
        if not row:
            return jsonify({"error": "Case not found"}), 404
        columns = [desc[0] for desc in cur.description]
        return jsonify(dict(zip(columns, row)))
    else:
        case = Evidence.query.get(case_id)
        if not case:
            return jsonify({"error": "Case not found"}), 404
        return jsonify(case.to_dict())


@app.route("/test-data", methods=["GET"])
def test_data():
    if cur:
        cur.execute("SELECT case_id, notes, geolocation, ocr_text, face_attributes, queries FROM cases ORDER BY created_at DESC LIMIT 1")
        row = cur.fetchone()
        if not row:
            return jsonify({"message": "No data in DB yet"}), 200
        columns = [desc[0] for desc in cur.description]
        return jsonify(dict(zip(columns, row)))
    else:
        case = Evidence.query.order_by(Evidence.timestamp.desc()).first()
        if not case:
            return jsonify({"message": "No data in DB yet"}), 200
        return jsonify(case.to_dict())


@app.route("/debug-cases", methods=["GET"])
def debug_cases():
    try:
        if cur:
            cur.execute("SELECT case_id, created_at, notes FROM cases LIMIT 5;")
            rows = cur.fetchall()
            return jsonify({"rows": rows}), 200
        else:
            cases = Evidence.query.limit(5).all()
            return jsonify({"rows": [c.to_dict() for c in cases]}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ---------------- RUN ----------------
with app.app_context():
    db.create_all()

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=int(os.getenv("PORT", 5000)))
