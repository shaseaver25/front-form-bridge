"""Run against the development preview using an operator's real signed-in state.

Usage: python3 scripts/verify-resume.py --storage-state /tmp/browser/staff-state.json
The state must come from normal staff sign-in; never use a service key or fake token.
Keep the state file private and delete it after use. This script never prints it.
"""
import argparse
import asyncio
from pathlib import Path
from playwright.async_api import async_playwright, expect


async def verify(args):
    output = Path("/tmp/browser/resume-verification")
    output.mkdir(parents=True, exist_ok=True)
    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(headless=True)
        options = {"viewport": {"width": 1280, "height": 1800}}
        if args.storage_state:
            options["storage_state"] = args.storage_state
        context = await browser.new_context(**options)
        page = await context.new_page()
        await page.goto("http://localhost:8080/dev/resume-verification")
        create = page.get_by_role("button", name="Create sample contact")
        await expect(page.get_by_role("heading", name="Resume verification")).to_be_visible()
        if await page.get_by_role("link", name="Sign in", exact=True).count():
            print("Sign-in required: supply browser state from a normal authorized staff login.")
            await page.screenshot(path=str(output / "signed-out.png"))
            await browser.close()
            return 2
        await expect(create).to_be_visible()
        await create.click()
        await expect(page.get_by_role("region", name="Saved sample details")).to_contain_text("Sample Resume Test")
        async with page.expect_download() as download_info:
            await page.get_by_role("button", name="Download sample resume").click()
        download = await download_info.value
        sample = output / "fictional-resume.txt"
        await download.save_as(sample)
        await page.get_by_role("checkbox", name="Parse resume after upload").check()
        await page.set_input_files('input[type="file"]', str(sample))
        dialog = page.get_by_role("dialog")
        await expect(dialog.get_by_role("textbox", name="Job title")).not_to_be_empty(timeout=120000)
        await dialog.get_by_role("button", name="Cancel", exact=True).click()
        await expect(page.get_by_role("region", name="Saved sample details")).not_to_contain_text("Verified Scrum Master")
        # Reparse the stored resume without another upload.
        await page.get_by_role("button", name="Parse", exact=True).click()
        await expect(dialog.get_by_role("textbox", name="Job title")).not_to_be_empty(timeout=120000)
        await dialog.get_by_role("textbox", name="Job title").fill("Verified Scrum Master")
        await dialog.get_by_role("checkbox", name="Job title", exact=True).check()
        await dialog.get_by_role("checkbox", name="Summary, skills, experience & education", exact=True).check()
        await dialog.get_by_role("checkbox", name="First name", exact=True).uncheck()
        await dialog.get_by_role("checkbox", name="Last name", exact=True).uncheck()
        await dialog.get_by_role("button", name="Save selected details").click()
        await expect(page.get_by_text("Saved details verified", exact=True)).to_be_visible(timeout=30000)
        await page.reload()
        await expect(page.get_by_text("Saved details verified", exact=True)).to_be_visible(timeout=30000)
        await page.screenshot(path=str(output / "saved-readback.png"))
        await page.get_by_role("button", name="Remove sample data").click()
        await expect(create).to_be_visible(timeout=30000)
        print("PASS: real signed-in upload, parse, cancel, existing-file reparse, reviewed save, reload/read-back, and cleanup.")
        await browser.close()
        return 0


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Verify resume parsing with real staff authentication, never mocked services.")
    parser.add_argument("--storage-state", help="Private Playwright browser state saved after normal staff sign-in")
    raise SystemExit(asyncio.run(verify(parser.parse_args())))