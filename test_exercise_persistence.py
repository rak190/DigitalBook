"""
Playwright Test: Interactive Exercise Components & LocalStorage Persistence Verification
Verifies:
1. Typing into GapFillInput on PageOverlay updates side panel in real-time
2. Typing into side panel updates PageOverlay
3. Deterministic schema in localStorage under 'digital_textbook_answers_v2'
4. Answers persist across browser reload (F5)
5. Answers persist across page navigation (Page 7 -> Page 8 -> Page 7)
6. Non-destructive answer checking
7. Reset page exercises workflow
"""

import sys
import time
import json
from playwright.sync_api import sync_playwright

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

def run_persistence_tests():
    print("==================================================================")
    print(" Testing Interactive Exercise Components & LocalStorage Persistence ")
    print("==================================================================")

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, channel="msedge")
        context = browser.new_context()
        page = context.new_page()

        # Step 1: Open Application
        print("\n--- Step 1: Loading Digital Workbook on http://localhost:8000 ---")
        page.goto("http://localhost:8000", wait_until="networkidle")
        time.sleep(1.0)

        # Clear any preexisting answers to test clean state
        page.evaluate("localStorage.removeItem('digital_textbook_answers_v2')")
        page.reload(wait_until="networkidle")
        time.sleep(1.0)

        # Step 2: Overlay Input -> Side Panel Sync
        print("\n--- Step 2: Testing On-Page Overlay Input & Real-Time Sync ---")
        overlay_input = page.locator("#overlay-input-p7_1")
        panel_input = page.locator("#panel-input-p7_1")

        assert overlay_input.is_visible(), "Overlay input #overlay-input-p7_1 not found on page!"
        assert panel_input.is_visible(), "Panel input #panel-input-p7_1 not found in exercise panel!"

        # Type into on-page overlay input
        overlay_input.fill("live")
        time.sleep(0.5)

        # Verify side panel input updated instantly
        assert panel_input.input_value() == "live", f"Panel input did not sync! Found: '{panel_input.input_value()}'"
        print("✓ Typing into overlay input instantly synchronized with side panel input!")

        # Step 3: Side Panel -> Overlay Input Sync
        print("\n--- Step 3: Testing Side Panel Input -> Overlay Sync ---")
        panel_input_2 = page.locator("#panel-input-p7_2")
        overlay_input_2 = page.locator("#overlay-input-p7_2")

        panel_input_2.fill("flat")
        time.sleep(0.5)

        assert overlay_input_2.input_value() == "flat", f"Overlay input did not sync! Found: '{overlay_input_2.input_value()}'"
        print("✓ Typing into side panel instantly synchronized with on-page overlay input!")

        # Step 4: Verify LocalStorage Schema & Debounce
        print("\n--- Step 4: Verifying Deterministic Schema in LocalStorage ---")
        time.sleep(0.5) # Wait for 300ms debounce
        raw_storage = page.evaluate("localStorage.getItem('digital_textbook_answers_v2')")
        assert raw_storage is not None, "digital_textbook_answers_v2 is missing from localStorage!"

        answers_data = json.loads(raw_storage)
        print("Stored answers count:", len(answers_data))

        # Check p7_1 schema
        item = answers_data.get("p7_1")
        assert item is not None, "p7_1 missing from stored answers!"
        assert item["value"] == "live", f"Expected value 'live', got {item.get('value')}"
        assert item["answer"] == "live", f"Expected answer 'live', got {item.get('answer')}"
        assert item["isCompleted"] is True, "Expected isCompleted to be True"
        assert item["completed"] is True, "Expected completed to be True"
        assert item["pageId"] == 7, f"Expected pageId 7, got {item.get('pageId')}"
        assert "lastUpdated" in item, "Missing lastUpdated timestamp"
        print("✓ LocalStorage strictly conforms to required schema:")
        print("  ", json.dumps(item, indent=2))

        # Step 5: Reload Persistence
        print("\n--- Step 5: Testing Persistence Across Browser Reload (F5) ---")
        page.reload(wait_until="networkidle")
        time.sleep(1.2)

        reloaded_overlay_1 = page.locator("#overlay-input-p7_1")
        reloaded_panel_1 = page.locator("#panel-input-p7_1")
        reloaded_overlay_2 = page.locator("#overlay-input-p7_2")
        reloaded_panel_2 = page.locator("#panel-input-p7_2")

        assert reloaded_overlay_1.input_value() == "live", f"Overlay 1 lost on reload! Found: '{reloaded_overlay_1.input_value()}'"
        assert reloaded_panel_1.input_value() == "live", f"Panel 1 lost on reload! Found: '{reloaded_panel_1.input_value()}'"
        assert reloaded_overlay_2.input_value() == "flat", f"Overlay 2 lost on reload! Found: '{reloaded_overlay_2.input_value()}'"
        assert reloaded_panel_2.input_value() == "flat", f"Panel 2 lost on reload! Found: '{reloaded_panel_2.input_value()}'"
        print("✓ All answers successfully persisted across page reload!")

        # Step 6: Page Navigation Persistence
        print("\n--- Step 6: Testing Persistence Across Page Navigation ---")
        next_btn = page.locator("button[title*='Next Page']")
        next_btn.click()
        time.sleep(1.0)

        # Verify on page 8
        page_input = page.locator("header input").first
        print("Navigated to page:", page_input.input_value())

        # Go back to page 7
        prev_btn = page.locator("button[title*='Previous Page']")
        prev_btn.click()
        time.sleep(1.0)
        print("Returned to page:", page_input.input_value())

        assert page.locator("#overlay-input-p7_1").input_value() == "live", "Answers lost after navigating pages!"
        assert page.locator("#panel-input-p7_1").input_value() == "live", "Panel answers lost after navigating pages!"
        print("✓ Answers successfully persisted across page navigation!")

        # Step 7: Non-Destructive Checking
        print("\n--- Step 7: Testing Non-Destructive Answer Checking ---")
        check_btn = page.locator("button:has-text('Check My Answers')")
        check_btn.click()
        time.sleep(0.8)

        # Value must remain intact
        assert page.locator("#panel-input-p7_1").input_value() == "live", "User answer was erased by checking!"
        assert page.locator("#overlay-input-p7_1").input_value() == "live", "Overlay answer was erased by checking!"
        print("✓ Checking answers did NOT erase user input!")

        # Step 8: Reset Page Exercises
        print("\n--- Step 8: Testing Reset Page Exercises ---")
        reset_btn = page.locator("button:has-text('Reset Page Exercises')")
        reset_btn.click()
        time.sleep(0.3)

        confirm_btn = page.locator("button:has-text('Confirm Reset')")
        assert confirm_btn.is_visible(), "Confirmation button not visible!"
        confirm_btn.click()
        time.sleep(0.5)

        assert page.locator("#panel-input-p7_1").input_value() == "", "Panel input not cleared after reset!"
        assert page.locator("#overlay-input-p7_1").input_value() == "", "Overlay input not cleared after reset!"

        # Verify cleared in localStorage as well
        raw_storage_after = page.evaluate("localStorage.getItem('digital_textbook_answers_v2')")
        answers_after = json.loads(raw_storage_after) if raw_storage_after else {}
        assert "p7_1" not in answers_after, "p7_1 still present in localStorage after reset!"
        print("✓ Reset Page Exercises successfully cleared inputs and updated localStorage!")

        page.screenshot(path="screenshot_step2_verified.png")
        print("\nSaved verification screenshot to 'screenshot_step2_verified.png'")
        browser.close()

    print("\n==================================================================")
    print(" ALL INTERACTIVE EXERCISE & PERSISTENCE TESTS PASSED (100%) ")
    print("==================================================================")

if __name__ == "__main__":
    run_persistence_tests()
