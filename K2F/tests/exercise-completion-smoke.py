"""K2F-31 Android acceptance test; open the sample workout before running."""

import runpy
from pathlib import Path

helpers = runpy.run_path(str(Path(__file__).with_name("exercise-modal-smoke.py")))
adb = helpers["adb"]
tap = helpers["tap"]
scroll_to = helpers["scroll_to"]
snapshot = helpers["snapshot"]
matching = helpers["matching"]
wait_for = helpers["wait_for"]


def assert_summary(text):
    scroll_to(text)
    assert matching(snapshot(), text), text


def main():
    root = snapshot()
    for label in ("Start Workout", "Start New Workout", "Resume"):
        if matching(root, label):
            tap(matching(root, label)[0])
            wait_for("Ⅱ Pause Workout")
    names = ["Bench Press", "Incline Dumbbell Press", "Seated Cable Row", "Hammer Curl"]
    # Normalize by reading the real accessible checked state; do not assume a
    # fresh workout or reset a user's persisted session to run this test.
    for name in names:
        checkbox = scroll_to(f"{name} completed")
        if checkbox.get("checked") == "true":
            tap(checkbox)
    assert_summary("0 of 4 exercises complete · 4 remaining")
    for count, name in enumerate(names, 1):
        tap(scroll_to(f"{name} completed"))
        checkbox = scroll_to(f"{name} completed")
        assert checkbox.get("checked") == "true", name
        assert_summary(f"{count} of 4 exercises complete · {4 - count} remaining")
        print(f"PASS: {name} updates completion and remaining counts")
    assert_summary("All exercises complete")
    tap(scroll_to("Ⅱ Pause Workout"))
    wait_for("Workout paused. Your progress is saved.")
    checkbox = scroll_to("Hammer Curl completed")
    assert checkbox.get("enabled") == "false", "Paused checkbox must be disabled"
    tap(checkbox)
    assert_summary("All exercises complete")
    tap(scroll_to("Back to Dashboard"))
    # Reenter through the actual dashboard card, creating a new workout view.
    card_label = "Current workout: Upper Body Strength. Week 5, Day 3 · 4 exercises · 45 min"
    tap(scroll_to(card_label))
    wait_for("Workout paused. Your progress is saved.")
    assert_summary("All exercises complete")
    tap(scroll_to("Resume"))
    wait_for("Ⅱ Pause Workout")
    assert_summary("All exercises complete")
    print("PASS: pause disables completion; leave/reopen/resume restores complete state")
    tap(scroll_to("View Hammer Curl details"))
    wait_for("Exercise details")
    adb("shell", "input", "keyevent", "KEYCODE_BACK")
    assert_summary("All exercises complete")
    tap(scroll_to("Hammer Curl completed"))
    assert_summary("3 of 4 exercises complete · 1 remaining")
    assert not matching(snapshot(), "All exercises complete")
    print("PASS: modal preserves completion; unchecking reverses complete state")
    # Restore the original demo completion pattern for subsequent walkthroughs.
    tap(scroll_to("Seated Cable Row completed"))
    assert_summary("2 of 4 exercises complete · 2 remaining")


if __name__ == "__main__":
    main()
