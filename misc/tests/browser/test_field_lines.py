"""Changing a field rewrites only that field's lines in the script pane."""

from playwright.sync_api import Page, expect

FORM = "/field_lines"


def pane(page: Page):
    return page.locator("#_script_content")


def type_at_end(page: Page, text: str):
    """Type into the script pane at the end of its text, as a researcher would."""
    pane(page).focus()
    page.keyboard.press("Control+End")
    page.keyboard.type(text)


def test_edit_survives_a_field_change(serve, page: Page):
    page.goto(serve({}) + FORM)
    type_at_end(page, " world")
    page.locator("#cores").fill("4")
    expect(pane(page)).to_have_value(
        "#PBS -l select=1:ncpus=4\n#PBS -N run\necho hello world"
    )


def test_edit_survives_a_field_change_after_a_failed_check(serve, page: Page):
    page.goto(serve({}) + FORM)
    page.locator("#cores").fill("20")
    type_at_end(page, " world")
    page.get_by_role("button", name="Submit").click()
    expect(page.get_by_text("Too many cores")).to_be_visible()
    page.locator("#cores").fill("4")
    expect(pane(page)).to_have_value(
        "#PBS -l select=1:ncpus=4\n#PBS -N run\necho hello world"
    )


def test_ticking_a_checkbox_adds_its_text_once(serve, page: Page):
    page.goto(serve({}) + "/checkbox_lines")
    box = page.get_by_role("checkbox", name="B")
    expect(pane(page)).to_have_value("A")
    box.click()
    expect(pane(page)).to_have_value("A\nB")
    box.click()
    expect(pane(page)).to_have_value("A")
    box.click()
    expect(pane(page)).to_have_value("A\nB")


def test_ticking_a_checkbox_beside_an_edit_adds_its_text_once(serve, page: Page):
    page.goto(serve({}) + "/checkbox_lines")
    type_at_end(page, "\nC")
    box = page.get_by_role("checkbox", name="B")
    box.click()
    expect(pane(page)).to_have_value("A\nB\nC")
    box.click()
    expect(pane(page)).to_have_value("A\nC")
    box.click()
    expect(pane(page)).to_have_value("A\nB\nC")


def test_an_edited_field_line_is_rewritten_by_its_field_only(serve, page: Page):
    page.goto(serve({}) + FORM)
    type_at_end(page, "\necho mine")
    # Edit the Name line by hand: it stays edited while another field changes.
    pane(page).evaluate("a => { const at = a.value.indexOf(' run') + 4; a.setSelectionRange(at, at); }")
    page.keyboard.type("x")
    page.locator("#cores").fill("2")
    expect(pane(page)).to_have_value(
        "#PBS -l select=1:ncpus=2\n#PBS -N runx\necho hello\necho mine"
    )
    page.locator("#name").fill("job")
    expect(pane(page)).to_have_value(
        "#PBS -l select=1:ncpus=2\n#PBS -N job\necho hello\necho mine"
    )
