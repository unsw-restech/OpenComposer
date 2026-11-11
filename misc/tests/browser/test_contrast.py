"""Text on the navbar, footer and banners is black or white by its background's brightness."""

import pytest
from playwright.sync_api import Page, expect

FORM = "/branding"
BLACK = "rgb(0, 0, 0)"
WHITE = "rgb(255, 255, 255)"

# The Katana OnDemand yellow, upstream's default navbar and category colours,
# and short hex forms of a light and a dark colour.
BACKGROUNDS = [
    pytest.param("#F9DD4A", BLACK, id="yellow"),
    pytest.param("#3D3B40", WHITE, id="dark-grey"),
    pytest.param("#5522BB", WHITE, id="purple"),
    pytest.param("#ccc", BLACK, id="short-light-grey"),
    pytest.param("#036", WHITE, id="short-navy"),
]


def every_colour(colour):
    keys = ["navbar_color", "dropdown_color", "footer_color", "category_color", "description_color"]
    return {key: colour for key in keys}


@pytest.mark.parametrize("background, text", BACKGROUNDS)
def test_navbar_text(serve, page: Page, background, text):
    url = serve({"platform_name": "IRIS", **every_colour(background)})
    page.goto(url + FORM)
    nav = page.get_by_role("navigation")
    expect(nav.get_by_text("IRIS", exact=True)).to_have_css("color", text)
    # The current page's link; the others are the same colour, dimmed.
    expect(nav.get_by_role("link", name="Application")).to_have_css("color", text)


@pytest.mark.parametrize("background, text", BACKGROUNDS)
def test_footer_text(serve, page: Page, background, text):
    url = serve(every_colour(background))
    page.goto(url + FORM)
    expect(page.locator("footer").get_by_text("Open Composer version")).to_have_css("color", text)


@pytest.mark.parametrize("background, text", BACKGROUNDS)
def test_description_banner_text(serve, page: Page, background, text):
    url = serve(every_colour(background))
    page.goto(url + FORM)
    expect(page.get_by_role("heading", name="Branding test")).to_have_css("color", text)
    expect(page.get_by_text("A form for the browser tests")).to_have_css("color", text)


@pytest.mark.parametrize("background, text", BACKGROUNDS)
def test_category_heading_text(serve, page: Page, background, text):
    url = serve(every_colour(background))
    page.goto(url + "/")
    # The test apps have no category, so they sit under the default heading.
    heading = page.locator(".fs-5", has_text="Application")
    expect(heading).to_have_css("color", text)


@pytest.mark.parametrize("background, text", BACKGROUNDS)
def test_history_banner_text(serve, page: Page, background, text):
    url = serve(every_colour(background))
    page.goto(url + "/history")
    page.get_by_role("button", name="Detail").click()
    expect(page.get_by_text("AND Search")).to_have_css("color", text)
