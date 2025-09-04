from fastapi import FastAPI

app = FastAPI(title="GeoIntel API", version="0.1")

@app.get("/")
def read_root():
    return {"message": "🚀 GeoIntel backend is running!"}

@app.get("/health")
def health_check():
    return {"status": "ok"}
