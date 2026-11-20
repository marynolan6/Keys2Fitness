"""K2F-39 Android smoke; removes all fixture data on success or failure."""
import argparse
import re

from helpers.android_ui import adb, bounds, fill, open_route, scroll_to, snapshot, tap, wait_for
from helpers.workout_sandbox import smoke_title, workout_sandbox


def assignment_actions(title, open_label=None):
    scroll_to("Your assigned workouts")
    width, height = map(int, re.findall(r"(\d+)x(\d+)", adb("shell", "wm", "size"))[-1])
    labels = []
    for _ in range(24):
        nodes = snapshot()
        for node in nodes:
            label = node.get("content-desc", "")
            if not label.startswith("Open assigned workout " + title + " from "):
                continue
            if label not in labels:
                labels.append(label)
            if label == open_label:
                # The whole card is now the action. A tall card doesn't need to
                # fit completely in the viewport to tap its visible middle.
                left, top, right, bottom = bounds(node)
                top, bottom = max(top, height // 8), min(bottom, height * 4 // 5)
                if bottom > top:
                    adb("shell", "input", "tap", str((left+right)//2), str((top+bottom)//2))
                    return labels
        if any(node.get("text") == "Your current goal" for node in nodes):
            assert not open_label, "Could not open dated assignment: " + str(open_label)
            return labels
        adb("shell", "input", "swipe", str(width // 2), str(height * 2 // 3), str(width // 2), str(height * 2 // 5), "500")
    raise AssertionError("Could not reach the end of the assigned workouts section")


def main(base_url):
    def route(path):
        open_route(path, base_url)

    title = smoke_title("Assignment")
    print("Fixture: " + title, flush=True)
    for client_id, name in [("2", "Alex Morgan"), ("1", "Spencer"), ("2", "Alex Morgan")]:
        route("coach/workouts?clientId=" + client_id)
        scroll_to("Selected clients: " + name)
        assert scroll_to("Assign to " + name).get("checked") == "true"
    print("PASS: changing client context refreshes the retained library selection", flush=True)
    route("coach/workouts/editor?clientId=2")
    fill("Workout name", title)
    tap("Add exercise")
    tap("Choose Bench Press")
    # Duration and notes deliberately stay blank.
    tap("Assign workout · 1 selected")
    wait_for("Confirm workout assignment?")
    wait_for("Workout: " + title)
    wait_for("Alex Morgan")
    tap("Cancel assignment")
    scroll_to("Assign workout · 1 selected")
    tap("Assign workout · 1 selected")
    adb("shell", "input", "keyevent", "4")
    scroll_to("Assign workout · 1 selected")
    tap("Assign workout · 1 selected")
    tap("Confirm assignment")
    wait_for("Workout Library")
    scroll_to("Assigned to Alex Morgan")
    route("coach-client/2/workouts")
    scroll_to(title)
    tap("Preview " + title + " as Alex Morgan")
    wait_for(title)
    wait_for("Bench Press")
    print("PASS: editor cancel, Android Back, confirm, coach status and opening as Alex", flush=True)

    route("client/home")
    tap("Change demo workout client")
    tap("Preview workouts for Spencer")
    wait_for("Demo workout client: Spencer")
    assert not assignment_actions(title), "Alex's workout appeared on Spencer's dashboard"
    route("client/home")
    tap("Change demo workout client")
    tap("Preview workouts for Alex Morgan")
    assert len(assignment_actions(title)) == 1
    print("PASS: assignment appears for Alex and not Spencer", flush=True)

    route("coach/workouts?clientId=2")
    fill("Search workouts and templates", title)
    tap("View template details for " + title)
    wait_for("Edit template")
    adb("shell", "input", "keyevent", "4")
    assert scroll_to("Search workouts and templates", editable=True).get("text") == title
    tap("Select " + title + " for assignment")
    tap("Assign workout · 1 selected")
    wait_for("Workout: " + title)
    tap("Cancel assignment")
    tap("Assign workout · 1 selected")
    tap("Confirm assignment")
    scroll_to("Assigned " + title + " to Alex Morgan.")
    route("client/home")
    # Both latest and earlier assigned copies must remain reachable.
    labels = assignment_actions(title)
    assert len(labels) == 2, labels
    assignment_actions(title, open_label=labels[-1])
    wait_for("Start Workout")
    wait_for(title)
    adb("shell", "am", "force-stop", "host.exp.exponent")
    route("coach-client/2/workouts")
    route("coach-client/2/workouts")
    scroll_to(title)
    print("PASS: library cancellation/confirmation, repeated assignments and restart persistence", flush=True)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--base-url", default="exp://127.0.0.1:8081", help="URL of the open Expo Go project")
    args = parser.parse_args()
    with workout_sandbox():
        main(args.base_url)
