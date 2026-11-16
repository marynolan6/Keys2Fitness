"""K2F-38 Android smoke; restores pre-test workout data even on failure."""
import argparse
import time

from helpers.android_ui import adb, fill, matches, open_route, scroll_to, snapshot, tap, wait_for
from helpers.workout_sandbox import smoke_title, workout_sandbox

BASE = "exp://127.0.0.1:8081"
FIELD = "Client-specific coach recommendation"
ALEX = "Alex only: use a lighter warmup before these working sets."
SPENCER = "Spencer only: pause briefly and keep a steady lowering phase."


def route(path):
    open_route(path, BASE)


def value(label):
    return scroll_to(label, editable=True).get("text", "")


def save_recommendation():
    tap("Save recommendation")
    deadline = time.monotonic() + 30
    while time.monotonic() < deadline:
        if not any(matches(node, "Edit client recommendation") for node in snapshot()):
            return
        time.sleep(1)
    raise AssertionError("Recommendation save did not close the editor")


def create(title):
    route("coach/workouts/editor?clientId=")
    fill("Workout name", title)
    tap("Add exercise")
    tap("Choose Bench Press")
    fill("Sets for Bench Press", "4")
    fill("Reps for Bench Press", "12")
    fill("Weight (lb) for Bench Press", "142.5")
    fill("Rest (seconds) for Bench Press", "1.5")
    tap("Save template")
    scroll_to("Use a whole number from 0 to 3600 seconds, or leave blank.")
    fill("Rest (seconds) for Bench Press", "120")
    fill("Instructions for Bench Press", "Keep a steady tempo.")
    tap("Add exercise")
    fill("Search exercises or enter a custom name", "Plank", dismiss_keyboard=False)
    tap("Choose Plank")
    fill("Weight (lb) for Plank", "")
    fill("Instructions for Plank", "")
    tap("Save template")
    wait_for("Workout Template Library")
    fill("Search workout templates", title)
    tap("Edit " + title)
    for label, expected in [("Sets for Bench Press", "4"), ("Reps for Bench Press", "12"),
                            ("Weight (lb) for Bench Press", "142.5"), ("Rest (seconds) for Bench Press", "120"),
                            ("Instructions for Bench Press", "Keep a steady tempo."), ("Weight (lb) for Plank", "")]:
        assert value(label) == expected, (label, value(label))
    tap("Assign to Alex Morgan")
    tap("Assign to Spencer")
    tap("Assign workout · 2 selected")
    tap("Confirm assignment")
    wait_for("Workout Template Library")
    print("PASS: inline rest validation, all prescription fields reload, optional fields save, two-client assignment", flush=True)


def recommendations(title):
    route("coach-client/2/workouts")
    scroll_to(title)
    tap("Edit recommendation for Bench Press")
    wait_for("Client: Alex Morgan")
    wait_for("Workout: " + title)
    existing = value(FIELD)
    assert existing
    fill(FIELD, "Do not save this canceled edit", dismiss_keyboard=False)
    tap("Cancel recommendation")
    tap("Edit recommendation for Bench Press")
    assert value(FIELD) == existing
    fill(FIELD, ALEX, dismiss_keyboard=False)
    save_recommendation()

    route("coach-client/1/workouts")
    scroll_to(title)
    tap("Edit recommendation for Bench Press")
    wait_for("Client: Spencer")
    assert value(FIELD) != ALEX
    fill(FIELD, SPENCER, dismiss_keyboard=False)
    save_recommendation()
    # Keep a modal open while changing client context to check the reset boundary.
    tap("Edit recommendation for Bench Press")
    route("coach-client/2/workouts")
    scroll_to(title)
    tap("Edit recommendation for Bench Press")
    wait_for("Client: Alex Morgan")
    assert value(FIELD) == ALEX
    tap("Cancel recommendation")
    tap("Preview " + title + " as Alex Morgan")
    tap("View Bench Press details")
    scroll_to("120 seconds")
    scroll_to("Keep a steady tempo.")
    wait_for(ALEX)
    tap("Close exercise details")
    print("PASS: cancel/reopen, existing recommendation prefill, independent clients, client-facing rest/instructions/recommendation", flush=True)

    adb("shell", "am", "force-stop", "host.exp.exponent")
    route("coach-client/2/workouts")
    route("coach-client/2/workouts")
    tap("Edit recommendation for Bench Press")
    assert value(FIELD) == ALEX
    fill(FIELD, "", dismiss_keyboard=False)
    save_recommendation()
    tap("Edit recommendation for Bench Press")
    assert value(FIELD) == ""
    fill(FIELD, ALEX, dismiss_keyboard=False)
    save_recommendation()
    print("PASS: process restart and explicit recommendation clearing/reopen", flush=True)


def main():
    title = smoke_title("Prescription")
    print("Fixture: " + title, flush=True)
    create(title)
    recommendations(title)


if __name__ == "__main__":
    argparse.ArgumentParser(description=__doc__).parse_args()
    with workout_sandbox():
        main()
