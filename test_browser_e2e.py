"""
End-to-End Browser Test using Playwright and Microsoft Edge
Verifies full textbook viewing, answer completion, grading,
annotations, TOC navigation, and flashcards.
"""

import threading
import time
import socketserver
from playwright.sync_api import sync_playwright
import server
import database

PORT = 8999

def run_e2e():
    database.init_db()
    httpd = socketserver.ThreadingTCPServer(("", PORT), server.DigitalTextbookHandler)
    thread = threading.Thread(target=httpd.serve_forever, daemon=True)
    thread.start()
    time.sleep(0.5)

    base_url = f"http://127.0.0.1:{PORT}"

    with sync_playwright() as p:
        browser = p.chromium.launch(channel="msedge", headless=True)
        context = browser.new_context(viewport={"width": 1400, "height": 900})
        page = context.new_page()

        print("1. Navigating to Digital Textbook app...")
        page.goto(base_url)
        page.wait_for_selector("#book-spread-container .book-page-image")
        time.sleep(1)

        # Verify header title and current unit pill
        pill_text = page.inner_text("#current-unit-pill")
        print(f"Current unit pill text: {pill_text}")
        assert "1A" in pill_text, "Expected Unit 1A in header pill"

        # Check page 7 input field exists
        print("2. Checking interactive exercise blanks on Page 7...")
        blanks = page.query_selector_all(".exercise-blank-input")
        print(f"Found {len(blanks)} interactive blanks on page 7")
        assert len(blanks) >= 16, f"Expected at least 16 blanks on page 7, found {len(blanks)}"

        # Fill in blanks for:
        # Q3: "Where do you [live]?" -> #blank-1
        # Q4: "Do you [live] in a house or a flat?" -> #blank-2
        # Q7: "What do you [do]?" -> #blank-5
        # Q8: "What time do you [get] up during the week?" -> #blank-6
        print("3. Completing answers in interactive blanks...")
        blanks[0].fill("live")
        blanks[1].fill("live")
        blanks[4].fill("do")
        blanks[5].fill("get")

        # Click Check Answers
        print("4. Clicking 'Check Answers' button...")
        page.click("#check-answers-btn")
        time.sleep(1)

        # Verify correct styling applied
        correct_blanks = page.query_selector_all(".exercise-blank-input.correct")
        print(f"Correctly validated blanks count: {len(correct_blanks)}")
        assert len(correct_blanks) >= 4, "Expected at least 4 blanks marked correct"

        # Take screenshot of page with completed answers
        page.screenshot(path="screenshot_page7_exercises.png")
        print("Saved screenshot_page7_exercises.png")

        # Test Pen drawing
        print("5. Testing Pen drawing tool...")
        page.click("button[data-mode='pen']")
        canvas = page.wait_for_selector("#canvas-page-7")
        canvas_box = canvas.bounding_box()
        # Draw a circle on the canvas
        page.mouse.move(canvas_box["x"] + 150, canvas_box["y"] + 150)
        page.mouse.down()
        page.mouse.move(canvas_box["x"] + 200, canvas_box["y"] + 150)
        page.mouse.move(canvas_box["x"] + 200, canvas_box["y"] + 200)
        page.mouse.move(canvas_box["x"] + 150, canvas_box["y"] + 200)
        page.mouse.move(canvas_box["x"] + 150, canvas_box["y"] + 150)
        page.mouse.up()
        time.sleep(0.5)

        # Test Table of Contents Drawer
        print("6. Opening Table of Contents drawer...")
        page.click("#toggle-toc-btn")
        page.wait_for_selector("#drawer-toc.open")
        time.sleep(0.5)
        page.screenshot(path="screenshot_toc_drawer.png")
        print("Saved screenshot_toc_drawer.png")

        # Navigate to Unit 2A (p. 15)
        print("7. Jumping to Unit 2A from TOC...")
        page.click(".toc-item[data-page='15']")
        time.sleep(1)
        page_val = page.input_value("#page-num-input")
        print(f"New page input value: {page_val}")
        assert page_val == "15", f"Expected page 15, got {page_val}"

        # Test Vocabulary Bank Drawer & Flashcards
        print("8. Testing Vocabulary Drawer & Flashcards...")
        page.click("#toggle-vocab-btn")
        page.wait_for_selector("#drawer-vocab.open")
        time.sleep(0.5)

        # Click Flashcards button
        page.click("#start-flashcards-btn")
        page.wait_for_selector("#flashcard-modal-backdrop.open")
        time.sleep(0.5)

        # Click card to flip
        print("9. Flipping flashcard...")
        page.click("#flashcard-inner")
        time.sleep(0.5)
        page.screenshot(path="screenshot_flashcard_modal.png")
        print("Saved screenshot_flashcard_modal.png")

        page.click("#close-flashcards-btn")
        time.sleep(0.5)

        print("10. All E2E browser checks passed successfully!")
        browser.close()

    httpd.shutdown()
    httpd.server_close()

if __name__ == '__main__':
    run_e2e()
