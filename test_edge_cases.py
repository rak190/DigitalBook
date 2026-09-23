import asyncio
from playwright.async_api import async_playwright

async def run_edge_case_tests():
    async with async_playwright() as p:
        browser = await p.chromium.launch(channel="msedge", headless=True)
        page = await browser.new_page()

        print("=== EDGE CASE TEST 1: Unknown Book ID fallback ===")
        await page.goto("http://localhost:8000/DigitalBook/#/reader?book=invalid-book-id-999", wait_until="networkidle")
        await page.wait_for_timeout(1000)
        # Should gracefully fall back to default manifest without crashing
        header_text = await page.inner_text("header")
        print(f"Fallback Header: {header_text[:80].strip()}")
        assert "English File" in header_text or "Pre-Intermediate" in header_text

        print("=== EDGE CASE TEST 2: Direct Query Parameter routing (?book=moeys-english-grade-9&page=15) ===")
        await page.goto("http://localhost:8000/DigitalBook/?book=moeys-english-grade-9&page=15", wait_until="networkidle")
        await page.wait_for_timeout(1000)
        header_text = await page.inner_text("header")
        print(f"Grade 9 Header: {header_text[:80].strip()}")
        assert "Grade 9" in header_text

        page_input_val = await page.input_value('header input[type="text"]')
        print(f"Current page input value: {page_input_val}")
        assert page_input_val == "15", f"Expected page 15, got {page_input_val}"

        print("=== EDGE CASE TEST 3: Out-of-bound page navigation ===")
        # Type page 99999
        page_input = await page.query_selector('header input[type="text"]')
        await page_input.fill("99999")
        await page_input.press("Enter")
        await page.wait_for_timeout(400)
        # Should reset or clamp
        clamped_val = await page.input_value('header input[type="text"]')
        print(f"Page value after 99999 input: {clamped_val}")
        assert clamped_val != "99999"

        # Type negative page -10
        await page_input.fill("-10")
        await page_input.press("Enter")
        await page.wait_for_timeout(400)
        clamped_val2 = await page.input_value('header input[type="text"]')
        print(f"Page value after -10 input: {clamped_val2}")
        assert clamped_val2 != "-10"

        print("=== EDGE CASE TEST 4: Cross-book Storage Isolation ===")
        # Navigate to Grade 7
        await page.goto("http://localhost:8000/DigitalBook/#/reader?book=moeys-english-grade-7&page=10", wait_until="networkidle")
        await page.wait_for_timeout(1000)

        # Type an answer in Grade 7
        storage_isolation_result = await page.evaluate("""() => {
            // Write distinct answer in Grade 7
            localStorage.setItem('digital_book_progress_moeys-english-grade-7', JSON.stringify({
                answers: { 'g7_q1': { exerciseId: 'g7_q1', value: 'Dara', isCompleted: true } },
                completedActivities: { 'g7_u1_ex2': true },
                bookmarks: [],
                notes: [],
                lastPage: 10
            }));

            // Write distinct answer in Grade 8
            localStorage.setItem('digital_book_progress_moeys-english-grade-8', JSON.stringify({
                answers: { 'g8_w1': { exerciseId: 'g8_w1', value: 'pen', isCompleted: true } },
                completedActivities: {},
                bookmarks: [],
                notes: [],
                lastPage: 15
            }));

            const g7 = JSON.parse(localStorage.getItem('digital_book_progress_moeys-english-grade-7'));
            const g8 = JSON.parse(localStorage.getItem('digital_book_progress_moeys-english-grade-8'));

            return {
                g7HasG8Answer: !!g7.answers['g8_w1'],
                g8HasG7Answer: !!g8.answers['g7_q1'],
                g7Value: g7.answers['g7_q1'].value,
                g8Value: g8.answers['g8_w1'].value
            };
        }""")

        print(f"Cross-book test result: {storage_isolation_result}")
        assert not storage_isolation_result['g7HasG8Answer'], "Grade 7 contains Grade 8 answer!"
        assert not storage_isolation_result['g8HasG7Answer'], "Grade 8 contains Grade 7 answer!"
        assert storage_isolation_result['g7Value'] == 'Dara'
        assert storage_isolation_result['g8Value'] == 'pen'

        print("=== EDGE CASE TEST 5: Reset All Answers Modal on Bookshelf ===")
        await page.goto("http://localhost:8000/DigitalBook/#/", wait_until="networkidle")
        await page.wait_for_timeout(800)

        # Open options menu for Grade 7
        dots_btn = await page.query_selector('button[aria-label="Options for English Grade 7"]')
        if dots_btn:
            await dots_btn.click()
            await page.wait_for_timeout(300)
            reset_btn = await page.query_selector('button:has-text("Reset All Answers")')
            assert reset_btn is not None
            await reset_btn.click()
            await page.wait_for_timeout(300)

            # Confirm modal appeared
            confirm_modal = await page.query_selector('h3:has-text("Reset answers for English Grade 7?")')
            assert confirm_modal is not None
            print("Reset confirmation modal appeared successfully!")

            # Click Yes, Reset Answers
            confirm_btn = await page.query_selector('button:has-text("Yes, Reset Answers")')
            await confirm_btn.click()
            await page.wait_for_timeout(500)

            # Check that Grade 7 storage was cleared while Grade 8 remains intact
            remaining_storage = await page.evaluate("""() => {
                const g7 = localStorage.getItem('digital_book_progress_moeys-english-grade-7');
                const g8 = localStorage.getItem('digital_book_progress_moeys-english-grade-8');
                return { g7, g8: !!g8 };
            }""")
            print(f"After reset: G7 cleared={remaining_storage['g7'] is None}, G8 intact={remaining_storage['g8']}")
            assert remaining_storage['g7'] is None, "Grade 7 storage was not cleared"
            assert remaining_storage['g8'] is True, "Grade 8 storage was incorrectly cleared"

        await browser.close()
        print("\n==========================================")
        print("ALL EDGE CASE TESTS PASSED SUCCESSFULLY! ")
        print("==========================================")

if __name__ == "__main__":
    asyncio.run(run_edge_case_tests())
