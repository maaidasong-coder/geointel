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
    case_id = db.Column(db.String(64), unique=True, default=lambda: str(uuid.uuid4()))
    filename = db.Column(db.String(255))
    notes = db.Column(db.Text)
    geolocation = db.Column(db.Text)
    ai_insights = db.Column(db.Text)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "case_id": self.case_id,
            "filename": self.filename,
            "notes": self.notes,
            "geolocation": self.geolocation,
            "ai_insights": self.ai_insights,
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

# ---------------- ROUTES ----------------
@app.route("/")
def home():
    return jsonify({"message": "GeoIntel Backend is live ✅"})

@app.route("/health")
def health():
    return jsonify({"status": "ok"})

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
        case = Evidence.query.filter_by(case_id=case_id).first()
        if not case:
            return jsonify({"error": "Case not found"}), 404
        return jsonify(case.to_dict())

# ---------------- UPLOAD ENDPOINT ----------------
@app.route("/api/upload", methods=["POST"])
def upload_evidence():
    try:
        file = request.files.get("file")
        notes = request.form.get("notes", "")
        if not file:
            return jsonify({"error": "No file uploaded"}), 400

        uploads_dir = "uploads"
        os.makedirs(uploads_dir, exist_ok=True)
        filename = f"{uuid.uuid4().hex}_{file.filename}"
        filepath = os.path.join(uploads_dir, filename)
        file.save(filepath)

        with open(filepath, "rb") as f:
            tags = exifread.process_file(f, details=False)

        gps_lat, gps_lon = None, None
        if "GPS GPSLatitude" in tags and "GPS GPSLongitude" in tags:
            def dms_to_dd(dms, ref):
                d, m, s = [float(x.num) / float(x.den) for x in dms.values]
                dd = d + (m / 60.0) + (s / 3600.0)
                if ref in ["S", "W"]:
                    dd *= -1
                return dd
            gps_lat = dms_to_dd(tags["GPS GPSLatitude"], str(tags.get("GPS GPSLatitudeRef", "N")))
            gps_lon = dms_to_dd(tags["GPS GPSLongitude"], str(tags.get("GPS GPSLongitudeRef", "E")))

        case_id = str(uuid.uuid4())
        created_at = datetime.utcnow()
        geolocation = json.dumps({"lat": gps_lat, "lon": gps_lon})
        exif_data = json.dumps({k: str(v) for k, v in tags.items()})

        if cur:
            cur.execute("""
                INSERT INTO cases (case_id, created_at, notes, geolocation, ai_insights, ocr_text, face_attributes)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, (case_id, created_at, notes, geolocation, exif_data, None, None))
            conn.commit()
        else:
            evidence = Evidence(
                case_id=case_id,
                filename=filename,
                notes=notes,
                geolocation=geolocation,
                ai_insights=exif_data
            )
            db.session.add(evidence)
            db.session.commit()

        return jsonify({
            "message": "Evidence uploaded successfully",
            "case_id": case_id,
            "filename": filename,
            "geolocation": {"lat": gps_lat, "lon": gps_lon},
            "exif_tags": {k: str(v) for k, v in tags.items()}
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ---------------- RUN ----------------
with app.app_context():
    db.create_all()

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=int(os.getenv("PORT", 5000)))
