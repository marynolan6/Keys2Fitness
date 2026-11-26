"""Expo Go integration test; restores pre-test workout data even on failure."""
import argparse
import time

from helpers.android_ui import fill, matches, open_route, scroll_to, snapshot, tap, tap_node, wait_for
from helpers.workout_sandbox import smoke_title, workout_sandbox


def run(args):
    title = smoke_title("Architecture")
    workout_note = "Architecture smoke workout note. Keep a controlled tempo."
    exercise_note = "Architecture smoke exercise note. Keep feet planted."
    route = lambda path: open_route(path, args.base_url)
    route("coach/workouts")
    fill("Search workouts and templates", args.source)
    tap("Assign or manage " + args.source)
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
    tap("Confirm assignment")
    wait_for("Workout Library")
    fill("Search workouts and templates", title)
    tap("Preview assigned client workout")
    wait_for("Your assigned workouts")
    tap("View workout →")
    wait_for(title)
    tap("Expand coach's note")
    wait_for(workout_note)
    tap("Collapse coach's note")
    tap("View Bench Press details")
    wait_for(exercise_note)
    tap("Close exercise details")
    print("PASS: editor controller -> assignment -> client workout and exercise notes", flush=True)

    tap("Start Workout")
    tap("Bench Press completed")
    route("client/home")  # Leave running; the session controller must checkpoint edits.
    tap("Continue workout →")
    tap("Ⅱ Pause Workout")
    wait_for("Workout paused. Your progress is saved.")
    assert scroll_to("Bench Press completed").get("checked") == "true"
    print("PASS: recorded progress survives dashboard navigation and Continue", flush=True)

    route("client/home")
    tap("Continue workout →")
    tap("Ⅱ Pause Workout")
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
    fill("Search workouts and templates", title)
    tap("Assign or manage " + title)
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


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--base-url", default="exp://127.0.0.1:8081")
    parser.add_argument("--source", default="Upper Body Strength", help="Existing template containing Bench Press")
    args = parser.parse_args()
    with workout_sandbox():
        run(args)


if __name__ == "__main__":
    main()
