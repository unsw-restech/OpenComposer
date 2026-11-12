"""One Submit bar stays on screen while the researcher scrolls a long form."""

import pytest
from playwright.sync_api import Page, expect

FORM = "/long-form"

VIEWPORTS = [
    # Fields and script pane side by side, each taller than the window.
    pytest.param({"width": 1280, "height": 720}, id="wide"),
    # One column: the fields, then the script pane below them.
    pytest.param({"width": 390, "height": 844}, id="phone"),
]


@pytest.fixture
def fake_pbs(tmp_path):
    """A `bin` whose qsub accepts every job as 4242.pbs."""
    bin_dir = tmp_path / "pbs-bin"
    bin_dir.mkdir()
    for name, body in [("qsub", "echo 4242.pbs"), ("qstat", "true")]:
        command = bin_dir / name
        command.write_text(f"#!/bin/sh\n{body}\n")
        command.chmod(0o755)
    return str(bin_dir)


def submit(page: Page):
    return page.get_by_role("button", name="Submit")


@pytest.mark.parametrize("viewport", VIEWPORTS)
def test_submit_stays_visible_while_scrolling(serve, page: Page, viewport):
    page.set_viewport_size(viewport)
    url = serve({})
    page.goto(url + FORM)
    expect(submit(page)).to_have_count(1)
    expect(submit(page)).to_be_in_viewport()

    # The last field, then the middle of the script pane, then the page's end.
    page.locator("#f16").scroll_into_view_if_needed()
    expect(submit(page)).to_be_in_viewport()
    page.locator("textarea").first.hover()
    page.mouse.wheel(0, 600)
    expect(submit(page)).to_be_in_viewport()
    page.locator("footer").scroll_into_view_if_needed()
    expect(submit(page)).to_be_in_viewport()


@pytest.mark.parametrize("viewport", VIEWPORTS)
def test_submit_works_from_the_middle_of_the_form(serve, fake_pbs, page: Page, viewport):
    page.set_viewport_size(viewport)
    url = serve({"bin": fake_pbs})
    page.goto(url + FORM)
    page.mouse.wheel(0, 800)
    page.wait_for_function("window.scrollY > 0")
    expect(submit(page)).to_be_in_viewport()
    # Click where the button shows, without scrolling to it, so the click
    # lands on whatever is on top there.
    box = submit(page).bounding_box()
    page.mouse.click(box["x"] + box["width"] / 2, box["y"] + box["height"] / 2)
    expect(page.get_by_text("Job was successfully submitted")).to_contain_text("4242")
