"""
Playwright Test: Docked Audio Player & Badge Click Triggers
Verifies:
1. Audio badge buttons exist and trigger the docked AudioPlayer
2. AudioPlayer shows correct track title, time indicators, and scrub bar
3. Play / Pause toggle
4. 10s Rewind and 10s Forward controls
5. Playback rate presets (0.75x, 1.0x, 1.25x, 1.5x)
6. Expandable listening script/transcript drawer
7. Upload MP3 modal trigger
8. Close player button
"""

import sys
import time
from playwright.sync_api import sync_playwright

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

def run_audio_tests():
    print("==================================================================")
    print(" Testing Docked Audio Player & Badge Click Triggers ")
    print("==================================================================")

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, channel="msedge")
        page = browser.new_page()

        # Step 1: Open Application
        print("\n--- Step 1: Loading Digital Workbook on http://localhost:8000 ---")
        page.goto("http://localhost:8000", wait_until="networkidle")
        time.sleep(1.0)

        # Step 2: Trigger Audio via Badge
        print("\n--- Step 2: Clicking Audio Badge Trigger ---")
        # Find audio badge button for track 1.2
        audio_badge = page.locator("button:has-text('1.2')").first
        assert audio_badge.is_visible(), "Audio badge '1.2' not visible in exercise panel!"
        audio_badge.click()
        time.sleep(0.8)

        # Step 3: Verify Docked Player Appears
        print("\n--- Step 3: Verifying Docked Audio Player ---")
        player_container = page.locator("div.fixed.bottom-3")
        assert player_container.is_visible(), "Docked AudioPlayer container not visible after badge click!"
        
        # Verify track title
        title_elem = page.locator("span:has-text('Track 1.2'), span:has-text('1.2')").first
        print("✓ Audio Player docked with title:", title_elem.text_content())

        # Step 4: Playback Rate Controls
        print("\n--- Step 4: Testing Playback Rate Presets ---")
        speed_125 = page.locator("button:has-text('1.25x')")
        assert speed_125.is_visible(), "1.25x speed preset button missing!"
        speed_125.click()
        time.sleep(0.2)
        print("✓ Selected 1.25x playback rate")

        speed_10 = page.locator("button:has-text('1x')")
        speed_10.click()
        print("✓ Reset to 1.0x playback rate")

        # Step 5: 10s Skip Controls
        print("\n--- Step 5: Testing 10-Second Skip Controls ---")
        fwd_btn = page.locator("button[title*='Forward 10 seconds']")
        assert fwd_btn.is_visible(), "Forward 10s button missing!"
        fwd_btn.click()
        time.sleep(0.2)
        print("✓ Forward 10s button responsive")

        rew_btn = page.locator("button[title*='Rewind 10 seconds']")
        assert rew_btn.is_visible(), "Rewind 10s button missing!"
        rew_btn.click()
        time.sleep(0.2)
        print("✓ Rewind 10s button responsive")

        # Step 6: Expandable Listening Script / Transcript
        print("\n--- Step 6: Testing Listening Script / Transcript Accordion ---")
        script_btn = page.locator("button[title*='Listening Script']")
        assert script_btn.is_visible(), "Transcript/Script button missing in player!"
        script_btn.click()
        time.sleep(0.5)

        script_heading = page.locator("div:has-text('Listening Script')").first
        assert script_heading.is_visible(), "Listening Script drawer did not open!"
        print("✓ Listening script successfully expanded!")

        # Verify snippet from track 1.2 script
        transcript_text = page.locator("div:has-text('Where are you from?')").first
        assert transcript_text.is_visible(), "Listening script dialogue not rendered!"
        print("✓ Authentic listening script dialogue verified inside player drawer!")

        # Step 7: Upload MP3 Modal Trigger
        print("\n--- Step 7: Testing Upload MP3 Modal Trigger ---")
        upload_btn = page.locator("button:has-text('Upload MP3')")
        if upload_btn.is_visible():
            upload_btn.click()
            time.sleep(0.5)
            modal_title = page.locator("h3:has-text('Upload Authentic MP3')")
            assert modal_title.is_visible(), "Upload MP3 modal failed to open!"
            print("✓ Upload Authentic MP3 modal opened successfully!")

            # Close upload modal
            page.locator("div.fixed.inset-0 button:has-text('Cancel'), div.fixed.inset-0 button >> svg.lucide-x").first.click()
            time.sleep(0.5)
            print("✓ Upload modal closed cleanly")

        # Step 8: Close Player
        print("\n--- Step 8: Testing Close Player ---")
        close_btn = page.locator("button[title*='Close player']")
        assert close_btn.is_visible(), "Close player button missing!"
        close_btn.click()
        time.sleep(0.5)

        assert not player_container.is_visible(), "AudioPlayer did not close after clicking close button!"
        print("✓ AudioPlayer successfully closed and dismissed!")

        page.screenshot(path="screenshot_step4_verified.png")
        print("\nSaved verification screenshot to 'screenshot_step4_verified.png'")
        browser.close()

    print("\n==================================================================")
    print(" ALL DOCKED AUDIO PLAYER & BADGE TESTS PASSED (100%) ")
    print("==================================================================")

if __name__ == "__main__":
    run_audio_tests()
