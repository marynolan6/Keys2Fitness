"""K2F-33 Android smoke; restores the library, assignments and sessions afterward."""
import argparse
import re
import time
from helpers.android_ui import adb, bounds, fill, matches, open_route, scroll_to, snapshot, tap, tap_node, wait_for
from helpers.workout_sandbox import smoke_title, workout_sandbox


def completed_count():
    for start, end in [(1500, 700), (700, 1500)]:
        for _ in range(12):
            for node in snapshot():
                match = re.fullmatch(r"(\d+) workouts? completed", node.get("text", ""))
                if match: return int(match[1])
            adb("shell", "input", "swipe", "100", str(start), "100", str(end), "300")
    raise AssertionError("Completed-workout count is not visible")


def main(base_url):
    title = smoke_title("Completion")
    route = lambda path: open_route(path, base_url)
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
    start = scroll_to("Start Workout")
    # Capture stable controls before the running clock prevents UIAutomator idle.
    sets = next(node for node in snapshot() if matches(node, "View Bench Press sets"))
    tap_node(start)
    tap_node(sets)
    wait_for("Workout sets")
    fill("Bench Press, set 1, actual reps", "7", dismiss_keyboard=False)
    fill("Bench Press, set 1, actual weight (lb)", "127.5", dismiss_keyboard=False)
    adb("shell", "input", "keyevent", "KEYCODE_ENTER")  # Done on the numeric keypad.
    for index in range(1, 4):
        tap(f"Bench Press, set {index} completed")
    tap_node(next(node for node in snapshot() if node.get("content-desc") == "Close workout sets"))
    left, top, right, bottom = bounds(start)
    # Finish now shares the former Start button's space with Pause on the left.
    adb("shell", "input", "tap", str(left + (right-left)//4), str((top+bottom)//2))
    time.sleep(1)
    wait_for("Workout paused. Your progress is saved.")
    tap("Finish Workout")
    wait_for("Confirm workout completion?")
    wait_for("7 reps")
    wait_for("127.5 lb")
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
    wait_for("7 reps")
    wait_for("127.5 lb")
    tap_node(next(node for node in snapshot() if node.get("content-desc") == "Back to workout history"))
    print("PASS: confirmed completion appears in progress/history with recorded sets", flush=True)
    route("coach-client/2/workouts")
    tap("Preview " + title + " as Alex Morgan")
    restart = scroll_to("Start New Workout")
    tap_node(restart)
    tap_node(restart)  # Pause is in the same spot for a fresh, incomplete attempt.
    wait_for("Workout paused. Your progress is saved.")
    tap("End Workout")
    wait_for("End this workout early?")
    tap("End Anyway")
    wait_for("Start New Workout")
    route("client/progress")
    assert completed_count() == baseline + 1
    print("PASS: second attempt ended early preserves completed history and does not inflate totals", flush=True)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--base-url", default="exp://127.0.0.1:8081", help="URL of the open Expo Go project")
    args = parser.parse_args()
    with workout_sandbox():
        main(args.base_url)
