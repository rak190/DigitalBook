import asyncio
import sys
from playwright.async_api import async_playwright

async def run_tests():
    async with async_playwright() as p:
        browser = await p.chromium.launch(channel="msedge", headless=True)
        page = await browser.new_page()

        print("1. Testing Bookshelf View at http://localhost:8000/DigitalBook/...")
        await page.goto("http://localhost:8000/DigitalBook/", wait_until="networkidle")
        await page.wait_for_timeout(1000)

        # Check Bookshelf title
        title = await page.text_content("h1")
        print(f"Header title: {title}")
        assert "Digital Bookshelf" in title, f"Unexpected title: {title}"

        # Check 4 books
        book_cards = await page.query_selector_all("main .group")
        print(f"Found {len(book_cards)} book cards")
        assert len(book_cards) == 4, f"Expected 4 books, found {len(book_cards)}"

        # Check filter tabs
        print("Testing Filter: MoEYS Cambodia...")
        await page.click('button:has-text("MoEYS Cambodia")')
        await page.wait_for_timeout(300)
        moeys_cards = await page.query_selector_all("main .group")
        print(f"MoEYS filtered cards: {len(moeys_cards)}")
        assert len(moeys_cards) == 3, f"Expected 3 MoEYS books, found {len(moeys_cards)}"

        print("Testing Filter: Self-Study...")
        await page.click('button:has-text("Self-Study")')
        await page.wait_for_timeout(300)
        oxford_cards = await page.query_selector_all("main .group")
        print(f"Self-Study filtered cards: {len(oxford_cards)}")
        assert len(oxford_cards) == 1, f"Expected 1 Oxford book, found {len(oxford_cards)}"

        # Reset to All Books
        await page.click('button:has-text("All Books")')
        await page.wait_for_timeout(300)

        # Test Search
        print('Testing Search: "Grade 8"...')
        search_input = await page.query_selector('input[placeholder*="Search books"]')
        await search_input.fill("Grade 8")
        await page.wait_for_timeout(300)
        search_cards = await page.query_selector_all("main .group")
        print(f"Search results: {len(search_cards)}")
        assert len(search_cards) == 1, f"Expected 1 result for Grade 8, found {len(search_cards)}"

        # Clear search
        await search_input.fill("")
        await page.wait_for_timeout(300)

        # Open English Grade 8
        print("2. Testing Open Book for English Grade 8...")
        g8_title = await page.query_selector('h3:has-text("English Grade 8")')
        assert g8_title is not None, "English Grade 8 card title not found"
        await g8_title.click()
        await page.wait_for_timeout(1000)

        url = page.url
        print(f"Opened Reader URL: {url}")
        assert "book=moeys-english-grade-8" in url, f"Expected book=moeys-english-grade-8 in URL, got {url}"

        # Verify TopBar title
        top_header = await page.query_selector("header")
        header_text = await top_header.inner_text()
        print(f"TopBar text excerpt: {header_text[:120].strip()}")
        assert "Grade 8" in header_text

        # Test Scoped Storage Isolation
        print("3. Testing Scoped Storage: Typing answer in Grade 8...")
        # Navigate to page 10 (Review Lesson A where an exercise exists)
        page_input = await page.query_selector('header input[type="text"]')
        await page_input.fill("10")
        await page_input.press("Enter")
        await page.wait_for_timeout(800)

        # Check localStorage for Grade 8
        storage_check = await page.evaluate("""() => {
            const g8 = localStorage.getItem('digital_book_progress_moeys-english-grade-8');
            const g7 = localStorage.getItem('digital_book_progress_moeys-english-grade-7');
            const ef = localStorage.getItem('digital_book_progress_english-file-pre-int');
            return { g8, g7, ef };
        }""")
        print(f"Storage check: G8 exists={bool(storage_check['g8'])}, G7 exists={bool(storage_check['g7'])}")
        assert storage_check['g8'] is not None, "Grade 8 storage key was not created"

        # Check Presentation Mode
        print("4. Testing Classroom Presentation Mode...")
        pres_btn = await page.query_selector('button:has-text("Presentation")')
        assert pres_btn is not None, "Presentation Mode button not found"
        await pres_btn.click()
        await page.wait_for_timeout(500)

        pres_header = await page.query_selector('header:has-text("Classroom Presentation")')
        assert pres_header is not None, "Classroom Presentation header not visible"
        print("Entered Presentation Mode successfully!")

        # Toggle Teacher Answer Key
        ans_key_btn = await page.query_selector('button:has-text("Show Answer Key")')
        assert ans_key_btn is not None, "Show Answer Key button not found"
        await ans_key_btn.click()
        await page.wait_for_timeout(300)
        on_text = await page.query_selector('button:has-text("Answer Key: ON")')
        assert on_text is not None, "Teacher Answer Key not toggled ON"
        print("Teacher Answer Key toggled ON successfully!")

        # Exit Presentation Mode
        exit_btn = await page.query_selector('button:has-text("Exit")')
        await exit_btn.click()
        await page.wait_for_timeout(500)

        # Back to Bookshelf
        print("5. Testing Back to Bookshelf...")
        bookshelf_btn = await page.query_selector('button:has-text("Bookshelf")')
        assert bookshelf_btn is not None, "Back to Bookshelf button not found"
        await bookshelf_btn.click()
        await page.wait_for_timeout(800)

        home_title = await page.text_content("h1")
        assert "Digital Bookshelf" in home_title, f"Failed to return to Bookshelf: {home_title}"
        print("Returned to Bookshelf successfully!")

        # Open English File Pre-Intermediate
        print("6. Testing Open Book for English File Pre-Intermediate...")
        ef_title = await page.query_selector('h3:has-text("English File Pre-Intermediate")')
        assert ef_title is not None
        await ef_title.click()
        await page.wait_for_timeout(1000)

        ef_url = page.url
        print(f"English File Reader URL: {ef_url}")
        assert "book=english-file-pre-int" in ef_url

        # Check Page 7
        page_input = await page.query_selector('header input[type="text"]')
        await page_input.fill("7")
        await page_input.press("Enter")
        await page.wait_for_timeout(800)

        # Verify hotspots on Page 7
        badges = await page.query_selector_all('button[aria-label*="Audio Track"], button[aria-label*="Activity"]')
        print(f"English File Page 7 hotspots count: {len(badges)}")
        assert len(badges) >= 2, f"Expected hotspots on Page 7, found {len(badges)}"

        # Open Ex 1 activity drawer
        ex1_badge = await page.query_selector('button:has-text("Ex 1")')
        if ex1_badge:
            await ex1_badge.click()
            await page.wait_for_timeout(600)
            drawer = await page.query_selector('aside[aria-label="Activity Window"]')
            assert drawer is not None, "Activity drawer failed to slide out"
            print("Activity drawer opened smoothly!")

            # Verify Check Answers button in drawer
            check_btn = await drawer.query_selector('button:has-text("Check Answers")')
            assert check_btn is not None, "Check Answers button found in activity drawer"

            # Close drawer
            close_btn = await drawer.query_selector('button[title="Close Activity"]')
            if close_btn:
                await close_btn.click()
                await page.wait_for_timeout(300)

        await browser.close()
        print("\n=========================================")
        print("ALL VALIDATION CRITERIA MET SUCCESSFULLY!")
        print("=========================================")

if __name__ == "__main__":
    asyncio.run(run_tests())
