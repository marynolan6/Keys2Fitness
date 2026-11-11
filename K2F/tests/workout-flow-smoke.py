"""Expo Go integration test. Creates a uniquely named local demo assignment; never resets existing records."""
import argparse
import time

from helpers.android_ui import adb, bounds, fill, matches, open_route, scroll_to, snapshot, tap, tap_node, wait_for


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--base-url", default="exp://127.0.0.1:8081")
    parser.add_argument("--source", default="Upper Body Strength", help="Existing template containing Bench Press")
    args = parser.parse_args()
    title = "Architecture smoke " + str(int(time.time()))
    workout_note = "Architecture smoke workout note. Keep a controlled tempo."
    exercise_note = "Architecture smoke exercise note. Keep feet planted."
    route = lambda path: open_route(path, args.base_url)
    route("coach/workouts")
    fill("Search workout templates", args.source)
    tap("Duplicate " + args.source)
    tap("Edit " + args.source[:93] + " (copy)")
    wait_for("Edit Workout")
    fill("Workout name", title)
    fill("Coach's workout note (shown to the client)", workout_note)
    fill("Coach notes for Bench Press", exercise_note)
    client = scroll_to("Assign to Alex Morgan")
    if client.get("checked") != "true":
        tap_node(client)
    tap("Assign workout · 1 selected")
    wait_for("Workout Template Library")
    fill("Search workout templates", title)
    tap("Preview assigned client workout")
    wait_for("Demo workout client: Alex Morgan")
    tap("View workout →")
    wait_for(title)
    tap("Expand coach's note")
    wait_for(workout_note)
    tap("Collapse coach's note")
    tap("View Bench Press details")
    wait_for(exercise_note)
    tap("Close exercise details")
    print("PASS: editor controller -> assignment -> client workout and exercise notes", flush=True)

    # UIAutomator can fail to reach idle while the clock ticks. Capture stable
    # controls first and pause with coordinates before inspecting the running UI.
    start = scroll_to("Start Workout")
    start_bounds = bounds(start)
    checkbox = scroll_to("Bench Press completed")
    # Return to Start without changing the viewport used for the checkpoint.
    tap("Start Workout")
    tap_node(checkbox)
    route("client/home")  # Leave running; the session controller must checkpoint edits.
    tap("Continue workout →")
    time.sleep(4)
    left, top, right, bottom = start_bounds
    adb("shell", "input", "tap", str((left + right) // 2), str(bottom - 8))
    time.sleep(2)
    wait_for("Workout paused. Your progress is saved.")
    assert scroll_to("Bench Press completed").get("checked") == "true"
    print("PASS: recorded progress survives dashboard navigation and Continue", flush=True)

    resume = scroll_to("Resume")
    route("client/home")
    tap("Continue workout →")
    time.sleep(4)
    tap_node(resume)  # Running Pause occupies the former Resume control's area.
    wait_for("Workout paused. Your progress is saved.")
    assert scroll_to("Bench Press completed").get("checked") == "true"
    ready_to_finish = any(matches(node, "Finish Workout") for node in snapshot())
    tap("Finish Workout" if ready_to_finish else "End Workout")
    for _ in range(12):
        current = snapshot()
        if any(matches(node, "Confirm workout completion?") for node in current):
            tap("Confirm completion")
            break
        if any(matches(node, "End this workout early?") for node in current):
            tap("End Anyway")
            break
        if any(matches(node, "Start New Workout") for node in current):
            break
        time.sleep(1)
    wait_for("Start New Workout")
    print("PASS: reducer transitions preserve completion across pause/resume/end", flush=True)

    route("coach/workouts")
    fill("Search workout templates", title)
    tap("Delete " + title)
    wait_for("Delete Workout Template?")
    tap("Delete template")
    wait_for("Template deleted.")
    # Earlier user sessions can still be active, so preview this exact assigned
    # copy from the coach history rather than replacing another active session.
    route("coach-client/2/workouts")
    tap("Preview " + title + " as Alex Morgan")
    wait_for("Start New Workout")
    tap("Expand coach's note")
    wait_for(workout_note)
    print("PASS: deleting the test template preserves the assigned snapshot and ended session", flush=True)
    print("Local test assignment retained as: " + title, flush=True)


if __name__ == "__main__":
    main()
