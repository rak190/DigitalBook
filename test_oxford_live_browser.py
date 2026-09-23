"""
Live Browser Playwright Verification for Oxford Learner's Bookshelf Redesign
"""
import time
from playwright.sync_api import sync_playwright

def verify_oxford_redesign():
    print("==================================================")
    print(" Verifying Oxford Learner's Bookshelf Redesign ")
    print("==================================================")

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, channel="msedge")
        page = browser.new_page(viewport={"width": 1280, "height": 800})

        # Step 1: Open app directly to Page 11 (Unit 1C)
        print("\n--- Step 1: Navigating to Unit 1C Page 11 ---")
        page.goto("http://localhost:8000/#page=11", wait_until="networkidle")
        time.sleep(1.5)

        # Verify pristine canvas has ZERO raw inputs over the book image
        canvas_inputs = page.locator(".pointer-events-none.z-10 input[id^='overlay-input-']").count()
        print(f"Number of bulky overlay inputs on canvas: {canvas_inputs}")
        assert canvas_inputs == 0, f"Expected 0 raw inputs on canvas, found {canvas_inputs}"
        print("Pristine canvas confirmed: 0 raw input boxes over printed text!")

        # Step 2: Verify hotspot badges
        print("\n--- Step 2: Verifying Discrete Activity & Audio Hotspots ---")
        hotspot_count = page.locator("button[aria-label*='LISTENING'], button[aria-label*='VOCABULARY'], button[aria-label*='Track']").count()
        print(f"Found {hotspot_count} discrete hotspot badges on page.")
        assert hotspot_count >= 2, "Expected at least 2 hotspot badges on Page 11"

        # Step 3: Click Audio Hotspot 1.28
        print("\n--- Step 3: Triggering Audio Hotspot 1.28 ---")
        audio_btn = page.locator("button[aria-label*='1.28']").first
        audio_btn.click()
        time.sleep(1)

        # Check audio dock
        dock_title = page.locator(".fixed.bottom-3").text_content()
        print("Docked Audio title:", dock_title[:60] if dock_title else "None")
        assert "1.28" in dock_title or "Listening" in dock_title

        # Step 4: Click Activity Hotspot Ex 5a (Prepositions of Place)
        print("\n--- Step 4: Opening Ex 5a Activity Window ---")
        ex5a_btn = page.locator("button[aria-label*='VOCABULARY']").first
        ex5a_btn.click()
        time.sleep(1)

        # Verify Activity Window opened
        activity_window = page.locator("aside[aria-label='Activity Window']")
        assert activity_window.is_visible(), "Activity Window failed to open"
        print("Activity Window opened successfully!")

        # Verify Word Bank chips
        chips = page.locator("aside[aria-label='Activity Window'] button:has-text('behind'), aside[aria-label='Activity Window'] button:has-text('in front of')")
        print(f"Found {chips.count()} word bank chips")
        assert chips.count() >= 2, "Expected word bank chips"

        # Step 5: Click a word bank chip to insert into blank
        print("\n--- Step 5: Testing Click-to-Insert Word Bank Chip ---")
        chip_in_front = page.locator("aside[aria-label='Activity Window'] button:text-is('in front of')").first
        chip_in_front.click()
        time.sleep(0.5)

        # Verify text was inserted into blank 2
        first_input = page.locator("aside[aria-label='Activity Window'] input").first
        input_val = first_input.input_value()
        print(f"Blank value after chip click: '{input_val}'")
        assert input_val == "in front of", f"Expected 'in front of', got '{input_val}'"

        # Step 6: Click 'Check Answers'
        print("\n--- Step 6: Non-Destructive Answer Checking ---")
        check_btn = page.locator("button:has-text('Check Answers')").first
        check_btn.click()
        time.sleep(0.5)

        # Verify score banner or correct styling
        input_val_after = first_input.input_value()
        assert input_val_after == "in front of", "Checking answers must not clear student input"
        print("Student input preserved non-destructively!")

        # Save verification screenshot
        page.screenshot(path="screenshot_oxford_bookshelf.png")
        print("Saved verification screenshot to 'screenshot_oxford_bookshelf.png'")

        browser.close()
        print("\n==================================================")
        print(" ALL OXFORD BOOKSHELF LIVE BROWSER TESTS PASSED! ")
        print("==================================================")

if __name__ == "__main__":
    verify_oxford_redesign()
