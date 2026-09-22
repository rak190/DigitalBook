"""
Sync Data Model:
Extracts all overlays from database.DEFAULT_PAGE_OVERLAYS and updates:
- data/exercises.json
- data/answer-key.json
- digital_textbook.db (seeds default overlays without erasing user data)
"""

import os
import json
import sqlite3
import database

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
os.makedirs(DATA_DIR, exist_ok=True)

def sync_all():
    # 1. Initialize and seed DB
    database.init_db()
    database.refresh_default_overlays(force=True, reset_user_answers=False)
    
    # 2. Extract structured exercises and answer keys
    all_exercises = []
    answer_keys = {}

    for page_num in sorted(database.DEFAULT_PAGE_OVERLAYS.keys()):
        overlays = database.DEFAULT_PAGE_OVERLAYS[page_num]
        book_page = max(1, page_num - 1)
        
        for idx, ov in enumerate(overlays, 1):
            ex_id = f"p{page_num}_{idx}"
            
            if isinstance(ov, dict):
                field_type = ov.get("field_type", "text")
                x = float(ov.get("x", 10.0))
                y = float(ov.get("y", 10.0))
                width = float(ov.get("width", 15.0))
                height = float(ov.get("height", 2.0))
                placeholder = ov.get("placeholder", "")
                label = ov.get("label", f"Q{idx}")
                correct_answers = ov.get("correct_answers", [])
                hint = ov.get("hint", "")
                explanation = ov.get("explanation", "")
                unit_ref = ov.get("unit_ref", f"Page {page_num}")
                options = ov.get("options", [])
                grading_type = ov.get("grading_type", "exact")
                sample_answer = ov.get("sample_answer", "")
                audio_track = ov.get("audio_track", "")
            else:
                field_type = ov[1]
                x = float(ov[2])
                y = float(ov[3])
                width = float(ov[4])
                height = float(ov[5])
                placeholder = ov[6]
                label = ov[7]
                correct_answers = json.loads(ov[8]) if isinstance(ov[8], str) else ov[8]
                hint = ov[9]
                explanation = ov[10]
                unit_ref = ov[11]
                options = json.loads(ov[12]) if len(ov) > 12 and isinstance(ov[12], str) else (ov[12] if len(ov) > 12 else [])
                grading_type = ov[13] if len(ov) > 13 else "exact"
                sample_answer = ov[14] if len(ov) > 14 else ""
                audio_track = ov[15] if len(ov) > 15 else ""

            ex_obj = {
                "id": ex_id,
                "pageNum": page_num,
                "bookPage": book_page,
                "label": label,
                "fieldType": field_type,
                "x": round(x, 1),
                "y": round(y, 1),
                "width": round(width, 1),
                "height": round(height, 1),
                "placeholder": placeholder,
                "hint": hint,
                "explanation": explanation,
                "unitRef": unit_ref,
                "gradingType": grading_type,
                "acceptedAnswers": correct_answers,
                "options": options,
                "sampleAnswer": sample_answer,
                "audioTrack": audio_track
            }
            all_exercises.append(ex_obj)

            answer_keys[ex_id] = {
                "exerciseId": ex_id,
                "label": label,
                "pageNum": page_num,
                "acceptedAnswers": correct_answers,
                "caseSensitive": False,
                "trimWhitespace": True,
                "ignorePunctuation": True,
                "grading": grading_type,
                "hint": hint,
                "explanation": explanation,
                "source": unit_ref
            }

    # Write exercises.json
    ex_path = os.path.join(DATA_DIR, "exercises.json")
    with open(ex_path, "w", encoding="utf-8") as f:
        json.dump(all_exercises, f, indent=2, ensure_ascii=False)
    print(f"Updated exercises.json: {len(all_exercises)} exercises across {len(database.DEFAULT_PAGE_OVERLAYS)} pages.")

    # Write answer-key.json
    ak_path = os.path.join(DATA_DIR, "answer-key.json")
    with open(ak_path, "w", encoding="utf-8") as f:
        json.dump(answer_keys, f, indent=2, ensure_ascii=False)
    print(f"Updated answer-key.json: {len(answer_keys)} answer keys.")

if __name__ == '__main__':
    sync_all()
