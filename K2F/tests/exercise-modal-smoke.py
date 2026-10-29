"""Android/Expo Go smoke test for K2F-20; start Expo on port 8081 first."""

import re
import subprocess
import time
import xml.etree.ElementTree as ET


DEVICE_XML = "/sdcard/k2f-exercise-modal-smoke.xml"


def screen_size():
    # The final size is the active override when Android's wm reports both.
    sizes = re.findall(r"(\d+)x(\d+)", adb("shell", "wm", "size"))
    return tuple(map(int, sizes[-1]))


def adb(*args):
    return subprocess.run(
        ["adb", *args], check=True, capture_output=True, text=True
    ).stdout


def snapshot():
    adb("shell", "uiautomator", "dump", DEVICE_XML)
    return ET.fromstring(adb("exec-out", "cat", DEVICE_XML))


def matching(root, value):
    return [
        node
        for node in root.iter("node")
        if node.get("text") == value or node.get("content-desc") == value
    ]


def wait_for(value, timeout=90):
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        root = snapshot()
        if matching(root, value):
            return root
        time.sleep(1)
    raise AssertionError(f"Timed out waiting for {value!r}")


def bounds(node):
    return tuple(map(int, re.findall(r"\d+", node.get("bounds", ""))))


def tap(node):
    left, top, right, bottom = bounds(node)
    adb("shell", "input", "tap", str((left + right) // 2), str((top + bottom) // 2))


def swipe(direction):
    width, height = screen_size()
    upper, lower = height // 4, height * 3 // 4
    start, end = (lower, upper) if direction == "down" else (upper, lower)
    adb("shell", "input", "swipe", str(width // 2), str(start), str(width // 2), str(end), "350")


def visible(node):
    _, height = screen_size()
    _, top, _, bottom = bounds(node)
    return 200 < top and bottom < height - 280


def scroll_to(value):
    for direction in ("down", "up"):
        for _ in range(10):
            root = snapshot()
            nodes = matching(root, value)
            if nodes and visible(nodes[0]):
                return nodes[0]
            swipe(direction)
    raise AssertionError(f"Could not scroll to {value!r}")


def check_progress(expected):
    node = scroll_to(expected)
    assert visible(node), f"Workout progress {expected} is not visible"


def main():
    adb("reverse", "tcp:8081", "tcp:8081")
    root = snapshot()
    if matching(root, "Exercise details"):
        adb("shell", "input", "keyevent", "KEYCODE_BACK")
        root = wait_for("Workout progress")
    if not matching(root, "Workout progress"):
        adb("shell", "am", "start", "-a", "android.intent.action.VIEW", "-d",
            "exp://127.0.0.1:8081/--/client/home/workout/today")
    root = wait_for("Workout progress")
    assert matching(root, "50%"), "Expected initial sample workout progress of 50%"

    tap(scroll_to("Bench Press completed"))
    check_progress("25%")

    exercises = [
        ("Bench Press", True),
        ("Incline Dumbbell Press", False),
        ("Seated Cable Row", True),
        ("Hammer Curl", False),
    ]
    for index, (name, has_coach_note) in enumerate(exercises):
        tap(scroll_to(f"View {name} details"))
        root = wait_for("Exercise details")
        assert matching(root, name), f"Wrong exercise shown for {name}"
        for section in ("Instructions", "Exercise demonstration", "Video coming soon"):
            assert matching(root, section), f"{name} missing {section}"
        if has_coach_note:
            scroll_to("Coach recommendation")
        else:
            swipe("down")
            assert not matching(snapshot(), "Coach recommendation"), (
                f"{name} should not show coach recommendations"
            )

        if index == 1:
            adb("shell", "input", "keyevent", "KEYCODE_BACK")
        else:
            tap(matching(snapshot(), "Close exercise details")[0])
        wait_for("Workout")
        assert not matching(snapshot(), "Exercise details"), "Modal did not close"
        check_progress("25%")
        print(f"PASS: {name} details, close, and preserved 25% progress")

    tap(scroll_to("Bench Press completed"))
    check_progress("50%")
    print("PASS: completion checkbox remains editable after all four modals")


if __name__ == "__main__":
    main()
