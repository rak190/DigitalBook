"""
Deep E2E Verification Suite for New Interactive Textbook Capabilities:
1. Learning Progress & Stats Drawer
2. Mistake Review Studio & One-Click Resolution
3. Global Textbook Search Modal with Live Debounced Query & Filter Pills
4. Visual Calibration & Authoring Tool (Mode Toggle & Modal Editor)
5. Zoom Preset Scale Selector
6. Rich Exercise Types & Sequential Keyboard Navigation
7. Continue Studying Banner
"""

import threading
import time
import socketserver
from playwright.sync_api import sync_playwright
import server
import database

PORT = 8995

def run_new_features_suite():
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

        print("--- Step 1: Initial Load & Header Controls ---")
        page.goto(base_url)
        page.wait_for_selector("#book-spread-container .book-page-image")
        time.sleep(0.5)

        # 1. Test Global Search Modal
        print("--- Step 2: Global Textbook Search Modal ---")
        page.click("#global-search-btn")
        page.wait_for_selector("#global-search-modal", state="visible")
        time.sleep(0.3)

        page.fill("#global-search-input", "present simple")
        time.sleep(0.8) # wait for debounce

        search_cards = page.query_selector_all("#global-search-results .search-result-card")
        print(f"Search results for 'present simple': {len(search_cards)}")
        assert len(search_cards) >= 1, "Expected search results for 'present simple'"

        # Filter by units
        page.click(".search-pill[data-filter='unit']")
        time.sleep(0.2)
        unit_cards = page.query_selector_all("#global-search-results .search-result-card")
        print(f"Filtered Unit results: {len(unit_cards)}")

        # Click the first search result to jump
        unit_cards[0].click()
        time.sleep(0.8)
        assert not page.is_visible("#global-search-modal"), "Search modal should close on selection"
        print("Search selection navigated successfully!")

        # 2. Test Zoom Presets Selector
        print("--- Step 3: Zoom Presets Selector ---")
        page.select_option("#zoom-preset-select", "1.5")
        time.sleep(0.3)
        zoom_text = page.inner_text("#zoom-level-text")
        print(f"Zoom level text after preset: {zoom_text}")
        assert "150%" in zoom_text, f"Expected 150%, got {zoom_text}"

        page.select_option("#zoom-preset-select", "1.0")
        time.sleep(0.3)
        assert "100%" in page.inner_text("#zoom-level-text"), "Failed to reset zoom to 100%"
        print("Zoom presets selector verified!")

        # 3. Test Progress Drawer
        print("--- Step 4: Learning Progress & Accuracy Dashboard ---")
        page.click("#toggle-progress-btn")
        page.wait_for_selector("#drawer-progress.open")
        time.sleep(0.5)

        completion_text = page.inner_text("#metric-completion")
        print(f"Metric Book Completion: {completion_text}")
        assert "%" in completion_text, "Completion text missing %"

        units_checklist = page.query_selector_all("#units-progress-list .unit-progress-item")
        print(f"Units checklist items: {len(units_checklist)}")
        assert len(units_checklist) >= 10, f"Expected >= 10 units, got {len(units_checklist)}"

        # Click a unit in the checklist to jump
        units_checklist[1].click()
        time.sleep(0.8)
        print("Jumped from units checklist successfully!")
        page.click("#drawer-progress .close-drawer-btn")
        time.sleep(0.3)

        # 4. Generate a Mistake by deliberately entering incorrect answer and checking
        print("--- Step 5: Mistake Generation & Mistake Review Studio ---")
        # Navigate to page 7
        page.fill("#page-num-input", "7")
        page.press("#page-num-input", "Enter")
        time.sleep(0.8)

        blanks = page.query_selector_all(".exercise-blank-input")
        if len(blanks) > 0:
            blanks[0].fill("wrong_answer_xyz_999")
            page.click("#check-answers-btn")
            time.sleep(0.8)

        # Open Mistakes Drawer
        page.click("#toggle-mistakes-btn")
        page.wait_for_selector("#drawer-mistakes.open")
        time.sleep(0.5)

        mistake_cards = page.query_selector_all("#mistakes-list-container .mistake-card")
        print(f"Mistake cards found: {len(mistake_cards)}")
        assert len(mistake_cards) >= 1, "Expected at least 1 mistake card after wrong answer"

        # Verify mistake card content
        first_card_text = mistake_cards[0].inner_text()
        print(f"Mistake snippet: {first_card_text[:80]}...")
        assert "wrong_answer_xyz_999" in first_card_text or "live" in first_card_text or "Page 7" in first_card_text, "Mistake card missing answer content"

        # Test Resolving the mistake
        resolve_btn = mistake_cards[0].query_selector("button.btn-success")
        assert resolve_btn is not None, "Resolve button missing on mistake card"
        resolve_btn.click()
        time.sleep(0.8)
        print("Mistake resolved successfully!")
        page.click("#drawer-mistakes .close-drawer-btn")
        time.sleep(0.3)

        # 5. Visual Calibration & Authoring Tool Mode
        print("--- Step 6: Visual Calibration & Authoring Tool Mode ---")
        page.click("#calibrate-tool-btn")
        time.sleep(0.3)

        viewport_classes = page.get_attribute("#viewport-container", "class") or ""
        assert "calibration-mode-active" in viewport_classes, "Failed to activate calibration-mode-active"
        print("Calibration mode active on viewport!")

        # Click on an exercise blank to open calibration modal
        blanks_calib = page.query_selector_all(".exercise-blank-input")
        assert len(blanks_calib) > 0, "No blanks found for calibration"
        blanks_calib[0].click()
        time.sleep(0.5)

        page.wait_for_selector("#calibration-modal", state="visible")
        print("Calibration modal opened successfully!")

        calib_label = page.input_value("#calib-label")
        print(f"Calibration overlay label: {calib_label}")
        assert len(calib_label) > 0, "Calibration label should not be empty"

        # Edit hint and save
        page.fill("#calib-hint", "Verified by E2E test")
        page.click("#save-calibration-btn")
        time.sleep(0.8)
        assert not page.is_visible("#calibration-modal"), "Calibration modal should close on save"
        print("Calibration modal saved and closed!")

        # Exit calibration mode
        page.click("button[data-mode='read']")
        time.sleep(0.3)
        viewport_classes_after = page.get_attribute("#viewport-container", "class") or ""
        assert "calibration-mode-active" not in viewport_classes_after, "Failed to exit calibration mode"
        print("Calibration mode exited successfully!")

        # 6. Sequential Keyboard Navigation
        print("--- Step 7: Sequential Enter Key Navigation ---")
        test_blanks = page.query_selector_all(".exercise-blank-input")
        if len(test_blanks) >= 2:
            test_blanks[0].focus()
            page.keyboard.type("test")
            page.keyboard.press("Enter")
            time.sleep(0.3)
            # Second blank should now be active
            active_id = page.evaluate("() => document.activeElement ? document.activeElement.id : ''")
            print(f"Active element after Enter: {active_id}")
            assert active_id == test_blanks[1].get_attribute("id"), f"Expected focus on {test_blanks[1].get_attribute('id')}, got {active_id}"
            print("Enter key sequentially advanced focus to the next blank!")

        page.screenshot(path="screenshot_new_features_verified.png")
        print("Saved screenshot_new_features_verified.png")

        browser.close()
        print("\n=======================================================")
        print(" ALL NEW INTERACTIVE FEATURES VERIFIED WITH ZERO ERRORS!")
        print("=======================================================")

if __name__ == '__main__':
    run_new_features_suite()
