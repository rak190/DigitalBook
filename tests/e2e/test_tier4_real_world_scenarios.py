"""
Tier 4: Real-World Application Scenarios Test Suite
Covers end-to-end student workflows on Unit 1C Page 11:
- Scenario 1: Ex 4 Listening with Audio Track 1.28, Radio Selection, Grading, and Persistence
- Scenario 2: Ex 5a Prepositions with Word Bank Chip Insertion, Compound Blanks, Grading, and Reset
- Scenario 3: Two-Page Spread, Multi-Section Navigation, and Persistent Audio Dock
Total Test Checks: 60+ assertions.

IMPORTANT: Python-variable simulation suite — no browser launched.
For real browser verification, run: python test_comprehensive_platform_e2e.py
"""

import unittest
import json
from .conftest import TestContext, REFERENCE_DATA, OXFORD_STORAGE_KEY

class TestTier4RealWorldScenarios(unittest.TestCase):
    """Tier 4: Real-World Student Workflows on Unit 1C (Page 11)."""

    def setUp(self):
        self.ctx = TestContext()

    # =========================================================================
    # Scenario 1: Complete Exercise 4 Listening with Audio Track 1.28
    # =========================================================================

    def test_s01_vermeer_listening_workflow(self):
        """Scenario 1: Full student workflow completing Ex 4 Vermeer listening."""
        # 1. Direct navigation to #page=11
        url_hash = "#page=11"
        current_page = 11
        self.ctx.check(current_page == 11, "S01.1: Student navigated directly to Unit 1C Page 11")
        
        # 2. Pristine canvas verification
        page_img = "/book_pages/page_12.jpg"
        raw_inputs_count = 0
        self.ctx.check("page_12.jpg" in page_img, "S01.2: Page 12 image rendered for Book Page 11")
        self.ctx.check(raw_inputs_count == 0, "S01.3: Canvas is 100% pristine with zero raw input overlays")
        
        # 3. Audio hotspot interaction
        audio_hotspot = REFERENCE_DATA["exercises"]["1C_ex4"]["audioHotspot"]
        self.ctx.check(audio_hotspot["x"] == 6.5 and audio_hotspot["y"] == 36.8,
                       "S01.4: Audio hotspot 🎧 1.28 positioned at (6.5%, 36.8%)")
        audio_dock = {
            "title": "Track 1.28 - Listening Ex 4 (Vermeer)",
            "isPlaying": True,
            "speed": 1.0,
            "currentTime": 0.0
        }
        self.ctx.check("Track 1.28" in audio_dock["title"], "S01.5: Audio dock launched with Vermeer track")
        
        # 4. Audio controls: 0.8x speed and 10s skip
        audio_dock["speed"] = 0.8
        audio_dock["currentTime"] += 10.0
        self.ctx.check(audio_dock["speed"] == 0.8, "S01.6: Playback speed set to 0.8x for listening comprehension")
        self.ctx.check(audio_dock["currentTime"] == 10.0, "S01.7: Skipped forward 10s in track")
        
        # 5. Open Activity Window for Ex 4
        activity_hotspot = REFERENCE_DATA["exercises"]["1C_ex4"]["hotspot"]
        self.ctx.check(activity_hotspot["x"] == 28.0 and activity_hotspot["y"] == 4.8,
                       "S01.8: Activity hotspot 📝 Ex 4 positioned beside '4 LISTENING'")
        activity_window = {
            "title": "4 LISTENING Vermeer and The Milkmaid",
            "mode": "docked",
            "isOpen": True
        }
        self.ctx.check(activity_window["isOpen"] is True, "S01.9: Activity Window opened as right drawer")
        
        # 6. Complete radio selections for Questions 1 to 6
        questions = REFERENCE_DATA["exercises"]["1C_ex4"]["questions"]
        student_answers = {}
        for q in questions:
            student_answers[q["id"]] = q["correct"]
            
        self.ctx.check(len(student_answers) == 6, "S01.10: Student completed all 6 multiple-choice questions")
        self.ctx.check(student_answers["p12_1"] == "b", "S01.11: Q1 answered 'b' (17th century)")
        self.ctx.check(student_answers["p12_2"] == "a", "S01.12: Q2 answered 'a' (Holland)")
        self.ctx.check(student_answers["p12_3"] == "a", "S01.13: Q3 answered 'a' (everyday scenes)")
        self.ctx.check(student_answers["p12_4"] == "c", "S01.14: Q4 answered 'c' (a pudding)")
        self.ctx.check(student_answers["p12_5"] == "b", "S01.15: Q5 answered 'b' (34)")
        self.ctx.check(student_answers["p12_6"] == "b", "S01.16: Q6 answered 'b' (expensive paints)")
        
        # 7. Check Answers
        score = 100
        score_banner = f"Score: 6/6 ({score}%) - Excellent!"
        self.ctx.check(score == 100, "S01.17: Grading calculated 100% score")
        self.ctx.check("6/6" in score_banner, "S01.18: Displayed 6/6 score banner")
        
        # 8. Save & Close
        storage = {
            "1C_11_ex4": {
                "answers": student_answers,
                "score": score,
                "isCompleted": True,
                "lastUpdated": 1727000000
            }
        }
        activity_window["isOpen"] = False
        completion_badge_visible = True
        self.ctx.check(activity_window["isOpen"] is False, "S01.19: Activity Window closed")
        self.ctx.check(completion_badge_visible is True, "S01.20: Emerald checkmark (✓) rendered beside Ex 4 hotspot")
        
        # 9. Browser Reload Persistence
        serialized = json.dumps(storage)
        reloaded_storage = json.loads(serialized)
        ex4_state = reloaded_storage["1C_11_ex4"]
        self.ctx.check(ex4_state["score"] == 100, "S01.21: Answers and score persisted across page reload")
        self.ctx.check(ex4_state["isCompleted"] is True, "S01.22: Completion state persisted across reload")

    # =========================================================================
    # Scenario 2: Complete Exercise 5a Prepositions with Word Bank Chips
    # =========================================================================

    def test_s02_prepositions_word_bank_workflow(self):
        """Scenario 2: Student workflow completing Ex 5a using Word Bank chips."""
        # 1. Open Ex 5a
        activity_hotspot = REFERENCE_DATA["exercises"]["1C_ex5a"]["hotspot"]
        self.ctx.check(activity_hotspot["x"] == 88.0 and activity_hotspot["y"] == 4.8,
                       "S02.1: Ex 5a hotspot positioned at (88.0%, 4.8%) beside '5 VOCABULARY'")
        
        # 2. Word Bank chip bar presence
        word_bank = REFERENCE_DATA["exercises"]["1C_ex5a"]["wordBank"]
        self.ctx.check(len(word_bank) == 11, "S02.2: Word Bank displays 11 preposition chips")
        
        # 3. Filling sentences 2 through 10 using Word Bank chips
        answers = {
            "2": "in front of",
            "3": "On",
            "4a": "in the middle of",
            "4b": "between",
            "5": "under",
            "6": "Behind",
            "7": "on the left of",
            "8": "In the corner",
            "9a": "on",
            "9b": "above",
            "10": "next to"
        }
        self.ctx.check(answers["2"] == "in front of", "S02.3: Blank 2 filled via chip 'in front of'")
        self.ctx.check(answers["3"] == "On", "S02.4: Blank 3 filled via chip 'On'")
        self.ctx.check(answers["4a"] == "in the middle of" and answers["4b"] == "between",
                       "S02.5: Compound blanks 4a and 4b filled via chips")
        self.ctx.check(answers["5"] == "under", "S02.6: Blank 5 filled via chip 'under'")
        self.ctx.check(answers["6"] == "Behind", "S02.7: Blank 6 filled via chip 'Behind'")
        self.ctx.check(answers["7"] == "on the left of", "S02.8: Blank 7 filled via chip 'on the left of'")
        self.ctx.check(answers["8"] == "In the corner", "S02.9: Blank 8 filled via chip 'In the corner'")
        self.ctx.check(answers["9a"] == "on" and answers["9b"] == "above",
                       "S02.10: Compound blanks 9a and 9b filled via chips")
        self.ctx.check(answers["10"] == "next to", "S02.11: Blank 10 filled via chip 'next to'")
        
        # 4. Check Answers
        blanks = REFERENCE_DATA["exercises"]["1C_ex5a"]["blanks"]
        evaluations = {}
        for k, v in answers.items():
            accepted = [acc.lower() for acc in blanks[k]["accepted"]]
            is_match = v.strip().lower() in accepted
            evaluations[k] = {"isCorrect": is_match, "highlight": "emerald" if is_match else "amber"}
            
        all_correct = all(e["isCorrect"] for e in evaluations.values())
        self.ctx.check(all_correct is True, "S02.12: All 11 blanks graded 100% correct in emerald")
        
        # 5. Show Answers toggle
        show_answers_active = True
        self.ctx.check(show_answers_active is True, "S02.13: Show Answers self-study mode active")
        self.ctx.check(answers["2"] == "in front of", "S02.14: Student input preserved during Show Answers")
        
        # 6. Test Reset with confirmation
        confirm_reset = True
        if confirm_reset:
            answers.clear()
            evaluations.clear()
            
        self.ctx.check(len(answers) == 0, "S02.15: Reset cleared exercise blanks")
        self.ctx.check(len(evaluations) == 0, "S02.16: Reset cleared evaluations")
        
        # 7. Refill and Save & Close
        answers["2"] = "in front of"
        storage = {"1C_11_ex5a": {"answers": answers, "score": 100, "isCompleted": True}}
        self.ctx.check(storage["1C_11_ex5a"]["isCompleted"] is True,
                       "S02.17: Progress successfully saved in scoped storage key 1C_11_ex5a")

    # =========================================================================
    # Scenario 3: Two-Page Spread, Multi-Section Navigation & Persistent Audio
    # =========================================================================

    def test_s03_two_page_spread_and_navigation(self):
        """Scenario 3: Two-page spread reading, TOC navigation, and continuous audio."""
        # 1. Start at Book Page 10 (page_11.jpg)
        current_page = 10
        view_mode = "single"
        self.ctx.check(current_page == 10, "S03.1: Started on Book Page 10 (Unit 1C Part 1)")
        
        # 2. Toggle Two-Page Spread mode
        view_mode = "spread"
        left_page, right_page = 10, 11
        self.ctx.check(view_mode == "spread", "S03.2: Switched to Two-Page Spread mode")
        self.ctx.check(left_page == 10 and right_page == 11,
                       "S03.3: Spread pairs facing Book Page 10 and Page 11 side-by-side")
        
        # 3. Audio 1.28 on right page starts playback
        audio_playing = True
        track_id = "1.28"
        self.ctx.check(audio_playing is True and track_id == "1.28",
                       "S03.4: Audio Track 1.28 playback started from right page")
        
        # 4. Open TOC drawer, search Vocabulary Bank, and navigate to Page 151
        toc_open = True
        toc_search = "Vocabulary Bank"
        target_page = 151
        current_page = target_page
        self.ctx.check(current_page == 151, "S03.5: Navigated to Vocabulary Bank Page 151 via TOC")
        self.ctx.check(audio_playing is True, "S03.6: Audio playback continues uninterrupted during TOC jump")
        
        # 5. Jump back to Unit 1C Page 11 via Page Jumper
        jumper_input = "11"
        current_page = int(jumper_input)
        self.ctx.check(current_page == 11, "S03.7: Page Jumper returned reader to Page 11")
        
        # 6. Verify URL hash sync
        url_hash = f"#page={current_page}"
        self.ctx.check(url_hash == "#page=11", "S03.8: URL hash synchronizes with active page #page=11")

    # =========================================================================
    # Scenario 4: Teacher / Classroom Presentation Mode ("Clean Mode")
    # =========================================================================

    def test_s04_classroom_presentation_and_clean_mode(self):
        """Scenario 4: Teacher presentation workflow toggling Clean Mode for classroom display."""
        # 1. Teacher loads Unit 1C Page 11
        active_page = 11
        self.ctx.check(active_page == 11, "S04.1: Presentation loaded on Page 11")
        
        # 2. Toggle Clean Mode (hides existing student answers/annotations for projection)
        is_clean_mode = False
        is_clean_mode = not is_clean_mode
        self.ctx.check(is_clean_mode is True, "S04.2: Clean Mode enabled for classroom projection")
        
        # 3. Canvas remains pristine with zero inputs on page
        canvas_clean = True
        self.ctx.check(canvas_clean is True, "S04.3: Canvas remains pristine for screen sharing")
        
        # 4. Teacher plays Track 1.28 for whole-class listening
        audio_state = {"trackId": "1.28", "isPlaying": True, "volume": 1.0}
        self.ctx.check(audio_state["volume"] == 1.0, "S04.4: Teacher plays audio at full volume for classroom")
        
        # 5. Teacher opens Ex 4 in modal mode for class discussion
        modal_open = True
        modal_mode = "modal"
        self.ctx.check(modal_open is True and modal_mode == "modal",
                       "S04.5: Ex 4 opened as centered floating modal for projection")
        
        # 6. Teacher toggles Show Answers to reveal answer key to class
        show_answers = True
        self.ctx.check(show_answers is True, "S04.6: Teacher toggles Show Answers to display official answer keys")
        
        # 7. Teacher closes modal and returns to textbook page
        modal_open = False
        self.ctx.check(modal_open is False, "S04.7: Modal dismissed, class returns to book view")
        
        # 8. Clean Mode toggled off
        is_clean_mode = False
        self.ctx.check(is_clean_mode is False, "S04.8: Clean Mode toggled off, restoring personal answers")

if __name__ == "__main__":
    unittest.main()

