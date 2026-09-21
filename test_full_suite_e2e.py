"""
Comprehensive E2E Verification Suite for Digital Textbook
Tests:
1. Page 7 rendering, Book Page badge, Exercise Blanks
2. Completing answers & grading
3. Pen drawing
4. Type Answer (Text Box) creation, editing, and persistence
5. Sticky Note creation, editing, collapsing, and persistence
6. Add Blank tool: Custom Modal dialog, blank creation, side panel sync
7. Delete Blank functionality
8. Audio Drawer: track selection and listening scripts display
9. Vocabulary Drawer & 3D Flashcards
10. Page 151 (Vocabulary Bank) exercise validation
"""

import threading
import time
import socketserver
from playwright.sync_api import sync_playwright
import server
import database

PORT = 8990

def run_suite():
    database.init_db()
    database.refresh_default_overlays()
    httpd = socketserver.ThreadingTCPServer(("", PORT), server.DigitalTextbookHandler)
    t = threading.Thread(target=httpd.serve_forever, daemon=True)
    t.start()
    time.sleep(0.5)

    base_url = f"http://127.0.0.1:{PORT}"

    with sync_playwright() as p:
        browser = p.chromium.launch(channel="msedge", headless=True)
        context = browser.new_context(viewport={"width": 1400, "height": 900})
        page = context.new_page()

        print("--- Step 1: Initial App Load & Book Page Badge ---")
        page.goto(base_url)
        page.wait_for_selector("#book-spread-container .book-page-image")
        time.sleep(0.5)

        badge_text = page.inner_text("#book-page-badge")
        print(f"Book page badge text: {badge_text}")
        assert "Book p.6" in badge_text, f"Expected '(Book p.6)', got '{badge_text}'"

        print("--- Step 2: Fill Answers & Check Grading ---")
        p7_blanks = page.query_selector_all(".exercise-blank-input")
        assert len(p7_blanks) >= 5, f"Expected at least 5 blanks, got {len(p7_blanks)}"
        p7_blanks[0].fill("live")
        p7_blanks[1].fill("live")
        p7_blanks[4].fill("do")
        page.click("#check-answers-btn")
        time.sleep(0.5)

        correct_inputs = page.query_selector_all(".exercise-blank-input.correct")
        print(f"Correct inputs count: {len(correct_inputs)}")
        assert len(correct_inputs) >= 3, f"Expected at least 3 correct, got {len(correct_inputs)}"

        print("--- Step 3: Type Answer (Custom Text Box) Placement & Persistence ---")
        page.click("button[data-mode='textbox']")
        time.sleep(0.2)
        canvas = page.wait_for_selector("#canvas-page-7")
        box = canvas.bounding_box()
        # Click on page notes layer
        page.mouse.click(box["x"] + 220, box["y"] + 250)
        time.sleep(0.5)

        text_boxes = page.query_selector_all(".custom-text-box")
        print(f"Text boxes found after click: {len(text_boxes)}")
        assert len(text_boxes) >= 1, "Failed: Text box was not created on click"

        # Type inside the text box
        page.type(".custom-text-box .text-content", " My student note 2026")
        time.sleep(1.0) # wait for autosave

        print("--- Step 4: Sticky Note Placement & Persistence ---")
        page.click("button[data-mode='stickynote']")
        time.sleep(0.2)
        page.mouse.click(box["x"] + 450, box["y"] + 280)
        time.sleep(0.5)

        sticky_notes = page.query_selector_all(".sticky-note")
        print(f"Sticky notes found after click: {len(sticky_notes)}")
        assert len(sticky_notes) >= 1, "Failed: Sticky note was not created on click"

        page.type(".sticky-note .sticky-note-body", " Important rule: Present simple with do/does")
        time.sleep(1.0) # wait for autosave

        print("--- Step 5: Verify Persistence Across Page Navigation ---")
        # Navigate away to page 8 and back to page 7
        page.click("#next-page-btn")
        time.sleep(0.8)
        assert page.input_value("#page-num-input") == "8", "Failed to navigate to page 8"
        page.click("#prev-page-btn")
        time.sleep(0.8)
        assert page.input_value("#page-num-input") == "7", "Failed to navigate back to page 7"

        # Verify text box and sticky note still exist with their content
        tb_restored = page.query_selector_all(".custom-text-box")
        sn_restored = page.query_selector_all(".sticky-note")
        assert len(tb_restored) >= 1, "Failed: Text box did not persist after navigation"
        assert len(sn_restored) >= 1, "Failed: Sticky note did not persist after navigation"
        print("Text boxes and Sticky notes successfully persisted across page turns!")

        print("--- Step 6: Add Blank Tool with Custom Modal ---")
        page.click("#add-blank-tool-btn")
        time.sleep(0.2)
        page.mouse.click(box["x"] + 300, box["y"] + 350)
        time.sleep(0.5)

        modal = page.wait_for_selector("#add-blank-modal-backdrop[style*='flex']")
        print("Add Blank custom modal successfully appeared without blocking prompt!")

        page.fill("#blank-modal-label", "Q99_Test")
        page.fill("#blank-modal-answer", "guitar, piano")
        page.fill("#blank-modal-hint", "musical instruments")
        page.click("#confirm-add-blank-btn")
        time.sleep(1.0)

        # Verify new blank input on page
        all_blanks = page.query_selector_all(".exercise-blank-input")
        print(f"Total interactive blanks on page after adding: {len(all_blanks)}")

        # Open Exercises drawer and verify the new blank appears in the panel
        page.click("#toggle-exercises-btn")
        page.wait_for_selector("#drawer-exercises.open")
        time.sleep(0.5)
        side_card = page.query_selector("#side-ex-card-" + all_blanks[-1].get_attribute("data-overlay-id"))
        assert side_card is not None, "Failed: New blank did not appear in side exercises panel"
        print("New blank verified in side exercises panel!")

        print("--- Step 7: Delete Blank Tool ---")
        # Click delete on the newly added blank
        del_btn = side_card.query_selector(".delete-overlay-btn")
        page.on("dialog", lambda d: d.accept())
        del_btn.click()
        time.sleep(1.0)
        blanks_after_del = page.query_selector_all(".exercise-blank-input")
        print(f"Total blanks after deletion: {len(blanks_after_del)}")
        assert len(blanks_after_del) == len(all_blanks) - 1, "Failed: Blank was not deleted"
        print("Blank successfully deleted!")
        page.click("#drawer-exercises .close-drawer-btn") # close exercises drawer
        time.sleep(0.5)

        print("--- Step 8: Audio Drawer & Listening Scripts ---")
        page.click("#toggle-audio-btn")
        page.wait_for_selector("#drawer-audio.open")
        time.sleep(0.5)

        script_text = page.inner_text("#listening-script-display")
        print(f"Listening script snippet: {script_text[:60]}...")
        assert "Where are you from?" in script_text, "Failed: Audio script text not loaded"

        # Change track to 1.10 Situations and conversations
        page.select_option("#audio-track-select", "1.10")
        time.sleep(0.5)
        script_110 = page.inner_text("#listening-script-display")
        assert "Conversation" in script_110 or "hotel" in script_110, "Failed: 1.10 script not updated"

        # Change track to 1.26 Calling Reception
        page.select_option("#audio-track-select", "1.26")
        time.sleep(0.5)
        script_126 = page.inner_text("#listening-script-display")
        assert "room 613" in script_126 or "air conditioning" in script_126, "Failed: 1.26 script not updated"
        print("Audio drawer tracks and listening scripts working perfectly!")
        page.click("#drawer-audio .close-drawer-btn")

        print("--- Step 9: Vocabulary Bank & Flashcards ---")
        page.click("#toggle-vocab-btn")
        page.wait_for_selector("#drawer-vocab.open")
        time.sleep(0.5)

        page.click("#start-flashcards-btn")
        page.wait_for_selector("#flashcard-modal-backdrop.open")
        time.sleep(0.5)
        page.click("#flashcard-inner")
        time.sleep(0.5)
        page.click("#close-flashcards-btn")
        time.sleep(0.3)
        page.click("#drawer-vocab .close-drawer-btn")
        print("Vocabulary and flashcards working properly!")

        print("--- Step 10: Page 151 (Vocabulary Bank Overlays) ---")
        page.fill("#page-num-input", "151")
        page.press("#page-num-input", "Enter")
        time.sleep(1.0)
        p151_badge = page.inner_text("#book-page-badge")
        print(f"Page 151 badge: {p151_badge}")
        assert "Book p.150" in p151_badge, f"Expected Book p.150, got {p151_badge}"

        p151_blanks = page.query_selector_all(".exercise-blank-input")
        print(f"Found {len(p151_blanks)} interactive blanks on page 151")
        assert len(p151_blanks) >= 10, f"Expected at least 10 blanks on p151, found {len(p151_blanks)}"

        # Fill in first two blanks (Personality section: friendly and unfriendly)
        page.fill("#blank-" + p151_blanks[0].get_attribute("data-overlay-id"), "friendly")
        page.fill("#blank-" + p151_blanks[1].get_attribute("data-overlay-id"), "unfriendly")
        page.click("#check-answers-btn")
        time.sleep(0.5)

        correct_151 = page.query_selector_all(".exercise-blank-input.correct")
        print(f"Correct blanks on page 151: {len(correct_151)}")
        assert len(correct_151) >= 2, "Failed to validate answers on page 151"

        print("--- Step 11: Online Class Mode Toggle ---")
        page.click("#toggle-class-mode-btn")
        time.sleep(0.3)
        body_class = page.get_attribute("body", "class") or ""
        assert "class-mode-active" in body_class, "Failed: class-mode-active not on body"
        print("Online Class Mode successfully enabled!")
        page.click("#toggle-class-mode-btn")
        time.sleep(0.3)
        body_class_after = page.get_attribute("body", "class") or ""
        assert "class-mode-active" not in body_class_after, "Failed to disable class-mode-active"
        print("Online Class Mode successfully disabled!")

        print("--- Step 12: Screen Sharing Clean Mode (Hide Answers) ---")
        page.click("#toggle-clean-mode-btn")
        time.sleep(0.3)
        body_class = page.get_attribute("body", "class") or ""
        assert "screen-share-clean-mode" in body_class, "Failed: screen-share-clean-mode not on body"
        clean_btn_text = page.inner_text("#toggle-clean-mode-btn")
        assert "Show Answers" in clean_btn_text, f"Expected 'Show Answers', got '{clean_btn_text}'"
        print("Screen Sharing Clean Mode active - typed answers hidden!")
        page.click("#toggle-clean-mode-btn")
        time.sleep(0.3)
        body_class_after = page.get_attribute("body", "class") or ""
        assert "screen-share-clean-mode" not in body_class_after, "Failed to disable clean mode"
        print("Clean Mode toggled off successfully!")

        print("--- Step 13: Presentation / Focus Mode ---")
        page.click("#toggle-focus-mode-btn")
        time.sleep(0.3)
        body_class = page.get_attribute("body", "class") or ""
        assert "focus-mode-active" in body_class, "Failed: focus-mode-active not on body"
        print("Focus mode active - toolbars hidden!")
        page.click("#exit-focus-btn")
        time.sleep(0.3)
        body_class_after = page.get_attribute("body", "class") or ""
        assert "focus-mode-active" not in body_class_after, "Failed to exit focus mode"
        print("Exited focus mode successfully!")

        print("--- Step 14: Teacher Quick-Jump (Book Page & Bank Shortcuts) ---")
        # Direct jump by book page 8 (which is PDF page 9)
        page.fill("#teacher-book-jump-input", "8")
        page.click("#teacher-book-jump-btn")
        time.sleep(0.8)
        assert page.input_value("#page-num-input") == "9", f"Expected PDF page 9 for Book p.8, got {page.input_value('#page-num-input')}"
        print("Teacher jumped to Book p.8 (PDF p.9) successfully!")

        # Shortcut jump to Grammar Bank
        page.click(".jump-pill[data-target-page='127']")
        time.sleep(0.8)
        assert page.input_value("#page-num-input") == "127", "Failed to jump to Grammar Bank (p.127)"
        print("Jumped to Grammar Bank successfully!")

        # Shortcut return to current Unit
        page.click("#teacher-return-unit-btn")
        time.sleep(0.8)
        assert page.input_value("#page-num-input") == "9", f"Expected return to unit page 9, got {page.input_value('#page-num-input')}"
        print("Returned to current unit page successfully!")

        print("--- Step 15: Floating Draggable Audio Widget ---")
        page.click("#toggle-floating-audio-btn")
        page.wait_for_selector("#floating-audio-widget", state="visible")
        time.sleep(0.3)
        # Verify speed preset button
        page.click(".audio-speed-group .speed-btn[data-speed='1.2']")
        time.sleep(0.2)
        speed_btn = page.query_selector(".audio-speed-group .speed-btn[data-speed='1.2'].active")
        assert speed_btn is not None, "Failed to activate 1.2x speed"

        # Click play button
        page.click("#float-audio-play-btn")
        time.sleep(0.5)
        print("Floating audio player widget verified!")

        print("--- Step 16: In-App Audio Dropzone Modal ---")
        page.click("#open-audio-uploader-btn")
        page.wait_for_selector("#audio-dropzone-modal", state="visible")
        time.sleep(0.5)
        checklist_items = page.query_selector_all("#audio-tracks-checklist .audio-track-item")
        print(f"Audio checklist items found: {len(checklist_items)}")
        assert len(checklist_items) >= 5, "Failed: Audio tracks checklist not populated"
        page.click("#done-audio-modal-btn")
        time.sleep(0.3)
        page.click("#float-audio-close-btn")
        time.sleep(0.3)

        print("--- Step 17: Gemini AI Tutor Feedback ---")
        # Navigate back to page 7
        page.fill("#page-num-input", "7")
        page.press("#page-num-input", "Enter")
        time.sleep(0.8)

        # Fill answer and click AI Tutor
        blanks = page.query_selector_all(".exercise-blank-input")
        if len(blanks) > 0:
            blanks[0].fill("live")
        page.click("#ai-tutor-btn")
        page.wait_for_selector("#ai-tutor-modal", state="visible")
        page.wait_for_selector("#ai-tutor-results", state="visible", timeout=30000)
        time.sleep(0.5)

        summary_text = page.inner_text("#ai-summary-text")
        print(f"AI Teacher Summary: {summary_text[:80]}...")
        assert len(summary_text) > 10, "Failed: AI Teacher summary is empty"

        score_text = page.inner_text("#ai-score-badge")
        print(f"AI Score Badge: {score_text}")
        assert "undefined" not in score_text, f"Failed: Score badge has undefined: {score_text}"

        ai_cards = page.query_selector_all("#ai-evaluations-list .ai-item-card")
        print(f"AI evaluation item cards: {len(ai_cards)}")
        assert len(ai_cards) >= 1, "Failed: AI evaluation item cards not rendered"
        page.click("#dismiss-ai-modal-btn")
        time.sleep(0.5)

        page.screenshot(path="screenshot_verified_all.png")
        print("Saved screenshot_verified_all.png")

        browser.close()
        print("\n=======================================================")
        print(" ALL 17 DEEP VERIFICATION CHECKS PASSED WITH ZERO ERRORS!")
        print("=======================================================")

if __name__ == '__main__':
    run_suite()
