"""
Shared Configuration, Fixtures, and Helper Utilities for Oxford Redesign E2E Tests.
Targeting React 18 + Vite 6 English File Pre-Intermediate Workbook Redesign.
"""

import os
import json
import time
from typing import Dict, Any, Optional

# Base URL resolution
BASE_URL = os.environ.get("TEST_BASE_URL", "http://localhost:8000")
ALT_BASE_URL = os.environ.get("TEST_ALT_BASE_URL", "http://localhost:5173")

# Reference Data for Unit 1C Page 11 (Book Page 11 / page_12.jpg)
REFERENCE_DATA = {
    "unitId": "1C",
    "bookPage": 11,
    "pdfPage": 12,
    "title": "One dark October evening",
    "topic": "The Remake Project",
    "exercises": {
        "1C_ex4": {
            "id": "1C_ex4",
            "legacyId": "p12_1",
            "type": "multiple-choice",
            "title": "4 LISTENING Vermeer and The Milkmaid",
            "audioTrack": "1.28",
            "hotspot": {"x": 28.0, "y": 4.8},
            "audioHotspot": {"x": 6.5, "y": 36.8},
            "questions": [
                {"num": 1, "id": "p12_1", "correct": "b", "label": "17th"},
                {"num": 2, "id": "p12_2", "correct": "a", "label": "Holland"},
                {"num": 3, "id": "p12_3", "correct": "a", "label": "everyday scenes"},
                {"num": 4, "id": "p12_4", "correct": "c", "label": "a pudding"},
                {"num": 5, "id": "p12_5", "correct": "b", "label": "34"},
                {"num": 6, "id": "p12_6", "correct": "b", "label": "Because some of the paints were very expensive"}
            ]
        },
        "1C_ex5a": {
            "id": "1C_ex5a",
            "legacyId": "p12_7",
            "type": "gap-fill",
            "title": "5 VOCABULARY prepositions of place",
            "audioTrack": "1.29",
            "hotspot": {"x": 88.0, "y": 4.8},
            "audioHotspot": {"x": 54.0, "y": 38.0},
            "wordBank": [
                "above", "behind", "between", "in", "in front of", 
                "in the corner", "in the middle of", "next to", "on", 
                "on the left of", "under"
            ],
            "blanks": {
                "2": {"id": "p12_7", "accepted": ["in front of"], "hint": "Position in front of him"},
                "3": {"id": "p12_8", "accepted": ["On", "on"], "hint": "Surface preposition"},
                "4a": {"id": "p12_9", "accepted": ["in the middle of", "in the center of"], "hint": "Central position"},
                "4b": {"id": "p12_10", "accepted": ["between"], "hint": "In the middle of two items"},
                "5": {"id": "p12_11", "accepted": ["under", "underneath", "beneath"], "hint": "Below the bread"},
                "6": {"id": "p12_12", "accepted": ["Behind", "behind"], "hint": "At the back of the man"},
                "7": {"id": "p12_13", "accepted": ["on the left of", "on the left"], "hint": "Position on the left side"},
                "8": {"id": "p12_14", "accepted": ["In the corner", "in the corner"], "hint": "Corner of the room"},
                "9a": {"id": "p12_15", "accepted": ["on"], "hint": "On the wall"},
                "9b": {"id": "p12_16", "accepted": ["above", "over"], "hint": "Higher than the sink"},
                "10": {"id": "p12_17", "accepted": ["next to", "beside"], "hint": "Beside the window"}
            }
        }
    }
}

# Standard Storage Key
OXFORD_STORAGE_KEY = "oxford_activity_progress_v1"
LEGACY_STORAGE_KEY = "digital_textbook_answers_v2"

# Viewports
VIEWPORTS = {
    "desktop": {"width": 1280, "height": 800},
    "tablet": {"width": 768, "height": 1024},
    "mobile": {"width": 375, "height": 667}
}

class TestContext:
    """Helper context wrapper providing assertions and browser helpers."""
    def __init__(self, page=None, offline_mode=False):
        self.page = page
        self.offline_mode = offline_mode
        self.assertion_count = 0
        self.passed_tests = []
        self.failed_tests = []

    def check(self, condition: bool, description: str, details: str = ""):
        """Record an assertion check with clear diagnostic logging."""
        self.assertion_count += 1
        if condition:
            self.passed_tests.append(description)
            print(f"    [PASS] {description}")
        else:
            msg = f"{description} | Details: {details}"
            self.failed_tests.append(msg)
            print(f"    [FAIL] {msg}")
            raise AssertionError(msg)

    def navigate_to_page(self, page_num: int):
        """Navigate to specified page using URL hash."""
        if self.page:
            self.page.goto(f"{BASE_URL}/#page={page_num}", wait_until="domcontentloaded")
            time.sleep(0.3)

    def get_storage_data(self, key: str = OXFORD_STORAGE_KEY) -> Dict[str, Any]:
        """Read parsed JSON data from localStorage."""
        if not self.page:
            return {}
        raw = self.page.evaluate(f"localStorage.getItem('{key}')")
        if raw:
            try:
                return json.loads(raw)
            except Exception:
                return {}
        return {}

    def set_storage_data(self, data: Dict[str, Any], key: str = OXFORD_STORAGE_KEY):
        """Write JSON data into localStorage."""
        if not self.page:
            return
        serialized = json.dumps(data)
        self.page.evaluate(f"localStorage.setItem('{key}', '{serialized}')")

    def clear_storage(self):
        """Clear all textbook localStorage."""
        if self.page:
            self.page.evaluate(f"localStorage.removeItem('{OXFORD_STORAGE_KEY}')")
            self.page.evaluate(f"localStorage.removeItem('{LEGACY_STORAGE_KEY}')")
