from __future__ import annotations

from dataclasses import dataclass
from os import environ


def _env_bool(name: str, default: bool = False) -> bool:
    value = environ.get(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def _env_float(name: str, default: float) -> float:
    value = environ.get(name)
    if value is None:
        return default
    try:
        return float(value)
    except ValueError:
        return default


@dataclass(frozen=True)
class Settings:
    sam2_endpoint_url: str | None
    groundingdino_endpoint_url: str | None
    depth_anything_endpoint_url: str | None
    worker_auth_token: str | None
    allow_test_fallback: bool
    request_timeout_seconds: float

    @classmethod
    def from_env(cls) -> "Settings":
        return cls(
            sam2_endpoint_url=environ.get("SAM2_ENDPOINT_URL") or None,
            groundingdino_endpoint_url=environ.get("GROUNDINGDINO_ENDPOINT_URL") or None,
            depth_anything_endpoint_url=environ.get("DEPTH_ANYTHING_ENDPOINT_URL") or None,
            worker_auth_token=environ.get("WORKER_AUTH_TOKEN") or None,
            allow_test_fallback=_env_bool("VISION_SIGNALS_ALLOW_TEST_FALLBACK", False),
            request_timeout_seconds=_env_float("VISION_SIGNALS_REQUEST_TIMEOUT_SECONDS", 20.0),
        )

    def provider_urls(self) -> dict[str, str]:
        return {
            key: value
            for key, value in {
                "sam2": self.sam2_endpoint_url,
                "groundingdino": self.groundingdino_endpoint_url,
                "depth_anything": self.depth_anything_endpoint_url,
            }.items()
            if value
        }

    def readiness_failures(self) -> list[str]:
        failures: list[str] = []
        if not self.provider_urls() and not self.allow_test_fallback:
            failures.append("no_gpu_worker_endpoint_configured")
        return failures

