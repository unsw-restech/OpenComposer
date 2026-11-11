"""The branding keys: a platform name in the navbar and tab title, and a catalogue link."""

from playwright.sync_api import Page, expect

FORM = "/branding"
CATALOGUE = "https://docs.restech.unsw.edu.au/iris/"


def test_platform_name_shows_in_navbar_and_tab_title(serve, page: Page):
    url = serve({"platform_name": "IRIS"})
    page.goto(url + FORM)
    expect(page).to_have_title("Branding test | IRIS")
    expect(page.get_by_role("navigation").get_by_text("IRIS", exact=True)).to_be_visible()


def test_catalogue_url_links_from_navbar(serve, page: Page):
    url = serve({"catalogue_url": CATALOGUE})
    page.goto(url + FORM)
    link = page.get_by_role("navigation").get_by_role("link", name="Catalogue")
    expect(link).to_have_attribute("href", CATALOGUE)


def test_unset_keys_leave_upstream_navbar_and_title(serve, page: Page):
    url = serve({})
    page.goto(url + FORM)
    expect(page).to_have_title("Branding test | Open Composer")
    # Everything the navbar shows, so neither a name nor a link: upstream's text.
    expect(page.get_by_role("navigation")).to_have_text(
        "Home Application History Home Directory Open OnDemand", use_inner_text=True
    )
