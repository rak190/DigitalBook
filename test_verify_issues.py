import threading
import time
import socketserver
from playwright.sync_api import sync_playwright
import server
import database

PORT = 8998
database.init_db()
httpd = socketserver.ThreadingTCPServer(('', PORT), server.DigitalTextbookHandler)
threading.Thread(target=httpd.serve_forever, daemon=True).start()
time.sleep(0.5)

with sync_playwright() as p:
    browser = p.chromium.launch(channel='msedge', headless=True)
    page = browser.new_page()
    page.goto(f'http://127.0.0.1:{PORT}')
    page.wait_for_selector('#book-spread-container .book-page-image')

    # Test 1: Click Type Answer and click on page
    print("Testing Text Box placement...")
    page.click("button[data-mode='textbox']")
    time.sleep(0.2)
    canvas = page.wait_for_selector('#canvas-page-7')
    box = canvas.bounding_box()
    page.mouse.click(box['x'] + 300, box['y'] + 300)
    time.sleep(0.5)
    text_boxes = page.query_selector_all('.custom-text-box')
    print('Found text boxes after click:', len(text_boxes))

    # Test 2: Click Sticky Note and click on page
    print("Testing Sticky Note placement...")
    page.click("button[data-mode='stickynote']")
    time.sleep(0.2)
    page.mouse.click(box['x'] + 400, box['y'] + 400)
    time.sleep(0.5)
    sticky_notes = page.query_selector_all('.sticky-note')
    print('Found sticky notes after click:', len(sticky_notes))

    # Test 3: Add Blank tool
    print("Testing Add Blank tool...")
    dialog_prompts = []
    def handle_dialog(dialog):
        print(f"Dialog opened: {dialog.message}")
        dialog_prompts.append(dialog.message)
        dialog.accept("my_answer")
    page.on("dialog", handle_dialog)
    page.click("#add-blank-tool-btn")
    time.sleep(0.2)
    page.mouse.click(box['x'] + 250, box['y'] + 250)
    time.sleep(1)
    print("Dialogs triggered:", len(dialog_prompts))

    browser.close()
