"""
CardioSense AI Backend Application Entrypoint.
FastAPI application configuring CORS, health check, API routes, and logging.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

from backend.api.routes import router
from backend.api.stream import stream_router

app = FastAPI(
    title="CardioSense AI — Cardiac Arrhythmia Monitoring API",
    description="Proof of Concept screening platform for leadless cardiac rhythm analysis and signal quality intelligence.",
    version="2.4.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

# Enable CORS for local Vite development and deployment
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)
app.include_router(stream_router)


@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "CardioSense AI API",
        "version": "2.4.0",
        "mode": "SCREENING_POC"
    }


# Mount frontend dist and serve Single-Page Application (SPA) if built
dist_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend", "dist")
if os.path.exists(dist_dir):
    assets_dir = os.path.join(dist_dir, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        target_file = os.path.join(dist_dir, full_path)
        if full_path and os.path.isfile(target_file):
            return FileResponse(target_file)
        return FileResponse(os.path.join(dist_dir, "index.html"))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)

