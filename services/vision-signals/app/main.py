from __future__ import annotations

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from .config import Settings
from .inference import VisionSignalsUnavailable, build_vision_signals

app = FastAPI(title="MacroLens Vision Signals", version="1.0.0")


class SignalsRequest(BaseModel):
    image_url: str = Field(alias="imageUrl", min_length=1)


@app.get("/health")
def health() -> dict[str, object]:
    settings = Settings.from_env()
    failures = settings.readiness_failures()
    return {
        "status": "ready" if not failures else "degraded",
        "providers": sorted(settings.provider_urls().keys()),
        "allowTestFallback": settings.allow_test_fallback,
        "readinessFailures": failures,
    }


@app.post("/signals")
def signals(request: SignalsRequest) -> dict[str, object]:
    settings = Settings.from_env()
    try:
        return build_vision_signals(request.image_url, settings)
    except VisionSignalsUnavailable as error:
        raise HTTPException(status_code=503, detail=str(error)) from error

