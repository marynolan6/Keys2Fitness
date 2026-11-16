"""K2F-33 Android smoke; restores the library, assignments and sessions afterward."""
import argparse
import re
from helpers.android_ui import adb, fill, open_route, scroll_to, snapshot, tap, tap_node, wait_for
from helpers.workout_sandbox import smoke_title, workout_sandbox


def completed_count():
    for start, end in [(1500, 700), (700, 1500)]:
        for _ in range(12):
            for node in snapshot():
                match = re.fullmatch(r"(\d+) workouts? completed", node.get("text", ""))
                if match: return int(match[1])
            adb("shell", "input", "swipe", "100", str(start), "100", str(end), "300")
    raise AssertionError("Completed-workout count is not visible")


def main():
    title = smoke_title("Completion")
    route = lambda path: open_route(path, "exp://127.0.0.1:8081")
    route("coach/workouts/editor?clientId=2")
    fill("Workout name", title)
    tap("Add exercise")
    tap("Choose Bench Press")
    fill("Reps for Bench Press", "8")
    fill("Weight (lb) for Bench Press", "135")
    client = scroll_to("Assign to Alex Morgan")
    if client.get("checked") != "true": tap_node(client)
    tap("Assign workout · 1 selected")
    tap("Confirm assignment")
    wait_for("Workout Template Library")
    tap("Preview assigned client workout")
    route("client/progress")
    baseline = completed_count()
    route("coach-client/2/workouts")
    tap("Preview " + title + " as Alex Morgan")
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
    tap(title)
    wait_for("Recorded workout")
    wait_for("Set 1 · Confirmed")
    wait_for("8 reps")
    wait_for("135 lb")
    tap_node(next(node for node in snapshot() if node.get("content-desc") == "Back to workout history"))
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


if __name__ == "__main__":
    argparse.ArgumentParser(description=__doc__).parse_args()
    with workout_sandbox():
        main()
