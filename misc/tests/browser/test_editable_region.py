"""A form's editable_region: only the lines between its two marker lines are editable."""

from playwright.sync_api import Page, expect

from test_locked_lines import caret_after, pane, point_at_line, shaded_lines

FORM = "/editable_region"
SCRIPT = "\n".join([
    "#PBS -l select=1:ncpus=1",
    "RUN_DIR=/tmp/run",
    "cat > \"$RUN_DIR/run.py\" <<'END'",
    "print(\"hello\")",
    "name = \"run\"",
    "END",
    "python \"$RUN_DIR/run.py\"",
])


def test_lines_outside_the_region_are_shaded(serve, page: Page):
    page.goto(serve({}) + FORM)
    expect(pane(page)).to_have_value(SCRIPT)
    lines = SCRIPT.split("\n")
    assert shaded_lines(page) == [line for line in lines if line != "print(\"hello\")"]


def test_hovering_a_line_outside_the_region_says_the_form_fixes_it(serve, page: Page):
    page.goto(serve({}) + FORM)
    point_at_line(page, 0)
    expect(pane(page)).to_have_attribute("title", "Set by Cores")
    for n in (1, 2, 5, 6):
        point_at_line(page, n)
        expect(pane(page)).to_have_attribute("title", "Fixed by the form")
    point_at_line(page, 3)
    expect(pane(page)).to_have_attribute("title", "")
    point_at_line(page, 4)
    expect(pane(page)).to_have_attribute("title", "Set by Name")


def test_a_line_outside_the_region_is_not_editable(serve, page: Page):
    page.goto(serve({}) + FORM)
    caret_after(page, "RUN_DIR=/tmp")
    page.keyboard.type("x")
    caret_after(page, "<<'EN")
    page.keyboard.press("Delete")
    caret_after(page, "name = \"run\"\nEND")
    page.keyboard.press("Backspace")
    page.keyboard.press("Backspace")
    page.keyboard.press("Backspace")
    caret_after(page, "python")
    page.keyboard.press("Shift+End")
    page.keyboard.press("Delete")
    expect(pane(page)).to_have_value(SCRIPT)


def test_an_edit_inside_the_region_survives_a_field_change(serve, page: Page):
    page.goto(serve({}) + FORM)
    caret_after(page, "print(\"hello")
    page.keyboard.type(" world")
    page.locator("#cores").fill("4")
    page.locator("#name").fill("mine")
    expect(pane(page)).to_have_value(
        SCRIPT.replace("ncpus=1", "ncpus=4").replace("hello", "hello world").replace("\"run\"", "\"mine\"")
    )


def test_the_script_is_submitted_with_its_markers_unchanged(serve, page: Page):
    page.goto(serve({}) + FORM)
    page.locator("#cores").fill("20")
    caret_after(page, "print(\"hello")
    page.keyboard.type(" world")
    page.get_by_role("button", name="Submit").click()
    expect(page.get_by_text("Too many cores")).to_be_visible()
    # The failed check shows the script the form submitted.
    expect(pane(page)).to_have_value(SCRIPT.replace("ncpus=1", "ncpus=20").replace("hello", "hello world"))
    point_at_line(page, 2)
    expect(pane(page)).to_have_attribute("title", "Fixed by the form")
    page.locator("#cores").fill("4")
    expect(pane(page)).to_have_value(SCRIPT.replace("ncpus=1", "ncpus=4").replace("hello", "hello world"))


def test_without_a_region_only_field_lines_are_locked(serve, page: Page):
    page.goto(serve({}) + "/locked_lines")
    pane(page).focus()
    page.keyboard.press("Control+End")
    page.keyboard.type(" world\necho mine")
    page.keyboard.press("Control+Home")
    page.keyboard.press("Enter")
    expect(pane(page)).to_have_value(
        "\n#PBS -l select=1:ncpus=1\n#PBS -l walltime=1:05:00\necho hello world\necho mine"
    )


def test_no_line_can_be_added_outside_the_region(serve, page: Page):
    page.goto(serve({}) + FORM)
    for after in ("ncpus=1", "RUN_DIR=/tmp/run\n", "name = \"run\"\nEND", "python \"$RUN_DIR/run.py\""):
        caret_after(page, after)
        page.keyboard.press("Enter")
        page.keyboard.type("echo mine")
    pane(page).focus()
    page.keyboard.press("Control+Home")
    page.keyboard.press("Enter")
    expect(pane(page)).to_have_value(SCRIPT)


def test_lines_can_be_added_anywhere_inside_the_region(serve, page: Page):
    page.goto(serve({}) + FORM)
    caret_after(page, "<<'END'")
    page.keyboard.press("Enter")
    page.keyboard.type("import os")
    caret_after(page, "name = \"run\"")
    page.keyboard.press("Enter")
    page.keyboard.type("print(name)")
    expect(pane(page)).to_have_value(
        SCRIPT.replace("<<'END'", "<<'END'\nimport os").replace("name = \"run\"", "name = \"run\"\nprint(name)")
    )
