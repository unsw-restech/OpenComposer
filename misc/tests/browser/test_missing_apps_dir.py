"""An apps_dir that doesn't exist: a normal page naming the folder, not an error."""

import pytest
from playwright.sync_api import Page, expect


@pytest.mark.parametrize("path", [pytest.param("/", id="list"), pytest.param("/branding", id="form")])
def test_a_missing_apps_dir_is_named_on_a_normal_page(serve, page: Page, tmp_path, path):
    missing = tmp_path / "no-such-folder"
    url = serve({"apps_dir": str(missing)})
    response = page.goto(url + path)
    assert response.status == 200
    expect(page.get_by_text(f"No forms: {missing} doesn't exist.", exact=True)).to_be_visible()
    expect(page.get_by_role("navigation")).to_be_visible()


def test_an_empty_apps_dir_shows_no_message(serve, page: Page, tmp_path):
    empty = tmp_path / "empty"
    empty.mkdir()
    url = serve({"apps_dir": str(empty)})
    response = page.goto(url + "/")
    assert response.status == 200
    expect(page.get_by_text("No forms:")).to_have_count(0)
    page.goto(url + "/branding")
    expect(page.get_by_text(f"{url}/branding is not found.", exact=True)).to_be_visible()


def test_a_conf_without_apps_dir_still_says_it_must_be_defined(serve, page: Page):
    url = serve({"apps_dir": None})
    response = page.goto(url + "/")
    assert response.status == 500
    expect(page.locator("body")).to_have_text('In ./conf.yml.erb, "apps_dir:" must be defined.')
