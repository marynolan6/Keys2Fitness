"""K2F-33 Android smoke test. Requires a one-exercise Bench Press template."""
import time
import argparse
import re
from helpers.android_ui import adb, fill, open_route, scroll_to, snapshot, tap, tap_node, wait_for


def completed_count():
    for start, end in [(1500, 700), (700, 1500)]:
        for _ in range(12):
            for node in snapshot():
                match = re.fullmatch(r"(\d+) workouts? completed", node.get("text", ""))
                if match: return int(match[1])
            adb("shell", "input", "swipe", "100", str(start), "100", str(end), "300")
    raise AssertionError("Completed-workout count is not visible")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--resume-title", help="Resume verification of an already-created paused fixture")
    args = parser.parse_args()
    title = args.resume_title or "Completion smoke " + str(int(time.time()))
    route = lambda path: open_route(path, "exp://127.0.0.1:8081")
    if not args.resume_title:
        route("coach/workouts")
        fill("Search workout templates", "Builder Demo Plan")
        tap("Duplicate Builder Demo Plan")
        tap("Edit Builder Demo Plan (copy)")
        fill("Workout name", title)
        client = scroll_to("Assign to Alex Morgan")
        if client.get("checked") != "true": tap_node(client)
        tap("Assign workout · 1 selected")
        wait_for("Workout Template Library")
        tap("Preview assigned client workout")
    route("client/progress")
    baseline = completed_count()
    route("coach-client/2/workouts")
    tap("Preview " + title + " as Alex Morgan")
    if not args.resume_title:
        wait_for(title)
        checkbox = scroll_to("Bench Press completed")
        tap("Start Workout")
        tap_node(checkbox)
        tap("Ⅱ Pause Workout")
    wait_for("Workout paused. Your progress is saved.")
    tap("Finish Workout")
    wait_for("Confirm workout completion?")
    tap("Keep Workout")
    assert scroll_to("Bench Press completed").get("checked") == "true"
    wait_for("Workout paused. Your progress is saved.")
    print("PASS: finish confirmation can be canceled without losing progress", flush=True)
    tap("Finish Workout")
    tap("Confirm completion")
    wait_for("Workout completed successfully! Saved to your workout history.")
    route("client/progress")
    assert completed_count() == baseline + 1
    tap("View " + title + ", completed")
    wait_for("Recorded workout")
    scroll_to("Set 1: 8 reps · 135 lb · Confirmed")
    tap("Close workout record")
    print("PASS: confirmed completion appears in progress/history with recorded sets", flush=True)
    route("coach-client/2/workouts")
    tap("Preview " + title + " as Alex Morgan")
    tap("Start New Workout")
    tap("Ⅱ Pause Workout")
    wait_for("Workout paused. Your progress is saved.")
    tap("End Workout")
    wait_for("End this workout early?")
    tap("End Anyway")
    wait_for("Start New Workout")
    route("client/progress")
    assert completed_count() == baseline + 1
    print("PASS: second attempt ended early preserves completed history and does not inflate totals", flush=True)
    print("Retained local test assignment: " + title, flush=True)


if __name__ == "__main__": main()
