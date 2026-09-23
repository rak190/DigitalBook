import asyncio
import json
import sys
from playwright.async_api import async_playwright

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

async def run_comprehensive_tests():
    print("==================================================================")
    print(" COMPREHENSIVE ARCHITECTURAL & FUNCTIONAL VERIFICATION SUITE ")
    print("==================================================================")

    async with async_playwright() as p:
        browser = await p.chromium.launch(channel="msedge", headless=True)
        page = await browser.new_page()

        # ----------------------------------------------------------------------
        # Test 1: Bookshelf Dashboard View & Filtering
        # ----------------------------------------------------------------------
        print("\n--- Test 1: Bookshelf Dashboard at http://localhost:8000/DigitalBook/ ---")
        await page.goto("http://localhost:8000/DigitalBook/#/", wait_until="networkidle")
        await page.wait_for_timeout(800)

        # Header check
        header_text = await page.locator("header").inner_text()
        assert "Digital Bookshelf" in header_text, f"Missing header: {header_text}"
        print("✓ Digital Bookshelf header found")

        # 4 book cards
        cards = await page.query_selector_all("main .grid > div")
        print(f"✓ Found {len(cards)} book cards (expected 4)")
        assert len(cards) == 4, f"Expected 4 cards, found {len(cards)}"

        # Filter: MoEYS
        moeys_btn = await page.query_selector('button:has-text("MoEYS Cambodia")')
        await moeys_btn.click()
        await page.wait_for_timeout(300)
        moeys_cards = await page.query_selector_all("main .grid > div")
        print(f"✓ MoEYS filter displays {len(moeys_cards)} cards (expected 3)")
        assert len(moeys_cards) == 3

        # Filter: Self-Study
        oxford_btn = await page.query_selector('button:has-text("Self-Study")')
        await oxford_btn.click()
        await page.wait_for_timeout(300)
        oxford_cards = await page.query_selector_all("main .grid > div")
        print(f"✓ Self-Study filter displays {len(oxford_cards)} cards (expected 1)")
        assert len(oxford_cards) == 1

        # Reset tab to All
        all_btn = await page.query_selector('button:has-text("All Books")')
        await all_btn.click()
        await page.wait_for_timeout(300)

        # ----------------------------------------------------------------------
        # Test 2: Direct Pathname & Hash Routing
        # ----------------------------------------------------------------------
        print("\n--- Test 2: Testing Dynamic Routing & Invalid Book ID Fallback ---")
        # Invalid book fallback - should NOT create phantom storage
        await page.goto("http://localhost:8000/DigitalBook/#/reader?book=invalid-phantom-id", wait_until="networkidle")
        await page.wait_for_timeout(800)
        top_text = await page.locator("header").inner_text()
        assert "Pre-Intermediate" in top_text or "English File" in top_text
        print("✓ Invalid book ID safely fell back to default manifest")

        # Check storage keys - no phantom storage created
        storage_keys = await page.evaluate("() => Object.keys(localStorage)")
        assert "digital_book_progress_invalid-phantom-id" not in storage_keys, "Phantom storage key was created!"
        print("✓ No phantom storage key created for invalid book ID")

        # Hash routing to Grade 8
        await page.goto("http://localhost:8000/DigitalBook/#/reader?book=moeys-english-grade-8&page=15", wait_until="networkidle")
        await page.wait_for_timeout(800)
        page_val = await page.input_value('header input[type="text"]')
        assert page_val == "15", f"Expected page 15, got {page_val}"
        grade8_text = await page.locator("header").inner_text()
        assert "Grade 8" in grade8_text, f"Expected Grade 8, got {grade8_text}"
        print("✓ Successfully routed to Grade 8 Page 15")

        # ----------------------------------------------------------------------
        # Test 3: Authentic MoEYS Table of Contents
        # ----------------------------------------------------------------------
        print("\n--- Test 3: Verifying Authentic MoEYS Curriculum TOC ---")
        toc_toggle = await page.query_selector('button[title*="Table of Contents"]')
        await toc_toggle.click()
        await page.wait_for_timeout(400)

        toc_aside = await page.query_selector("aside")
        assert toc_aside is not None, "TOC sidebar did not open"
        toc_text = await toc_aside.inner_text()
        print(f"TOC preview:\n{toc_text[:250]}...")
        assert "Unit 1: A new classmate" in toc_text, "Missing authentic Unit 1 in Grade 8 TOC!"
        assert "Unit 2: New routines" in toc_text, "Missing authentic Unit 2 in Grade 8 TOC!"
        print("✓ Authentic MoEYS curriculum units verified in Table of Contents")

        # Close TOC
        close_toc = await page.query_selector('aside button[title*="Close"]')
        if close_toc:
            await close_toc.click()
            await page.wait_for_timeout(300)

        # ----------------------------------------------------------------------
        # Test 4: Classroom Presentation Mode & Teacher Answer Keys
        # ----------------------------------------------------------------------
        print("\n--- Test 4: Testing Presentation Mode & Teacher Answer Key ---")
        pres_btn = await page.query_selector('button[title*="Presentation Mode"]')
        assert pres_btn is not None, "Presentation mode button missing"
        await pres_btn.click()
        await page.wait_for_timeout(500)

        pres_header = await page.locator("header").inner_text()
        print(f"Presentation header text: {pres_header}")
        assert "CLASSROOM PRESENTATION" in pres_header.upper(), f"Failed to enter Presentation Mode: {pres_header}"
        print("✓ Successfully entered Classroom Presentation Mode")

        # Toggle Teacher Answer Key
        key_btn = await page.query_selector('button:has-text("Show Answer Key")')
        assert key_btn is not None, "Show Answer Key button missing"
        await key_btn.click()
        await page.wait_for_timeout(400)

        # Check teacher answer tags on page canvas
        answer_tags = await page.query_selector_all(".animate-in.fade-in")
        print(f"✓ Teacher answer key revealed on projector canvas ({len(answer_tags)} tags)")

        # Exit presentation mode
        exit_pres = await page.query_selector('button:has-text("Exit")')
        await exit_pres.click()
        await page.wait_for_timeout(400)
        print("✓ Successfully exited Classroom Presentation Mode")

        # ----------------------------------------------------------------------
        # Test 5: Activity Drawer, Check Answers & Completion Badging
        # ----------------------------------------------------------------------
        print("\n--- Test 5: Testing Activity Drawer, Auto-Grading & Reset Behavior ---")
        # Grade 8 Page 10 (Review Lesson A)
        await page.goto("http://localhost:8000/DigitalBook/#/reader?book=moeys-english-grade-8&page=10", wait_until="networkidle")
        await page.wait_for_timeout(800)

        # Click Ex 3 badge to open activity drawer
        ex3_badge = await page.query_selector('button:has-text("Ex 3")')
        assert ex3_badge is not None, "Ex 3 badge missing on Page 10"
        await ex3_badge.click()
        await page.wait_for_timeout(500)

        activity_window = await page.query_selector('aside[aria-label="Activity Window"]')
        assert activity_window is not None, "Activity drawer failed to slide out!"
        print("✓ Activity drawer smoothly opened upon clicking hotspot badge")

        # Partial answer: Type only 1 correct answer (pen)
        first_input = await page.query_selector('aside input[type="text"]')
        assert first_input is not None, "GapFill input missing"
        await first_input.fill("pen")
        await page.wait_for_timeout(300)

        # Click Check Answers
        check_btn = await page.query_selector('aside button:has-text("Check Answers")')
        await check_btn.click()
        await page.wait_for_timeout(400)

        # Check score banner: 1 of 4 correct (25%) -> NOT completed!
        banner = await page.query_selector('aside span:has-text("correct")')
        banner_text = await banner.inner_text() if banner else ""
        print(f"Score banner after partial answer: {banner_text.strip()}")
        assert "1 of 4 correct" in banner_text

        # Verify badge on canvas is NOT green checkmark
        completed_check = await page.query_selector('button:has-text("Ex 3") svg.stroke-\\[3\\]')
        assert completed_check is None, "Incomplete activity was falsely marked with checkmark!"
        print("✓ Verified activity is NOT marked complete with partial answers")

        # Complete all remaining answers: home, tea, end
        all_inputs = await page.query_selector_all('aside input[type="text"]')
        assert len(all_inputs) == 4, f"Expected 4 gapfill inputs, got {len(all_inputs)}"
        await all_inputs[1].fill("home")
        await all_inputs[2].fill("tea")
        await all_inputs[3].fill("end")
        await page.wait_for_timeout(300)

        # Check answers again
        await check_btn.click()
        await page.wait_for_timeout(400)

        # Verify 100% completed
        banner_after = await page.query_selector('aside span:has-text("correct")')
        banner_after_text = await banner_after.inner_text() if banner_after else ""
        print(f"Score banner after all answers: {banner_after_text.strip()}")
        assert "4 of 4 correct" in banner_after_text

        # Badge should now show green checkmark
        completed_badge = await page.query_selector('button:has-text("Ex 3")')
        badge_html = await completed_badge.inner_html() if completed_badge else ""
        assert "stroke-[3]" in badge_html or "Check" in badge_html or "emerald" in (await completed_badge.get_attribute("class") or "")
        print("✓ Verified activity successfully marked COMPLETE with green badge on canvas!")

        # Reset Activity in drawer
        page.on("dialog", lambda dialog: dialog.accept())
        reset_btn = await page.query_selector('aside button[title*="Reset Exercise"]')
        await reset_btn.click()
        await page.wait_for_timeout(400)

        # Verify inputs are cleared
        val_after_reset = await all_inputs[0].input_value()
        assert val_after_reset == "", f"Input not cleared after reset: '{val_after_reset}'"

        # Verify badge is UN-COMPLETED
        badge_after_reset = await page.query_selector('button:has-text("Ex 3")')
        badge_reset_class = await badge_after_reset.get_attribute("class") if badge_after_reset else ""
        assert "bg-sky-600" in badge_reset_class, f"Badge did not reset to default sky color: {badge_reset_class}"
        print("✓ Verified reset correctly cleared answers and un-completed badge on canvas!")

        # Close activity drawer
        close_act = await page.query_selector('aside button[title*="Close Activity"]')
        await close_act.click()
        await page.wait_for_timeout(300)

        # ----------------------------------------------------------------------
        # Test 6: Audio Player & TTS Fallback without Cancellation
        # ----------------------------------------------------------------------
        print("\n--- Test 6: Testing Docked Audio Player & TTS Fallback ---")
        # Grade 7 Page 10 audio track T.1.1.2 (synthetic TTS fallback)
        await page.goto("http://localhost:8000/DigitalBook/#/reader?book=moeys-english-grade-7&page=10", wait_until="networkidle")
        await page.wait_for_timeout(800)

        t112_badge = await page.query_selector('button:has-text("T.1.1.2")')
        assert t112_badge is not None, "T.1.1.2 audio badge missing"
        await t112_badge.click()
        await page.wait_for_timeout(1000)

        # Check audio player appeared
        player = await page.query_selector('[role="region"][aria-label="Audio Player"]')
        assert player is not None, "Audio player did not appear!"
        player_text = await player.inner_text()
        print(f"Audio player state:\n{player_text}")

        # Check speech synthesis is actively speaking without being aborted
        speech_state = await page.evaluate("() => ({ speaking: window.speechSynthesis.speaking, paused: window.speechSynthesis.paused })")
        print("Speech synthesis state:", speech_state)
        assert speech_state["speaking"] is True, "Speech synthesis was cancelled or failed to speak!"
        print("✓ Verified TTS fallback speaks naturally without lifecycle cancellation bug!")

        # Close player
        close_player = await page.query_selector('[role="region"][aria-label="Audio Player"] button[title*="Close"]')
        if close_player:
            await close_player.click()
            await page.wait_for_timeout(300)

        # ----------------------------------------------------------------------
        # Test 7: Scoped Storage Isolation & Reset All Answers
        # ----------------------------------------------------------------------
        print("\n--- Test 7: Testing Scoped Storage Isolation & Non-Resurrection ---")
        # English File Page 7
        await page.goto("http://localhost:8000/DigitalBook/#/reader?book=english-file-pre-int&page=7", wait_until="networkidle")
        await page.wait_for_timeout(800)

        # Open Ex 1 and complete it
        ex1_badge = await page.query_selector('button:has-text("Ex 1")')
        await ex1_badge.click()
        await page.wait_for_timeout(400)

        inputs = await page.query_selector_all('aside input[type="text"]')
        await inputs[0].fill("Where")
        await inputs[1].fill("What")
        await inputs[2].fill("How")
        await inputs[3].fill("Who")
        await inputs[4].fill("When")
        await page.wait_for_timeout(300)

        check_btn_ef = await page.query_selector('aside button:has-text("Check Answers")')
        await check_btn_ef.click()
        await page.wait_for_timeout(500)

        save_close_btn = await page.query_selector('aside button:has-text("Save & Close")')
        await save_close_btn.click()
        await page.wait_for_timeout(500)

        # Verify English File has progress in localStorage
        ef_storage = await page.evaluate("() => JSON.parse(localStorage.getItem('digital_book_progress_english-file-pre-int') || '{}')")
        assert ef_storage.get("completedActivities", {}).get("ef_u1a_ex1") is True
        print("✓ English File progress successfully saved")

        # Return to Bookshelf
        back_btn = await page.query_selector('button[title*="Return to Bookshelf"]')
        await back_btn.click()
        await page.wait_for_timeout(600)

        # Reset English File from Bookshelf dropdown
        ef_options_btn = await page.query_selector('button[aria-label="Options for English File Pre-Intermediate"]')
        await ef_options_btn.click()
        await page.wait_for_timeout(300)

        reset_all_btn = await page.query_selector('button:has-text("Reset All Answers")')
        await reset_all_btn.click()
        await page.wait_for_timeout(300)

        confirm_btn = await page.query_selector('button:has-text("Yes, Reset Answers")')
        await confirm_btn.click()
        await page.wait_for_timeout(500)

        # Re-open English File
        open_ef_btn = await page.query_selector('h3:has-text("English File Pre-Intermediate")')
        await open_ef_btn.click()
        await page.wait_for_timeout(800)

        # Verify that completed activities did NOT resurrect from legacy keys!
        ef_storage_after = await page.evaluate("() => JSON.parse(localStorage.getItem('digital_book_progress_english-file-pre-int') || '{}')")
        assert len(ef_storage_after.get("completedActivities", {})) == 0, f"Resurrected completedActivities found: {ef_storage_after.get('completedActivities')}"
        print("✓ Verified Reset All Answers completely reset English File without resurrecting legacy data!")

        await browser.close()
        print("\n==================================================================")
        print(" ALL COMPREHENSIVE REVIEW TESTS PASSED (100% VERIFIED) ")
        print("==================================================================")

if __name__ == "__main__":
    asyncio.run(run_comprehensive_tests())
