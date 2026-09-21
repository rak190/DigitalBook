"""
Integration and Unit Test Suite for Digital Textbook Server & APIs
"""

import unittest
import threading
import time
import requests
import os
import json
import socketserver
import server
import database

PORT = 8899

class DigitalTextbookServerTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        database.init_db()
        # Start server in background thread on custom test port
        cls.httpd = socketserver.ThreadingTCPServer(("", PORT), server.DigitalTextbookHandler)
        cls.thread = threading.Thread(target=cls.httpd.serve_forever, daemon=True)
        cls.thread.start()
        time.sleep(0.5)
        cls.base_url = f"http://127.0.0.1:{PORT}"

    @classmethod
    def tearDownClass(cls):
        cls.httpd.shutdown()
        cls.httpd.server_close()

    def test_01_index_html(self):
        res = requests.get(f"{self.base_url}/")
        self.assertEqual(res.status_code, 200)
        self.assertIn("English File Pre-Intermediate", res.text)
        self.assertIn("viewport-container", res.text)

    def test_02_static_assets(self):
        for path in ["/css/style.css", "/js/app.js", "/js/viewer.js", "/js/annotations.js", "/js/exercises.js", "/js/audio.js", "/js/vocabulary.js", "/js/notes.js"]:
            res = requests.get(f"{self.base_url}{path}")
            self.assertEqual(res.status_code, 200, f"Failed loading static asset: {path}")

    def test_03_book_info_and_toc(self):
        res = requests.get(f"{self.base_url}/api/book-info")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["totalPages"], 169)
        self.assertTrue(len(data["toc"]) > 20)
        u1a = next(item for item in data["toc"] if item.get("id") == "u1a")
        self.assertEqual(u1a["page"], 7)
        self.assertEqual(u1a["bookPage"], 6)

    def test_04_page_image_and_thumbnail(self):
        # Test Page 7 (Unit 1A)
        res_page = requests.get(f"{self.base_url}/api/pages/7")
        self.assertEqual(res_page.status_code, 200)
        self.assertEqual(res_page.headers.get("Content-Type"), "image/jpeg")
        self.assertTrue(len(res_page.content) > 100000)

        # Test Thumbnail 7
        res_thumb = requests.get(f"{self.base_url}/api/thumbnails/7")
        self.assertEqual(res_thumb.status_code, 200)
        self.assertEqual(res_thumb.headers.get("Content-Type"), "image/jpeg")
        self.assertTrue(len(res_thumb.content) > 1000)

    def test_05_overlays_and_answers_validation(self):
        # Check overlays on Page 7
        res = requests.get(f"{self.base_url}/api/overlays/7")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        overlays = data["overlays"]
        self.assertTrue(len(overlays) >= 16) # Unit 1A Ex 1a has 16 blanks

        # Find Q3 overlay (Where do you [live]?)
        q3 = next(ov for ov in overlays if ov["label"] == "Q3")
        q3_id = str(q3["id"])

        # Check answering Q3 correctly
        answers_payload = {
            "answers": {
                q3_id: "live"
            }
        }
        check_res = requests.post(f"{self.base_url}/api/check-answers/7", json=answers_payload)
        self.assertEqual(check_res.status_code, 200)
        check_data = check_res.json()
        self.assertTrue(check_data["results"][q3_id]["is_correct"])

        # Check answering Q3 incorrectly
        bad_answers = {
            "answers": {
                q3_id: "wrong_word"
            }
        }
        bad_check = requests.post(f"{self.base_url}/api/check-answers/7", json=bad_answers)
        self.assertFalse(bad_check.json()["results"][q3_id]["is_correct"])

    def test_06_add_custom_blank(self):
        custom_payload = {
            "page_num": 10,
            "x": 25.5,
            "y": 40.0,
            "width": 12.0,
            "height": 2.5,
            "placeholder": "Test answer",
            "label": "Custom Blank Test",
            "correct_answers": ["wearing", "dressed"],
            "hint": "What is he wearing?",
            "explanation": "Present continuous"
        }
        res = requests.post(f"{self.base_url}/api/overlays", json=custom_payload)
        self.assertEqual(res.status_code, 200)
        res_data = res.json()
        self.assertEqual(res_data["status"], "success")
        blank_id = res_data["id"]

        # Verify it now appears on page 10
        p10_res = requests.get(f"{self.base_url}/api/overlays/10")
        p10_overlays = p10_res.json()["overlays"]
        created = next((ov for ov in p10_overlays if ov["id"] == blank_id), None)
        self.assertIsNotNone(created)
        self.assertEqual(created["label"], "Custom Blank Test")

        # Clean up
        del_res = requests.delete(f"{self.base_url}/api/overlays/{blank_id}")
        self.assertEqual(del_res.status_code, 200)

    def test_07_annotations_persistence(self):
        test_page = 99
        payload = {
            "strokes": [
                {"tool": "pen", "color": "#ef4444", "width": 4, "points": [{"x": 10, "y": 20}, {"x": 15, "y": 25}]}
            ],
            "text_boxes": [
                {"id": "box_test", "x": 30, "y": 40, "text": "My study note", "color": "#0284c7"}
            ],
            "sticky_notes": [
                {"id": "sticky_test", "x": 50, "y": 60, "text": "Remember irregular verbs", "collapsed": False}
            ]
        }
        save_res = requests.post(f"{self.base_url}/api/annotations/{test_page}", json=payload)
        self.assertEqual(save_res.status_code, 200)

        # Retrieve
        get_res = requests.get(f"{self.base_url}/api/annotations/{test_page}")
        self.assertEqual(get_res.status_code, 200)
        data = get_res.json()
        self.assertEqual(len(data["strokes"]), 1)
        self.assertEqual(len(data["text_boxes"]), 1)
        self.assertEqual(data["text_boxes"][0]["text"], "My study note")

        # Delete / clear
        del_res = requests.delete(f"{self.base_url}/api/annotations/{test_page}")
        self.assertEqual(del_res.status_code, 200)
        get_empty = requests.get(f"{self.base_url}/api/annotations/{test_page}").json()
        self.assertEqual(len(get_empty["strokes"]), 0)

    def test_08_vocabulary_api(self):
        # Get list
        res = requests.get(f"{self.base_url}/api/vocabulary")
        self.assertEqual(res.status_code, 200)
        vocab = res.json()
        self.assertTrue(len(vocab) >= 20)

        # Add new word
        new_word = {
            "word": "gorgeous",
            "pos": "adjective",
            "definition": "Very attractive or pleasant",
            "example": "She looked gorgeous in that dress.",
            "category": "Appearance",
            "page_num": 8
        }
        add_res = requests.post(f"{self.base_url}/api/vocabulary", json=new_word)
        self.assertEqual(add_res.status_code, 200)

        # Search for it
        search_res = requests.get(f"{self.base_url}/api/vocabulary?search=gorgeous")
        found = search_res.json()
        self.assertEqual(len(found), 1)
        self.assertEqual(found[0]["word"], "gorgeous")

        # Toggle learned
        v_id = found[0]["id"]
        toggle_res = requests.post(f"{self.base_url}/api/vocabulary/{v_id}/toggle")
        self.assertEqual(toggle_res.status_code, 200)
        self.assertEqual(toggle_res.json()["learned"], 1)

        # Clean up
        requests.delete(f"{self.base_url}/api/vocabulary/{v_id}")

    def test_09_notes_and_bookmarks(self):
        # Add note
        note_res = requests.post(f"{self.base_url}/api/notes", json={"page_num": 7, "title": "Grammar Tips", "content": "Notice word order: ASI"})
        self.assertEqual(note_res.status_code, 200)
        note_id = note_res.json()["id"]

        notes = requests.get(f"{self.base_url}/api/notes").json()
        self.assertTrue(any(n["id"] == note_id for n in notes))

        # Add bookmark
        bm_res = requests.post(f"{self.base_url}/api/bookmarks", json={"page_num": 7, "title": "Unit 1A Bookmark"})
        self.assertEqual(bm_res.status_code, 200)

        bookmarks = requests.get(f"{self.base_url}/api/bookmarks").json()
        self.assertTrue(any(b["page_num"] == 7 for b in bookmarks))

        # Clean up
        requests.delete(f"{self.base_url}/api/notes/{note_id}")
        requests.delete(f"{self.base_url}/api/bookmarks/7")

    def test_10_export(self):
        res = requests.get(f"{self.base_url}/api/export")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("vocabulary", data)
        self.assertIn("annotations", data)

    def test_11_audio_status_upload_and_streaming(self):
        # 1. Audio status
        status_res = requests.get(f"{self.base_url}/api/audio/status")
        self.assertEqual(status_res.status_code, 200)
        status_data = status_res.json()
        self.assertEqual(status_data["status"], "success")
        self.assertIn("1.2", status_data["known_tracks"])

        # 2. Upload sample MP3 file with un-normalized name (EF4_1.2.mp3)
        sample_audio_content = b"ID3\x03\x00\x00\x00\x00\x00#TSSE\x00\x00\x00\x0f\x00\x00\x01\xff\xfeL\x00a\x00v\x00f\x005\x008\x00.\x007\x006\x00" + b"\x00" * 1024
        files = {
            "file": ("EF4_1.2.mp3", sample_audio_content, "audio/mpeg")
        }
        upload_res = requests.post(f"{self.base_url}/api/audio/upload", files=files)
        self.assertEqual(upload_res.status_code, 200)
        upload_data = upload_res.json()
        self.assertEqual(upload_data["status"], "success")
        self.assertEqual(upload_data["uploaded"][0]["track_id"], "1.2")
        self.assertEqual(upload_data["uploaded"][0]["filename"], "1.2.mp3")

        # Also test alternative format like 1_03.mp3 (Unit 1, Track 3)
        files_alt = {
            "file": ("1_03.mp3", sample_audio_content, "audio/mpeg")
        }
        upload_alt = requests.post(f"{self.base_url}/api/audio/upload", files=files_alt).json()
        self.assertEqual(upload_alt["uploaded"][0]["track_id"], "1.3")
        self.assertEqual(upload_alt["uploaded"][0]["filename"], "1.3.mp3")

        # 3. Audio status now reports 1.2 and 1.3 as available
        status_after = requests.get(f"{self.base_url}/api/audio/status").json()
        self.assertIn("1.2", status_after["tracks"])
        self.assertEqual(status_after["tracks"]["1.2"]["filename"], "1.2.mp3")
        self.assertIn("1.3", status_after["tracks"])

        # Unit test normalize_audio_filename on authentic Oxford rip filenames
        tid, cfn = server.normalize_audio_filename("ef3e_p-int_pe1_1-26.mp3")
        self.assertEqual(tid, "1.26")
        self.assertEqual(cfn, "1.26.mp3")

        tid4, cfn4 = server.normalize_audio_filename("ef3e_p-int_pe5_4-31.mp3")
        self.assertEqual(tid4, "4.31")
        self.assertEqual(cfn4, "4.31.mp3")

        tid_rc, cfn_rc = server.normalize_audio_filename("ef3e_p-int_r&c_1-53.mp3")
        self.assertEqual(tid_rc, "1.53")
        self.assertEqual(cfn_rc, "1.53.mp3")

        # 4. Stream audio track with HTTP Range header (Partial Content 206)
        stream_res = requests.get(
            f"{self.base_url}/audio/1.2.mp3",
            headers={"Range": "bytes=0-99"}
        )
        self.assertEqual(stream_res.status_code, 206)
        self.assertEqual(len(stream_res.content), 100)
        self.assertIn("bytes 0-99/", stream_res.headers.get("Content-Range", ""))

        # 5. Stream authentic rip track 1.26 (Calling Reception)
        stream_26 = requests.get(
            f"{self.base_url}/audio/1.26.mp3",
            headers={"Range": "bytes=0-49"}
        )
        self.assertEqual(stream_26.status_code, 206)
        self.assertEqual(len(stream_26.content), 50)

        # 6. Stream alias 2.1 (which maps to 1.31)
        stream_alias = requests.get(
            f"{self.base_url}/audio/2.1.mp3",
            headers={"Range": "bytes=0-49"}
        )
        self.assertEqual(stream_alias.status_code, 206)
        self.assertEqual(len(stream_alias.content), 50)

        # 7. Out of bounds range returns 416
        bad_range = requests.get(
            f"{self.base_url}/audio/1.2.mp3",
            headers={"Range": "bytes=99999-100000"}
        )
        self.assertEqual(bad_range.status_code, 416)

    def test_12_ai_check_answers_hybrid(self):
        # Test AI tutor endpoint with Page 7 answers
        ov_res = requests.get(f"{self.base_url}/api/overlays/7").json()
        overlays = ov_res["overlays"]
        q3 = next(ov for ov in overlays if ov["label"] == "Q3")
        q3_id = str(q3["id"])

        payload = {
            "page_num": 7,
            "answers": {
                q3_id: "live"
            }
        }
        ai_res = requests.post(f"{self.base_url}/api/ai-check-answers", json=payload)
        self.assertEqual(ai_res.status_code, 200)
        ai_data = ai_res.json()
        self.assertEqual(ai_data["status"], "success")
        self.assertIn("score", ai_data)
        self.assertIn("correct_count", ai_data)
        self.assertIn("total_count", ai_data)
        self.assertIn("correct", ai_data)
        self.assertIn("total", ai_data)
        self.assertIn("teacher_summary", ai_data)
        self.assertIn("evaluations", ai_data)
        self.assertTrue(ai_data["evaluations"][q3_id]["is_correct"])

    def test_13_expanded_overlays(self):
        # Ensure Unit 1A (p.8), Unit 1B (p.9, p.10), Unit 1C (p.11, p.12), Grammar Bank (p.128, p.129), Vocab Bank (p.151, p.152, p.153) overlays exist
        expanded_pages = [8, 9, 10, 11, 12, 128, 129, 151, 152, 153]
        for p in expanded_pages:
            res = requests.get(f"{self.base_url}/api/overlays/{p}")
            self.assertEqual(res.status_code, 200)
            data = res.json()
            self.assertTrue(len(data["overlays"]) >= 3, f"Expected at least 3 overlays on page {p}, found {len(data['overlays'])}")

if __name__ == '__main__':
    unittest.main()
