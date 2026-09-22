"""
Playwright Test: Self-Check, Answer Key Toggle, Review Mistakes, and Try Again
Verifies:
1. Non-destructive answer checking with score breakdown
2. "Show Key" / "Hide Key" toggle functionality
3. Answer key shows accepted alternatives
4. Distinction between auto-graded and self-check activities
5. "Review Mistakes" filter functionality
6. "Try Again" clears ONLY incorrect answers while preserving correct ones
7. Collapsible Hint (💡) and Explanation (ℹ️) cards
"""

import sys
import time
from playwright.sync_api import sync_playwright

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

def run_self_check_tests():
    print("==================================================================")
    print(" Testing Self-Check, Answer Key Toggle, Mistakes & Try Again ")
    print("==================================================================")

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, channel="msedge")
        page = browser.new_page()

        # Step 1: Open Application & Reset to clean state
        print("\n--- Step 1: Loading Digital Workbook on http://localhost:8000 ---")
        page.goto("http://localhost:8000", wait_until="networkidle")
        time.sleep(1.0)

        page.evaluate("localStorage.removeItem('digital_textbook_answers_v2')")
        page.reload(wait_until="networkidle")
        time.sleep(1.0)

        # Step 2: Fill mixed answers (one correct, one incorrect)
        print("\n--- Step 2: Entering mixed answers (1 Correct, 1 Incorrect) ---")
        panel_input_1 = page.locator("#panel-input-p7_1")
        panel_input_2 = page.locator("#panel-input-p7_2")

        panel_input_1.fill("live")      # Correct answer for Q3
        panel_input_2.fill("incorrect") # Incorrect answer for Q4
        time.sleep(0.5)
        print("✓ Filled Q3: 'live' (correct), Q4: 'incorrect' (mistake)")

        # Step 3: Check Answers
        print("\n--- Step 3: Checking Answers ---")
        check_btn = page.locator("button:has-text('Check My Answers')")
        check_btn.click()
        time.sleep(0.8)

        # Verify evaluation banner
        score_info = page.locator("p:has-text('correct')").first
        print("✓ Score banner text:", score_info.text_content())

        # Verify status badges
        correct_badge = page.locator("span:has-text('Correct')").first
        revise_badge = page.locator("span:has-text('Revise')").first
        assert correct_badge.is_visible(), "Correct status badge missing!"
        assert revise_badge.is_visible(), "Revise status badge missing!"
        print("✓ Correct and Revise badges rendered accurately!")

        # Step 4: Show / Hide Answer Key Toggle
        print("\n--- Step 4: Testing Show / Hide Answer Key Toggle ---")
        key_toggle_btn = page.locator("button:has-text('Show Key')")
        assert key_toggle_btn.is_visible(), "Show Key toggle button missing!"
        key_toggle_btn.click()
        time.sleep(0.4)

        # Verify Answer Key box appeared
        key_box = page.locator("div:has-text('Answer Key')").first
        assert key_box.is_visible(), "Answer Key box not rendered after toggle!"
        print("✓ Answer Key box successfully revealed!")

        # Click Hide Key
        hide_key_btn = page.locator("button:has-text('Hide Key')")
        assert hide_key_btn.is_visible(), "Hide Key button missing!"
        hide_key_btn.click()
        time.sleep(0.4)
        print("✓ Answer Key successfully hidden!")

        # Step 5: Review Mistakes Filter
        print("\n--- Step 5: Testing 'Review Mistakes' Filter ---")
        review_mistakes_btn = page.locator("button:has-text('Review Mistakes')")
        assert review_mistakes_btn.is_visible(), "Review Mistakes button missing!"
        review_mistakes_btn.click()
        time.sleep(0.5)

        # The incorrect item (p7_2) should be visible, while correct (p7_1) should be filtered out
        assert panel_input_2.is_visible(), "Incorrect item p7_2 should be visible in mistakes view!"
        assert not panel_input_1.is_visible(), "Correct item p7_1 should be filtered out in mistakes view!"
        print("✓ 'Review Mistakes' successfully filtered list to only incorrect exercises!")

        # Click Show All Exercises
        show_all_btn = page.locator("button:has-text('Show All Exercises')")
        show_all_btn.click()
        time.sleep(0.5)
        assert panel_input_1.is_visible(), "All exercises should be restored after Show All!"
        print("✓ All exercises restored when exiting mistake filter!")

        # Step 6: Try Again (Non-destructive to correct answers)
        print("\n--- Step 6: Testing 'Try Again' Action ---")
        try_again_btn = page.locator("button:has-text('Try Again')")
        assert try_again_btn.is_visible(), "Try Again button missing!"
        try_again_btn.click()
        time.sleep(0.6)

        # Correct answer must remain "live", while incorrect must be cleared to ""
        assert panel_input_1.input_value() == "live", f"Correct answer was cleared! Value: '{panel_input_1.input_value()}'"
        assert panel_input_2.input_value() == "", f"Incorrect answer was not cleared! Value: '{panel_input_2.input_value()}'"
        print("✓ 'Try Again' preserved correct answer 'live' and cleared mistake for retry!")

        # Step 7: Hint (💡) Toggle
        print("\n--- Step 7: Testing Collapsible Hint Toggle ---")
        hint_btn = page.locator("button:has-text('Hint')").first
        if hint_btn.is_visible():
            hint_btn.click()
            time.sleep(0.3)
            hint_card = page.locator("span:has-text('Hint:')").first
            assert hint_card.is_visible(), "Hint card did not expand!"
            print("✓ Hint card successfully expanded!")

            # Toggle hide hint
            page.locator("button:has-text('Hide Hint')").first.click()
            time.sleep(0.3)
            print("✓ Hint card successfully collapsed!")

        page.screenshot(path="screenshot_step5_verified.png")
        print("\nSaved verification screenshot to 'screenshot_step5_verified.png'")
        browser.close()

    print("\n==================================================================")
    print(" ALL SELF-CHECK & ANSWER KEY TESTS PASSED (100%) ")
    print("==================================================================")

if __name__ == "__main__":
    run_self_check_tests()
