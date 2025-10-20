from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image
import exifread, os, uuid, json, base64, requests
from datetime import datetime
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.exc import DataError
from io import BytesIO

# ---------------- APP INIT ----------------
app = Flask(__name__)
CORS(app)

# ---------------- DATABASE CONFIG ----------------
DATABASE_URL = os.getenv("DATABASE_URL")
if DATABASE_URL:
    app.config["SQLALCHEMY_DATABASE_URI"] = DATABASE_URL
else:
    BASE_DIR = os.path.abspath(os.path.dirname(__file__))
    db_path = os.path.join(BASE_DIR, 'geointel.db')
    app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///{db_path}"

app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
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
            "ai_insights": json.loads(self.ai_insights) if self.ai_insights else {},
            "timestamp": self.timestamp.isoformat()
        }

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

# ---------------- HELPERS ----------------
def image_to_base64(image_bytes):
    return base64.b64encode(image_bytes).decode("utf-8")

def call_hf_model(url, image_bytes, task_name):
    """Generic Hugging Face API call with better error handling"""
    if not HF_API_TOKEN or not url:
        return {"error": f"{task_name} model URL or HF_TOKEN missing"}
    try:
        payload = {"inputs": image_to_base64(image_bytes)}
        r = requests.post(url, headers=HEADERS, json=payload, timeout=45)
        if r.status_code != 200:
            return {"error": f"{task_name} model failed: {r.text}"}
        return r.json()
    except Exception as e:
        return {"error": f"{task_name} model exception: {str(e)}"}

def extract_gps(tags):
    """Extract GPS coordinates from EXIF tags"""
    try:
        if "GPS GPSLatitude" in tags and "GPS GPSLongitude" in tags:
            def dms_to_dd(dms, ref):
                d, m, s = [float(x.num) / float(x.den) for x in dms.values]
                dd = d + (m / 60.0) + (s / 3600.0)
                if ref in ["S", "W"]:
                    dd *= -1
                return dd
            lat = dms_to_dd(tags["GPS GPSLatitude"], str(tags.get("GPS GPSLatitudeRef", "N")))
            lon = dms_to_dd(tags["GPS GPSLongitude"], str(tags.get("GPS GPSLongitudeRef", "E")))
            return {"lat": lat, "lon": lon}
    except Exception:
        pass
    return {"info": "No GPS data"}

# ---------------- ROUTES ----------------
@app.route("/")
def home():
    return jsonify({"message": "GeoIntel Backend is live ✅"})

@app.route("/health")
def health():
    return jsonify({"status": "ok"})

@app.route("/favicon.ico")
def favicon():
    return "", 204

@app.route("/cases", methods=["GET"])
def list_cases():
    cases = Evidence.query.order_by(Evidence.timestamp.desc()).limit(10).all()
    if not cases:
        return jsonify({"message": "No cases found yet"}), 200
    return jsonify([c.to_dict() for c in cases])

@app.route("/cases/<case_id>", methods=["GET"])
def get_case(case_id):
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
            image_bytes = f.read()

        # Extract EXIF + GPS
        tags = exifread.process_file(BytesIO(image_bytes), details=False)
        gps_data = extract_gps(tags)
        exif_data = {k: str(v) for k, v in tags.items()}

        # ---------- AI MODEL ANALYSIS ----------
        scene_result = call_hf_model(SCENE_MODEL_URL, image_bytes, "Scene Detection")
        ocr_result = call_hf_model(OCR_MODEL_URL, image_bytes, "OCR Text Extraction")
        face_result = call_hf_model(FACE_MODEL_URL, image_bytes, "Face Recognition")
        embedding_result = call_hf_model(EMBEDDING_MODEL_URL, image_bytes, "Image Embedding")

        ai_summary = {
            "scene": scene_result,
            "ocr": ocr_result,
            "face": face_result,
            "embedding": embedding_result,
            "exif": exif_data,
            "gps": gps_data
        }

        case_id = str(uuid.uuid4())
        evidence = Evidence(
            case_id=case_id,
            filename=filename,
            notes=notes,
            geolocation=json.dumps(gps_data),
            ai_insights=json.dumps(ai_summary, indent=2)
        )
        db.session.add(evidence)
        db.session.commit()

        return jsonify({
            "message": "Evidence analyzed successfully ✅",
            "case_id": case_id,
            "filename": filename,
            "geolocation": gps_data,
            "ai_results": ai_summary
        }), 200

    except Exception as e:
        print("❌ Upload error:", e)
        return jsonify({"error": f"Analysis failed: {str(e)}"}), 500

# ---------------- RUN ----------------
if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=int(os.getenv("PORT", 5000)))
