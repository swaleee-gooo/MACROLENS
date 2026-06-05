from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from .config import Settings

JsonObject = dict[str, Any]


class VisionSignalsUnavailable(RuntimeError):
    """Raised when strict mode cannot produce real model-backed signals."""


@dataclass(frozen=True)
class WorkerOutput:
    provider: str
    body: JsonObject


def _post_json(url: str, payload: JsonObject, timeout_seconds: float, bearer_token: str | None) -> JsonObject:
    body = json.dumps(payload).encode("utf-8")
    headers = {"content-type": "application/json"}
    if bearer_token:
        headers["authorization"] = f"Bearer {bearer_token}"

    request = Request(url, data=body, headers=headers, method="POST")
    try:
        with urlopen(request, timeout=timeout_seconds) as response:
            return json.loads(response.read().decode("utf-8"))
    except HTTPError as error:
        raise VisionSignalsUnavailable(f"worker_http_{error.code}") from error
    except URLError as error:
        raise VisionSignalsUnavailable(f"worker_unreachable_{error.reason}") from error
    except TimeoutError as error:
        raise VisionSignalsUnavailable("worker_timeout") from error
    except json.JSONDecodeError as error:
        raise VisionSignalsUnavailable("worker_invalid_json") from error


def _list_or_empty(value: Any) -> list[Any]:
    return value if isinstance(value, list) else []


def _dict_or_none(value: Any) -> JsonObject | None:
    return value if isinstance(value, dict) else None


def _merge_outputs(outputs: list[WorkerOutput], warnings: list[str]) -> JsonObject:
    object_boxes: list[Any] = []
    masks: list[Any] = []
    depth_stats: JsonObject | None = None

    for output in outputs:
        object_boxes.extend(_list_or_empty(output.body.get("objectBoxes")))
        masks.extend(_list_or_empty(output.body.get("masks")))
        warnings.extend(str(item) for item in _list_or_empty(output.body.get("warnings")))
        if output.provider == "depth_anything":
            depth_stats = _dict_or_none(output.body.get("depthStats")) or {
                "provider": "depth-anything",
                "available": False,
                "confidence": 0,
                "failureMode": "worker_missing_depth_stats",
            }

    return {
        "objectBoxes": object_boxes,
        "masks": masks,
        "depthStats": depth_stats
        or {
            "provider": "none",
            "available": False,
            "confidence": 0,
            "failureMode": "depth_worker_not_configured",
        },
        "warnings": sorted(set(warnings)),
    }


def _test_fallback(image_url: str) -> JsonObject:
    return {
        "objectBoxes": [
            {
                "label": "test-food-region",
                "confidence": 0.01,
                "box": [0.15, 0.15, 0.7, 0.7],
            }
        ],
        "masks": [
            {
                "label": "test-mask",
                "confidence": 0.01,
                "areaFraction": 0.4,
            }
        ],
        "depthStats": {
            "provider": "test-fallback",
            "available": False,
            "confidence": 0,
            "failureMode": "test_fallback_not_real_depth",
        },
        "warnings": [
            "test_fallback_not_for_production",
            f"source_image:{image_url[:80]}",
        ],
    }


def build_vision_signals(
    image_url: str,
    settings: Settings,
    post_json=_post_json,
) -> JsonObject:
    provider_urls = settings.provider_urls()
    if not provider_urls:
        if settings.allow_test_fallback:
            return _test_fallback(image_url)
        raise VisionSignalsUnavailable("no_gpu_worker_endpoint_configured")

    outputs: list[WorkerOutput] = []
    warnings: list[str] = []
    for provider, endpoint_url in provider_urls.items():
        try:
            outputs.append(
                WorkerOutput(
                    provider=provider,
                    body=post_json(
                        endpoint_url,
                        {"imageUrl": image_url},
                        settings.request_timeout_seconds,
                        settings.worker_auth_token,
                    ),
                )
            )
        except VisionSignalsUnavailable as error:
            warnings.append(f"{provider}:{error}")

    if not outputs:
        raise VisionSignalsUnavailable("all_gpu_workers_failed")

    return _merge_outputs(outputs, warnings)

