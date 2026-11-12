"""Lines holding a field are locked: shaded, not editable, labelled and linked to their field."""

from playwright.sync_api import Page, expect

FORM = "/locked_lines"
SCRIPT = "#PBS -l select=1:ncpus=1\n#PBS -l walltime=1:05:00\necho hello"


def pane(page: Page):
    return page.locator("#_script_content")


def caret_after(page: Page, text: str):
    """Put the script pane's caret just after the first occurrence of text."""
    pane(page).focus()
    pane(page).evaluate(
        "(a, t) => { const at = a.value.indexOf(t) + t.length; a.setSelectionRange(at, at); }",
        text,
    )


def shaded_lines(page: Page):
    """The text of each script pane line drawn with a background of its own."""
    return page.locator("#_script_content_highlight").evaluate(
        """code => [...code.querySelectorAll('*')]
                    .filter(e => getComputedStyle(e).backgroundColor !== 'rgba(0, 0, 0, 0)')
                    .map(e => e.textContent)"""
    )


def test_field_lines_are_shaded(serve, page: Page):
    page.goto(serve({}) + FORM)
    expect(pane(page)).to_have_value(SCRIPT)
    assert shaded_lines(page) == ["#PBS -l select=1:ncpus=1", "#PBS -l walltime=1:05:00"]
    page.locator("#cores").fill("4")
    expect(pane(page)).to_have_value(SCRIPT.replace("ncpus=1", "ncpus=4"))
    assert shaded_lines(page) == ["#PBS -l select=1:ncpus=4", "#PBS -l walltime=1:05:00"]


def point_at_line(page: Page, n: int):
    """Move the mouse over the nth line of the script pane, counting from 0."""
    box = page.locator("#_script_content_highlight .oc-locked-line").first.bounding_box()
    page.mouse.move(box["x"] + box["width"] / 2, box["y"] + box["height"] * (n + 0.5))


def test_hovering_a_field_line_names_its_field(serve, page: Page):
    page.goto(serve({}) + FORM)
    point_at_line(page, 0)
    expect(pane(page)).to_have_attribute("title", "Set by Cores")
    point_at_line(page, 1)
    expect(pane(page)).to_have_attribute("title", "Set by Hours and Minutes")
    point_at_line(page, 2)
    expect(pane(page)).to_have_attribute("title", "")


def test_clicking_a_field_line_focuses_its_field(serve, page: Page):
    page.goto(serve({}) + FORM)
    point_at_line(page, 0)
    page.mouse.down()
    page.mouse.up()
    expect(page.locator("#cores")).to_be_focused()
    point_at_line(page, 1)
    page.mouse.down()
    page.mouse.up()
    expect(page.locator("#hours")).to_be_focused()
    point_at_line(page, 2)
    page.mouse.down()
    page.mouse.up()
    expect(pane(page)).to_be_focused()


def test_a_field_line_is_not_editable(serve, page: Page):
    page.goto(serve({}) + FORM)
    caret_after(page, "ncpus=1")
    page.keyboard.type("x")
    page.keyboard.press("Backspace")
    page.keyboard.press("Backspace")
    expect(pane(page)).to_have_value(SCRIPT)


def test_a_line_holding_several_fields_is_not_editable(serve, page: Page):
    page.goto(serve({}) + FORM)
    caret_after(page, "walltime=1:0")
    page.keyboard.type("9")
    page.keyboard.press("Enter")
    caret_after(page, "walltime=1:05:00")
    page.keyboard.press("Delete")
    caret_after(page, "walltime=1:05:00\n")
    page.keyboard.press("Backspace")
    expect(pane(page)).to_have_value(SCRIPT)


def test_a_line_added_beside_a_field_line_survives_its_field_changing(serve, page: Page):
    page.goto(serve({}) + FORM)
    caret_after(page, "walltime=1:05:00")
    page.keyboard.press("Enter")
    page.keyboard.type("echo mine")
    page.locator("#minutes").fill("30")
    expect(pane(page)).to_have_value(
        "#PBS -l select=1:ncpus=1\n#PBS -l walltime=1:30:00\necho mine\necho hello"
    )
