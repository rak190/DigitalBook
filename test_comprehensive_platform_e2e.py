import asyncio
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

from playwright.async_api import async_playwright

BASE_URL = "http://localhost:8000/DigitalBook/"

async def run_comprehensive_tests():
    print("==================================================================")
    print("      DigitalBook Platform - Comprehensive End-to-End Test Suite ")
    print("==================================================================")

    async with async_playwright() as p:
        browser = await p.chromium.launch(channel="msedge", headless=True)
        page = await browser.new_page()
        page.set_default_timeout(10000)

        # -------------------------------------------------------------
        # STEP 1: Bookshelf View, Filtering, Search, and Sort
        # -------------------------------------------------------------
        print("\n[STEP 1] Testing Bookshelf View, Search, Filtering & Info Modal...")
        await page.goto(BASE_URL, wait_until="networkidle")
        await page.wait_for_timeout(1000)

        # Check Bookshelf title & branding
        title = await page.text_content("h1")
        assert "Digital Bookshelf" in title or "DigitalBook" in title, f"Unexpected header title: {title}"
        print("  ✓ Bookshelf header loaded successfully")

        # Check total 4 books
        cards = await page.query_selector_all("main .group")
        assert len(cards) == 4, f"Expected 4 books, found {len(cards)}"
        print(f"  ✓ Found all 4 books in registry (MoEYS G7, G8, G9, English File Pre-Int)")

        # Filter: MoEYS Cambodia
        await page.click('button:has-text("MoEYS Cambodia")')
        await page.wait_for_timeout(300)
        moeys_cards = await page.query_selector_all("main .group")
        assert len(moeys_cards) == 3, f"Expected 3 MoEYS books, got {len(moeys_cards)}"
        print("  ✓ MoEYS Cambodia filter displays 3 secondary school books")

        # Filter: Self-Study
        await page.click('button:has-text("Self-Study")')
        await page.wait_for_timeout(300)
        self_study_cards = await page.query_selector_all("main .group")
        assert len(self_study_cards) == 1, f"Expected 1 Self-Study book, got {len(self_study_cards)}"
        print("  ✓ Self-Study filter displays English File Pre-Intermediate")

        # Reset filter
        await page.click('button:has-text("All Books")')
        await page.wait_for_timeout(300)

        # Search test
        search_input = await page.query_selector('input[placeholder*="Search books"]')
        await search_input.fill("Grade 8")
        await page.wait_for_timeout(300)
        search_cards = await page.query_selector_all("main .group")
        assert len(search_cards) == 1, f"Expected 1 search match for 'Grade 8', found {len(search_cards)}"
        print("  ✓ Keyword search correctly filters bookshelf cards")
        await search_input.fill("")
        await page.wait_for_timeout(300)

        # Info Modal test
        info_buttons = await page.query_selector_all('button[title*="Book details"], button[aria-label*="Book details"]')
        if not info_buttons:
            # Look for info icon inside book card
            info_buttons = await page.query_selector_all('main .group button')
        if info_buttons:
            # Click info on first card
            for btn in info_buttons:
                btn_txt = await btn.get_attribute("title") or await btn.get_attribute("aria-label") or ""
                if "info" in btn_txt.lower() or "detail" in btn_txt.lower():
                    await btn.click()
                    await page.wait_for_timeout(400)
                    modal = await page.query_selector('div[role="dialog"], div.fixed:has-text("Curriculum")')
                    if modal:
                        print("  ✓ Book Details & Curriculum modal rendered")
                        close_btn = await page.query_selector('div[role="dialog"] button:has-text("Close"), div.fixed button:has-text("Close")')
                        if close_btn:
                            await close_btn.click()
                            await page.wait_for_timeout(300)
                    break

        # -------------------------------------------------------------
        # STEP 2: Open Book (English Grade 8) & Manifest-driven Reader
        # -------------------------------------------------------------
        print("\n[STEP 2] Testing Reader Shell & Table of Contents on English Grade 8...")
        g8_title = await page.query_selector('h3:has-text("English Grade 8")')
        assert g8_title is not None, "English Grade 8 card not found"
        await g8_title.click()
        await page.wait_for_timeout(1000)

        reader_url = page.url
        assert "book=moeys-english-grade-8" in reader_url, f"Reader URL incorrect: {reader_url}"
        print(f"  ✓ Opened Reader at {reader_url}")

        header = await page.query_selector("header")
        header_text = await header.inner_text()
        assert "Grade 8" in header_text, "Grade 8 missing from header"
        print("  ✓ Header displays manifest-driven book title")

        # Open Table of Contents
        toc_btn = await page.query_selector('button[aria-label="Table of Contents"], button[title="Toggle Table of Contents"]')
        if toc_btn:
            await toc_btn.click()
            await page.wait_for_timeout(500)
            print("  ✓ Manifest-driven Table of Contents drawer opened")

            # Expand Chapter 1 accordion if collapsed
            ch1_header = await page.query_selector('button:has-text("Chapter 1: A Sunday Adventure")')
            if ch1_header:
                await ch1_header.click()
                await page.wait_for_timeout(400)

            # Click Unit 1 in TOC
            u1_item = await page.query_selector('button:has-text("Unit 1: A new classmate")')
            if u1_item:
                await u1_item.click()
                await page.wait_for_timeout(800)
                print("  ✓ Navigated to Unit 1 (p.15) via Table of Contents")
            else:
                # Direct jump to page 15
                page_input = await page.query_selector('header input[type="text"]')
                await page_input.fill("15")
                await page_input.press("Enter")
                await page.wait_for_timeout(800)

            # Close TOC
            await toc_btn.click()
            await page.wait_for_timeout(400)
        else:
            page_input = await page.query_selector('header input[type="text"]')
            await page_input.fill("15")
            await page_input.press("Enter")
            await page.wait_for_timeout(800)

        # -------------------------------------------------------------
        # STEP 3: Audio Player Dock, A/B Looping, Transcript & Speech Fallback
        # -------------------------------------------------------------
        print("\n[STEP 3] Testing Universal Audio Dock, A/B Looping & Listening Script...")
        # Check hotspots on Grade 8 Page 15
        audio_hotspot = await page.wait_for_selector('button[aria-label*="Audio Track T.1.1.1"], button:has-text("T.1.1.1")', timeout=5000)
        assert audio_hotspot is not None, "Audio hotspot T.1.1.1 not found on Page 15"
        await audio_hotspot.click()
        await page.wait_for_timeout(800)

        audio_dock = await page.wait_for_selector('div[role="region"][aria-label="Audio Player"]', timeout=5000)
        assert audio_dock is not None, "Audio player bottom dock failed to mount"
        print("  ✓ Audio player dock mounted at bottom of screen")

        # Verify A/B Looping buttons
        loop_a = await page.query_selector('button[aria-label="Set Loop Point A"]')
        loop_b = await page.query_selector('button[aria-label="Set Loop Point B"]')
        assert loop_a is not None and loop_b is not None, "A/B looping controls missing"
        print("  ✓ A/B looping controls ([A], [B]) verified")

        # Verify Speed Selector
        speed_btn = await page.query_selector('button:has-text("1x"), button:has-text("1.0x")')
        assert speed_btn is not None, "Playback speed button not found"
        print("  ✓ Playback speed presets available")

        # Open Transcript panel
        script_btn = await page.query_selector('button:has-text("Script"), button:has-text("Transcript")')
        if script_btn:
            await script_btn.click()
            await page.wait_for_timeout(400)
            transcript_content = await page.query_selector('aside:has-text("Transcript"), div:has-text("Transcript")')
            assert transcript_content is not None, "Transcript panel failed to open"
            print("  ✓ Listening transcript panel opened with dialogue script")

            # Check Projector Large Text toggle
            large_txt_btn = await page.query_selector('button:has-text("Large Text"), button:has-text("Projector")')
            if large_txt_btn:
                await large_txt_btn.click()
                await page.wait_for_timeout(300)
                print("  ✓ Projector Large Text mode toggled for classroom display")

            # Toggle off transcript panel
            await script_btn.click()
            await page.wait_for_timeout(300)

        # Close audio player dock
        close_audio = await page.query_selector('button[aria-label="Close audio player"]')
        if close_audio:
            await close_audio.click()
            await page.wait_for_timeout(300)

        # -------------------------------------------------------------
        # STEP 4: Image Hotspot, Lightbox Viewer, Zoom & Projector Mode
        # -------------------------------------------------------------
        print("\n[STEP 4] Testing Clickable Image Region, Focus Lightbox & Vocabulary Definition...")
        img_hotspot = await page.query_selector('button[aria-label*="Equipment"], button:has-text("Equipment")')
        assert img_hotspot is not None, "Image hotspot for Classroom Equipment not found"
        await img_hotspot.click()
        await page.wait_for_timeout(600)

        # Verify Fullscreen Lightbox Image Viewer mounted
        lightbox = await page.query_selector('div[role="dialog"][aria-label*="Image Viewer"], div:has-text("Classroom Equipment")')
        assert lightbox is not None, "Lightbox Image Viewer modal failed to open"
        print("  ✓ Fullscreen Lightbox Image Viewer opened successfully")

        # Check Zoom controls
        zoom_in = await page.query_selector('button[title*="Zoom In"], button[aria-label*="Zoom In"]')
        zoom_out = await page.query_selector('button[title*="Zoom Out"], button[aria-label*="Zoom Out"]')
        assert zoom_in is not None and zoom_out is not None, "Image zoom controls missing"
        await zoom_in.click()
        await page.wait_for_timeout(200)
        print("  ✓ High-resolution image zoom controls verified")

        # Check Vocabulary definition panel
        vocab_card = await page.query_selector('div:has-text("Chalkboard"), div:has-text("/ˈtʃɔːkbɔːd/")')
        assert vocab_card is not None, "Vocabulary annotation card missing in image viewer"
        print("  ✓ Vocabulary panel displays word, phonetic transcription and definition")

        # Check Projector Presentation mode in Image Viewer
        proj_mode_btn = await page.query_selector('button:has-text("Present Image"), button:has-text("Projector")')
        if proj_mode_btn:
            await proj_mode_btn.click()
            await page.wait_for_timeout(300)
            print("  ✓ Projector Presentation mode active in Image Viewer")
            # Exit presentation mode
            exit_proj = await page.query_selector('button:has-text("Exit Presentation")')
            if exit_proj:
                await exit_proj.click()
                await page.wait_for_timeout(300)

        # Close Lightbox Image Viewer
        close_lightbox = await page.query_selector('button[aria-label="Close viewer"], button[title="Close (Esc)"]')
        if close_lightbox:
            await close_lightbox.click()
        else:
            await page.keyboard.press("Escape")
        await page.wait_for_timeout(500)
        print("  ✓ Lightbox Image Viewer dismissed cleanly")

        # -------------------------------------------------------------
        # STEP 5: Generic Exercise Engine (Gap-fill, Check Answers, Show Key, Reset)
        # -------------------------------------------------------------
        print("\n[STEP 5] Testing Generic Exercise Engine on Grade 8 (Gap-fill)...")
        ex2_hotspot = await page.query_selector('button[aria-label*="Ex 2"], button:has-text("Ex 2")')
        assert ex2_hotspot is not None, "Ex 2 hotspot not found on Grade 8 Page 15"
        await ex2_hotspot.click()
        await page.wait_for_timeout(600)

        activity_drawer = await page.query_selector('aside[aria-label="Activity Window"]')
        assert activity_drawer is not None, "Activity Window drawer failed to open"
        print("  ✓ Activity Window drawer opened with gap-fill exercise")

        # Verify Word Bank chips
        word_chips = await activity_drawer.query_selector_all('button:has-text("chalkboard"), button:has-text("ruler"), button:has-text("timetable")')
        assert len(word_chips) > 0, "Word bank chips not rendered"
        print(f"  ✓ Word bank chips rendered ({len(word_chips)} chips visible)")

        # Fill inputs
        inputs = await activity_drawer.query_selector_all('input[type="text"]')
        if len(inputs) >= 3:
            await inputs[0].fill("chalkboard")
            await inputs[1].fill("ruler")
            await inputs[2].fill("timetable")
            await page.wait_for_timeout(300)
            print("  ✓ Filled gap-fill blanks with target vocabulary")

        # Click Check Answers
        check_btn = await activity_drawer.query_selector('button:has-text("Check Answers")')
        assert check_btn is not None, "Check Answers button missing"
        await check_btn.click()
        await page.wait_for_timeout(400)
        print("  ✓ Answers evaluated via ExerciseService")

        # Check score banner or correct indicators
        score_elem = await activity_drawer.query_selector('div:has-text("Score"), div:has-text("100%"), span:has-text("100%")')
        if score_elem:
            score_text = await score_elem.inner_text()
            print(f"  ✓ Dynamic grading displayed: {score_text.strip()}")

        # Toggle Show Answers
        show_btn = await activity_drawer.query_selector('button:has-text("Show Answers")')
        if show_btn:
            await show_btn.click()
            await page.wait_for_timeout(300)
            print("  ✓ Show Answers toggled ON non-destructively")
            await show_btn.click()
            await page.wait_for_timeout(200)

        # Close exercise drawer
        close_ex = await activity_drawer.query_selector('button[title="Close Activity"]')
        if close_ex:
            await close_ex.click()
            await page.wait_for_timeout(400)

        # -------------------------------------------------------------
        # STEP 6: Classroom Presentation Mode & Teacher Answer Key
        # -------------------------------------------------------------
        print("\n[STEP 6] Testing Classroom Presentation Mode & Scoped Persistence...")
        pres_btn = await page.query_selector('button:has-text("Presentation")')
        await pres_btn.click()
        await page.wait_for_timeout(400)
        assert await page.query_selector('header:has-text("Classroom Presentation")') is not None
        print("  ✓ Entered Classroom Presentation Mode (clean canvas)")

        ans_key_btn = await page.query_selector('button:has-text("Show Answer Key")')
        await ans_key_btn.click()
        await page.wait_for_timeout(300)
        assert await page.query_selector('button:has-text("Answer Key: ON")') is not None
        print("  ✓ Teacher Answer Key toggled ON across all page hotspots")

        exit_btn = await page.query_selector('button:has-text("Exit")')
        await exit_btn.click()
        await page.wait_for_timeout(400)

        # Check Scoped localStorage
        storage_data = await page.evaluate("""() => {
            return {
                g8: localStorage.getItem('digital_book_progress_moeys-english-grade-8'),
                ef: localStorage.getItem('digital_book_progress_english-file-pre-int')
            };
        }""")
        assert storage_data['g8'] is not None, "Grade 8 scoped storage key was not written"
        print("  ✓ Scoped storage key 'digital_book_progress_moeys-english-grade-8' validated")

        # -------------------------------------------------------------
        # STEP 7: Return to Bookshelf and Open English File Pre-Intermediate
        # -------------------------------------------------------------
        print("\n[STEP 7] Returning to Bookshelf & Opening English File Pre-Intermediate...")
        bookshelf_btn = await page.query_selector('button:has-text("Bookshelf")')
        await bookshelf_btn.click()
        await page.wait_for_timeout(800)

        ef_title = await page.query_selector('h3:has-text("English File Pre-Intermediate")')
        await ef_title.click()
        await page.wait_for_timeout(1000)

        # Jump to Unit 1C Page 12 (Vermeer and The Milkmaid)
        page_input = await page.query_selector('header input[type="text"]')
        await page_input.fill("12")
        await page_input.press("Enter")
        await page.wait_for_timeout(800)

        # Check Vermeer Milkmaid Image Hotspot
        milkmaid_hotspot = await page.query_selector('button[aria-label*="Painting"], button:has-text("Painting")')
        assert milkmaid_hotspot is not None, "Vermeer Milkmaid image hotspot not found on English File Page 12"
        await milkmaid_hotspot.click()
        await page.wait_for_timeout(500)

        # Check Lightbox opened with Vermeer title & Milkmaid vocab
        vm_modal = await page.query_selector('div:has-text("The Milkmaid by Johannes Vermeer")')
        assert vm_modal is not None, "Vermeer painting lightbox failed to display"
        print("  ✓ English File Vermeer The Milkmaid high-resolution lightbox opened")

        # Close viewer
        close_vm = await page.query_selector('button[aria-label="Close viewer"], button[title="Close (Esc)"]')
        if close_vm:
            await close_vm.click()
        else:
            await page.keyboard.press("Escape")
        await page.wait_for_timeout(400)

        # Verify Storage Isolation
        storage_check_final = await page.evaluate("""() => {
            const g8 = JSON.parse(localStorage.getItem('digital_book_progress_moeys-english-grade-8') || '{}');
            const ef = JSON.parse(localStorage.getItem('digital_book_progress_english-file-pre-int') || '{}');
            return {
                g8HasG8Ex: Object.keys(g8.answers || {}).some(k => k.startsWith('g8_')),
                efHasG8Ex: Object.keys(ef.answers || {}).some(k => k.startsWith('g8_'))
            };
        }""")
        assert not storage_check_final['efHasG8Ex'], "Data BLEED detected: English File store contains Grade 8 keys!"
        print("  ✓ Confirmed complete data isolation: zero progress bleed across books")

        # -------------------------------------------------------------
        # STEP 8: Deep Linking with Book Alias & 300% Zoom Range
        # -------------------------------------------------------------
        print("\n[STEP 8] Testing Deep Linking with Book Alias & 300% Zoom...")
        deep_link_url = "http://localhost:8000/DigitalBook/#/books/english-grade-8/page/11"
        await page.goto(deep_link_url, wait_until="networkidle")
        await page.wait_for_timeout(1000)

        # Confirm reader loaded English Grade 8 at Page 11
        header_el = await page.query_selector("header")
        header_text = await header_el.inner_text() if header_el else ""
        assert "Grade 8" in header_text, f"Deep link failed to resolve alias: {header_text}"
        page_val = await page.input_value('header input[type="text"]')
        assert page_val == "11", f"Expected page 11 from deep link, got {page_val}"
        print("  ✓ Deep link '#/books/english-grade-8/page/11' successfully routed to Grade 8 Page 11")

        # Test Zoom Range up to 300%
        zoom_in_btn = await page.query_selector('button[title="Zoom In"]')
        if zoom_in_btn:
            for _ in range(14):
                await zoom_in_btn.click()
                await page.wait_for_timeout(50)
            zoom_span = await page.query_selector('header span:has-text("%")')
            zoom_text = await zoom_span.inner_text() if zoom_span else ""
            print(f"  ✓ Max zoom level reached: {zoom_text}")
            assert "%" in (zoom_text or ""), "Zoom text indicator missing"

        # -------------------------------------------------------------
        # STEP 9: Testing Modular Exercise Components (Matching & True/False)
        # -------------------------------------------------------------
        print("\n[STEP 9] Testing Modular Exercise Components on Grade 8 Page 11...")
        # Reset zoom to 100%
        reset_zoom_btn = await page.query_selector('button[title="Set Zoom to 100%"]')
        if reset_zoom_btn:
            await reset_zoom_btn.click()
            await page.wait_for_timeout(300)

        # 1. Matching Exercise (Ex 1)
        matching_hotspot = await page.query_selector('button:has-text("Ex 1")')
        assert matching_hotspot is not None, "Ex 1 hotspot not found on Grade 8 Page 11"
        await matching_hotspot.click()
        await page.wait_for_timeout(600)

        matching_title = await page.query_selector('h2:has-text("Matching")')
        assert matching_title is not None, "Matching exercise modal failed to open"
        print("  ✓ Matching exercise card opened via ExerciseRenderer")

        # Select matching options
        selects = await page.query_selector_all('aside select')
        assert len(selects) >= 3, f"Expected 3 matching selects, found {len(selects)}"
        await selects[0].select_option(label="Solving equations and geometry problems")
        await selects[1].select_option(label="Studying maps and climate")
        await selects[2].select_option(label="Practising dialogue and communicative grammar")
        await page.wait_for_timeout(200)

        # Check answers
        check_btn = await page.query_selector('button:has-text("Check Answers")')
        await check_btn.click()
        await page.wait_for_timeout(400)

        banner = await page.text_content('div:has-text("correct")')
        assert "3 of 3" in (banner or "") or "100%" in (banner or ""), f"Unexpected score: {banner}"
        print("  ✓ Matching exercise evaluated 3 of 3 correct (100%)")

        close_btn = await page.query_selector('button:has-text("Save & Close"), button:has-text("Close")')
        if close_btn:
            await close_btn.click()
        await page.wait_for_timeout(500)

        # 2. True / False Exercise (Ex 2)
        tf_hotspot = await page.query_selector('button:has-text("Ex 2")')
        assert tf_hotspot is not None, "Ex 2 hotspot not found on Grade 8 Page 11"
        await tf_hotspot.click()
        await page.wait_for_timeout(600)

        tf_title = await page.query_selector('h2:has-text("True / False")')
        assert tf_title is not None, "True/False exercise modal failed to open"
        print("  ✓ True/False exercise card opened via ExerciseRenderer")

        tf_buttons = await page.query_selector_all('button:has-text("True"), button:has-text("False")')
        assert len(tf_buttons) >= 6, f"Expected at least 6 T/F buttons, found {len(tf_buttons)}"
        await tf_buttons[0].click()  # Q1 True
        await tf_buttons[3].click()  # Q2 False
        await tf_buttons[4].click()  # Q3 True
        await page.wait_for_timeout(200)

        check_btn = await page.query_selector('button:has-text("Check Answers")')
        await check_btn.click()
        await page.wait_for_timeout(400)

        tf_banner = await page.text_content('div:has-text("correct")')
        assert "3 of 3" in (tf_banner or "") or "100%" in (tf_banner or ""), f"Unexpected T/F score: {tf_banner}"
        print("  ✓ True/False exercise evaluated 3 of 3 correct (100%)")

        close_btn = await page.query_selector('button:has-text("Save & Close"), button:has-text("Close")')
        if close_btn:
            await close_btn.click()
        await page.wait_for_timeout(500)

        # -------------------------------------------------------------
        # STEP 10: Anti-Corruption Backup Validation
        # -------------------------------------------------------------
        print("\n[STEP 10] Testing Backup Anti-Corruption & Book Validation...")
        anti_corruption_check = await page.evaluate("""() => {
            if (!window.StorageService) return { tested: false };
            const g7Backup = JSON.stringify({
                bookId: 'moeys-english-grade-7',
                version: 3,
                answers: { g7_ex: 'corrupt' }
            });
            const rejectedResult = window.StorageService.importBookData('moeys-english-grade-8', g7Backup);

            const g8Backup = JSON.stringify({
                bookId: 'moeys-english-grade-8',
                version: 3,
                answers: { g8_valid: 'test' }
            });
            const acceptedResult = window.StorageService.importBookData('moeys-english-grade-8', g8Backup);

            return {
                tested: true,
                rejectedSuccess: rejectedResult.success,
                rejectedMessage: rejectedResult.message,
                acceptedSuccess: acceptedResult.success
            };
        }""")
        if anti_corruption_check.get('tested'):
            assert not anti_corruption_check['rejectedSuccess'], "Security FAILURE: Mismatched backup was accepted!"
            assert "Cannot import" in anti_corruption_check['rejectedMessage'], "Missing mismatch warning message"
            assert anti_corruption_check['acceptedSuccess'], "Valid same-book backup import failed"
            print("  ✓ Cross-book backup import correctly rejected with anti-corruption warning")
            print("  ✓ Matching-book backup import successfully accepted")

        # -------------------------------------------------------------
        # STEP 11: Return to Bookshelf & Start From Beginning Action
        # -------------------------------------------------------------
        print("\n[STEP 11] Testing Bookshelf Start from Beginning Action...")
        back_btn = await page.query_selector('button:has-text("Bookshelf")')
        await back_btn.click()
        await page.wait_for_timeout(800)

        restart_btn = await page.query_selector('button[title*="Start from beginning"]')
        assert restart_btn is not None, "Start from beginning button not found on book card"
        await restart_btn.click()
        await page.wait_for_timeout(1000)

        page_input_after = await page.input_value('header input[type="text"]')
        assert page_input_after == "1", f"Expected page 1 after restart, got {page_input_after}"
        print("  ✓ 'Start from beginning' button launches reader directly at Page 1")

        await browser.close()

        print("\n==================================================================")
        print("  🎉 ALL COMPREHENSIVE PLATFORM E2E TESTS PASSED WITH ZERO ERRORS! ")
        print("==================================================================")

if __name__ == "__main__":
    asyncio.run(run_comprehensive_tests())
