from __future__ import annotations

import unittest
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from app.config import Settings
from app.inference import VisionSignalsUnavailable, build_vision_signals


class VisionSignalsInferenceTest(unittest.TestCase):
    def test_strict_mode_requires_real_worker(self) -> None:
        settings = Settings(
            sam2_endpoint_url=None,
            groundingdino_endpoint_url=None,
            depth_anything_endpoint_url=None,
            worker_auth_token=None,
            allow_test_fallback=False,
            request_timeout_seconds=1,
        )

        with self.assertRaisesRegex(VisionSignalsUnavailable, "no_gpu_worker_endpoint_configured"):
            build_vision_signals("https://cdn.example/meal.jpg", settings)

    def test_test_fallback_is_explicitly_labeled_not_real(self) -> None:
        settings = Settings(
            sam2_endpoint_url=None,
            groundingdino_endpoint_url=None,
            depth_anything_endpoint_url=None,
            worker_auth_token=None,
            allow_test_fallback=True,
            request_timeout_seconds=1,
        )

        result = build_vision_signals("https://cdn.example/meal.jpg", settings)

        self.assertEqual(result["depthStats"]["provider"], "test-fallback")
        self.assertFalse(result["depthStats"]["available"])
        self.assertIn("test_fallback_not_for_production", result["warnings"])

    def test_merges_configured_worker_outputs(self) -> None:
        settings = Settings(
            sam2_endpoint_url="https://sam2.example/predict",
            groundingdino_endpoint_url="https://grounding.example/predict",
            depth_anything_endpoint_url="https://depth.example/predict",
            worker_auth_token="token",
            allow_test_fallback=False,
            request_timeout_seconds=1,
        )
        calls: list[str] = []

        def fake_post_json(url: str, payload: dict[str, object], timeout_seconds: float, bearer_token: str | None) -> dict[str, object]:
            calls.append(url)
            self.assertEqual(payload, {"imageUrl": "https://cdn.example/meal.jpg"})
            self.assertEqual(bearer_token, "token")
            if "sam2" in url:
                return {"masks": [{"label": "rice", "confidence": 0.8, "areaFraction": 0.32}]}
            if "grounding" in url:
                return {"objectBoxes": [{"label": "rice", "confidence": 0.83, "box": [0.1, 0.2, 0.3, 0.4]}]}
            return {"depthStats": {"provider": "depth-anything", "available": True, "confidence": 0.75, "relativeDepthP50": 0.44}}

        result = build_vision_signals("https://cdn.example/meal.jpg", settings, post_json=fake_post_json)

        self.assertEqual(calls, ["https://sam2.example/predict", "https://grounding.example/predict", "https://depth.example/predict"])
        self.assertEqual(result["masks"][0]["label"], "rice")
        self.assertEqual(result["objectBoxes"][0]["label"], "rice")
        self.assertTrue(result["depthStats"]["available"])
        self.assertEqual(result["warnings"], [])


if __name__ == "__main__":
    unittest.main()
