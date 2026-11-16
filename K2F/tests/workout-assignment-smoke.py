"""K2F-39 Android smoke; removes all fixture data on success or failure."""

from helpers.android_ui import adb, fill, open_route, scroll_to, snapshot, tap, wait_for
from helpers.workout_sandbox import smoke_title, workout_sandbox


BASE = "exp://127.0.0.1:8081"


def route(path):
    open_route(path, BASE)


def main():
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
    wait_for("Workout Template Library")
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
    scroll_to("No coach-built workouts assigned yet.")
    route("client/home")
    tap("Change demo workout client")
    tap("Preview workouts for Alex Morgan")
    scroll_to("Open " + title)
    print("PASS: assignment appears for Alex and not Spencer", flush=True)

    route("coach/workouts?clientId=2")
    fill("Search workout templates", title)
    tap("Select " + title)
    tap("Assign workout · 1 selected")
    wait_for("Workout: " + title)
    tap("Cancel assignment")
    tap("Assign workout · 1 selected")
    tap("Confirm assignment")
    scroll_to("Assigned " + title + " to Alex Morgan.")
    route("client/home")
    # Both latest and earlier assigned copies must remain reachable.
    scroll_to("Your assigned workouts")
    labels = set()
    for _ in range(7):
        labels.update(node.get("content-desc") for node in snapshot()
                      if node.get("content-desc", "").startswith("Open assigned workout " + title + " from "))
        adb("shell", "input", "swipe", "30", "1700", "30", "850", "300")
    assert len(labels) == 2, labels
    tap(sorted(labels)[0])
    wait_for(title)
    adb("shell", "am", "force-stop", "host.exp.exponent")
    route("coach-client/2/workouts")
    route("coach-client/2/workouts")
    scroll_to(title)
    print("PASS: library cancellation/confirmation, repeated assignments and restart persistence", flush=True)


if __name__ == "__main__":
    with workout_sandbox():
        main()
